const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const knex = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { documentUploadMiddleware, cleanupTempFile } = require('../middleware/documentUpload');
const { storeFileSecurely, retrieveFileSecurely, deleteFileSecurely } = require('../services/fileEncryptionService');
const documentProcessingService = require('../services/documentProcessingService');
const verificationService = require('../services/verificationService');

const router = express.Router();

// KYC-specific rate limiting
const kycUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 uploads per hour per IP
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many document uploads. Please try again later.',
      retryAfter: 3600
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const kycAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 admin actions per 15 minutes
  message: {
    success: false,
    error: {
      type: 'ADMIN_RATE_LIMIT_EXCEEDED',
      message: 'Too many admin actions. Please slow down.',
      retryAfter: 900
    }
  }
});

/**
 * Helper function to create audit log entry
 */
async function createAuditLog(kycRecordId, actionType, performedBy, actionDetails, req) {
  try {
    await knex('kyc_audit_logs').insert({
      kyc_record_id: kycRecordId,
      action_type: actionType,
      performed_by: performedBy,
      action_details: JSON.stringify(actionDetails),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Helper function to get or create KYC record for user
 */
async function getOrCreateKYCRecord(userId) {
  let kycRecord = await knex('kyc_records')
    .where('user_id', userId)
    .first();

  if (!kycRecord) {
    const [newRecord] = await knex('kyc_records')
      .insert({
        user_id: userId,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    kycRecord = newRecord;
  }

  return kycRecord;
}

/**
 * POST /api/kyc/upload
 * Upload KYC document with processing and validation
 */
router.post('/upload',
  authenticateToken,
  kycUploadLimiter,
  documentUploadMiddleware,
  cleanupTempFile,
  [
    body('documentType')
      .isIn(['aadhaar', 'pan', 'bank_statement'])
      .withMessage('Invalid document type')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const { documentType } = req.body;
      const userId = req.user.id;
      const fileInfo = req.fileValidation;

      // Get or create KYC record
      const kycRecord = await getOrCreateKYCRecord(userId);

      // Check if document type already exists
      const existingDoc = await knex('kyc_documents')
        .where({
          kyc_record_id: kycRecord.id,
          document_type: documentType
        })
        .first();

      if (existingDoc) {
        // Delete old document before uploading new one
        try {
          await deleteFileSecurely(existingDoc.encrypted_filename, userId);
        } catch (error) {
          console.error('Failed to delete old document:', error);
        }
        
        await knex('kyc_documents')
          .where('id', existingDoc.id)
          .del();
      }

      // Store file securely with encryption
      const storageResult = await storeFileSecurely(
        fileInfo.tempPath,
        fileInfo.originalName,
        documentType,
        userId
      );

      // Process document with OCR and validation
      const processingResult = await documentProcessingService.processDocument(
        fileInfo.tempPath,
        documentType
      );

      let validationResult = null;
      if (processingResult.success && processingResult.extractedData) {
        // Validate extracted data based on document type
        switch (documentType) {
          case 'aadhaar':
            validationResult = await verificationService.validateAadhaar(processingResult.extractedData);
            break;
          case 'pan':
            validationResult = await verificationService.validatePAN(processingResult.extractedData);
            break;
          case 'bank_statement':
            validationResult = await verificationService.validateBankStatement(processingResult.extractedData);
            break;
        }
      }

      // Store document metadata in database
      const [documentRecord] = await knex('kyc_documents')
        .insert({
          kyc_record_id: kycRecord.id,
          document_type: documentType,
          original_filename: storageResult.originalFilename,
          encrypted_filename: storageResult.encryptedFilename,
          file_size: storageResult.fileSize,
          mime_type: fileInfo.mimeType,
          upload_timestamp: new Date(),
          extracted_data: processingResult.success ? JSON.stringify(processingResult.extractedData) : null,
          validation_status: validationResult?.isValid ? 'valid' : 'invalid',
          validation_errors: validationResult ? JSON.stringify(validationResult.errors) : null
        })
        .returning('*');

      // Update KYC record status based on validation
      let newKYCStatus = kycRecord.status;
      if (validationResult?.isValid) {
        // Check if all required documents are uploaded and valid
        const allDocuments = await knex('kyc_documents')
          .where('kyc_record_id', kycRecord.id)
          .whereIn('document_type', ['aadhaar', 'pan', 'bank_statement']);

        const validDocuments = allDocuments.filter(doc => doc.validation_status === 'valid');
        
        if (validDocuments.length >= 2) { // At least Aadhaar and PAN required
          newKYCStatus = 'pending'; // Ready for admin review
        }
      }

      await knex('kyc_records')
        .where('id', kycRecord.id)
        .update({
          status: newKYCStatus,
          updated_at: new Date()
        });

      // Create audit log
      await createAuditLog(kycRecord.id, 'DOCUMENT_UPLOADED', userId, {
        document_type: documentType,
        filename: storageResult.originalFilename,
        file_size: storageResult.fileSize,
        validation_status: validationResult?.isValid ? 'valid' : 'invalid',
        processing_success: processingResult.success
      }, req);

      // Prepare response
      const response = {
        success: true,
        data: {
          documentId: documentRecord.id,
          documentType: documentType,
          uploadTimestamp: documentRecord.upload_timestamp,
          validationStatus: documentRecord.validation_status,
          kycStatus: newKYCStatus,
          processing: {
            success: processingResult.success,
            confidence: processingResult.ocrConfidence || 0,
            extractedData: processingResult.extractedData || null
          }
        }
      };

      if (validationResult) {
        response.data.validation = {
          isValid: validationResult.isValid,
          confidence: validationResult.confidence,
          errors: validationResult.errors,
          warnings: validationResult.warnings
        };
      }

      res.status(200).json(response);

    } catch (error) {
      console.error('KYC upload error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'UPLOAD_PROCESSING_ERROR',
          message: 'Failed to process document upload',
          details: error.message
        }
      });
    }
  }
);

/**
 * GET /api/kyc/status/:userId
 * Get KYC status and documents for a user
 */
router.get('/status/:userId',
  authenticateToken,
  [
    param('userId').isInt().withMessage('Invalid user ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array()
          }
        });
      }

      const requestedUserId = parseInt(req.params.userId);
      const currentUserId = req.user.id;

      // Users can only access their own KYC status unless they're admin
      if (requestedUserId !== currentUserId && req.user.user_role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            type: 'ACCESS_DENIED',
            message: 'You can only access your own KYC status'
          }
        });
      }

      // Get KYC record
      const kycRecord = await knex('kyc_records')
        .where('user_id', requestedUserId)
        .first();

      if (!kycRecord) {
        return res.status(200).json({
          success: true,
          data: {
            kycStatus: 'not_started',
            documents: [],
            progress: {
              currentStep: 0,
              totalSteps: 3,
              statusMessage: 'KYC verification not started',
              estimatedTime: '2-3 business days'
            }
          }
        });
      }

      // Get documents
      const documents = await knex('kyc_documents')
        .where('kyc_record_id', kycRecord.id)
        .select([
          'id',
          'document_type',
          'original_filename',
          'file_size',
          'upload_timestamp',
          'validation_status',
          'validation_errors'
        ]);

      // Calculate progress
      const totalSteps = 3;
      const completedSteps = documents.filter(doc => doc.validation_status === 'valid').length;
      
      let statusMessage = 'Documents pending upload';
      let estimatedTime = '2-3 business days';

      switch (kycRecord.status) {
        case 'pending':
          statusMessage = 'Documents under review by compliance team';
          estimatedTime = '1-2 business days';
          break;
        case 'verified':
          statusMessage = 'KYC verification completed successfully';
          estimatedTime = null;
          break;
        case 'rejected':
          statusMessage = 'KYC verification rejected. Please resubmit documents';
          estimatedTime = '2-3 business days after resubmission';
          break;
        case 'expired':
          statusMessage = 'KYC verification expired. Please resubmit documents';
          estimatedTime = '2-3 business days after resubmission';
          break;
      }

      res.status(200).json({
        success: true,
        data: {
          kycStatus: kycRecord.status,
          documents: documents.map(doc => ({
            id: doc.id,
            type: doc.document_type,
            filename: doc.original_filename,
            size: doc.file_size,
            uploadedAt: doc.upload_timestamp,
            status: doc.validation_status,
            errors: doc.validation_errors ? JSON.parse(doc.validation_errors) : []
          })),
          progress: {
            currentStep: completedSteps,
            totalSteps: totalSteps,
            statusMessage: statusMessage,
            estimatedTime: estimatedTime
          },
          timestamps: {
            createdAt: kycRecord.created_at,
            updatedAt: kycRecord.updated_at,
            verifiedAt: kycRecord.verified_at
          },
          rejectionReason: kycRecord.rejection_reason
        }
      });

    } catch (error) {
      console.error('KYC status error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'STATUS_FETCH_ERROR',
          message: 'Failed to fetch KYC status',
          details: error.message
        }
      });
    }
  }
);

