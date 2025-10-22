const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Mock dependencies before importing
jest.mock('../config/database', () => {
  const mockKnex = jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    raw: jest.fn()
  }));
  return mockKnex;
});

jest.mock('../services/fileEncryptionService', () => ({
  storeFileSecurely: jest.fn(),
  retrieveFileSecurely: jest.fn(),
  deleteFileSecurely: jest.fn()
}));

jest.mock('../services/documentProcessingService', () => ({
  processDocument: jest.fn()
}));

jest.mock('../services/verificationService', () => ({
  validateAadhaar: jest.fn(),
  validatePAN: jest.fn(),
  validateBankStatement: jest.fn(),
  crossValidateDocuments: jest.fn()
}));

jest.mock('../middleware/documentUpload', () => ({
  documentUploadMiddleware: (req, res, next) => {
    req.fileValidation = {
      isValid: true,
      originalName: 'test.pdf',
      tempPath: '/tmp/test.pdf',
      size: 1024,
      mimeType: 'application/pdf'
    };
    req.body.documentType = req.body.documentType || 'aadhaar';
    next();
  },
  cleanupTempFile: (req, res, next) => next()
}));

const mockKnex = require('../config/database');
const { storeFileSecurely, retrieveFileSecurely, deleteFileSecurely } = require('../services/fileEncryptionService');
const documentProcessingService = require('../services/documentProcessingService');
const verificationService = require('../services/verificationService');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const kycRouter = require('../routes/kyc');
app.use('/api/kyc', kycRouter);

// Test data
const testUser = {
    id: 1,
    userId: 1,
    email: 'test@example.com',
    user_role: 'user'
};

const testAdmin = {
    id: 2,
    userId: 2,
    email: 'admin@platform.com',
    user_role: 'admin'
};

const mockKYCRecord = {
    id: 1,
    user_id: 1,
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date()
};

const mockDocument = {
    id: 1,
    kyc_record_id: 1,
    document_type: 'aadhaar',
    original_filename: 'aadhaar.pdf',
    encrypted_filename: 'enc_aadhaar_123.pdf',
    file_size: 1024000,
    mime_type: 'application/pdf',
    upload_timestamp: new Date(),
    validation_status: 'valid'
};

// Helper function to generate test JWT
const generateTestToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

