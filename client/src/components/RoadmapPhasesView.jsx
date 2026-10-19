/**
 * Dedicated Roadmap Phases Page Component (Step 4)
 * 
 * Displays the complete phased execution roadmap and interactive tasks.
 * Focuses purely on execution without cluttering the screen with the tech stack
 * or skill gap recommendation lists.
 */

import PhasesExplorer from './PhasesExplorer';

export default function RoadmapPhasesView({
  roadmapData,
  taskStatuses = {},
  onUpdateTaskStatus,
  onBackToOverview,
  onBackToProjects,
  onNewPlan,
  onDeleteRoadmap,
}) {
  if (!roadmapData) return null;

  const overview = roadmapData.projectOverview || {};
  const activePhases = roadmapData.phases
    ? roadmapData.phases.map((phase) => ({
        ...phase,
        tasks: phase.tasks.map((task) => ({
          ...task,
          status: taskStatuses[task.id] || task.status || 'todo',
        })),
      }))
    : [];

  const roadmapId = roadmapData.id || roadmapData._id;

  let totalTasks = 0;
  let doneTasks = 0;
  let totalHours = 0;

  activePhases.forEach((p) => {
    p.tasks.forEach((t) => {
      totalTasks++;
      totalHours += t.estimatedHours || 0;
      if (t.status === 'done') doneTasks++;
    });
  });

  const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left', maxWidth: '1060px', margin: '0 auto', width: '100%' }}>
      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px 14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            id="btn-phases-back-overview"
            onClick={onBackToOverview}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem', padding: '5px 14px' }}
          >
            ← Project Overview
          </button>

          <button
            type="button"
            id="btn-phases-back-projects"
            onClick={onBackToProjects}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            Your Projects
          </button>

          <button
            type="button"
            id="btn-phases-new-plan"
            onClick={onNewPlan}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            + New Plan
          </button>
        </div>

        <div>
          {roadmapId && onDeleteRoadmap && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this roadmap?')) {
                  onDeleteRoadmap(roadmapId);
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{
                color: 'var(--status-unfeasible)',
                borderColor: '#FECACA',
                background: '#FEF2F2',
                fontSize: '0.75rem',
                padding: '4px 10px',
              }}
            >
              Delete Roadmap
            </button>
          )}
        </div>
      </div>

      {/* Project Header Bar */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: '700' }}>
            ROADMAP PHASES & EXECUTION
          </span>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: '2px 0 0' }}>
            {overview.title || 'Development Roadmap'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Progress
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {doneTasks} / {totalTasks} tasks ({completionPercent}%)
            </div>
          </div>

          <div style={{
            width: '64px',
            height: '6px',
            background: '#EAE6DD',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${completionPercent}%`,
              height: '100%',
              background: 'var(--status-feasible)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.3s ease',
            }} />
          </div>

          <div style={{
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            color: '#0284C7',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            padding: '3px 8px',
            borderRadius: '4px',
          }}>
            ~{totalHours} hrs total
          </div>
        </div>
      </div>

      {/* Structured Phased Execution Roadmap with Task Breakdown & Definition of Done */}
      <PhasesExplorer
        phases={activePhases}
        roadmapId={roadmapId}
        onUpdateTaskStatus={onUpdateTaskStatus}
      />

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '12px',
        marginBottom: '20px',
      }}>
        <button
          type="button"
          onClick={onBackToOverview}
          className="btn btn-primary"
          style={{ padding: '9px 22px', fontSize: '0.88rem' }}
        >
          ← Return to Project Overview
        </button>

        <button
          type="button"
          onClick={onBackToProjects}
          className="btn btn-secondary"
          style={{ padding: '9px 20px', fontSize: '0.88rem' }}
        >
          Your Projects
        </button>
      </div>
    </div>
  );
}
