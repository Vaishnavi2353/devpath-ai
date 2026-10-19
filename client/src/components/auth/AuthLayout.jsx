/**
 * DevPath AI — Warm, Natural Split-Screen Authentication Layout
 * 
 * Visual Direction:
 * - Warm off-white / cream background
 * - Crisp white authentication card with subtle borders & soft natural shadow
 * - Left pane: brand introduction, clear headline, and 4 concise benefits
 * - Right pane: clean white card with Sign In / Create Account tabs
 */

import './auth.css';

export default function AuthLayout({ children, activeTab, onTabChange }) {
  return (
    <div className="auth-page">
      <div className="auth-split-container">
        
        {/* ====================================================================
            LEFT SECTION: Brand & Product Introduction
            ==================================================================== */}
        <section className="auth-intro-column">
          {/* Brand Mark & Tagline */}
          <div className="auth-brand-badge-group">
            <div className="auth-brand-logo" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h1 className="auth-brand-title">
              DevPath <span>AI</span>
            </h1>
          </div>

          {/* Headline & Supporting Text */}
          <div className="auth-intro-text">
            <h2 className="auth-main-headline">
              Turn your project idea into a clear plan.
            </h2>
            <p className="auth-supporting-text">
              Break down complex ideas, identify what to learn, and build projects one step at a time.
            </p>
          </div>

          {/* Understated Benefits List */}
          <div className="auth-benefits-list">
            <div className="auth-benefit-item">
              <div className="auth-benefit-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                  <line x1="9" y1="3" x2="9" y2="18" />
                  <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
              </div>
              <div className="auth-benefit-content">
                <h3 className="auth-benefit-title">Personalized project roadmaps</h3>
                <p className="auth-benefit-desc">
                  Tailored to your deadline, daily hours, and chosen tech stack.
                </p>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="auth-benefit-content">
                <h3 className="auth-benefit-title">Clear, actionable tasks</h3>
                <p className="auth-benefit-desc">
                  Every milestone broken into bite-sized subtasks and definitions of done.
                </p>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <div className="auth-benefit-content">
                <h3 className="auth-benefit-title">Skill-gap guidance</h3>
                <p className="auth-benefit-desc">
                  Identify what to learn first to avoid hitting roadblocks.
                </p>
              </div>
            </div>

            <div className="auth-benefit-item">
              <div className="auth-benefit-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className="auth-benefit-content">
                <h3 className="auth-benefit-title">Trackable project progress</h3>
                <p className="auth-benefit-desc">
                  Check off subtasks as you build and keep steady momentum.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            RIGHT SECTION: Authentication Form Card
            ==================================================================== */}
        <section className="auth-form-column">
          <div className="auth-card">
            {/* Segmented Sign In / Create Account Tabs */}
            <div className="auth-tab-bar" role="tablist" aria-label="Authentication Options">
              <button
                id="tab-btn-login"
                role="tab"
                type="button"
                aria-selected={activeTab === 'login'}
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => onTabChange('login')}
              >
                Sign In
              </button>
              <button
                id="tab-btn-signup"
                role="tab"
                type="button"
                aria-selected={activeTab === 'signup'}
                className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => onTabChange('signup')}
              >
                Create Account
              </button>
            </div>

            {/* Active Form */}
            {children}
          </div>
        </section>

      </div>
    </div>
  );
}
