/**
 * Compact Next Actionable Task Component
 * 
 * Directs developer attention to the immediate next step in the roadmap
 * without consuming excessive screen real estate.
 */

export default function NextActionableTaskCard({ phases = [], onUpdateTaskStatus }) {
  // Find first task across phases that is not 'done'
  let nextTask = null;
  let nextPhase = null;

  for (const phase of phases) {
    for (const task of phase.tasks) {
      if (task.status !== 'done') {
        nextTask = task;
        nextPhase = phase;
        break;
      }
    }
    if (nextTask) break;
  }

  if (!nextTask) {
    return (
      <div className="glass-panel" style={{
        padding: '14px 16px',
        textAlign: 'center',
        background: 'rgba(16, 185, 129, 0.06)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>🎉</div>
        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--status-feasible)', margin: '0 0 2px' }}>
          All Tasks Completed!
        </h4>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          Every planned milestone in this DevPath roadmap is complete.
        </p>
      </div>
    );
  }

  const isCurrentInProgress = nextTask.status === 'in_progress';

  return (
    <div className="glass-panel" style={{
      padding: '14px 16px',
      textAlign: 'left',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '6px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: '#fff',
            background: 'var(--primary-color)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-full)',
            letterSpacing: '0.3px',
          }}>
            ⚡ Next Task
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
            in {nextPhase?.title}
          </span>
        </div>

        <span style={{
          fontSize: '0.74rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--primary-color)',
        }}>
          ~{nextTask.estimatedHours}h
        </span>
      </div>

      {/* Task Title */}
      <h4 style={{
        fontSize: '0.92rem',
        fontWeight: '700',
        color: 'var(--text-main)',
        lineHeight: '1.3',
        margin: '0 0 4px',
      }}>
        {nextTask.title}
      </h4>

      {/* Short Description */}
      <p style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        lineHeight: '1.4',
        margin: '0 0 8px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {nextTask.description}
      </p>

      {/* Collapsible Acceptance Criteria */}
      {nextTask.acceptanceCriteria && nextTask.acceptanceCriteria.length > 0 && (
        <details className="compact-disclosure" style={{ marginBottom: '8px' }}>
          <summary>
            <span>Criteria ({nextTask.acceptanceCriteria.length})</span>
          </summary>
          <ul style={{
            margin: '4px 0 0',
            paddingLeft: '16px',
            fontSize: '0.76rem',
            color: 'var(--text-main)',
            lineHeight: '1.4',
          }}>
            {nextTask.acceptanceCriteria.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </details>
      )}

      {/* Action Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {nextTask.module}
        </span>

        {!isCurrentInProgress ? (
          <button
            id="btn-start-next-task"
            type="button"
            onClick={() => onUpdateTaskStatus(nextTask.id, 'in_progress')}
            className="btn btn-primary btn-sm"
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
            }}
          >
            ▶ Start Working
          </button>
        ) : (
          <button
            id="btn-complete-next-task"
            type="button"
            onClick={() => onUpdateTaskStatus(nextTask.id, 'done')}
            className="btn btn-sm"
            style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              background: 'var(--status-feasible)',
              color: '#ffffff',
            }}
          >
            ✓ Mark Done
          </button>
        )}
      </div>
    </div>
  );
}
