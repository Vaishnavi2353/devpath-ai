/**
 * Authentication Middleware
 * 
 * Protects private endpoints by verifying the JWT token.
 * Supports token extraction from HttpOnly cookie (cookie-first)
 * or Authorization Bearer header.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devpath_super_secret_jwt_key_2026_change_in_prod';

async function requireAuth(req, res, next) {
  let token = null;

  // 1. Try extracting from HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization header: "Bearer <token>"
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token.',
    });
  }
}

/**
 * Optional authentication middleware.
 * Attaches req.user if a valid token is present, but does not block unauthenticated requests.
 */
async function optionalAuth(req, res, next) {
  let token = null;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
    }
  } catch {
    // Ignore invalid/expired token in optionalAuth
  }

  return next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};
