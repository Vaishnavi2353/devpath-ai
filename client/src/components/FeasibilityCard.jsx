export default function FeasibilityCard({ feasibility }) {
  if (!feasibility) return null;

  const {
    status,
    totalEstimatedHours,
    totalAvailableHours,
    workingDaysCount,
    bufferHours,
    feasibilityRatio,
    advisory,
  } = feasibility;

  const isFeasible = status === 'FEASIBLE';
  const isTight = status === 'TIGHT';

  const badgeClass = isFeasible
    ? 'badge-feasible'
    : isTight
    ? 'badge-tight'
    : 'badge-unfeasible';

  const statusLabel = isFeasible
    ? 'Feasible Plan'
    : isTight
    ? 'Tight Schedule'
    : 'Unfeasible Timeline';

  const accentColor = isFeasible
    ? 'var(--status-feasible)'
    : isTight
    ? 'var(--status-tight)'
    : 'var(--status-unfeasible)';

  // Calculate percentage for progress bar (capped at 100% or slightly over)
  const percent = totalAvailableHours > 0
    ? Math.min(100, Math.round((totalEstimatedHours / totalAvailableHours) * 100))
    : 100;

  return (
    <div className="glass-panel" style={{
      padding: '28px',
      textAlign: 'left',
      borderLeft: `4px solid ${accentColor}`,
    }}>
      {/* Title & Status Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Feasibility & Capacity Analysis
            </h3>
            <span className={`badge ${badgeClass}`} style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
              ● {statusLabel}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Deterministic backend calculation based on your working schedule and task estimates.
          </p>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: accentColor,
          background: 'var(--bg-card-subtle)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}>
          Capacity Ratio: {feasibilityRatio !== undefined ? (feasibilityRatio * 100).toFixed(0) : 0}%
        </div>
      </div>

      {/* Visual Capacity Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          marginBottom: '6px',
          fontFamily: 'var(--font-mono)',
        }}>
          <span>Estimated Effort: {totalEstimatedHours}h</span>
          <span>Available Capacity: {totalAvailableHours}h</span>
        </div>
        <div style={{
          width: '100%',
          height: '10px',
          background: 'var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: `${percent}%`,
            height: '100%',
            background: accentColor,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }} />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
            Estimated Effort
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {totalEstimatedHours} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hrs</span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
            Available Time
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {totalAvailableHours} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hrs</span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
            Working Days
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {workingDaysCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days</span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>
            Buffer Margin
          </div>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: '700',
            color: bufferHours >= 0 ? 'var(--status-feasible)' : 'var(--status-unfeasible)',
            fontFamily: 'var(--font-mono)',
            marginTop: '2px',
          }}>
            {bufferHours > 0 ? `+${bufferHours}` : bufferHours} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>hrs</span>
          </div>
        </div>
      </div>

      {/* Advisory Note */}
      {advisory && (
        <div style={{
          background: isFeasible ? 'var(--status-feasible-bg)' : isTight ? 'var(--status-tight-bg)' : 'var(--status-unfeasible-bg)',
          border: `1px solid ${accentColor}`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1rem' }}>
              {isFeasible ? '💡' : isTight ? '⚠️' : '🚨'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: accentColor, textTransform: 'uppercase' }}>
              Strategic Recommendation
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
            {advisory}
          </p>
        </div>
      )}

      {/* Engineering Disclaimer */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
        * Note: Feasibility math is deterministic. Task estimates are baseline AI recommendations and should be refined as you write code.
      </p>
    </div>
  );
}
