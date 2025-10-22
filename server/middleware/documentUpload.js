const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// File validation constants
const FILE_VALIDATION = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_EXTENSIONS: ['.pdf', '.jpg', '.jpeg', '.png']
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/kyc');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and UUID
    const uniqueSuffix = Date.now() + '-' + uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, 'temp_' + uniqueSuffix + extension);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!FILE_VALIDATION.ALLOWED_TYPES.includes(file.mimetype)) {
    const error = new Error(`Invalid file type. Allowed types: ${FILE_VALIDATION.ALLOWED_TYPES.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Check file extension
  const extension = path.extname(file.originalname).toLowerCase();
  if (!FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension)) {
    const error = new Error(`Invalid file extension. Allowed extensions: ${FILE_VALIDATION.ALLOWED_EXTENSIONS.join(', ')}`);
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }

  // Additional security checks
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    const error = new Error('Invalid filename. Filename contains illegal characters.');
    error.code = 'INVALID_FILENAME';
    return cb(error, false);
  }

  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_VALIDATION.MAX_SIZE,
    files: 1 // Only allow one file per upload
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('document');

// Enhanced upload middleware with error handling
const documentUploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors
      let errorMessage = 'File upload error';
      let errorCode = 'UPLOAD_ERROR';

      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          errorMessage = `File too large. Maximum size allowed is ${FILE_VALIDATION.MAX_SIZE / (1024 * 1024)}MB`;
          errorCode = 'FILE_TOO_LARGE';
          break;
        case 'LIMIT_FILE_COUNT':
          errorMessage = 'Too many files. Only one file allowed per upload';
          errorCode = 'TOO_MANY_FILES';
          break;
        case 'LIMIT_UNEXPECTED_FILE':
          errorMessage = 'Unexpected field name. Use "document" as the field name';
          errorCode = 'UNEXPECTED_FIELD';
          break;
        default:
          errorMessage = err.message;
      }

      return res.status(400).json({
        success: false,
        error: {
          type: errorCode,
          message: errorMessage,
          retryable: false
        }
      });
    } else if (err) {
      // Handle custom validation errors
      return res.status(400).json({
        success: false,
        error: {
          type: err.code || 'VALIDATION_ERROR',
          message: err.message,
          retryable: false
        }
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'NO_FILE',
          message: 'No file uploaded. Please select a file to upload.',
          retryable: true
        }
      });
    }

    // Validate document type parameter
    const documentType = req.body.documentType;
    const validDocumentTypes = ['aadhaar', 'pan', 'bank_statement'];
    
    if (!documentType || !validDocumentTypes.includes(documentType)) {
      // Clean up uploaded file
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error cleaning up file:', unlinkErr);
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          type: 'INVALID_DOCUMENT_TYPE',
          message: `Invalid document type. Allowed types: ${validDocumentTypes.join(', ')}`,
          retryable: false
        }
      });
    }

    // Add file validation info to request
    req.fileValidation = {
      isValid: true,
      originalName: req.file.originalname,
      tempPath: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      documentType: documentType
    };

    next();
  });
};

// Cleanup middleware to remove temporary files on error
const cleanupTempFile = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If there's an error and we have a temp file, clean it up
    if (req.file && req.file.path && (res.statusCode >= 400)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error cleaning up temp file:', err);
      });
    }
    originalSend.call(this, data);
  };

  next();
};

// File validation utility functions
const validateFileSize = (size) => {
  return size <= FILE_VALIDATION.MAX_SIZE;
};

const validateFileType = (mimetype) => {
  return FILE_VALIDATION.ALLOWED_TYPES.includes(mimetype);
};

const validateFileExtension = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  return FILE_VALIDATION.ALLOWED_EXTENSIONS.includes(extension);
};

// Get file info utility
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    extension: path.extname(file.originalname),
    sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
  };
};

module.exports = {
  documentUploadMiddleware,
  cleanupTempFile,
  validateFileSize,
  validateFileType,
  validateFileExtension,
  getFileInfo,
  FILE_VALIDATION,
  uploadsDir
};