/**
 * Dedicated Your Projects Page Component
 * 
 * Displays the authenticated user's actual persisted projects and roadmap history.
 * Matches the dark navy / charcoal modern SaaS design system.
 */

import { useState } from 'react';

const STATUS_CONFIG = {
  Draft: {
    badgeClass: 'badge-status-draft',
    dotColor: '#6E756A',
    label: 'Draft',
  },
  Generating: {
    badgeClass: 'badge-status-generating',
    dotColor: '#2563EB',
    label: 'Generating',
  },
  'Roadmap Generated': {
    badgeClass: 'badge-status-generated',
    dotColor: '#15803D',
    label: 'Roadmap Generated',
  },
  'In Progress': {
    badgeClass: 'badge-status-in-progress',
    dotColor: '#6D28D9',
    label: 'In Progress',
  },
  Failed: {
    badgeClass: 'badge-status-failed',
    dotColor: '#DC2626',
    label: 'Generation Failed',
  },
};

export default function YourProjectsList({
  projects = [],
  loading = false,
  onOpenRoadmap,
  onRetryProject,
  onEditInForm,
  onUpdateProjectStatus,
  onDeleteProject,
  onCreateNew,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Filter projects by search and status
  const filteredProjects = projects.filter((project) => {
    if (selectedStatusFilter !== 'ALL' && project.status !== selectedStatusFilter) {
      return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = project.title?.toLowerCase().includes(q);
    const problemMatch = project.inputs?.problemStatement?.toLowerCase().includes(q);
    const techMatch = project.inputs?.techStack?.some((t) => t.toLowerCase().includes(q));

    return titleMatch || problemMatch || techMatch;
  });

  const handleRetry = async (e, projectId) => {
    e.stopPropagation();
    setActionInProgressId(projectId);
    try {
      await onRetryProject(projectId);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDelete = async (e, projectId, title) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title || 'this project'}"?`)) {
      return;
    }
    setActionInProgressId(projectId);
    try {
      await onDeleteProject(projectId);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleStatusChange = async (e, projectId, newStatus) => {
    e.stopPropagation();
    setActionInProgressId(projectId);
    try {
      await onUpdateProjectStatus(projectId, newStatus);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '28px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
            Loading Your Projects...
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: '#F9F8F5',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                height: '170px',
                animation: 'pulseGlow 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Count by status
  const counts = {
    ALL: projects.length,
    'In Progress': projects.filter((p) => p.status === 'In Progress').length,
    'Roadmap Generated': projects.filter((p) => p.status === 'Roadmap Generated').length,
    Draft: projects.filter((p) => p.status === 'Draft').length,
    Failed: projects.filter((p) => p.status === 'Failed').length,
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', textAlign: 'left' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.3px', color: 'var(--text-main)', margin: '0 0 4px' }}>
            Your Projects
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Manage and track execution across your planned software builds.
          </p>
        </div>

        <button
          type="button"
          id="btn-create-new-project"
          onClick={onCreateNew}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Project</span>
        </button>
      </div>

      {/* Toolbar: Search & Status Filters */}
      {projects.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '22px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, idea, or tech stack..."
                id="input-search-projects"
                className="form-input"
                style={{
                  padding: '8px 32px 8px 12px',
                  fontSize: '0.84rem',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All', count: counts.ALL },
                { id: 'In Progress', label: 'In Progress', count: counts['In Progress'] },
                { id: 'Roadmap Generated', label: 'Generated', count: counts['Roadmap Generated'] },
                { id: 'Draft', label: 'Drafts', count: counts.Draft },
                { id: 'Failed', label: 'Failed', count: counts.Failed },
              ].map((tab) => {
                if (tab.id !== 'ALL' && tab.count === 0) return null;
                const isActive = selectedStatusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStatusFilter(tab.id)}
                    style={{
                      background: isActive ? '#EAE6DD' : '#FFFFFF',
                      border: isActive ? '1px solid #D8D2C7' : '1px solid var(--border-subtle)',
                      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isActive ? 'none' : '0 1px 2px rgba(37, 41, 35, 0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      background: isActive ? '#D8D2C7' : '#F1EFEA',
                      color: 'var(--text-main)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Genuine Empty State: No projects created yet */}
      {projects.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: '#FAF9F6',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
            No projects created yet
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px', lineHeight: '1.5' }}>
            Turn your first project idea into a realistic, personalized development roadmap.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="btn btn-primary"
            style={{ padding: '10px 22px' }}
          >
            Create Your First Project
          </button>
        </div>
      )}

      {/* Empty Filter State */}
      {projects.length > 0 && filteredProjects.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          background: '#FAF9F6',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            No projects match your search or filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedStatusFilter('ALL');
            }}
            className="btn btn-secondary btn-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {filteredProjects.map((project) => {
            const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.Draft;
            const hasRoadmap = Boolean(project.roadmap);
            const isActing = actionInProgressId === project.id;

            return (
              <div
                key={project.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 41, 35, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.99)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onClick={() => {
                  if (hasRoadmap) {
                    onOpenRoadmap(project.roadmap);
                  } else {
                    handleRetry({ stopPropagation: () => {} }, project.id);
                  }
                }}
              >
                <div>
                  {/* Title & Status Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '8px',
                  }}>
                    <h4 style={{
                      fontSize: '1rem',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      lineHeight: '1.3',
                      margin: 0,
                    }}>
                      {project.title}
                    </h4>

                    <span
                      className={`badge ${statusInfo.badgeClass}`}
                      style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: statusInfo.dotColor,
                        display: 'inline-block',
                      }} />
                      {project.status}
                    </span>
                  </div>

                  {/* Problem Statement snippet */}
                  <p style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: '12px',
                  }}>
                    {project.inputs?.problemStatement}
                  </p>

                  {/* Tech Stack Pills */}
                  {project.inputs?.techStack && project.inputs.techStack.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                      {project.inputs.techStack.slice(0, 4).map((tech, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: '#F9F8F5',
                            color: '#475569',
                            border: '1px solid #EAE5DE',
                          }}
                        >
                          {tech}
                        </span>
                      ))}
                      {project.inputs.techStack.length > 4 && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                          +{project.inputs.techStack.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Error Note if Failed */}
                  {project.status === 'Failed' && project.lastError && (
                    <div style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px',
                      fontSize: '0.76rem',
                      color: '#DC2626',
                      marginBottom: '8px',
                    }}>
                      {project.lastError}
                    </div>
                  )}
                </div>

                {/* Footer Metadata & Actions */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                    color: 'var(--text-dim)',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-subtle)',
                    marginBottom: '10px',
                  }}>
                    <span>
                      {project.inputs?.deadline ? new Date(project.inputs.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                    </span>
                    <span>
                      {project.inputs?.availableHoursPerDay || 3}h/day
                    </span>
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {hasRoadmap ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRoadmap(project.roadmap);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                        >
                          View Roadmap →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleRetry(e, project.id)}
                          disabled={isActing}
                          className="btn btn-primary btn-sm"
                          style={{
                            fontSize: '0.8rem',
                            padding: '6px 14px',
                            background: project.status === 'Failed' ? '#DC2626' : undefined,
                          }}
                        >
                          {isActing ? 'Generating...' : (project.status === 'Failed' ? 'Retry Generation' : 'Generate Roadmap')}
                        </button>
                      )}

                      {(project.status === 'Draft' || project.status === 'Failed') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditInForm(project.inputs);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                        >
                          Edit Idea
                        </button>
                      )}

                      {hasRoadmap && (
                        <select
                          value={project.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(e, project.id, e.target.value)}
                          disabled={isActing}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-main)',
                            fontSize: '0.74rem',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="Roadmap Generated">Roadmap Generated</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Draft">Draft</option>
                        </select>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, project.id, project.title)}
                      disabled={isActing}
                      className="btn btn-secondary btn-sm"
                      title="Delete project"
                      style={{
                        padding: '4px 8px',
                        color: 'var(--text-dim)',
                        borderColor: 'transparent',
                        background: 'transparent',
                        fontSize: '0.8rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#DC2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-dim)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
