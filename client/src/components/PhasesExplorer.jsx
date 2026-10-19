/**
 * Compact Phased Execution Roadmap Component
 * 
 * Displays structured, collapsible phases with actionable task breakdowns:
 * - What needs to be built & why it matters
 * - Prerequisites (skills or prior tasks needed beforehand)
 * - Actionable Steps (ordered subtask checklist with interactive completion tracking)
 * - Acceptance Criteria (observable conditions to verify during development)
 * - Definition of Done (concise final sign-off checklist)
 * - Task Status (Not Started, In Progress, Completed)
 */

import { useState, useEffect } from 'react';

const PRIORITY_BADGES = {
  CRITICAL: 'badge-priority-critical',
  HIGH: 'badge-priority-high',
  MEDIUM: 'badge-priority-medium',
  LOW: 'badge-priority-low',
};

const TIER_BADGES = {
  MVP: 'badge-mvp',
  STRETCH: 'badge-stretch',
  FUTURE: 'badge-future',
};

const STATUS_CONFIG = {
  todo: {
    label: 'Not Started',
    badgeClass: 'badge-status-draft',
    color: '#94a3b8',
    icon: '○',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'badge-status-in-progress',
    color: '#818cf8',
    icon: '▶',
  },
  done: {
    label: 'Completed',
    badgeClass: 'badge-status-generated',
    color: '#34d399',
    icon: '✓',
  },
};

