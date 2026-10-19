/**
 * DevPath AI — Warm, Minimalist Login Form
 * 
 * Features:
 * - Email & Password authentication
 * - Validation, loading states, and error handling
 * - Clean layout without third-party authentication
 */

import { useState } from 'react';
import { useAuth } from '../../context/useAuth';

export default function LoginForm({ onSwitchToSignup }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const errors = {};

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setLoading(true);

    try {
      await login({ email: trimmedEmail, password });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Form Header */}
      <div className="auth-card-header">
        <h2 className="auth-card-title">Welcome back</h2>
        <p className="auth-card-subtitle">
          Enter your credentials to access your saved projects and roadmaps.
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

      {/* Email / Password Login Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Email Address */}
        <div className="auth-field">
          <label htmlFor="login-email" className="auth-label">
            Email Address
          </label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="auth-label">
            Password
          </label>
          <div className="auth-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
              id="btn-toggle-login-password"
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

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-submit-login"
          disabled={loading}
          className="auth-submit-btn"
        >
          {loading ? (
            <>
              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Switch to Signup Prompt */}
      <div className="auth-switch-prompt">
        Don&apos;t have an account yet?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="auth-switch-btn"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