/**
 * GET /api/kyc/document/:documentId
 * View/download a specific KYC document (for user to verify their upload)
 */
router.get('/document/:documentId',
  authenticateToken,
  [
    param('documentId').isInt().withMessage('Invalid document ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid document ID',
            details: errors.array()
          }
        });
      }

      const documentId = parseInt(req.params.documentId);
      const userId = req.user.id;

      // Get document with KYC record to verify ownership
      const document = await knex('kyc_documents')
        .join('kyc_records', 'kyc_documents.kyc_record_id', 'kyc_records.id')
        .where('kyc_documents.id', documentId)
        .select([
          'kyc_documents.*',
          'kyc_records.user_id'
        ])
        .first();

      if (!document) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
      }

      // Check ownership (users can only view their own documents, admins can view all)
      if (document.user_id !== userId && req.user.user_role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            type: 'ACCESS_DENIED',
            message: 'You can only access your own documents'
          }
        });
      }

      // Retrieve and decrypt file
      const fileResult = await retrieveFileSecurely(
        document.encrypted_filename,
        document.user_id,
        JSON.parse(document.extracted_data || '{}')
      );

      // Create audit log for document access
      await createAuditLog(document.kyc_record_id, 'DOCUMENT_ACCESSED', userId, {
        document_id: documentId,
        document_type: document.document_type,
        accessed_by: req.user.user_role
      }, req);

      // Set appropriate headers
      res.setHeader('Content-Type', document.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${document.original_filename}"`);
      res.setHeader('Content-Length', document.file_size);

      // Stream the file
      const fs = require('fs');
      const fileStream = fs.createReadStream(fileResult.tempFilePath);
      
      fileStream.pipe(res);
      
      // Clean up temporary file after streaming
      fileStream.on('end', () => {
        fileResult.cleanup();
      });

      fileStream.on('error', (error) => {
        console.error('File streaming error:', error);
        fileResult.cleanup();
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: {
              type: 'FILE_STREAM_ERROR',
              message: 'Failed to stream document'
            }
          });
        }
      });

    } catch (error) {
      console.error('Document retrieval error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'DOCUMENT_RETRIEVAL_ERROR',
          message: 'Failed to retrieve document',
          details: error.message
        }
      });
    }
  }
);

