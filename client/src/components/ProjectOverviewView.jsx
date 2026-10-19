/**
 * Dedicated Project Overview Page Component (Step 2 & 3)
 * 
 * Displays project title, description, scope, calm feasibility analysis,
 * recommended tech stack, skill gaps, and the signature "Let's Explore Your Roadmap" CTA.
 * Does NOT display the phased tasks or the large Next Task panel.
 */

export default function ProjectOverviewView({
  roadmapData,
  onExploreRoadmap,
  onBackToProjects,
  onNewPlan,
  onDeleteRoadmap,
}) {
  if (!roadmapData) return null;

  const overview = roadmapData.projectOverview || {};
  const feasibility = roadmapData.feasibility || {};
  const inputs = roadmapData.meta?.inputs || {};
  const recommendedStack = roadmapData.recommendedStack || [];
  const skillGaps = roadmapData.skillGaps || [];
  const roadmapId = roadmapData.id || roadmapData._id;

  const status = feasibility.status || 'FEASIBLE';
  const isFeasible = status === 'FEASIBLE';
  const isTight = status === 'TIGHT';
  const isOverCapacity = status === 'UNFEASIBLE';

  const ratioPercent = feasibility.feasibilityRatio !== undefined
    ? Math.round(feasibility.feasibilityRatio * 100)
    : (feasibility.totalAvailableHours > 0
        ? Math.round((feasibility.totalEstimatedHours / feasibility.totalAvailableHours) * 100)
        : 100);

  // Calm, friendly feasibility presentation
  const feasibilityTheme = isFeasible
    ? {
        badgeText: '● Realistic & Achievable',
        badgeColor: '#15803D',
        badgeBg: '#DCFCE7',
        badgeBorder: '#86EFAC',
        accentColor: 'var(--status-feasible)',
        headline: 'Your schedule comfortably supports this project.',
        summary: `With ${feasibility.workingDaysCount || 'N/A'} working days and ${inputs.availableHoursPerDay || 3}h/day commitment, you have ${feasibility.totalAvailableHours || 0}h available against an estimated ${feasibility.totalEstimatedHours || 0}h of effort. You have a healthy ${feasibility.bufferHours || 0}h buffer margin.`,
      }
    : isTight
    ? {
        badgeText: '● Ambitious Schedule',
        badgeColor: '#B45309',
        badgeBg: '#FEF3C7',
        badgeBorder: '#FDE68A',
        accentColor: 'var(--status-tight)',
        headline: 'Achievable with consistent, focused execution.',
        summary: `Your plan requires ${feasibility.totalEstimatedHours || 0}h within ${feasibility.totalAvailableHours || 0}h of available time (${ratioPercent}% capacity). You have a ${feasibility.bufferHours || 0}h buffer margin. Staying on track will help you meet your deadline comfortably.`,
      }
    : {
        badgeText: '● Scope Adjustment Recommended',
        badgeColor: '#C2410C',
        badgeBg: '#FFEDD5',
        badgeBorder: '#FDBA74',
        accentColor: '#C2410C',
        headline: 'Thoughtful Timeline & Scope Guidance',
        summary: `The estimated total effort (${feasibility.totalEstimatedHours || 0}h) exceeds your planned schedule (${feasibility.totalAvailableHours || 0}h) by ${Math.abs(feasibility.bufferHours || 0)}h. This is completely standard in early software planning. DevPath has preserved every task so you can prioritize effectively.`,
      };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', textAlign: 'left', maxWidth: '1060px', margin: '0 auto', width: '100%' }}>
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
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            id="btn-overview-back-projects"
            onClick={onBackToProjects}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            ← Your Projects
          </button>

          <button
            type="button"
            id="btn-overview-new-plan"
            onClick={onNewPlan}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
          >
            + New Plan
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

      {/* SECTION 1: Project Details & Boundaries */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        borderLeft: `4px solid ${feasibilityTheme.accentColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
          <div>
            <span style={{
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              color: 'var(--accent-purple)',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}>
              PROJECT OVERVIEW & ARCHITECTURE
            </span>
            <h1 style={{
              fontSize: 'clamp(1.35rem, 2.5vw, 1.7rem)',
              fontWeight: '800',
              letterSpacing: '-0.3px',
              color: 'var(--text-main)',
              lineHeight: '1.25',
              marginTop: '4px',
              marginBottom: 0,
            }}>
              {overview.title || 'Your Generated Project Plan'}
            </h1>
          </div>

          <span style={{
            fontSize: '0.76rem',
            fontWeight: '600',
            color: feasibilityTheme.badgeColor,
            background: feasibilityTheme.badgeBg,
            border: `1px solid ${feasibilityTheme.badgeBorder}`,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
          }}>
            {feasibilityTheme.badgeText}
          </span>
        </div>

        {/* Project Description */}
        <p style={{
          fontSize: '0.92rem',
          color: 'var(--text-main)',
          lineHeight: '1.6',
          margin: '10px 0 16px',
        }}>
          {overview.summary}
        </p>

        {/* Target Scope & Boundaries */}
        {overview.targetScope && (
          <div style={{
            background: '#F8F6FC',
            border: '1px solid #DDD6FE',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#5545B8', textTransform: 'uppercase', marginBottom: '4px' }}>
              🎯 Target MVP Scope & Boundaries
            </div>
            <p style={{ fontSize: '0.86rem', color: '#374151', lineHeight: '1.5', margin: 0 }}>
              {overview.targetScope}
            </p>
          </div>
        )}

        {/* Metric Summary Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '10px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            background: '#F9F8F5',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #EAE5DE',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Estimated Effort
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {feasibility.totalEstimatedHours || 0} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>hrs</span>
            </div>
          </div>

          <div style={{
            background: '#F9F8F5',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #EAE5DE',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Available Time
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {feasibility.totalAvailableHours || 0} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>hrs</span>
            </div>
          </div>

          <div style={{
            background: '#F9F8F5',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #EAE5DE',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Target Deadline
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
              {inputs.deadline ? new Date(inputs.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
            </div>
          </div>

          <div style={{
            background: '#F9F8F5',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #EAE5DE',
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              Commitment
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {inputs.availableHoursPerDay || 3} <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>h/day</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Calm Feasibility Summary & Guidance */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            {feasibilityTheme.headline}
          </h3>
          <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: '600', color: feasibilityTheme.accentColor }}>
            Capacity Ratio: {ratioPercent}%
          </span>
        </div>

        {/* Visual Progress / Capacity Gauge */}
        <div style={{
          width: '100%',
          height: '6px',
          background: '#EAE6DD',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
          marginBottom: '12px',
        }}>
          <div style={{
            width: `${Math.min(100, ratioPercent)}%`,
            height: '100%',
            background: feasibilityTheme.accentColor,
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.4s ease',
          }} />
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 12px' }}>
          {feasibilityTheme.summary}
        </p>

        {/* Helpful, non-intimidating suggestions if capacity is exceeded */}
        {isOverCapacity && (
          <div style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400E', textTransform: 'uppercase' }}>
              Recommended Options for Managing Scope:
            </span>
            <div style={{ fontSize: '0.82rem', color: '#78350F', lineHeight: '1.45', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <strong>💡 Option A (MVP Focus):</strong> When reviewing your phases, prioritize Phase 1 and Phase 2 tasks first. Treat later advanced features as stretch goals.
              </div>
              <div>
                <strong>💡 Option B (Schedule Flexibility):</strong> If every planned feature is essential, consider adding ~1 extra hour per day or extending your target deadline by a few days.
              </div>
            </div>
          </div>
        )}

        {feasibility.advisory && !isOverCapacity && (
          <div style={{
            background: isFeasible ? '#F0FDF4' : '#FFFBEB',
            border: `1px solid ${isFeasible ? '#86EFAC' : '#FDE68A'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: isFeasible ? '#166534' : '#92400E',
            lineHeight: '1.45',
          }}>
            <strong>Recommendation:</strong> {feasibility.advisory}
          </div>
        )}
      </div>

      {/* SECTION 3: Recommended Tech Stack & Skill Gaps */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '18px',
      }}>
        {/* Recommended Tech Stack */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Recommended Tech Stack
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {recommendedStack.length} tools
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendedStack.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#F9F8F5',
                  border: '1px solid #EAE5DE',
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 12px',
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
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      color: '#1D4ED8',
                      background: '#EFF6FF',
                      border: '1px solid #DBEAFE',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.category}
                    </span>
                  </div>

                  {item.matchedStudentSkill ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--status-feasible)', fontWeight: '600' }}>
                      ✓ In Your Toolbelt
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: '600' }}>
                      ★ New to Learn
                    </span>
                  )}
                </div>

                <p style={{
                  fontSize: '0.78rem',
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

        {/* Skill Gaps & Ramp-Up */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '0.96rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Skill Gaps & Ramp-Up
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {skillGaps.length} areas
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {skillGaps.map((item, idx) => {
              const isHigh = item.severity === 'BLOCKER' || item.severity === 'HIGH';
              return (
                <div
                  key={idx}
                  style={{
                    background: '#F9F8F5',
                    border: '1px solid #EAE5DE',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 12px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginBottom: '3px',
                  }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {item.skill}
                    </span>

                    <span style={{
                      fontSize: '0.68rem',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      color: isHigh ? '#DC2626' : '#4F46E5',
                      background: isHigh ? '#FEE2E2' : '#EEF2FF',
                      border: isHigh ? '1px solid #FECACA' : '1px solid #E0E7FF',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.severity}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.78rem',
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
      </div>

      {/* STEP 3: Signature "Let's Explore Your Roadmap" CTA Button */}
      <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '24px' }}>
        <button
          id="btn-explore-roadmap"
          type="button"
          onClick={onExploreRoadmap}
          className="btn btn-explore-roadmap"
          style={{
            padding: '16px 36px',
            fontSize: '1.08rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span>Let&apos;s Explore Your Roadmap</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
