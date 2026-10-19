/**
 * Compact Skill Gaps Component
 * 
 * Lists identified gaps with severity indicators and targeted learning advice
 * in concise, readable rows.
 */

const SEVERITY_CONFIG = {
  BLOCKER: { bg: 'var(--status-unfeasible-bg)', text: 'var(--status-unfeasible)', icon: '🛑' },
  HIGH: { bg: 'var(--status-tight-bg)', text: 'var(--status-tight)', icon: '⚠️' },
  MEDIUM: { bg: '#FEF3C7', text: '#B45309', icon: '⚡' },
  LOW: { bg: 'var(--primary-color-subtle)', text: 'var(--primary-color)', icon: 'ℹ️' },
};

export default function SkillGapsCard({ gaps = [] }) {
  if (!gaps || gaps.length === 0) return null;

  return (
    <div className="glass-panel" style={{ padding: '14px 16px', textAlign: 'left' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <h4 style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
          Skill Gaps & Ramp-Up
        </h4>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {gaps.length} areas
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {gaps.map((item, idx) => {
          const style = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.MEDIUM;

          return (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                marginBottom: '3px',
              }}>
                <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {item.skill}
                </span>

                <span style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  fontWeight: '700',
                  color: style.text,
                  background: style.bg,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}>
                  {style.icon} {item.severity}
                </span>
              </div>

              <p style={{
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                lineHeight: '1.4',
                margin: 0,
              }}>
                {item.recommendation}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