/**
 * DELETE /api/kyc/document/:documentId
 * Delete a KYC document (allows users to re-upload)
 */
router.delete('/document/:documentId',
  authenticateToken,
  [
    param('documentId').isInt().withMessage('Invalid document ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid document ID',
            details: errors.array()
          }
        });
      }

      const documentId = parseInt(req.params.documentId);
      const userId = req.user.id;

      // Get document with KYC record to verify ownership
      const document = await knex('kyc_documents')
        .join('kyc_records', 'kyc_documents.kyc_record_id', 'kyc_records.id')
        .where('kyc_documents.id', documentId)
        .select([
          'kyc_documents.*',
          'kyc_records.user_id'
        ])
        .first();

      if (!document) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
      }

      // Check ownership
      if (document.user_id !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            type: 'ACCESS_DENIED',
            message: 'You can only delete your own documents'
          }
        });
      }

      // Delete encrypted file
      await deleteFileSecurely(document.encrypted_filename, document.user_id);

      // Delete database record
      await knex('kyc_documents')
        .where('id', documentId)
        .del();

      // Create audit log
      await createAuditLog(document.kyc_record_id, 'DOCUMENT_DELETED', userId, {
        document_id: documentId,
        document_type: document.document_type,
        filename: document.original_filename
      }, req);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'DOCUMENT_DELETION_ERROR',
          message: 'Failed to delete document',
          details: error.message
        }
      });
    }
  }
);

// ============================================================================
// ADMIN KYC REVIEW ENDPOINTS
// ============================================================================

/**
 * GET /api/kyc/admin/pending
 * Get all pending KYC submissions for admin review
 */
