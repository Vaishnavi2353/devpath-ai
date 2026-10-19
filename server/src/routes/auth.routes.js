/**
 * Authentication Routes
 * 
 * Defines endpoints for /api/auth:
 * - POST /api/auth/signup
 * - POST /api/auth/login
 * - GET  /api/auth/me (Protected)
 * - POST /api/auth/logout
 */

const express = require('express');
const router = express.Router();

const { validateSignup, validateLogin } = require('../middleware/validateAuth');
const { requireAuth } = require('../middleware/auth.middleware');
const { signup, login, googleAuth, getCurrentUser, logout } = require('../controllers/auth.controller');

// Public routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/google', googleAuth);
router.post('/logout', logout);

// Protected routes
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;
