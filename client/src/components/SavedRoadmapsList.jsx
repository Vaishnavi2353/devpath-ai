/**
 * Saved Roadmaps List Component
 * 
 * Displays persistent roadmaps fetched from MongoDB Atlas.
 */

import { useState } from 'react';

const FEASIBILITY_BADGES = {
  FEASIBLE: 'badge-feasible',
  TIGHT: 'badge-tight',
  UNFEASIBLE: 'badge-unfeasible',
};

export default function SavedRoadmapsList({
  roadmaps = [],
  loading = false,
  onSelectRoadmap,
  onDeleteRoadmap,
  onCreateNew,
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = roadmaps.filter((r) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = r.title?.toLowerCase().includes(q);
    const problemMatch = r.meta?.inputs?.problemStatement?.toLowerCase().includes(q);
    return titleMatch || problemMatch;
  });

  const handleDelete = async (e, id, title) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title || 'this roadmap'}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteRoadmap(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '28px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>
          Loading Saved Roadmaps...
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                background: '#F9F8F5',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                height: '140px',
                animation: 'pulseGlow 1.5s infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

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
            Saved Roadmaps
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Select any generated architectural plan to inspect phases and track progress.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {roadmaps.length > 2 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter roadmaps..."
              className="form-input"
              style={{
                padding: '6px 12px',
                fontSize: '0.82rem',
                width: '180px',
              }}
            />
          )}

          <button
            type="button"
            onClick={onCreateNew}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Plan</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {roadmaps.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '44px 20px',
          background: '#FAF9F6',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
            No saved roadmaps yet
          </h4>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 18px', lineHeight: '1.5' }}>
            Generated project roadmaps will be permanently preserved in MongoDB Atlas for easy access.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="btn btn-primary"
            style={{ padding: '9px 20px', fontSize: '0.9rem' }}
          >
            Generate a Roadmap
          </button>
        </div>
      )}

      {/* Grid of Saved Roadmaps */}
      {filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px',
        }}>
          {filtered.map((item) => {
            const isDeleting = deletingId === item.id;
            const badgeClass = FEASIBILITY_BADGES[item.feasibility?.status] || 'badge-mvp';

            return (
              <div
                key={item.id}
                onClick={() => onSelectRoadmap(item)}
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
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
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
              >
                <div>
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
                      {item.title}
                    </h4>

                    {item.feasibility?.status && (
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                        {item.feasibility.status}
                      </span>
                    )}
                  </div>

                  <p style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.45',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: 0,
                  }}>
                    {item.projectOverview?.summary || item.meta?.inputs?.problemStatement}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.76rem',
                  color: 'var(--text-dim)',
                }}>
                  <span>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Saved'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                      Open →
                    </span>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={(e) => handleDelete(e, item.id, item.title)}
                      className="btn btn-secondary btn-sm"
                      title="Delete roadmap"
                      style={{
                        padding: '3px 6px',
                        color: 'var(--text-dim)',
                        background: 'transparent',
                        borderColor: 'transparent',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#DC2626'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
