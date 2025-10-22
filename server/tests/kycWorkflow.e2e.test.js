const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Mock dependencies
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
    orderBy: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis()
  }));
  return mockKnex;
});

// Mock auth middleware
jest.mock('../middleware/auth', () => {
  const mockJwt = require('jsonwebtoken');
  return {
    authenticateToken: (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ 
          success: false,
          error: { type: 'NO_TOKEN', message: 'Access token required' }
        });
      }

      try {
        const decoded = mockJwt.verify(token, process.env.JWT_SECRET || 'test-secret');
        req.user = decoded;
        next();
      } catch (err) {
        return res.status(403).json({ 
          success: false,
          error: { type: 'INVALID_TOKEN', message: 'Invalid token' }
        });
      }
    },
    requireRole: (role) => (req, res, next) => {
      if (role === 'admin' && req.user.email !== 'admin@platform.com') {
        return res.status(403).json({
          success: false,
          error: { type: 'INSUFFICIENT_PERMISSIONS', message: 'Admin role required' }
        });
      }
      next();
    }
  };
});

// Mock rate limiting
jest.mock('../middleware/kycRateLimit', () => ({
  kycUploadLimiter: (req, res, next) => next(),
  kycStatusLimiter: (req, res, next) => next(),
  adminKycLimiter: (req, res, next) => next(),
  documentAccessLimiter: (req, res, next) => next()
}));

// Mock audit service
jest.mock('../services/kycAuditService', () => ({
  logDocumentUpload: jest.fn(),
  logStatusCheck: jest.fn(),
  logApproval: jest.fn(),
  logRejection: jest.fn(),
  logDocumentAccess: jest.fn(),
  logAdminPendingView: jest.fn()
}));

const mockKnex = require('../config/database');

// Create test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const { router: simpleKycRouter } = require('../routes/simple-kyc');
app.use('/api/kyc', simpleKycRouter);

// Test data
const testUser = {
  userId: 1,
  email: 'test@example.com',
  user_role: 'user'
};

const adminUser = {
  userId: 3,
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
  filename: 'test-123.pdf',
  file_size: 1024,
  upload_timestamp: new Date()
};

// Helper functions
const generateTestToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