router.get('/admin/pending',
  authenticateToken,
  requireRole('admin'),
  kycAdminLimiter,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['pending', 'verified', 'rejected', 'expired']).withMessage('Invalid status filter')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array()
          }
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const statusFilter = req.query.status || 'pending';
      const offset = (page - 1) * limit;

      // Get KYC submissions with user details
      const query = knex('kyc_records')
        .join('users', 'kyc_records.user_id', 'users.id')
        .leftJoin('users as verifier', 'kyc_records.verified_by', 'verifier.id')
        .where('kyc_records.status', statusFilter)
        .select([
          'kyc_records.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'users.phone',
          'verifier.first_name as verifier_first_name',
          'verifier.last_name as verifier_last_name'
        ])
        .orderBy('kyc_records.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const submissions = await query;

      // Get document counts for each submission
      const submissionIds = submissions.map(s => s.id);
      const documentCounts = await knex('kyc_documents')
        .whereIn('kyc_record_id', submissionIds)
        .groupBy('kyc_record_id')
        .select([
          'kyc_record_id',
          knex.raw('COUNT(*) as total_documents'),
          knex.raw('COUNT(CASE WHEN validation_status = ? THEN 1 END) as valid_documents', ['valid'])
        ]);

      const documentCountMap = {};
      documentCounts.forEach(dc => {
        documentCountMap[dc.kyc_record_id] = {
          total: parseInt(dc.total_documents),
          valid: parseInt(dc.valid_documents)
        };
      });

      // Get total count for pagination
      const totalCount = await knex('kyc_records')
        .where('status', statusFilter)
        .count('id as count')
        .first();

      const formattedSubmissions = submissions.map(submission => ({
        id: submission.id,
        userId: submission.user_id,
        userName: `${submission.first_name} ${submission.last_name}`,
        userEmail: submission.email,
        userPhone: submission.phone,
        status: submission.status,
        submittedAt: submission.created_at,
        updatedAt: submission.updated_at,
        verifiedAt: submission.verified_at,
        verifiedBy: submission.verified_by ? {
          name: `${submission.verifier_first_name} ${submission.verifier_last_name}`
        } : null,
        rejectionReason: submission.rejection_reason,
        complianceScore: submission.compliance_score,
        documentsCount: documentCountMap[submission.id] || { total: 0, valid: 0 }
      }));

      res.status(200).json({
        success: true,
        data: {
          submissions: formattedSubmissions,
          pagination: {
            page: page,
            limit: limit,
            total: parseInt(totalCount.count),
            totalPages: Math.ceil(parseInt(totalCount.count) / limit)
          },
          filters: {
            status: statusFilter
          }
        }
      });

    } catch (error) {
      console.error('Admin pending KYC fetch error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'ADMIN_FETCH_ERROR',
          message: 'Failed to fetch pending KYC submissions',
          details: error.message
        }
      });
    }
  }
);

/**
 * GET /api/kyc/admin/submission/:submissionId
 * Get detailed KYC submission for admin review
 */
