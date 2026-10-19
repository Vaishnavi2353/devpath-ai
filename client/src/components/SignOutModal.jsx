/**
 * DevPath AI — Sign Out Confirmation Modal
 * 
 * Accessible, elegant confirmation dialog adhering to the warm cream theme:
 * - Clean white card surface with subtle warm-gray border (#E3E0D7)
 * - Restrained lavender icon accent
 * - Confirms user intent before session termination
 * - Reusable logout handler with loading and failure error handling
 * - Dismissable via Escape, Cancel button, or overlay click (when not loading)
 * - Focus trapping and accessible dialog semantics
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export default function SignOutModal({ isOpen, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const [confirmHovered, setConfirmHovered] = useState(false);
  const [cancelHovered, setCancelHovered] = useState(false);

  // Close helper that cleans up any error state
  const handleClose = useCallback(() => {
    if (!loading) {
      setError(null);
      onClose();
    }
  }, [loading, onClose]);

  // Handle auto-focus and body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      // Auto-focus the cancel button for safe keyboard navigation
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key and keyboard focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Basic focus trap within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    // Only close if clicking directly on the backdrop overlay, not inside modal
    if (e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };

  const handleConfirmLogout = async () => {
    if (loading) return; // Prevent duplicate requests
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
      // On success, AuthContext triggers setUser(null) and redirect happens automatically
    } catch (err) {
      console.error('[SignOutModal] Error during sign out:', err);
      setError(err.message || 'Unable to sign out right now. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(37, 41, 35, 0.45)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
        aria-describedby="signout-modal-desc"
        className="modal-content"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E3E0D7',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(37, 41, 35, 0.08), 0 8px 10px -6px rgba(37, 41, 35, 0.04)',
          maxWidth: '440px',
          width: '100%',
          padding: '28px 24px',
          textAlign: 'center',
          position: 'relative',
          fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
        }}
      >
        {/* Subtle Sign Out Brand Avatar Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#EDE9FE',
            border: '1px solid #DDD6FE',
            color: '#6555C9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        {/* Modal Title */}
        <h2
          id="signout-modal-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#252923',
            margin: '0 0 8px',
            letterSpacing: '-0.2px',
          }}
        >
          Are you sure you want to sign out?
        </h2>

        {/* Modal Description */}
        <p
          id="signout-modal-desc"
          style={{
            fontSize: '0.88rem',
            color: '#6E756A',
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}
        >
          You&apos;ll need to sign in again to access your saved projects and roadmaps.
        </p>

        {/* Error Alert Banner (if logout fails) */}
        {error && (
          <div
            id="signout-error-banner"
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '18px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#991B1B',
              fontSize: '0.84rem',
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>{error}</div>
          </div>
        )}

        {/* Action Buttons: Cancel & Sign Out */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* Cancel Button */}
          <button
            ref={cancelBtnRef}
            id="btn-cancel-signout"
            type="button"
            onClick={handleClose}
            disabled={loading}
            onMouseEnter={() => setCancelHovered(true)}
            onMouseLeave={() => setCancelHovered(false)}
            style={{
              flex: '1 1 120px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #E3E0D7',
              backgroundColor: cancelHovered && !loading ? '#F3F0E8' : '#FFFFFF',
              color: '#252923',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            Cancel
          </button>

          {/* Sign Out Confirmation Button */}
          <button
            id="btn-confirm-signout"
            type="button"
            onClick={handleConfirmLogout}
            disabled={loading}
            onMouseEnter={() => setConfirmHovered(true)}
            onMouseLeave={() => setConfirmHovered(false)}
            style={{
              flex: '1 1 120px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid transparent',
              backgroundColor: loading
                ? '#991B1B'
                : confirmHovered
                ? '#7F1D1D'
                : '#B91C1C',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            }}
          >
            {loading ? (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="spinner"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Signing Out...</span>
              </>
            ) : (
              <span>Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
