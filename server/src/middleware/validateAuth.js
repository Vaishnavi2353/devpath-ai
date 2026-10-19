/**
 * Authentication Input Validation Middleware
 * 
 * Validates signup and login payloads using Zod.
 */

const { z } = require('zod');

const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password cannot exceed 100 characters'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

function validateSignup(req, res, next) {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const details = issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      error: 'Validation Error',
      details,
      fieldErrors: typeof result.error.flatten === 'function' ? result.error.flatten().fieldErrors : {},
    });
  }
  req.body = result.data;
  return next();
}

function validateLogin(req, res, next) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const details = issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      error: 'Validation Error',
      details,
      fieldErrors: typeof result.error.flatten === 'function' ? result.error.flatten().fieldErrors : {},
    });
  }
  req.body = result.data;
  return next();
}

module.exports = {
  validateSignup,
  validateLogin,
  signupSchema,
  loginSchema,
};
