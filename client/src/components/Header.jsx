/**
 * DevPath AI — Clean Modern Header & Navigation
 * 
 * Refined, understated light header with:
 * - DevPath AI logo
 * - Simplified, non-pill navigation (Your Projects, Roadmaps, New Plan)
 * - Clear but understated active state
 * - User profile info and Sign Out action
 */

import { useState } from 'react';
import SignOutModal from './SignOutModal';

export default function Header({
  onReset,
  hasPlan,
  user,
  onLogout,
  activeTab = 'projects',
  onTabChange,
}) {
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  return (
    <header style={{
      borderBottom: '1px solid #EAE5DE',
      background: '#FFFFFF',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '12px 0',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
      fontFamily: "var(--font-auth, 'Outfit', 'Plus Jakarta Sans', sans-serif)",
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        {/* Brand Logo & Title */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => {
            if (onTabChange) onTabChange('projects');
            if (onReset) onReset();
          }}
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#EDE9FE',
            border: '1px solid #DDD6FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <span style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.3px', color: '#0F172A' }}>
              DevPath <span style={{ color: '#15803D' }}>AI</span>
            </span>
          </div>
        </div>

        {/* Center Navigation Options: Your Projects, Roadmaps, New Plan */}
        {user && onTabChange && (
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <button
              type="button"
              id="nav-tab-projects"
              onClick={() => onTabChange('projects')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'projects' && !hasPlan ? '600' : '500',
                cursor: 'pointer',
                border: activeTab === 'projects' && !hasPlan ? '1px solid #E2E8F0' : '1px solid transparent',
                background: activeTab === 'projects' && !hasPlan ? '#F1EFEA' : 'transparent',
                color: activeTab === 'projects' && !hasPlan ? '#0F172A' : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>Your Projects</span>
            </button>

            <button
              type="button"
              id="nav-tab-roadmaps"
              onClick={() => onTabChange('roadmaps')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'roadmaps' && !hasPlan ? '600' : '500',
                cursor: 'pointer',
                border: activeTab === 'roadmaps' && !hasPlan ? '1px solid #E2E8F0' : '1px solid transparent',
                background: activeTab === 'roadmaps' && !hasPlan ? '#F1EFEA' : 'transparent',
                color: activeTab === 'roadmaps' && !hasPlan ? '#0F172A' : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <span>Roadmaps</span>
            </button>

            <button
              type="button"
              id="nav-tab-new-plan"
              onClick={() => onTabChange('new-plan')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.84rem',
                fontWeight: activeTab === 'new-plan' && !hasPlan ? '600' : '500',
                cursor: 'pointer',
                border: activeTab === 'new-plan' && !hasPlan ? '1px solid #D8D2C7' : '1px solid transparent',
                background: activeTab === 'new-plan' && !hasPlan ? '#F1EFEA' : 'transparent',
                color: activeTab === 'new-plan' && !hasPlan ? '#0F172A' : '#64748B',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Plan</span>
            </button>
          </nav>
        )}

        {/* Right Actions: User Account & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '8px',
                background: '#F5F2EB',
                border: '1px solid #EAE5DE',
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '5px',
                  background: '#EDE9FE',
                  color: '#6D28D9',
                  border: '1px solid #DDD6FE',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {userInitial}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#0F172A' }}>
                  {user.name}
                </span>
              </div>

              <button
                id="btn-logout"
                type="button"
                onClick={() => setIsSignOutModalOpen(true)}
                onMouseEnter={() => setLogoutHovered(true)}
                onMouseLeave={() => setLogoutHovered(false)}
                title="Sign out of DevPath"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: logoutHovered ? '1px solid #FECACA' : '1px solid #EAE5DE',
                  background: logoutHovered ? '#FEF2F2' : '#FFFFFF',
                  color: logoutHovered ? '#DC2626' : '#475569',
                  fontSize: '0.82rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={onLogout}
      />
    </header>
  );
}