describe('KYC End-to-End Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete User KYC Journey', () => {
    test('should complete full KYC workflow from upload to approval', async () => {
      const userToken = generateTestToken(testUser);
      const adminToken = generateTestToken(adminUser);

      // Step 1: User checks initial KYC status (should be not_started)
      const mockKnexInstance = mockKnex();
      mockKnexInstance.first.mockResolvedValueOnce(null); // No KYC record

      const initialStatusResponse = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(initialStatusResponse.status).toBe(200);
      expect(initialStatusResponse.body.success).toBe(true);
      expect(initialStatusResponse.body.data.status).toBe('not_started');
      expect(initialStatusResponse.body.data.canTrade).toBe(false);

      // Step 2: User uploads KYC documents
      mockKnexInstance.first
        .mockResolvedValueOnce(null) // No existing KYC record
        .mockResolvedValueOnce(null); // No old documents
      
      mockKnexInstance.returning
        .mockResolvedValueOnce([mockKYCRecord]) // Insert KYC record
        .mockResolvedValueOnce([mockDocument]); // Insert document

      mockKnexInstance.where.mockResolvedValueOnce([]); // No old documents to delete
      mockKnexInstance.del.mockResolvedValueOnce(0); // Delete old documents

      const uploadResponse = await request(app)
        .post('/api/kyc/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('documents', Buffer.from('test file'), 'test.pdf')
        .field('documentTypes', JSON.stringify(['aadhaar']));

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body.success).toBe(true);
      expect(uploadResponse.body.data.status).toBe('pending');

      // Step 3: User checks status after upload (should be pending)
      mockKnexInstance.first.mockResolvedValueOnce(mockKYCRecord); // KYC record exists
      mockKnexInstance.select.mockResolvedValueOnce([mockDocument]); // Documents

      const pendingStatusResponse = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(pendingStatusResponse.status).toBe(200);
      expect(pendingStatusResponse.body.success).toBe(true);
      expect(pendingStatusResponse.body.data.status).toBe('pending');
      expect(pendingStatusResponse.body.data.canTrade).toBe(false);
      expect(pendingStatusResponse.body.data.documents).toHaveLength(1);

      // Step 4: Admin views pending submissions
      mockKnexInstance.join.mockReturnThis();
      mockKnexInstance.where.mockReturnThis();
      mockKnexInstance.select.mockReturnThis();
      mockKnexInstance.orderBy.mockResolvedValueOnce([{
        ...mockKYCRecord,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      }]);

      mockKnexInstance.first.mockResolvedValueOnce({ count: '1' }); // Document count

      const pendingResponse = await request(app)
        .get('/api/kyc/admin/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(pendingResponse.status).toBe(200);
      expect(pendingResponse.body.success).toBe(true);
      expect(pendingResponse.body.data.pendingSubmissions).toHaveLength(1);

      // Step 5: Admin approves KYC
      mockKnexInstance.first.mockResolvedValueOnce(mockKYCRecord); // KYC record lookup
      mockKnexInstance.update.mockResolvedValueOnce(1); // Update operation

      const approvalResponse = await request(app)
        .post('/api/kyc/admin/approve/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Documents verified successfully' });

      expect(approvalResponse.status).toBe(200);
      expect(approvalResponse.body.success).toBe(true);
      expect(approvalResponse.body.data.status).toBe('verified');

      // Step 6: User checks final status (should be verified)
      const verifiedKYCRecord = { ...mockKYCRecord, status: 'verified' };
      mockKnexInstance.first.mockResolvedValueOnce(verifiedKYCRecord);
      mockKnexInstance.select.mockResolvedValueOnce([mockDocument]);

      const finalStatusResponse = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(finalStatusResponse.status).toBe(200);
      expect(finalStatusResponse.body.success).toBe(true);
      expect(finalStatusResponse.body.data.status).toBe('verified');
      expect(finalStatusResponse.body.data.canTrade).toBe(true);
    });

    test('should handle KYC rejection workflow', async () => {
      const userToken = generateTestToken(testUser);
      const adminToken = generateTestToken(adminUser);

      // Admin rejects KYC
      const mockKnexInstance = mockKnex();
      mockKnexInstance.first.mockResolvedValueOnce(mockKYCRecord); // KYC record lookup
      mockKnexInstance.update.mockResolvedValueOnce(1); // Update operation

      const rejectionResponse = await request(app)
        .post('/api/kyc/admin/reject/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Documents are not clear, please resubmit' });

      expect(rejectionResponse.status).toBe(200);
      expect(rejectionResponse.body.success).toBe(true);
      expect(rejectionResponse.body.data.status).toBe('rejected');

      // User checks status after rejection
      const rejectedKYCRecord = { 
        ...mockKYCRecord, 
        status: 'rejected',
        rejection_reason: 'Documents are not clear, please resubmit'
      };
      mockKnexInstance.first.mockResolvedValueOnce(rejectedKYCRecord);
      mockKnexInstance.select.mockResolvedValueOnce([mockDocument]);

      const rejectedStatusResponse = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(rejectedStatusResponse.status).toBe(200);
      expect(rejectedStatusResponse.body.success).toBe(true);
      expect(rejectedStatusResponse.body.data.status).toBe('rejected');
      expect(rejectedStatusResponse.body.data.canTrade).toBe(false);
      expect(rejectedStatusResponse.body.data.rejectionReason).toBe('Documents are not clear, please resubmit');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle upload without authentication', async () => {
      const response = await request(app)
        .post('/api/kyc/upload')
        .attach('documents', Buffer.from('test file'), 'test.pdf')
        .field('documentTypes', JSON.stringify(['aadhaar']));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle admin actions by non-admin users', async () => {
      const userToken = generateTestToken(testUser);

      const response = await request(app)
        .get('/api/kyc/admin/pending')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should handle database errors gracefully', async () => {
      const userToken = generateTestToken(testUser);
      const mockKnexInstance = mockKnex();
      
      mockKnexInstance.first.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Features', () => {
    test('should validate document types', async () => {
      const userToken = generateTestToken(testUser);

      const response = await request(app)
        .post('/api/kyc/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('documents', Buffer.from('test file'), 'test.pdf')
        .field('documentTypes', 'invalid-json');

      expect(response.status).toBe(500); // JSON parse error
      expect(response.body.success).toBe(false);
    });

    test('should require files for upload', async () => {
      const userToken = generateTestToken(testUser);

      const response = await request(app)
        .post('/api/kyc/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .field('documentTypes', JSON.stringify(['aadhaar']));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No files uploaded');
    });

    test('should validate admin approval parameters', async () => {
      const adminToken = generateTestToken(adminUser);

      const response = await request(app)
        .post('/api/kyc/admin/approve/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Approved' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should require rejection reason', async () => {
      const adminToken = generateTestToken(adminUser);

      const response = await request(app)
        .post('/api/kyc/admin/reject/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}); // No reason provided

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});