router.get('/admin/submission/:submissionId',
  authenticateToken,
  requireRole('admin'),
  kycAdminLimiter,
  [
    param('submissionId').isInt().withMessage('Invalid submission ID')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid submission ID',
            details: errors.array()
          }
        });
      }

      const submissionId = parseInt(req.params.submissionId);

      // Get KYC record with user details
      const submission = await knex('kyc_records')
        .join('users', 'kyc_records.user_id', 'users.id')
        .leftJoin('users as verifier', 'kyc_records.verified_by', 'verifier.id')
        .where('kyc_records.id', submissionId)
        .select([
          'kyc_records.*',
          'users.first_name',
          'users.last_name',
          'users.email',
          'users.phone',
          'users.created_at as user_created_at',
          'verifier.first_name as verifier_first_name',
          'verifier.last_name as verifier_last_name'
        ])
        .first();

      if (!submission) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'SUBMISSION_NOT_FOUND',
            message: 'KYC submission not found'
          }
        });
      }

      // Get all documents for this submission
      const documents = await knex('kyc_documents')
        .where('kyc_record_id', submissionId)
        .select([
          'id',
          'document_type',
          'original_filename',
          'file_size',
          'mime_type',
          'upload_timestamp',
          'extracted_data',
          'validation_status',
          'validation_errors'
        ]);

      // Get audit trail
      const auditLogs = await knex('kyc_audit_logs')
        .leftJoin('users', 'kyc_audit_logs.performed_by', 'users.id')
        .where('kyc_record_id', submissionId)
        .select([
          'kyc_audit_logs.*',
          'users.first_name',
          'users.last_name'
        ])
        .orderBy('kyc_audit_logs.timestamp', 'desc');

      // Cross-validate documents if both Aadhaar and PAN are present
      let crossValidation = null;
      const aadhaarDoc = documents.find(d => d.document_type === 'aadhaar');
      const panDoc = documents.find(d => d.document_type === 'pan');

      if (aadhaarDoc && panDoc && aadhaarDoc.extracted_data && panDoc.extracted_data) {
        const aadhaarData = JSON.parse(aadhaarDoc.extracted_data);
        const panData = JSON.parse(panDoc.extracted_data);
        crossValidation = verificationService.crossValidateDocuments(aadhaarData, panData);
      }

      const formattedSubmission = {
        id: submission.id,
        user: {
          id: submission.user_id,
          name: `${submission.first_name} ${submission.last_name}`,
          email: submission.email,
          phone: submission.phone,
          registeredAt: submission.user_created_at
        },
        status: submission.status,
        timestamps: {
          submittedAt: submission.created_at,
          updatedAt: submission.updated_at,
          verifiedAt: submission.verified_at
        },
        verification: {
          verifiedBy: submission.verified_by ? {
            name: `${submission.verifier_first_name} ${submission.verifier_last_name}`
          } : null,
          rejectionReason: submission.rejection_reason,
          complianceScore: submission.compliance_score
        },
        documents: documents.map(doc => ({
          id: doc.id,
          type: doc.document_type,
          filename: doc.original_filename,
          size: doc.file_size,
          mimeType: doc.mime_type,
          uploadedAt: doc.upload_timestamp,
          extractedData: doc.extracted_data ? JSON.parse(doc.extracted_data) : null,
          validationStatus: doc.validation_status,
          validationErrors: doc.validation_errors ? JSON.parse(doc.validation_errors) : []
        })),
        crossValidation: crossValidation,
        auditTrail: auditLogs.map(log => ({
          id: log.id,
          actionType: log.action_type,
          performedBy: log.performed_by ? `${log.first_name} ${log.last_name}` : 'System',
          actionDetails: JSON.parse(log.action_details),
          timestamp: log.timestamp,
          ipAddress: log.ip_address
        }))
      };

      res.status(200).json({
        success: true,
        data: formattedSubmission
      });

    } catch (error) {
      console.error('Admin submission fetch error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'SUBMISSION_FETCH_ERROR',
          message: 'Failed to fetch KYC submission details',
          details: error.message
        }
      });
    }
  }
);

/**
 * POST /api/kyc/admin/approve/:submissionId
 * Approve a KYC submission
 */
router.post('/admin/approve/:submissionId',
  authenticateToken,
  requireRole('admin'),
  kycAdminLimiter,
  [
    param('submissionId').isInt().withMessage('Invalid submission ID'),
    body('complianceScore').optional().isInt({ min: 0, max: 100 }).withMessage('Compliance score must be between 0 and 100'),
    body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const submissionId = parseInt(req.params.submissionId);
      const adminId = req.user.id;
      const { complianceScore = 85, notes } = req.body;

      // Get KYC record
      const kycRecord = await knex('kyc_records')
        .where('id', submissionId)
        .first();

      if (!kycRecord) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'SUBMISSION_NOT_FOUND',
            message: 'KYC submission not found'
          }
        });
      }

      if (kycRecord.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_STATUS',
            message: 'Only pending submissions can be approved'
          }
        });
      }

      // Update KYC record
      await knex('kyc_records')
        .where('id', submissionId)
        .update({
          status: 'verified',
          verified_at: new Date(),
          verified_by: adminId,
          compliance_score: complianceScore,
          updated_at: new Date()
        });

      // Create audit log
      await createAuditLog(submissionId, 'KYC_APPROVED', adminId, {
        compliance_score: complianceScore,
        notes: notes,
        approved_by: req.user.email
      }, req);

      res.status(200).json({
        success: true,
        message: 'KYC submission approved successfully',
        data: {
          submissionId: submissionId,
          status: 'verified',
          approvedBy: req.user.email,
          approvedAt: new Date(),
          complianceScore: complianceScore
        }
      });

    } catch (error) {
      console.error('KYC approval error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'APPROVAL_ERROR',
          message: 'Failed to approve KYC submission',
          details: error.message
        }
      });
    }
  }
);

/**
 * POST /api/kyc/admin/reject/:submissionId
 * Reject a KYC submission
 */
