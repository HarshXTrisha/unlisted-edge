const rateLimit = require('express-rate-limit');

// KYC Upload Rate Limiting - 5 uploads per hour per user
const kycUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 uploads per hour
  keyGenerator: (req) => {
    // Use user ID for rate limiting
    return `kyc_upload_${req.user.userId || req.user.id}`;
  },
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many KYC upload attempts. Please try again in an hour.',
      retryAfter: 3600
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for admin users
  skip: (req) => {
    return req.user && (req.user.email === 'admin@platform.com' || req.user.user_role === 'admin');
  }
});

// KYC Status Check Rate Limiting - 30 requests per hour per user
const kycStatusLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 status checks per hour
  keyGenerator: (req) => {
    return `kyc_status_${req.user.userId || req.user.id}`;
  },
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many status check requests. Please try again later.',
      retryAfter: 3600
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin KYC Action Rate Limiting - 100 actions per hour per admin
const adminKycLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 admin actions per hour
  keyGenerator: (req) => {
    return `admin_kyc_${req.user.userId || req.user.id}`;
  },
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many admin actions. Please try again later.',
      retryAfter: 3600
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Only apply to admin users
  skip: (req) => {
    return !(req.user && (req.user.email === 'admin@platform.com' || req.user.user_role === 'admin'));
  }
});

// Document Access Rate Limiting - 50 document views per hour per user
const documentAccessLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 document views per hour
  keyGenerator: (req) => {
    return `doc_access_${req.user.userId || req.user.id}`;
  },
  message: {
    success: false,
    error: {
      type: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many document access requests. Please try again later.',
      retryAfter: 3600
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  kycUploadLimiter,
  kycStatusLimiter,
  adminKycLimiter,
  documentAccessLimiter
};