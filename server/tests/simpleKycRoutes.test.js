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

// Helper functions
const generateTestToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
};

describe('Simple KYC Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/kyc/upload', () => {
    test('should reject request without authentication', async () => {
      const response = await request(app)
        .post('/api/kyc/upload')
        .field('documentTypes', JSON.stringify(['aadhaar']));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject request without files', async () => {
      const token = generateTestToken(testUser);

      const response = await request(app)
        .post('/api/kyc/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('documentTypes', JSON.stringify(['aadhaar']));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No files uploaded');
    });

    test('should handle successful document upload', async () => {
      const token = generateTestToken(testUser);

      // Mock database responses in the correct order
      const mockKnexInstance = mockKnex();
      mockKnexInstance.first
        .mockResolvedValueOnce(null) // No existing KYC record
        .mockResolvedValueOnce(null); // No old documents
      
      mockKnexInstance.returning
        .mockResolvedValueOnce([mockKYCRecord]) // Insert KYC record
        .mockResolvedValueOnce([{
          id: 1,
          kyc_record_id: 1,
          document_type: 'aadhaar',
          original_filename: 'test.pdf',
          filename: 'test-123.pdf'
        }]); // Insert document

      mockKnexInstance.where.mockResolvedValueOnce([]); // No old documents to delete
      mockKnexInstance.del.mockResolvedValueOnce(0); // Delete old documents

      const response = await request(app)
        .post('/api/kyc/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('documents', Buffer.from('test file'), 'test.pdf')
        .field('documentTypes', JSON.stringify(['aadhaar']));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
    });
  });

  describe('GET /api/kyc/status', () => {
    test('should return not_started status for new user', async () => {
      const token = generateTestToken(testUser);

      mockKnex().first.mockResolvedValueOnce(null); // No KYC record

      const response = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('not_started');
      expect(response.body.data.canTrade).toBe(false);
    });

    test('should return KYC status with documents', async () => {
      const token = generateTestToken(testUser);

      const mockKnexInstance = mockKnex();
      mockKnexInstance.first.mockResolvedValueOnce(mockKYCRecord); // KYC record exists
      mockKnexInstance.select.mockResolvedValueOnce([{
        document_type: 'aadhaar',
        original_filename: 'aadhaar.pdf',
        upload_timestamp: new Date()
      }]); // Documents

      const response = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.canTrade).toBe(false);
      expect(response.body.data.documents).toHaveLength(1);
    });
  });

  describe('Admin Endpoints', () => {
    test('should reject non-admin access to pending submissions', async () => {
      const token = generateTestToken(testUser);

      const response = await request(app)
        .get('/api/kyc/admin/pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should allow admin access to pending submissions', async () => {
      const token = generateTestToken(adminUser);

      const mockKnexInstance = mockKnex();
      
      // Mock pending KYCs query chain
      mockKnexInstance.join.mockReturnThis();
      mockKnexInstance.where.mockReturnThis();
      mockKnexInstance.select.mockReturnThis();
      mockKnexInstance.orderBy.mockResolvedValueOnce([{
        ...mockKYCRecord,
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com'
      }]);

      // Mock document count for each KYC
      mockKnexInstance.first.mockResolvedValueOnce({ count: '1' });

      const response = await request(app)
        .get('/api/kyc/admin/pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pendingSubmissions).toHaveLength(1);
    });

    test('should allow admin to approve KYC submission', async () => {
      const token = generateTestToken(adminUser);

      const mockKnexInstance = mockKnex();
      
      // Mock KYC record lookup
      mockKnexInstance.first.mockResolvedValueOnce(mockKYCRecord);
      
      // Mock update operation
      mockKnexInstance.update.mockResolvedValueOnce(1);

      const response = await request(app)
        .post('/api/kyc/admin/approve/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ notes: 'Approved' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('verified');
    });

    test('should allow admin to reject KYC submission', async () => {
      const token = generateTestToken(adminUser);

      const mockKnexInstance = mockKnex();
      
      // Mock KYC record lookup
      mockKnexInstance.first.mockResolvedValueOnce(mockKYCRecord);
      
      // Mock update operation
      mockKnexInstance.update.mockResolvedValueOnce(1);

      const response = await request(app)
        .post('/api/kyc/admin/reject/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Invalid documents' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const token = generateTestToken(testUser);

      const mockKnexInstance = mockKnex();
      mockKnexInstance.first.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});