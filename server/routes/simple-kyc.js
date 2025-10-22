const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, param, validationResult } = require('express-validator');
const knex = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  kycUploadLimiter,
  kycStatusLimiter,
  adminKycLimiter,
  documentAccessLimiter
} = require('../middleware/kycRateLimit');
const KYCAuditService = require('../services/kycAuditService');
const KYCExpiryService = require('../services/kycExpiryService');

const router = express.Router();

// Simple file upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/kyc-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and PDF files are allowed'));
    }
  }
});

/**
 * POST /api/simple-kyc/upload
 * Upload KYC documents - goes straight to admin for review
 */
router.post('/upload',
  authenticateToken,
  kycUploadLimiter,
  upload.array('documents', 5), // Allow up to 5 files
  [
    body('documentTypes').notEmpty().withMessage('Document types are required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.userId || req.user.id;

      let documentTypes;
      try {
        // Handle case where documentTypes is already an object
        if (typeof req.body.documentTypes === 'object') {
          documentTypes = req.body.documentTypes;
        } else {
          documentTypes = JSON.parse(req.body.documentTypes);
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in documentTypes',
          error: 'VALIDATION_ERROR'
        });
      }

      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      // Get or create KYC record
      let kycRecord = await knex('kyc_records').where('user_id', userId).first();

      if (!kycRecord) {
        [kycRecord] = await knex('kyc_records').insert({
          user_id: userId,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        }).returning('*');
      } else {
        // Update status to pending if it was rejected
        await knex('kyc_records').where('id', kycRecord.id).update({
          status: 'pending',
          updated_at: new Date(),
          rejection_reason: null
        });
      }

      // Delete old documents if resubmitting
      const oldDocs = await knex('kyc_documents').where('kyc_record_id', kycRecord.id);

      // Delete files asynchronously
      const deletePromises = oldDocs.map(async (oldDoc) => {
        const oldFilePath = path.join(__dirname, '../uploads/kyc-documents', oldDoc.filename);
        try {
          await fs.promises.unlink(oldFilePath);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.error(`Failed to delete file ${oldFilePath}:`, error);
          }
        }
      });

      await Promise.all(deletePromises);
      await knex('kyc_documents').where('kyc_record_id', kycRecord.id).del();

      // Save new documents
      const documentRecords = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const docType = documentTypes[i] || 'other';

        const [docRecord] = await knex('kyc_documents').insert({
          kyc_record_id: kycRecord.id,
          document_type: docType,
          original_filename: file.originalname,
          filename: file.filename,
          file_path: file.path,
          file_size: file.size,
          mime_type: file.mimetype,
          upload_timestamp: new Date()
        }).returning('*');

        documentRecords.push(docRecord);
      }

      // Log audit trail
      await KYCAuditService.logDocumentUpload(
        userId,
        kycRecord.id,
        documentRecords.map(doc => doc.id),
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Documents uploaded successfully. Waiting for admin approval.',
        data: {
          kycId: kycRecord.id,
          status: 'pending',
          documentsUploaded: documentRecords.length
        }
      });

    } catch (error) {
      console.error('KYC upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/simple-kyc/status
 * Get user's KYC status
 */
router.get('/status', authenticateToken, kycStatusLimiter, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const kycRecord = await knex('kyc_records').where('user_id', userId).first();

    if (!kycRecord) {
      return res.json({
        success: true,
        data: {
          status: 'not_started',
          canTrade: false,
          documents: [], // Always include documents array
          message: 'Please upload your KYC documents to start trading'
        }
      });
    }

    const documents = await knex('kyc_documents')
      .where('kyc_record_id', kycRecord.id)
      .select('document_type', 'original_filename', 'upload_timestamp');

    // Log status check
    await KYCAuditService.logStatusCheck(
      userId,
      kycRecord.id,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: {
        status: kycRecord.status,
        canTrade: kycRecord.status === 'verified',
        submittedAt: kycRecord.created_at,
        updatedAt: kycRecord.updated_at,
        verifiedAt: kycRecord.verified_at,
        rejectionReason: kycRecord.rejection_reason,
        documents: documents,
        message: getStatusMessage(kycRecord.status)
      }
    });

  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status'
    });
  }
});