export default function PhasesExplorer({ phases = [], roadmapId, onUpdateTaskStatus }) {
  const [selectedPhaseId, setSelectedPhaseId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'todo' | 'in_progress' | 'done'
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [expandedTaskDetails, setExpandedTaskDetails] = useState({});
  const [taskStepStates, setTaskStepStates] = useState({});
  const [taskDoDStates, setTaskDoDStates] = useState({});

  // Restore step and DoD checkbox states from localStorage on mount
  useEffect(() => {
    try {
      const stepStates = {};
      const dodStates = {};
      phases.forEach((p) => {
        p.tasks?.forEach((t) => {
          const savedSteps = localStorage.getItem(`devpath_steps_${roadmapId || 'local'}_${t.id}`);
          if (savedSteps) {
            stepStates[t.id] = JSON.parse(savedSteps);
          } else if (Array.isArray(t.completedSteps)) {
            const mapped = {};
            t.completedSteps.forEach((idx) => { mapped[idx] = true; });
            stepStates[t.id] = mapped;
          }

          const savedDoD = localStorage.getItem(`devpath_dod_${roadmapId || 'local'}_${t.id}`);
          if (savedDoD) {
            dodStates[t.id] = JSON.parse(savedDoD);
          }
        });
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTaskStepStates(stepStates);
      setTaskDoDStates(dodStates);
    } catch (err) {
      console.warn('Could not restore step states from localStorage:', err.message);
    }
  }, [phases, roadmapId]);

  if (!phases || phases.length === 0) return null;

  // Compute overall stats
  let totalTasks = 0;
  let doneTasks = 0;
  let inProgressTasks = 0;
  let todoTasks = 0;

  phases.forEach((p) => {
    p.tasks?.forEach((t) => {
      totalTasks++;
      if (t.status === 'done') doneTasks++;
      else if (t.status === 'in_progress') inProgressTasks++;
      else todoTasks++;
    });
  });

  const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Collapse / Expand handlers
  const togglePhaseCollapse = (phaseId) => {
    setCollapsedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  const areAllCollapsed = phases.every((p) => collapsedPhases[p.id]);

  const toggleAllCollapse = () => {
    if (areAllCollapsed) {
      setCollapsedPhases({});
    } else {
      const allCollapsed = {};
      phases.forEach((p) => {
        allCollapsed[p.id] = true;
      });
      setCollapsedPhases(allCollapsed);
    }
  };

  const toggleTaskDetails = (taskId) => {
    setExpandedTaskDetails((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const areAllDetailsExpanded = phases.flatMap((p) => p.tasks).every((t) => expandedTaskDetails[t.id]);

  const toggleAllTaskDetails = () => {
    if (areAllDetailsExpanded) {
      setExpandedTaskDetails({});
    } else {
      const allExpanded = {};
      phases.forEach((p) => {
        p.tasks?.forEach((t) => {
          allExpanded[t.id] = true;
        });
      });
      setExpandedTaskDetails(allExpanded);
    }
  };

  const setStatus = (taskId, newStatus) => {
    if (!onUpdateTaskStatus) return;
    const completedIndices = Object.keys(taskStepStates[taskId] || {})
      .filter((k) => taskStepStates[taskId][k])
      .map(Number);
    onUpdateTaskStatus(taskId, newStatus, completedIndices);
  };

  const cycleStatus = (taskId, currentStatus) => {
    if (currentStatus === 'todo') {
      setStatus(taskId, 'in_progress');
    } else if (currentStatus === 'in_progress') {
      setStatus(taskId, 'done');
    } else {
      setStatus(taskId, 'todo');
    }
  };

  const toggleStepCheckbox = (taskId, stepIdx, totalSteps) => {
    setTaskStepStates((prev) => {
      const currentTaskSteps = prev[taskId] || {};
      const isNowChecked = !currentTaskSteps[stepIdx];
      const updated = {
        ...currentTaskSteps,
        [stepIdx]: isNowChecked,
      };

      try {
        localStorage.setItem(`devpath_steps_${roadmapId || 'local'}_${taskId}`, JSON.stringify(updated));
      } catch (err) {
        void err;
      }

      // Count checked steps
      const checkedCount = Object.keys(updated).filter((k) => updated[k]).length;

      // Find current task status
      let currentStatus = 'todo';
      for (const p of phases) {
        const found = p.tasks?.find((t) => t.id === taskId);
        if (found) {
          currentStatus = found.status;
          break;
        }
      }

      // If user checks first step and task was 'todo', automatically transition to 'in_progress'
      if (checkedCount > 0 && currentStatus === 'todo') {
        setStatus(taskId, 'in_progress');
      }

      // If user checks all steps and task wasn't 'done', they can easily mark done
      if (checkedCount === totalSteps && currentStatus !== 'done') {
        setStatus(taskId, 'done');
      }

      return { ...prev, [taskId]: updated };
    });
  };

  const toggleDoDCheckbox = (taskId, dodIdx) => {
    setTaskDoDStates((prev) => {
      const currentTaskDoD = prev[taskId] || {};
      const updated = {
        ...currentTaskDoD,
        [dodIdx]: !currentTaskDoD[dodIdx],
      };

      try {
        localStorage.setItem(`devpath_dod_${roadmapId || 'local'}_${taskId}`, JSON.stringify(updated));
      } catch (err) {
        void err;
      }

      return { ...prev, [taskId]: updated };
    });
  };

  // Filter phases and tasks
  const filteredPhases = phases
    .filter((p) => (selectedPhaseId === 'all' ? true : p.id === selectedPhaseId))
    .map((p) => {
      if (statusFilter === 'all') return p;
      return {
        ...p,
        tasks: p.tasks.filter((t) => t.status === statusFilter),
      };
    })
    .filter((p) => p.tasks.length > 0);

  return (
    <div className="glass-panel" style={{ padding: '18px 20px', textAlign: 'left' }}>
      {/* Header & Overall Progress */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '14px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            Phased Roadmap & Execution
          </h3>
          <span style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {doneTasks} / {totalTasks} tasks completed ({completionPercent}%)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            id="btn-toggle-all-details"
            onClick={toggleAllTaskDetails}
            style={{
              background: '#EDE9FE',
              border: '1px solid #DDD6FE',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 11px',
              fontSize: '0.74rem',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {areAllDetailsExpanded ? '▴ Hide All Task Details' : '▾ Expand All Steps & DoD'}
          </button>

          <button
            type="button"
            id="btn-toggle-all-phases"
            onClick={toggleAllCollapse}
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 10px',
              fontSize: '0.74rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: '600',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {areAllCollapsed ? '▸ Expand Phases' : '▾ Collapse Phases'}
          </button>
        </div>
      </div>

      {/* Progress Bar & Filter Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          width: '100%',
          height: '5px',
          background: '#EAE6DD',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: '12px',
        }}>
          <div style={{
            width: `${completionPercent}%`,
            height: '100%',
            background: 'var(--status-feasible)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Phase Filter Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}>
            <button
              type="button"
              onClick={() => setSelectedPhaseId('all')}
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.74rem',
                fontWeight: '600',
                cursor: 'pointer',
                border: selectedPhaseId === 'all' ? '1px solid #D8D2C7' : '1px solid var(--border-subtle)',
                background: selectedPhaseId === 'all' ? '#EAE6DD' : '#FFFFFF',
                color: selectedPhaseId === 'all' ? 'var(--text-main)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                boxShadow: selectedPhaseId === 'all' ? 'none' : '0 1px 2px rgba(37, 41, 35, 0.03)',
              }}
            >
              All Phases ({phases.length})
            </button>
            {phases.map((phase) => {
              const isSelected = selectedPhaseId === phase.id;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setSelectedPhaseId(phase.id)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #D8D2C7' : '1px solid var(--border-subtle)',
                    background: isSelected ? '#EAE6DD' : '#FFFFFF',
                    color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected ? 'none' : '0 1px 2px rgba(37, 41, 35, 0.03)',
                  }}
                >
                  P{phase.order}: {phase.title}
                </button>
              );
            })}
          </div>

          {/* Quick Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginRight: '2px' }}>Filter:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'todo', label: `Not Started (${todoTasks})` },
              { id: 'in_progress', label: `In Progress (${inProgressTasks})` },
              { id: 'done', label: `Completed (${doneTasks})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                style={{
                  background: statusFilter === f.id ? '#EAE6DD' : 'transparent',
                  border: statusFilter === f.id ? '1px solid #D8D2C7' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 7px',
                  fontSize: '0.68rem',
                  color: statusFilter === f.id ? 'var(--text-main)' : 'var(--text-dim)',
                  cursor: 'pointer',
                  fontWeight: statusFilter === f.id ? '700' : '500',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Phases List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredPhases.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '24px',
            color: 'var(--text-muted)',
            fontSize: '0.84rem',
            background: '#FAF9F6',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}>
            No tasks match the selected filter.
          </div>
        )}

        {filteredPhases.map((phase) => {
          const phaseTotal = phase.tasks.length;
          const phaseDone = phase.tasks.filter((t) => t.status === 'done').length;
          const phasePercent = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;
          const phaseHours = phase.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
          const isCollapsed = Boolean(collapsedPhases[phase.id]);

          return (
            <div
              key={phase.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Phase Header Bar */}
              <div
                onClick={() => togglePhaseCollapse(phase.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '10px 14px',
                  background: isCollapsed ? '#FAF9F6' : '#F9F8F5',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderBottom: isCollapsed ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    background: '#EDE9FE',
                    border: '1px solid #DDD6FE',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}>
                    P{phase.order}
                  </span>

                  <h4 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                    {phase.title}
                  </h4>

                  <span className={`badge ${TIER_BADGES[phase.tier] || 'badge-mvp'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    {phase.tier}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {phaseDone}/{phaseTotal} done • ~{phaseHours}h
                  </span>

                  <div style={{
                    width: '50px',
                    height: '4px',
                    background: '#EAE6DD',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${phasePercent}%`,
                      height: '100%',
                      background: 'var(--status-feasible)',
                      borderRadius: 'var(--radius-full)',
                    }} />
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {isCollapsed ? '▸' : '▾'}
                  </span>
                </div>
              </div>

              {/* Collapsed 1-Line Preview */}
              {isCollapsed && (
                <div style={{
                  padding: '6px 14px',
                  fontSize: '0.74rem',
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {phase.tasks.map((t) => t.title).join(' • ')}
                </div>
              )}

              {/* Expanded Tasks List */}
              {!isCollapsed && (
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {phase.description && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 4px', lineHeight: '1.4' }}>
                      {phase.description}
                    </p>
                  )}

                  {phase.tasks.map((task) => {
                    const status = task.status || 'todo';
                    const isDone = status === 'done';
                    const isInProgress = status === 'in_progress';
                    const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
                    const isExpanded = Boolean(expandedTaskDetails[task.id]);

                    // Robust fallbacks for rich breakdown data
                    const prerequisites = Array.isArray(task.prerequisites) ? task.prerequisites : [];
                    const steps = (Array.isArray(task.steps) && task.steps.length > 0)
                      ? task.steps
                      : [
                          `Review prerequisites and technical requirements for ${task.title}.`,
                          `Implement core logic and data flow for ${task.module || 'this module'}.`,
                          `Add validation, edge-case error handling, and unit verification.`,
                          `Test against acceptance criteria to ensure zero regressions.`,
                        ];

                    const criteria = (Array.isArray(task.acceptanceCriteria) && task.acceptanceCriteria.length > 0)
                      ? task.acceptanceCriteria
                      : [
                          'Observable feature behavior satisfies the requirement',
                          'Relevant tests or manual verification pass with zero console errors',
                        ];

                    const definitionOfDone = (Array.isArray(task.definitionOfDone) && task.definitionOfDone.length > 0)
                      ? task.definitionOfDone
                      : [
                          'All actionable subtasks have been executed and reviewed.',
                          'Acceptance criteria have been tested and verified.',
                          'Code is clean, documented, and committed with zero console warnings.',
                        ];

                    const taskStepsState = taskStepStates[task.id] || {};
                    const checkedStepCount = steps.filter((_, idx) => taskStepsState[idx]).length;
                    const stepProgressPercent = Math.round((checkedStepCount / steps.length) * 100);

                    const taskDoDState = taskDoDStates[task.id] || {};
                    const checkedDoDCount = definitionOfDone.filter((_, idx) => taskDoDState[idx]).length;

                    return (
                      <div
                        key={task.id}
                        id={`task-card-${task.id}`}
                        style={{
                          background: isDone
                            ? '#F0FDF4'
                            : isInProgress
                            ? '#F5F3FF'
                            : '#FFFFFF',
                          border: isDone
                            ? '1px solid #BBF7D0'
                            : isInProgress
                            ? '1px solid #DDD6FE'
                            : '1px solid var(--border-subtle)',
                          borderLeft: isDone
                            ? '4px solid #15803D'
                            : isInProgress
                            ? '4px solid #6555C9'
                            : '4px solid #CBD5E1',
                          borderRadius: 'var(--radius-sm)',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Task Top Bar: Status, Title, Badges, Hours */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          {/* Circular Status Toggle Button */}
                          <button
                            type="button"
                            onClick={() => cycleStatus(task.id, status)}
                            title={`Status: ${statusCfg.label}. Click to cycle.`}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: isDone
                                ? '1px solid #15803D'
                                : isInProgress
                                ? '1px solid #6555C9'
                                : '1px solid #CBD5E1',
                              background: isDone
                                ? '#DCFCE7'
                                : isInProgress
                                ? '#EDE9FE'
                                : '#FFFFFF',
                              color: isDone ? '#15803D' : isInProgress ? '#6555C9' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              flexShrink: 0,
                              marginTop: '2px',
                              padding: 0,
                            }}
                          >
                            {isDone ? '✓' : isInProgress ? '▶' : ''}
                          </button>

                          {/* Task Main Header */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginBottom: '2px',
                            }}>
                              <h5 style={{
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                color: isDone ? 'var(--text-dim)' : 'var(--text-main)',
                                textDecoration: isDone ? 'line-through' : 'none',
                                margin: 0,
                                lineHeight: '1.3',
                              }}>
                                {task.title}
                              </h5>

                              {/* Badges & Status Controls */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-muted)',
                                  background: '#F1EFEA',
                                  border: '1px solid #E3E0D7',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  fontFamily: 'var(--font-mono)',
                                }}>
                                  {task.module}
                                </span>

                                <span className={`badge ${PRIORITY_BADGES[task.priority] || 'badge-priority-medium'}`} style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                                  {task.priority}
                                </span>

                                <span style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.74rem',
                                  fontWeight: '600',
                                  color: '#0284C7',
                                }}>
                                  ~{task.estimatedHours}h
                                </span>

                                {/* Status Switcher Dropdown */}
                                <select
                                  value={status}
                                  onChange={(e) => setStatus(task.id, e.target.value)}
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: isDone
                                      ? '1px solid #86EFAC'
                                      : isInProgress
                                      ? '1px solid #DDD6FE'
                                      : '1px solid var(--border-subtle)',
                                    background: isDone
                                      ? '#DCFCE7'
                                      : isInProgress
                                      ? '#EDE9FE'
                                      : '#FFFFFF',
                                    color: isDone ? '#15803D' : isInProgress ? '#6555C9' : 'var(--text-main)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                  }}
                                >
                                  <option value="todo" style={{ background: '#FFFFFF', color: '#252923' }}>○ Not Started</option>
                                  <option value="in_progress" style={{ background: '#FFFFFF', color: '#6555C9' }}>▶ In Progress</option>
                                  <option value="done" style={{ background: '#FFFFFF', color: '#15803D' }}>✓ Completed</option>
                                </select>
                              </div>
                            </div>

                            {/* Description (What needs to be built & why it matters) */}
                            <p style={{
                              fontSize: '0.8rem',
                              color: isDone ? 'var(--text-dim)' : 'var(--text-muted)',
                              lineHeight: '1.45',
                              margin: '2px 0 6px',
                            }}>
                              {task.description}
                            </p>

                            {/* Breakdown Summary Bar & Toggle */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '6px',
                              paddingTop: '4px',
                              borderTop: '1px dashed var(--border-subtle)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {/* Steps Counter Chip */}
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontFamily: 'var(--font-mono)',
                                  color: checkedStepCount === steps.length ? '#15803D' : 'var(--text-main)',
                                  background: '#F1EFEA',
                                  border: '1px solid #E3E0D7',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                }}>
                                  ✓ {checkedStepCount}/{steps.length} steps done
                                </span>

                                {/* DoD Counter Chip */}
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontFamily: 'var(--font-mono)',
                                  color: checkedDoDCount === definitionOfDone.length ? '#15803D' : 'var(--text-dim)',
                                  background: '#F1EFEA',
                                  border: '1px solid #E3E0D7',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                }}>
                                  🎯 {definitionOfDone.length} DoD checks
                                </span>

                                {prerequisites.length > 0 && (
                                  <span style={{
                                    fontSize: '0.68rem',
                                    color: '#B45309',
                                    background: '#FEF3C7',
                                    border: '1px solid #FDE68A',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                  }}>
                                    ⚡ {prerequisites.length} prereq{prerequisites.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleTaskDetails(task.id)}
                                style={{
                                  background: isExpanded ? '#EDE9FE' : 'none',
                                  border: isExpanded ? '1px solid #DDD6FE' : 'none',
                                  color: 'var(--primary)',
                                  fontSize: '0.74rem',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: isExpanded ? '2px 8px' : 0,
                                  borderRadius: '4px',
                                }}
                              >
                                <span>{isExpanded ? '▴ Hide Breakdown & DoD' : '▸ View Action Plan & Definition of Done'}</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* EXPANDED ACTIONABLE BREAKDOWN & DEFINITION OF DONE */}
                        {isExpanded && (
                          <div style={{
                            marginTop: '6px',
                            padding: '14px',
                            background: '#F9F8F5',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid #EAE5DE',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                          }}>
                            {/* SECTION 1: Prerequisites (What you need to know beforehand) */}
                            {prerequisites.length > 0 && (
                              <div style={{
                                background: '#FFFBEB',
                                border: '1px solid #FDE68A',
                                borderRadius: 'var(--radius-sm)',
                                padding: '10px 12px',
                              }}>
                                <div style={{
                                  fontSize: '0.74rem',
                                  fontWeight: '700',
                                  color: '#92400E',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.4px',
                                  marginBottom: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}>
                                  <span>⚡</span>
                                  <span>Prerequisites & Required Prior Knowledge:</span>
                                </div>
                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#78350F', lineHeight: '1.45' }}>
                                  {prerequisites.map((req, idx) => (
                                    <li key={idx} style={{ marginBottom: '2px' }}>
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* SECTION 2: Actionable Steps (What steps to follow) */}
                            <div>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                              }}>
                                <div style={{
                                  fontSize: '0.76rem',
                                  fontWeight: '700',
                                  color: 'var(--primary)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}>
                                  <span>📋</span>
                                  <span>Actionable Steps Checklist ({checkedStepCount}/{steps.length}):</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                  {stepProgressPercent}% done
                                </span>
                              </div>

                              {/* Steps Mini Progress Bar */}
                              <div style={{
                                width: '100%',
                                height: '3px',
                                background: '#EAE6DD',
                                borderRadius: 'var(--radius-full)',
                                overflow: 'hidden',
                                marginBottom: '8px',
                              }}>
                                <div style={{
                                  width: `${stepProgressPercent}%`,
                                  height: '100%',
                                  background: 'var(--primary)',
                                  borderRadius: 'var(--radius-full)',
                                  transition: 'width 0.2s ease',
                                }} />
                              </div>

                              {/* Interactive Ordered Subtask Checklist */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {steps.map((step, idx) => {
                                  const isStepChecked = Boolean(taskStepsState[idx]);
                                  return (
                                    <label
                                      key={idx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        background: isStepChecked ? '#F0FDF4' : '#FFFFFF',
                                        border: isStepChecked ? '1px solid #BBF7D0' : '1px solid var(--border-subtle)',
                                        cursor: 'pointer',
                                        fontSize: '0.78rem',
                                        color: isStepChecked ? 'var(--text-dim)' : 'var(--text-main)',
                                        textDecoration: isStepChecked ? 'line-through' : 'none',
                                        lineHeight: '1.4',
                                        userSelect: 'none',
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isStepChecked}
                                        onChange={() => toggleStepCheckbox(task.id, idx, steps.length)}
                                        style={{
                                          marginTop: '2px',
                                          accentColor: '#15803D',
                                          cursor: 'pointer',
                                          flexShrink: 0,
                                        }}
                                      />
                                      <span>
                                        <strong style={{ color: isStepChecked ? '#15803D' : 'var(--primary)', marginRight: '4px' }}>
                                          Step {idx + 1}:
                                        </strong>
                                        {step}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>

                            {/* SECTION 3: Acceptance Criteria (How to verify during development) */}
                            <div>
                              <div style={{
                                fontSize: '0.76rem',
                                fontWeight: '700',
                                color: '#0284C7',
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px',
                                marginBottom: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}>
                                <span>🔍</span>
                                <span>Acceptance Criteria (Observable Requirements):</span>
                              </div>
                              <ul style={{
                                margin: 0,
                                paddingLeft: '18px',
                                fontSize: '0.76rem',
                                color: 'var(--text-main)',
                                lineHeight: '1.45',
                              }}>
                                {criteria.map((crit, idx) => (
                                  <li key={idx} style={{ marginBottom: '3px' }}>
                                    {crit}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* SECTION 4: Definition of Done (Final verification checklist) */}
                            <div style={{
                              background: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              borderRadius: 'var(--radius-sm)',
                              padding: '10px 12px',
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '6px',
                              }}>
                                <div style={{
                                  fontSize: '0.76rem',
                                  fontWeight: '700',
                                  color: '#15803D',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}>
                                  <span>🎯</span>
                                  <span>Definition of Done (Final Sign-Off Checklist):</span>
                                </div>
                                <span style={{ fontSize: '0.68rem', color: '#166534', fontFamily: 'var(--font-mono)' }}>
                                  {checkedDoDCount}/{definitionOfDone.length} confirmed
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {definitionOfDone.map((dodItem, idx) => {
                                  const isDoDChecked = Boolean(taskDoDState[idx]);
                                  return (
                                    <label
                                      key={idx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '8px',
                                        padding: '4px 6px',
                                        borderRadius: '3px',
                                        background: isDoDChecked ? '#DCFCE7' : 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.76rem',
                                        color: isDoDChecked ? '#15803D' : 'var(--text-main)',
                                        textDecoration: isDoDChecked ? 'line-through' : 'none',
                                        lineHeight: '1.4',
                                        userSelect: 'none',
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isDoDChecked}
                                        onChange={() => toggleDoDCheckbox(task.id, idx)}
                                        style={{
                                          marginTop: '2px',
                                          accentColor: '#15803D',
                                          cursor: 'pointer',
                                          flexShrink: 0,
                                        }}
                                      />
                                      <span>{dodItem}</span>
                                    </label>
                                  );
                                })}
                              </div>

                              {/* Quick Complete Action */}
                              {!isDone && (
                                <div style={{ marginTop: '8px', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => setStatus(task.id, 'done')}
                                    className="btn btn-secondary btn-sm"
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '4px 12px',
                                      color: '#15803D',
                                      borderColor: '#86EFAC',
                                      background: '#FFFFFF',
                                    }}
                                  >
                                    ✓ Mark Task as Completed
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
