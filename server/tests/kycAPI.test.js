const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Set test environment
process.env.JWT_SECRET = 'test-secret-key-for-testing';

// Mock dependencies
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234-5678-9012'
}));
jest.mock('../config/database');
jest.mock('../services/fileEncryptionService');
jest.mock('../services/documentProcessingService');
jest.mock('../services/verificationService');
jest.mock('../middleware/documentUpload', () => ({
  documentUploadMiddleware: (req, res, next) => {
    req.fileValidation = {
      originalName: 'test.pdf',
      tempPath: '/tmp/test.pdf',
      size: 1024,
      mimeType: 'application/pdf'
    };
    next();
  },
  cleanupTempFile: (req, res, next) => next()
}));

const mockKnex = require('../config/database');
const { storeFileSecurely } = require('../services/fileEncryptionService');
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

// Helper function to generate test JWT
const generateTestToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
};

describe('KYC API Routes', () => {
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

  describe('Authentication', () => {
    test('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/kyc/status/1');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('NO_TOKEN');
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/kyc/status/1')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('INVALID_TOKEN');
    });
  });

  describe('KYC Status Endpoint', () => {
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

    test('should return KYC status with documents', async () => {
      const token = generateTestToken(testUser);
      
      const mockKYCRecord = {
        id: 1,
        user_id: 1,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };

      const mockDocuments = [{
        id: 1,
        document_type: 'aadhaar',
        original_filename: 'aadhaar.pdf',
        file_size: 1024000,
        upload_timestamp: new Date(),
        validation_status: 'valid',
        validation_errors: null
      }];

      mockKnex().first.mockResolvedValueOnce(mockKYCRecord);
      mockKnex().select.mockResolvedValueOnce(mockDocuments);

      const response = await request(app)
        .get('/api/kyc/status/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.kycStatus).toBe('pending');
      expect(response.body.data.documents).toHaveLength(1);
    });

    test('should reject access to other user status', async () => {
      const token = generateTestToken(testUser);

      const response = await request(app)
        .get('/api/kyc/status/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('ACCESS_DENIED');
    });
  });

  describe('Document Upload', () => {
    test('should handle successful document upload', async () => {
      const token = generateTestToken(testUser);
      
      // Mock successful responses
      const mockKYCRecord = { id: 1, user_id: 1, status: 'pending' };
      const mockDocument = { id: 1, validation_status: 'valid' };

      mockKnex().first
        .mockResolvedValueOnce(mockKYCRecord) // getOrCreateKYCRecord
        .mockResolvedValueOnce(null); // existingDoc check
      
      mockKnex().returning.mockResolvedValueOnce([mockDocument]);
      mockKnex().where.mockResolvedValueOnce([]);

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
        .field('documentType', 'aadhaar')
        .attach('document', Buffer.from('test file'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.documentType).toBe('aadhaar');
    });

    test('should reject invalid document type', async () => {
      const token = generateTestToken(testUser);

      const response = await request(app)
        .post('/api/kyc/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('documentType', 'invalid_type')
        .attach('document', Buffer.from('test file'), 'test.pdf');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('VALIDATION_ERROR');
    });
  });

  describe('Admin Endpoints', () => {
    test('should reject non-admin access', async () => {
      const token = generateTestToken(testUser);
      
      // Mock user role check
      mockKnex().first.mockResolvedValueOnce({ user_role: 'user' });

      const response = await request(app)
        .get('/api/kyc/admin/pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.type).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow admin access to pending submissions', async () => {
      const token = generateTestToken(testAdmin);
      
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
  });
});