/**
 * GET /api/simple-kyc/admin/pending
 * Admin: Get all pending KYC submissions
 */
router.get('/admin/pending',
  authenticateToken,
  requireRole('admin'),
  adminKycLimiter,
  async (req, res) => {
    try {
      const pendingKYCs = await knex('kyc_records')
        .join('users', 'kyc_records.user_id', 'users.id')
        .where('kyc_records.status', 'pending')
        .select([
          'kyc_records.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'users.phone'
        ])
        .orderBy('kyc_records.created_at', 'desc');

      // Get document counts for all KYCs in a single query
      const kycIds = pendingKYCs.map(kyc => kyc.id);
      const documentCounts = await knex('kyc_documents')
        .whereIn('kyc_record_id', kycIds)
        .groupBy('kyc_record_id')
        .select('kyc_record_id')
        .count('id as count');

      // Create a map for quick lookup
      const countMap = {};
      documentCounts.forEach(row => {
        countMap[row.kyc_record_id] = parseInt(row.count);
      });

      // Assign counts to each KYC
      pendingKYCs.forEach(kyc => {
        kyc.documentCount = countMap[kyc.id] || 0;
      });

      // Log admin pending view
      await KYCAuditService.logAdminPendingView(
        req.user.userId || req.user.id,
        pendingKYCs.length,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: {
          pendingSubmissions: pendingKYCs,
          total: pendingKYCs.length
        }
      });

    } catch (error) {
      console.error('Admin pending KYC error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending KYCs'
      });
    }
  }
);

/**
 * GET /api/simple-kyc/admin/submission/:id
 * Admin: Get detailed KYC submission
 */
router.get('/admin/submission/:id',
  authenticateToken,
  requireRole('admin'),
  [param('id').isInt().withMessage('Invalid KYC ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const kycId = req.params.id;

      const kycRecord = await knex('kyc_records')
        .join('users', 'kyc_records.user_id', 'users.id')
        .where('kyc_records.id', kycId)
        .select([
          'kyc_records.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'users.phone'
        ])
        .first();

      if (!kycRecord) {
        return res.status(404).json({
          success: false,
          message: 'KYC submission not found'
        });
      }

      const documents = await knex('kyc_documents')
        .where('kyc_record_id', kycId)
        .select('*');

      res.json({
        success: true,
        data: {
          kyc: kycRecord,
          documents: documents
        }
      });

    } catch (error) {
      console.error('Admin KYC submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get KYC submission'
      });
    }
  }
);

/**
 * GET /api/simple-kyc/admin/document/:filename
 * Admin: View uploaded document
 */
router.get('/admin/document/:filename',
  authenticateToken,
  requireRole('admin'),
  documentAccessLimiter,
  async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../uploads/kyc-documents', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Get document info from database
      const document = await knex('kyc_documents').where('filename', filename).first();

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document record not found'
        });
      }

      // Log document access
      await KYCAuditService.logDocumentAccess(
        req.user.userId || req.user.id,
        document.id,
        filename,
        req.ip,
        req.get('User-Agent')
      );

      res.setHeader('Content-Type', document.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${document.original_filename}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Document view error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load document'
      });
    }
  }
);

/**
 * POST /api/simple-kyc/admin/approve/:id
 * Admin: Approve KYC submission
 */
router.post('/admin/approve/:id',
  authenticateToken,
  requireRole('admin'),
  adminKycLimiter,
  [
    param('id').isInt().withMessage('Invalid KYC ID'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const kycId = req.params.id;
      const adminId = req.user.userId || req.user.id;
      const { notes } = req.body;

      const kycRecord = await knex('kyc_records').where('id', kycId).first();

      if (!kycRecord) {
        return res.status(404).json({
          success: false,
          message: 'KYC submission not found'
        });
      }

      if (kycRecord.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending submissions can be approved'
        });
      }

      await knex('kyc_records').where('id', kycId).update({
        status: 'verified',
        verified_at: new Date(),
        verified_by: adminId,
        updated_at: new Date(),
        rejection_reason: null
      });

      // Log approval
      await KYCAuditService.logApproval(
        adminId,
        kycId,
        notes,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'KYC approved successfully',
        data: {
          kycId: kycId,
          status: 'verified',
          approvedBy: req.user.email,
          notes: notes
        }
      });

    } catch (error) {
      console.error('KYC approval error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve KYC'
      });
    }
  }
);

