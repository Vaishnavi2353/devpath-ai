/**
 * Compact Recommended Stack Component
 * 
 * Displays suggested technologies in compact, scannable rows with category tags
 * and match indicators.
 */

export default function RecommendedStackCard({ stack = [] }) {
  if (!stack || stack.length === 0) return null;

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
          Recommended Tech Stack
        </h4>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {stack.length} tools
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stack.map((item, idx) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {item.name}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  color: 'var(--primary-color)',
                  background: 'var(--primary-color-subtle)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {item.category}
                </span>
              </div>

              {item.matchedStudentSkill ? (
                <span style={{ fontSize: '0.7rem', color: 'var(--status-feasible)', fontWeight: '600' }}>
                  ✓ Known
                </span>
              ) : (
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: '600' }}>
                  ★ New
                </span>
              )}
            </div>

            <p style={{
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              lineHeight: '1.4',
              margin: 0,
            }}>
              {item.justification}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