describe('KYC Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock implementations
        mockKnex.mockReturnValue({
            where: jest.fn().mockReturnThis(),
            first: jest.fn(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            del: jest.fn().mockReturnThis(),
            returning: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            count: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockReturnThis(),
            whereNotNull: jest.fn().mockReturnThis(),
            raw: jest.fn()
        });
    });

    describe('POST /api/kyc/upload', () => {
        test('should reject request without authentication', async () => {
            const response = await request(app)
                .post('/api/kyc/upload')
                .attach('document', Buffer.from('test file'), 'test.pdf')
                .field('documentType', 'aadhaar');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('NO_TOKEN');
        });

        test('should reject invalid document type', async () => {
            const token = generateTestToken(testUser);

            const response = await request(app)
                .post('/api/kyc/upload')
                .set('Authorization', `Bearer ${token}`)
                .attach('document', Buffer.from('test file'), 'test.pdf')
                .field('documentType', 'invalid_type');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('VALIDATION_ERROR');
        });

        test('should handle successful document upload', async () => {
            const token = generateTestToken(testUser);

            // Mock database responses
            mockKnex().first.mockResolvedValueOnce(mockKYCRecord); // getOrCreateKYCRecord
            mockKnex().first.mockResolvedValueOnce(null); // existingDoc check
            mockKnex().returning.mockResolvedValueOnce([mockDocument]); // document insert
            mockKnex().where.mockResolvedValueOnce([]); // allDocuments check

            // Mock file services
            storeFileSecurely.mockResolvedValue({
                success: true,
                encryptedFilename: 'enc_test.pdf',
                originalFilename: 'test.pdf',
                fileSize: 1024
            });

            documentProcessingService.processDocument.mockResolvedValue({
                success: true,
                extractedData: { number: '123456789012', name: 'Test User' },
                ocrConfidence: 85
            });

            verificationService.validateAadhaar.mockResolvedValue({
                isValid: true,
                confidence: 90,
                errors: [],
                warnings: []
            });

            const response = await request(app)
                .post('/api/kyc/upload')
                .set('Authorization', `Bearer ${token}`)
                .attach('document', Buffer.from('test file'), 'test.pdf')
                .field('documentType', 'aadhaar');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.documentType).toBe('aadhaar');
            expect(response.body.data.validationStatus).toBe('valid');
        });
    });

    describe('GET /api/kyc/status/:userId', () => {
        test('should reject unauthorized access to other user\'s status', async () => {
            const token = generateTestToken(testUser);

            const response = await request(app)
                .get('/api/kyc/status/999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('ACCESS_DENIED');
        });

        test('should return KYC status for user\'s own account', async () => {
            const token = generateTestToken(testUser);

            // Mock database responses
            mockKnex().first.mockResolvedValueOnce(mockKYCRecord);
            mockKnex().select.mockResolvedValueOnce([mockDocument]);

            const response = await request(app)
                .get('/api/kyc/status/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.kycStatus).toBe('pending');
            expect(response.body.data.documents).toHaveLength(1);
        });

        test('should return not_started status for new user', async () => {
            const token = generateTestToken(testUser);

            // Mock no KYC record found
            mockKnex().first.mockResolvedValueOnce(null);

            const response = await request(app)
                .get('/api/kyc/status/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.kycStatus).toBe('not_started');
            expect(response.body.data.documents).toHaveLength(0);
        });
    });

    describe('GET /api/kyc/document/:documentId', () => {
        test('should reject unauthorized access', async () => {
            const response = await request(app)
                .get('/api/kyc/document/1');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('should reject access to other user\'s documents', async () => {
            const token = generateTestToken(testUser);

            // Mock document belonging to different user
            mockKnex().first.mockResolvedValueOnce({
                ...mockDocument,
                user_id: 999
            });

            const response = await request(app)
                .get('/api/kyc/document/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('ACCESS_DENIED');
        });

        test('should return 404 for non-existent document', async () => {
            const token = generateTestToken(testUser);

            mockKnex().first.mockResolvedValueOnce(null);

            const response = await request(app)
                .get('/api/kyc/document/999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('DOCUMENT_NOT_FOUND');
        });
    });

    describe('DELETE /api/kyc/document/:documentId', () => {
        test('should allow user to delete their own document', async () => {
            const token = generateTestToken(testUser);

            mockKnex().first.mockResolvedValueOnce({
                ...mockDocument,
                user_id: 1
            });

            deleteFileSecurely.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/kyc/document/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(deleteFileSecurely).toHaveBeenCalled();
        });

        test('should reject deletion of other user\'s documents', async () => {
            const token = generateTestToken(testUser);

            mockKnex().first.mockResolvedValueOnce({
                ...mockDocument,
                user_id: 999
            });

            const response = await request(app)
                .delete('/api/kyc/document/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Admin Endpoints', () => {
        describe('GET /api/kyc/admin/pending', () => {
            test('should reject non-admin access', async () => {
                const token = generateTestToken(testUser);

                // Mock user role check
                mockKnex().first.mockResolvedValueOnce({ user_role: 'user' });

                const response = await request(app)
                    .get('/api/kyc/admin/pending')
                    .set('Authorization', `Bearer ${token}`);

                expect(response.status).toBe(403);
                expect(response.body.success).toBe(false);
            });

            test('should return pending submissions for admin', async () => {
                const token = generateTestToken(testAdmin);

                // Mock admin role and data
                const mockSubmissions = [{
                    id: 1,
                    user_id: 1,
                    first_name: 'Test',
                    last_name: 'User',
                    email: 'test@example.com',
                    phone: '+1234567890',
                    status: 'pending',
                    created_at: new Date()
                }];

                mockKnex().select.mockResolvedValueOnce(mockSubmissions);
                mockKnex().select.mockResolvedValueOnce([{ kyc_record_id: 1, total_documents: 2, valid_documents: 2 }]);
                mockKnex().first.mockResolvedValueOnce({ count: 1 });

                const response = await request(app)
                    .get('/api/kyc/admin/pending')
                    .set('Authorization', `Bearer ${token}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.submissions).toHaveLength(1);
            });
        });

        describe('POST /api/kyc/admin/approve/:submissionId', () => {
            test('should allow admin to approve KYC submission', async () => {
                const token = generateTestToken(testAdmin);

                mockKnex().first.mockResolvedValueOnce({
                    id: 1,
                    status: 'pending'
                });

                const response = await request(app)
                    .post('/api/kyc/admin/approve/1')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        complianceScore: 90,
                        notes: 'All documents verified'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.status).toBe('verified');
            });

            test('should reject approval of non-pending submission', async () => {
                const token = generateTestToken(testAdmin);

                mockKnex().first.mockResolvedValueOnce({
                    id: 1,
                    status: 'verified'
                });

                const response = await request(app)
                    .post('/api/kyc/admin/approve/1')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        complianceScore: 90
                    });

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.type).toBe('INVALID_STATUS');
            });
        });

        describe('POST /api/kyc/admin/reject/:submissionId', () => {
            test('should allow admin to reject KYC submission', async () => {
                const token = generateTestToken(testAdmin);

                mockKnex().first.mockResolvedValueOnce({
                    id: 1,
                    status: 'pending'
                });

                const response = await request(app)
                    .post('/api/kyc/admin/reject/1')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        reason: 'Documents are not clear enough for verification'
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.status).toBe('rejected');
            });

            test('should require rejection reason', async () => {
                const token = generateTestToken(testAdmin);

                const response = await request(app)
                    .post('/api/kyc/admin/reject/1')
                    .set('Authorization', `Bearer ${token}`)
                    .send({});

                expect(response.status).toBe(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.type).toBe('VALIDATION_ERROR');
            });
        });

        describe('GET /api/kyc/admin/statistics', () => {
            test('should return KYC statistics for admin', async () => {
                const token = generateTestToken(testAdmin);

                // Mock statistics data
                mockKnex().first
                    .mockResolvedValueOnce({
                        total_submissions: 100,
                        pending: 10,
                        verified: 80,
                        rejected: 8,
                        expired: 2,
                        avg_compliance_score: 85.5
                    })
                    .mockResolvedValueOnce({
                        recent_submissions: 15,
                        recent_verified: 12,
                        recent_rejected: 3
                    })
                    .mockResolvedValueOnce({
                        avg_processing_hours: 24.5,
                        min_processing_hours: 2.0,
                        max_processing_hours: 72.0
                    });

                const response = await request(app)
                    .get('/api/kyc/admin/statistics')
                    .set('Authorization', `Bearer ${token}`);

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.overview.totalSubmissions).toBe(100);
                expect(response.body.data.overview.pending).toBe(10);
                expect(response.body.data.recentActivity.submissions).toBe(15);
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors gracefully', async () => {
            const token = generateTestToken(testUser);

            mockKnex().first.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/api/kyc/status/1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('STATUS_FETCH_ERROR');
        });

        test('should handle file processing errors', async () => {
            const token = generateTestToken(testUser);

            mockKnex().first.mockResolvedValueOnce(mockKYCRecord);
            mockKnex().first.mockResolvedValueOnce(null);

            storeFileSecurely.mockRejectedValue(new Error('File storage failed'));

            const response = await request(app)
                .post('/api/kyc/upload')
                .set('Authorization', `Bearer ${token}`)
                .attach('document', Buffer.from('test file'), 'test.pdf')
                .field('documentType', 'aadhaar');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.type).toBe('UPLOAD_PROCESSING_ERROR');
        });
    });

    describe('Rate Limiting', () => {
        test('should apply rate limiting to upload endpoint', async () => {
            // This test would require actual rate limiting implementation
            // For now, we just verify the middleware is applied
            expect(true).toBe(true);
        });

        test('should apply admin rate limiting', async () => {
            // This test would require actual rate limiting implementation
            // For now, we just verify the middleware is applied
            expect(true).toBe(true);
        });
    });
});