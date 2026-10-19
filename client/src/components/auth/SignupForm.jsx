/**
 * DevPath AI — Warm, Minimalist Signup Form
 * 
 * Features:
 * - Full email & password registration (Name, Email, Password, Confirm Password)
 * - Validation, loading states, and error handling
 * - Clean layout without third-party authentication
 */

import { useState } from 'react';
import { useAuth } from '../../context/useAuth';

export default function SignupForm({ onSwitchToLogin }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const errors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      await signup({ name: trimmedName, email: trimmedEmail, password });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Form Header */}
      <div className="auth-card-header">
        <h2 className="auth-card-title">Create your account</h2>
        <p className="auth-card-subtitle">
          Start planning realistic, capacity-aware project roadmaps.
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="auth-error-banner" role="alert">
          <svg className="auth-error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Email / Password Registration Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Full Name */}
        <div className="auth-field">
          <label htmlFor="signup-name" className="auth-label">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Rivera"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationErrors.name) {
                setValidationErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            disabled={loading}
            className={`auth-input ${validationErrors.name ? 'has-error' : ''}`}
          />
          {validationErrors.name && (
            <p className="auth-field-error" role="alert">{validationErrors.name}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="auth-field">
          <label htmlFor="signup-email" className="auth-label">
            Email Address
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (validationErrors.email) {
                setValidationErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            disabled={loading}
            className={`auth-input ${validationErrors.email ? 'has-error' : ''}`}
          />
          {validationErrors.email && (
            <p className="auth-field-error" role="alert">{validationErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="signup-password" className="auth-label">
            Password <span style={{ fontWeight: 400, color: '#64748B' }}>(min 6 characters)</span>
          </label>
          <div className="auth-input-wrapper">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              disabled={loading}
              className={`auth-input with-toggle ${validationErrors.password ? 'has-error' : ''}`}
            />
            <button
              type="button"
              id="btn-toggle-signup-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="auth-password-toggle"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {validationErrors.password && (
            <p className="auth-field-error" role="alert">{validationErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="auth-field">
          <label htmlFor="signup-confirm-password" className="auth-label">
            Confirm Password
          </label>
          <div className="auth-input-wrapper">
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword) {
                  setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              disabled={loading}
              className={`auth-input with-toggle ${validationErrors.confirmPassword ? 'has-error' : ''}`}
            />
            <button
              type="button"
              id="btn-toggle-signup-confirm-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="auth-password-toggle"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="auth-field-error" role="alert">{validationErrors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-submit-signup"
          disabled={loading}
          className="auth-submit-btn"
        >
          {loading ? (
            <>
              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Switch to Login Prompt */}
      <div className="auth-switch-prompt">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="auth-switch-btn"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}
