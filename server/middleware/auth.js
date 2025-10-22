const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware to verify JWT token (supports demo tokens)
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: {
        type: 'NO_TOKEN',
        message: 'Access token required'
      }
    });
  }

  // Try to verify as JWT first
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
      return next();
    }

    // If JWT verification fails, try demo token (base64 encoded)
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.userId && decoded.email) {
        req.user = decoded;
        return next();
      }
    } catch (demoErr) {
      // Demo token parsing failed
    }

    return res.status(403).json({ 
      success: false,
      error: {
        type: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  });
};

/**
 * Middleware to require specific user role
 */
const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // For demo admin user - only apply when checking for admin role
      if (requiredRole === 'admin' && req.user.email === 'admin@platform.com') {
        req.user.user_role = 'admin';
        req.user.id = req.user.userId || 3; // Demo admin ID
        return next();
      }

      // For real users, check database
      const userId = req.user.userId || req.user.id;
      const user = await db('users')
        .select('id', 'user_role', 'email')
        .where({ id: userId })
        .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            type: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      // Update req.user with database info
      req.user.id = user.id;
      req.user.user_role = user.user_role;
      req.user.email = user.email;

      // Check role
      if (user.user_role !== requiredRole) {
        return res.status(403).json({
          success: false,
          error: {
            type: 'INSUFFICIENT_PERMISSIONS',
            message: `${requiredRole} role required`
          }
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'ROLE_CHECK_ERROR',
          message: 'Failed to verify user role'
        }
      });
    }
  };
};

/**
 * Middleware to check if user owns resource or is admin
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceUserId = parseInt(req.params[userIdParam], 10);
      
      // Validate parsed user ID
      if (!Number.isInteger(resourceUserId)) {
        return res.status(400).json({
          success: false,
          error: {
            type: 'INVALID_PARAMETER',
            message: 'Invalid userId parameter'
          }
        });
      }
      
      const currentUserId = req.user.userId || req.user.id;

      // Check if user is admin
      const user = await db('users')
        .select('user_role')
        .where({ id: currentUserId })
        .first();

      if (user?.user_role === 'admin' || req.user.email === 'admin@platform.com') {
        return next();
      }

      // Check ownership
      if (currentUserId !== resourceUserId) {
        return res.status(403).json({
          success: false,
          error: {
            type: 'ACCESS_DENIED',
            message: 'You can only access your own resources'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: {
          type: 'OWNERSHIP_CHECK_ERROR',
          message: 'Failed to verify resource ownership'
        }
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrAdmin
};