router.post('/admin/reject/:submissionId',
  authenticateToken,
  requireRole('admin'),
  kycAdminLimiter,
  [
    param('submissionId').isInt().withMessage('Invalid submission ID'),
    body('reason').notEmpty().isString().isLength({ min: 10, max: 500 }).withMessage('Rejection reason is required (10-500 characters)'),
    body('complianceScore').optional().isInt({ min: 0, max: 100 }).withMessage('Compliance score must be between 0 and 100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: errors.array()
          }
        });
      }

      const submissionId = parseInt(req.params.submissionId);
      const adminId = req.user.id;
      const { reason, complianceScore = 0 } = req.body;

      // Get KYC record
      const kycRecord = await knex('kyc_records')
        .where('id', submissionId)
        .first();

      if (!kycRecord) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'SUBMISSION_NOT_FOUND',
            message: 'KYC submission not found'
          }
        });
      }

      if (kycRecord.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_STATUS',
            message: 'Only pending submissions can be rejected'
          }
        });
      }

      // Update KYC record
      await knex('kyc_records')
        .where('id', submissionId)
        .update({
          status: 'rejected',
          verified_by: adminId,
          rejection_reason: reason,
          compliance_score: complianceScore,
          updated_at: new Date()
        });

      // Create audit log
      await createAuditLog(submissionId, 'KYC_REJECTED', adminId, {
        rejection_reason: reason,
        compliance_score: complianceScore,
        rejected_by: req.user.email
      }, req);

      res.status(200).json({
        success: true,
        message: 'KYC submission rejected',
        data: {
          submissionId: submissionId,
          status: 'rejected',
          rejectedBy: req.user.email,
          rejectedAt: new Date(),
          reason: reason,
          complianceScore: complianceScore
        }
      });

    } catch (error) {
      console.error('KYC rejection error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'REJECTION_ERROR',
          message: 'Failed to reject KYC submission',
          details: error.message
        }
      });
    }
  }
);

/**
 * GET /api/kyc/admin/statistics
 * Get KYC statistics for admin dashboard
 */
router.get('/admin/statistics',
  authenticateToken,
  requireRole('admin'),
  kycAdminLimiter,
  async (req, res) => {
    try {
      // Get overall statistics
      const stats = await knex('kyc_records')
        .select([
          knex.raw('COUNT(*) as total_submissions'),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending', ['pending']),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as verified', ['verified']),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as rejected', ['rejected']),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as expired', ['expired']),
          knex.raw('AVG(compliance_score) as avg_compliance_score')
        ])
        .first();

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await knex('kyc_records')
        .where('created_at', '>=', thirtyDaysAgo)
        .select([
          knex.raw('COUNT(*) as recent_submissions'),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as recent_verified', ['verified']),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as recent_rejected', ['rejected'])
        ])
        .first();

      // Get processing time statistics
      const processingTimes = await knex('kyc_records')
        .whereNotNull('verified_at')
        .select([
          knex.raw('AVG(EXTRACT(EPOCH FROM (verified_at - created_at))/3600) as avg_processing_hours'),
          knex.raw('MIN(EXTRACT(EPOCH FROM (verified_at - created_at))/3600) as min_processing_hours'),
          knex.raw('MAX(EXTRACT(EPOCH FROM (verified_at - created_at))/3600) as max_processing_hours')
        ])
        .first();

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalSubmissions: parseInt(stats.total_submissions),
            pending: parseInt(stats.pending),
            verified: parseInt(stats.verified),
            rejected: parseInt(stats.rejected),
            expired: parseInt(stats.expired),
            averageComplianceScore: parseFloat(stats.avg_compliance_score || 0).toFixed(1)
          },
          recentActivity: {
            submissions: parseInt(recentActivity.recent_submissions),
            verified: parseInt(recentActivity.recent_verified),
            rejected: parseInt(recentActivity.recent_rejected)
          },
          processingTimes: {
            averageHours: parseFloat(processingTimes.avg_processing_hours || 0).toFixed(1),
            minimumHours: parseFloat(processingTimes.min_processing_hours || 0).toFixed(1),
            maximumHours: parseFloat(processingTimes.max_processing_hours || 0).toFixed(1)
          },
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('KYC statistics error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'STATISTICS_ERROR',
          message: 'Failed to fetch KYC statistics',
          details: error.message
        }
      });
    }
  }
);

module.exports = router;