/**
 * POST /api/simple-kyc/admin/reject/:id
 * Admin: Reject KYC submission
 */
router.post('/admin/reject/:id',
  authenticateToken,
  requireRole('admin'),
  adminKycLimiter,
  [
    param('id').isInt().withMessage('Invalid KYC ID'),
    body('reason').notEmpty().withMessage('Rejection reason is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const kycId = req.params.id;
      const adminId = req.user.userId || req.user.id;
      const { reason } = req.body;

      const kycRecord = await knex('kyc_records').where('id', kycId).first();

      if (!kycRecord) {
        return res.status(404).json({
          success: false,
          message: 'KYC submission not found'
        });
      }

      if (kycRecord.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending submissions can be rejected'
        });
      }

      await knex('kyc_records').where('id', kycId).update({
        status: 'rejected',
        verified_by: adminId,
        rejection_reason: reason,
        updated_at: new Date()
      });

      // Log rejection
      await KYCAuditService.logRejection(
        adminId,
        kycId,
        reason,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'KYC rejected',
        data: {
          kycId: kycId,
          status: 'rejected',
          rejectedBy: req.user.email,
          reason: reason
        }
      });

    } catch (error) {
      console.error('KYC rejection error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject KYC'
      });
    }
  }
);

/**
 * GET /api/kyc/admin/audit/:kycId
 * Admin: Get audit trail for a KYC record
 */
router.get('/admin/audit/:kycId',
  authenticateToken,
  requireRole('admin'),
  [param('kycId').isInt().withMessage('Invalid KYC ID')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const kycId = req.params.kycId;
      const auditTrail = await KYCAuditService.getAuditTrail(kycId);

      res.json({
        success: true,
        data: {
          kycId: kycId,
          auditTrail: auditTrail
        }
      });

    } catch (error) {
      console.error('Audit trail error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit trail'
      });
    }
  }
);

/**
 * GET /api/kyc/admin/audit-stats
 * Admin: Get audit statistics
 */
router.get('/admin/audit-stats',
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || '7 days';
      const stats = await KYCAuditService.getAuditStats(timeframe);

      res.json({
        success: true,
        data: {
          timeframe: timeframe,
          stats: stats
        }
      });

    } catch (error) {
      console.error('Audit stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit statistics'
      });
    }
  }
);

/**
 * GET /api/kyc/admin/expiry-summary
 * Admin: Get document expiry summary
 */
router.get('/admin/expiry-summary',
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const summary = await KYCExpiryService.getExpirySummary();

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('Expiry summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get expiry summary'
      });
    }
  }
);

/**
 * POST /api/kyc/admin/run-expiry-check
 * Admin: Manually run expiry check
 */
router.post('/admin/run-expiry-check',
  authenticateToken,
  requireRole('admin'),
  async (req, res) => {
    try {
      const result = await KYCExpiryService.runDailyExpiryCheck();

      res.json({
        success: true,
        message: 'Expiry check completed successfully',
        data: result
      });

    } catch (error) {
      console.error('Expiry check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to run expiry check'
      });
    }
  }
);

/**
 * Middleware to check if user can trade (KYC verified)
 */
const requireKYCVerification = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;

    const kycRecord = await knex('kyc_records')
      .where('user_id', userId)
      .where('status', 'verified')
      .first();

    if (!kycRecord) {
      return res.status(403).json({
        success: false,
        message: 'KYC verification required to trade',
        requiresKYC: true
      });
    }

    next();
  } catch (error) {
    console.error('KYC check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify KYC status'
    });
  }
};

// Helper function to get status message
function getStatusMessage(status) {
  switch (status) {
    case 'pending':
      return 'Your documents are under review. You will be notified once approved.';
    case 'verified':
      return 'Your KYC is verified. You can now trade on the platform.';
    case 'rejected':
      return 'Your KYC was rejected. Please resubmit with correct documents.';
    default:
      return 'Please upload your KYC documents to start trading.';
  }
}

module.exports = { router, requireKYCVerification };