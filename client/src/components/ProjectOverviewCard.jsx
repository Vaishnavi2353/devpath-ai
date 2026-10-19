/**
 * Compact Project Overview & Summary Banner Component
 * 
 * Unifies project title, scope, deterministic feasibility metrics,
 * deadline, and strategic advisory into a single compact, scannable header.
 */

export default function ProjectOverviewCard({ overview, feasibility, meta }) {
  if (!overview) return null;

  const { title, summary, targetScope } = overview;
  const inputs = meta?.inputs || {};

  const status = feasibility?.status || 'FEASIBLE';
  const isFeasible = status === 'FEASIBLE';
  const isTight = status === 'TIGHT';

  const badgeClass = isFeasible
    ? 'badge-feasible'
    : isTight
    ? 'badge-tight'
    : 'badge-unfeasible';

  const statusLabel = isFeasible
    ? 'Feasible'
    : isTight
    ? 'Tight Schedule'
    : 'Unfeasible';

  const accentColor = isFeasible
    ? 'var(--status-feasible)'
    : isTight
    ? 'var(--status-tight)'
    : 'var(--status-unfeasible)';

  const ratioPercent = feasibility?.feasibilityRatio !== undefined
    ? Math.round(feasibility.feasibilityRatio * 100)
    : (feasibility?.totalAvailableHours > 0
        ? Math.round((feasibility.totalEstimatedHours / feasibility.totalAvailableHours) * 100)
        : 100);

  return (
    <div className="glass-panel" style={{
      padding: '16px 20px',
      textAlign: 'left',
      borderLeft: `4px solid ${accentColor}`,
    }}>
      {/* Title & Date Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '4px',
      }}>
        <h2 style={{
          fontSize: 'clamp(1.25rem, 2.2vw, 1.5rem)',
          fontWeight: '800',
          letterSpacing: '-0.3px',
          color: 'var(--text-main)',
          lineHeight: '1.25',
          margin: 0,
        }}>
          {title}
        </h2>

        {meta?.createdAt && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Generated {new Date(meta.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Short Summary */}
      <p style={{
        fontSize: '0.86rem',
        color: 'var(--text-muted)',
        lineHeight: '1.5',
        margin: '0 0 10px',
      }}>
        {summary}
      </p>

      {/* Collapsible Target Scope (Progressive Disclosure) */}
      {targetScope && (
        <details className="compact-disclosure" style={{ marginBottom: '12px' }}>
          <summary>
            <span>🎯 View Target Scope & Boundaries</span>
          </summary>
          <div style={{
            marginTop: '6px',
            padding: '8px 12px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            lineHeight: '1.45',
          }}>
            {targetScope}
          </div>
        </details>
      )}

      {/* Unified Compact Metrics Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.76rem',
      }}>
        {/* Feasibility Status Pill */}
        {feasibility && (
          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.74rem', padding: '3px 8px' }}>
            ● {statusLabel} ({ratioPercent}% capacity)
          </span>
        )}

        {/* Estimated Effort vs Capacity */}
        {feasibility && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            <strong style={{ color: 'var(--text-main)' }}>Effort:</strong> {feasibility.totalEstimatedHours}h / {feasibility.totalAvailableHours}h
          </div>
        )}

        {/* Deadline & Working Days */}
        <div style={{
          background: 'var(--bg-card-subtle)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
        }}>
          <strong style={{ color: 'var(--text-main)' }}>Deadline:</strong> {inputs.deadline || 'Flexible'} {feasibility?.workingDaysCount ? `(${feasibility.workingDaysCount} days)` : ''}
        </div>

        {/* Daily Commitment */}
        {inputs.availableHoursPerDay && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}>
            <strong style={{ color: 'var(--text-main)' }}>Commitment:</strong> {inputs.availableHoursPerDay}h/day
          </div>
        )}

        {/* Buffer Margin */}
        {feasibility && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: feasibility.bufferHours >= 0 ? 'var(--status-feasible)' : 'var(--status-unfeasible)',
            fontFamily: 'var(--font-mono)',
          }}>
            <strong>Buffer:</strong> {feasibility.bufferHours > 0 ? `+${feasibility.bufferHours}` : feasibility.bufferHours}h
          </div>
        )}

        {/* Current Status */}
        {inputs.currentProjectStatus && (
          <div style={{
            background: 'var(--bg-card-subtle)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
          }}>
            <strong style={{ color: 'var(--text-main)' }}>Status:</strong> {inputs.currentProjectStatus}
          </div>
        )}
      </div>

      {/* Compact Feasibility Strategic Advisory Banner */}
      {feasibility?.advisory && (
        <div style={{
          background: isFeasible ? 'var(--status-feasible-bg)' : isTight ? 'var(--status-tight-bg)' : 'var(--status-unfeasible-bg)',
          border: `1px solid ${accentColor}`,
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          marginTop: '10px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          fontSize: '0.8rem',
          color: 'var(--text-main)',
          lineHeight: '1.45',
        }}>
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>
            {isFeasible ? '💡' : isTight ? '⚠️' : '🚨'}
          </span>
          <span>
            <strong style={{ color: accentColor, textTransform: 'uppercase', fontSize: '0.72rem', marginRight: '6px' }}>
              Recommendation:
            </strong>
            {feasibility.advisory}
          </span>
        </div>
      )}
    </div>
  );
}
