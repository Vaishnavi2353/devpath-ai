import { useState, useEffect } from 'react';

const STEPS = [
  'Scoping idea & structuring MVP boundaries...',
  'Mapping technologies & assessing student skill alignment...',
  'Pinpointing critical skill gaps & ramp-up advice...',
  'Decomposing modules into ordered phases and granular tasks...',
  'Validating task acceptance criteria and effort estimations...',
  'Executing authoritative capacity & feasibility arithmetic...',
];

export default function LoadingSkeleton() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          width: '64px',
          height: '64px',
          margin: '0 auto 24px',
          borderRadius: '16px',
          background: '#EDE9FE',
          border: '1px solid #DDD6FE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(101, 85, 201, 0.15)',
        }}>
          <svg className="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
          Architecting Your Execution Plan
        </h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '32px' }}>
          DevPath is analyzing your constraints and structuring an achievable roadmap.
        </p>

        {/* Step List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isCurrent ? '#EDE9FE' : '#F9F8F5',
                  border: isCurrent ? '1px solid #C4B5FD' : '1px solid var(--border-subtle)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  background: isCompleted ? 'var(--status-feasible)' : isCurrent ? 'var(--primary)' : '#E2E8F0',
                  color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-dim)',
                }}>
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span style={{
                  fontSize: '0.9rem',
                  color: isCurrent ? 'var(--text-main)' : isCompleted ? 'var(--text-muted)' : 'var(--text-dim)',
                  fontWeight: isCurrent ? '600' : '400',
                }}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
