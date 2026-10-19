/**
 * Authentication Controller
 * 
 * Handles user registration, login, current-user inspection, and logout.
 * Implements HttpOnly cookie storage, JWT token issuance, and generic credentials error messaging.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'devpath_super_secret_jwt_key_2026_change_in_prod';
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Helper to construct standard cookie options
 */
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/',
  };
}

/**
 * POST /api/auth/signup
 */
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    // 1. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    // 2. Hash password and persist user
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    // 3. Issue JWT token
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // 4. Set HttpOnly cookie
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      message: 'Account created successfully',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    console.error('[AuthController.signup] Error:', error.message);
    // Handle duplicate key error from Mongo safely
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create account. Please try again.',
    });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Find user and explicitly select passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      // Use generic error message to prevent user enumeration
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // 2. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // 3. Issue JWT token
    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // 4. Set HttpOnly cookie
    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      message: 'Logged in successfully',
      user: user.toSafeObject(),
      token,
    });
  } catch (error) {
    console.error('[AuthController.login] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred during login.',
    });
  }
}

/**
 * GET /api/auth/me
 */
async function getCurrentUser(req, res) {
  // req.user is guaranteed by requireAuth middleware
  return res.status(200).json({
    user: req.user.toSafeObject(),
  });
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  const cookieOptions = getCookieOptions();
  delete cookieOptions.maxAge; // Let clearCookie handle expiration

  res.clearCookie('token', cookieOptions);

  return res.status(200).json({
    message: 'Logged out successfully',
  });
}

/**
 * POST /api/auth/google
 * Handles Continue with Google authentication
 */
async function googleAuth(req, res) {
  try {
    const { email, name } = req.body || {};
    if (!email || !email.trim()) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Google email address is required.',
      });
    }

    const targetEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Please provide a valid Google email address.',
      });
    }

    const targetName = name?.trim() || targetEmail.split('@')[0];

    let user = await User.findOne({ email: targetEmail });
    if (!user) {
      const placeholderHash = await User.hashPassword('GoogleOAuth_' + Math.random().toString(36) + '!');
      user = await User.create({
        name: targetName,
        email: targetEmail,
        passwordHash: placeholderHash,
      });
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.cookie('token', token, getCookieOptions());

    return res.status(200).json({
      message: 'Google authentication successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('[AuthController.googleAuth] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Google authentication failed. Please try again.',
    });
  }
}

module.exports = {
  signup,
  login,
  googleAuth,
  getCurrentUser,
  logout,
};

