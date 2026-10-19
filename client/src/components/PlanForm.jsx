/**
 * DevPath AI — New Plan Page Component
 * 
 * Refined, focused, and calm planning interface for students & developers.
 * 
 * Hierarchy:
 * 1. Centered heading: "What are we building today?" & subtitle.
 * 2. Section 1 (OUTSIDE white container): Project description textarea,
 *    label & character counter on the same row, and example-project suggestions.
 * 3. ONE COMBINED WHITE FORM CONTAINER holding:
 *    - Section 2: Current Skills & Technologies (chips with muted sage green selected state).
 *    - Sections 3, 4, 5: Project Planning Details (Target Deadline, Available Hours, Project Status).
 *    - Primary Action: Generate My Roadmap button (sage green).
 */

import { useState } from 'react';
import './plan-form.css';

const POPULAR_SKILLS = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Express',
  'Python', 'MongoDB', 'PostgreSQL', 'HTML/CSS', 'TailwindCSS',
  'Docker', 'Git', 'Next.js', 'WebSockets'
];

const STATUS_OPTIONS = [
  { value: 'Idea Stage / Not Started', label: 'Idea Stage', desc: 'No code written yet' },
  { value: 'Initial Planning & Research', label: 'Planning', desc: 'Researched tools and requirements' },
  { value: 'In Progress / Basic Skeleton', label: 'In Progress', desc: 'Boilerplate or repo started' },
  { value: 'Prototype Built / Needs Refactoring', label: 'Prototype', desc: 'Rough working proof-of-concept' },
];

const PRESETS = [
  {
    name: 'Collaborative Markdown Editor',
    icon: '📝',
    data: {
      problemStatement: 'A web-based collaborative markdown editor where students can edit study notes simultaneously with live cursor presence, syntax highlighting, and PDF/HTML document export.',
      techStack: ['React', 'JavaScript', 'Node.js', 'HTML/CSS'],
      availableHoursPerDay: 3,
      currentProjectStatus: 'Idea Stage / Not Started',
      workingDays: 'weekdays',
    },
  },
  {
    name: 'AI Study Card Generator',
    icon: '🧠',
    data: {
      problemStatement: 'A flashcard application that extracts key concepts from lecture notes and quizzes students using spaced repetition algorithms and progress analytics.',
      techStack: ['React', 'TypeScript', 'Python', 'TailwindCSS'],
      availableHoursPerDay: 4,
      currentProjectStatus: 'Initial Planning & Research',
      workingDays: 'all',
    },
  },
  {
    name: 'Student Dev Portfolio & Blog',
    icon: '🚀',
    data: {
      problemStatement: 'A modern developer portfolio platform showcasing project case studies, GitHub activity stats, and an interactive technical blog with markdown support.',
      techStack: ['React', 'JavaScript', 'TailwindCSS'],
      availableHoursPerDay: 2.5,
      currentProjectStatus: 'In Progress / Basic Skeleton',
      workingDays: 'weekdays',
    },
  },
];

const DAYS_LIST = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export default function PlanForm({ onSubmit, onSaveDraft, loading, initialValues, externalError, onClearExternalError }) {
  const [today] = useState(() => new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(() => {
    if (initialValues?.deadline) return initialValues.deadline;
    const target = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    return target.toISOString().split('T')[0];
  });
  const [problemStatement, setProblemStatement] = useState(initialValues?.problemStatement || '');
  const [techStack, setTechStack] = useState(initialValues?.techStack || ['React', 'JavaScript']);
  const [customTechInput, setCustomTechInput] = useState('');
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState(initialValues?.availableHoursPerDay || 3);
  const [currentProjectStatus, setCurrentProjectStatus] = useState(initialValues?.currentProjectStatus || 'Idea Stage / Not Started');
  const [scheduleMode, setScheduleMode] = useState(() => {
    if (Array.isArray(initialValues?.workingDays)) return 'custom';
    return initialValues?.workingDays || 'weekdays';
  });
  const [customDays, setCustomDays] = useState(() => {
    if (Array.isArray(initialValues?.workingDays)) return initialValues.workingDays;
    return ['mon', 'tue', 'wed', 'thu', 'fri'];
  });
  const [formErrors, setFormErrors] = useState({});

  const togglePopularSkill = (skill) => {
    if (techStack.includes(skill)) {
      setTechStack(techStack.filter((s) => s !== skill));
    } else {
      setTechStack([...techStack, skill]);
    }
  };

  const handleAddCustomTech = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = customTechInput.trim().replace(/^,+|,+$/g, '');
      if (trimmed && !techStack.includes(trimmed)) {
        setTechStack([...techStack, trimmed]);
        setCustomTechInput('');
      }
    }
  };

  const handleAddCustomTechClick = () => {
    const trimmed = customTechInput.trim().replace(/^,+|,+$/g, '');
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
      setCustomTechInput('');
    }
  };

  const removeTech = (skillToRemove) => {
    setTechStack(techStack.filter((s) => s !== skillToRemove));
  };

  const toggleCustomDay = (dayId) => {
    if (customDays.includes(dayId)) {
      setCustomDays(customDays.filter((d) => d !== dayId));
    } else {
      setCustomDays([...customDays, dayId]);
    }
  };

  const applyPreset = (preset) => {
    setProblemStatement(preset.data.problemStatement);
    setTechStack(preset.data.techStack);
    setAvailableHoursPerDay(preset.data.availableHoursPerDay);
    setCurrentProjectStatus(preset.data.currentProjectStatus);
    setScheduleMode(preset.data.workingDays);
    setFormErrors({});
    if (onClearExternalError) onClearExternalError();
  };

  const validateForm = () => {
    const errors = {};
    const trimmed = problemStatement.trim();

    if (!trimmed || trimmed.length < 10) {
      errors.problemStatement = 'Please describe your project idea with at least 10 characters.';
    } else {
      // Heuristic checks for obvious keyboard mashing, repeated characters, or unspaced gibberish
      const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
      const uniqueLetters = new Set(lettersOnly.toLowerCase().split(''));
      const tokens = trimmed.split(/[\s,./\\;:'"!?()[\]{}<>=+_-]+/).filter(Boolean);

      if (lettersOnly.length < 4) {
        errors.problemStatement = 'Please use descriptive words to explain what you want to build.';
      } else if (/([a-zA-Z0-9])\1{3,}/.test(trimmed)) {
        errors.problemStatement = 'Project description contains repeated characters. Please describe a genuine project idea.';
      } else if (lettersOnly.length >= 12 && uniqueLetters.size < 4) {
        errors.problemStatement = 'Project description lacks sufficient variety to represent an actionable project.';
      } else if (tokens.length === 1 && trimmed.length > 20 && !/^https?:\/\//i.test(trimmed)) {
        errors.problemStatement = 'Please use separate words to describe your project idea.';
      } else if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(trimmed)) {
        errors.problemStatement = 'The description appears to contain random character clusters. Please provide a clear project summary.';
      }
    }

    if (techStack.length === 0) {
      errors.techStack = 'Please select or add at least one technology you know.';
    }

    if (!deadline) {
      errors.deadline = 'Please select a target deadline.';
    } else if (deadline < today) {
      errors.deadline = 'Deadline cannot be in the past.';
    }

    if (availableHoursPerDay <= 0 || availableHoursPerDay > 24) {
      errors.availableHoursPerDay = 'Hours per day must be between 0.5 and 24.';
    }

    if (scheduleMode === 'custom' && customDays.length === 0) {
      errors.workingDays = 'Please select at least one active working day.';
    }

    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    if (onClearExternalError) onClearExternalError();
    const workingDays = scheduleMode === 'custom' ? customDays : scheduleMode;

    onSubmit({
      problemStatement: problemStatement.trim(),
      deadline,
      techStack,
      availableHoursPerDay: Number(availableHoursPerDay),
      currentProjectStatus,
      workingDays,
    });
  };

  const handleSaveDraftClick = (e) => {
    e.preventDefault();
    if (!problemStatement.trim() || problemStatement.trim().length < 5) {
      setFormErrors({ problemStatement: 'Please provide at least a brief problem description to save as draft.' });
      return;
    }

    setFormErrors({});
    if (onClearExternalError) onClearExternalError();
    const workingDays = scheduleMode === 'custom' ? customDays : scheduleMode;

    if (onSaveDraft) {
      onSaveDraft({
        problemStatement: problemStatement.trim(),
        deadline,
        techStack,
        availableHoursPerDay: Number(availableHoursPerDay),
        currentProjectStatus,
        workingDays,
        status: 'Draft',
      });
    }
  };

  const problemError = formErrors.problemStatement || externalError?.details?.[0] || externalError?.message;
  const isClarification = externalError?.code === 'CLARIFICATION_REQUIRED';

  return (
    <div className="plan-page-container">
      {/* ------------------------------------------------------------------
          1. MAIN HEADING & SUPPORTING SUBTITLE (OUTSIDE White Container)
          ------------------------------------------------------------------ */}
      <div className="plan-header-block">
        <h1 className="plan-main-title">
          What are we building today?
        </h1>
        <p className="plan-main-subtitle">
          Share your idea, and DevPath AI will help you turn it into a realistic project roadmap.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="plan-form-root">
        {/* ----------------------------------------------------------------
            2. SECTION 1: PROJECT DESCRIPTION (OUTSIDE White Container)
            ---------------------------------------------------------------- */}
        <div className="plan-description-wrapper">
          <div className="plan-section-header">
            <label htmlFor="input-problem-statement" className="plan-section-label">
              1. What do you want to build?
            </label>
            <span className={`plan-char-counter ${problemStatement.length >= 10 ? 'valid' : ''}`}>
              {problemStatement.length} / 2500 chars {problemStatement.length < 10 && '(min 10)'}
            </span>
          </div>

          <textarea
            id="input-problem-statement"
            rows={4}
            className={`plan-textarea ${problemError ? 'has-error' : ''}`}
            placeholder="Describe your project idea in detail: what problem it solves, key features you want to build, and any specific constraints (e.g., A web-based collaborative markdown editor where students can edit study notes simultaneously with live cursor presence and document exports)..."
            value={problemStatement}
            onChange={(e) => {
              setProblemStatement(e.target.value);
              if (formErrors.problemStatement) {
                setFormErrors((prev) => ({ ...prev, problemStatement: null }));
              }
              if (onClearExternalError) {
                onClearExternalError();
              }
            }}
            disabled={loading}
          />

          {problemError && (
            <div
              id="problem-statement-error"
              style={{
                marginTop: '10px',
                padding: '12px 16px',
                backgroundColor: isClarification ? '#FFFBEB' : '#FEF2F2',
                border: `1px solid ${isClarification ? '#FDE68A' : '#FECACA'}`,
                borderRadius: '8px',
                color: isClarification ? '#92400E' : '#B91C1C',
                fontSize: '0.86rem',
                lineHeight: '1.45',
              }}
            >
              <div style={{ fontWeight: '700', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{isClarification ? '💡' : '⚠️'}</span>
                <span>{isClarification ? 'Clarification Helpful' : 'Please Refine Your Project Idea'}</span>
              </div>
              <p style={{ margin: 0 }}>
                {problemError}
              </p>
              {externalError?.details && externalError.details.length > 1 && (
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '0.8rem' }}>
                  {externalError.details.slice(1).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Example Project Suggestions */}
          <div className="plan-examples-bar">
            <span className="plan-examples-label">Try an example:</span>
            {PRESETS.map((p, idx) => (
              <button
                key={p.name}
                type="button"
                id={`btn-preset-${idx}`}
                onClick={() => applyPreset(p)}
                className="plan-example-chip"
                title={`Load "${p.name}" preset`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ----------------------------------------------------------------
            3. ONE COMBINED WHITE FORM CONTAINER
            Holds:
            - Section 2: Current Skills & Technologies
            - Sections 3, 4, 5: Project Planning Details (Deadline, Hours, Status)
            - Primary Action: Generate My Roadmap button
            ---------------------------------------------------------------- */}
        <div className="plan-combined-card">
          {/* --------------------------------------------------------------
              SECTION 2: CURRENT SKILLS & TECHNOLOGIES
              -------------------------------------------------------------- */}
          <div className="plan-skills-section">
            <div className="plan-skills-header">
              <label className="plan-section-label" style={{ display: 'block' }}>
                2. Your Current Skills & Technologies
              </label>
              <p className="plan-skills-desc">
                Select technologies you already know. DevPath will tailor the roadmap to build on your existing strengths.
              </p>
            </div>

            {/* Predefined Technology Chips */}
            <div className="plan-skills-chips">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = techStack.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => togglePopularSkill(skill)}
                    disabled={loading}
                    className={`plan-tech-chip ${isSelected ? 'selected' : ''}`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Skill Input & Add Button */}
            <div className="plan-custom-skill-row">
              <input
                type="text"
                id="input-custom-tech"
                placeholder="Add other skill (e.g. Flutter, Go, GraphQL)..."
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                onKeyDown={handleAddCustomTech}
                disabled={loading}
                className="plan-custom-input"
              />
              <button
                type="button"
                onClick={handleAddCustomTechClick}
                disabled={!customTechInput.trim() || loading}
                className="plan-btn-add-skill"
              >
                Add
              </button>
            </div>

            {/* Selected Skills Tags */}
            {techStack.length > 0 && (
              <div className="plan-custom-tags-list">
                <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '600' }}>
                  Selected ({techStack.length}):
                </span>
                {techStack.map((tech) => (
                  <span key={tech} className="plan-custom-tag">
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="plan-tag-remove-btn"
                      title={`Remove ${tech}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            {formErrors.techStack && (
              <p className="plan-error-text">
                {formErrors.techStack}
              </p>
            )}
          </div>

          {/* Divider */}
          <hr className="plan-internal-divider" />

          {/* --------------------------------------------------------------
              SECTIONS 3, 4, 5: PROJECT PLANNING DETAILS
              -------------------------------------------------------------- */}
          <div className="plan-preferences-section">
            <div className="plan-preferences-grid">
              {/* Field 3: Target Deadline */}
              <div className="plan-field-group">
                <label htmlFor="input-deadline" className="plan-field-label">
                  3. Target Deadline
                </label>
                <input
                  id="input-deadline"
                  type="date"
                  min={today}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={loading}
                  className={`plan-field-input ${formErrors.deadline ? 'has-error' : ''}`}
                />
                {formErrors.deadline && (
                  <p className="plan-error-text">
                    {formErrors.deadline}
                  </p>
                )}
              </div>

              {/* Field 4: Available Hours Per Day */}
              <div className="plan-field-group">
                <label htmlFor="input-hours" className="plan-field-label">
                  4. Available Hours ({availableHoursPerDay}h / day)
                </label>
                <div className="plan-hours-container">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      id="input-hours"
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={availableHoursPerDay}
                      onChange={(e) => setAvailableHoursPerDay(e.target.value)}
                      disabled={loading}
                      className="plan-field-input"
                      style={{ width: '80px' }}
                    />
                    <div className="plan-hours-pills" style={{ flex: 1 }}>
                      {[1, 2, 3, 4, 6].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setAvailableHoursPerDay(h)}
                          className={`plan-hour-pill ${Number(availableHoursPerDay) === h ? 'selected' : ''}`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {formErrors.availableHoursPerDay && (
                  <p className="plan-error-text">
                    {formErrors.availableHoursPerDay}
                  </p>
                )}
              </div>

              {/* Field 5: Current Project Status */}
              <div className="plan-field-group">
                <label htmlFor="select-status" className="plan-field-label">
                  5. Current Project Status
                </label>
                <select
                  id="select-status"
                  value={currentProjectStatus}
                  onChange={(e) => setCurrentProjectStatus(e.target.value)}
                  disabled={loading}
                  className="plan-field-select"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Working Schedule Row */}
            <div className="plan-schedule-wrapper">
              <label htmlFor="select-schedule" className="plan-field-label" style={{ marginBottom: 2 }}>
                Working Schedule
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  id="select-schedule"
                  value={scheduleMode}
                  onChange={(e) => setScheduleMode(e.target.value)}
                  disabled={loading}
                  className="plan-field-select"
                  style={{ maxWidth: '260px' }}
                >
                  <option value="weekdays">Weekdays (Mon – Fri)</option>
                  <option value="all">Every Day (7 Days a Week)</option>
                  <option value="custom">Custom Working Days...</option>
                </select>

                {scheduleMode === 'custom' && (
                  <div className="plan-custom-days-bar">
                    {DAYS_LIST.map((d) => {
                      const isDayActive = customDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleCustomDay(d.id)}
                          className={`plan-day-btn ${isDayActive ? 'selected' : ''}`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {formErrors.workingDays && (
                <p className="plan-error-text">
                  {formErrors.workingDays}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <hr className="plan-internal-divider" />

          {/* --------------------------------------------------------------
              PRIMARY ACTION: GENERATE MY ROADMAP BUTTON (Muted Sage Green)
              -------------------------------------------------------------- */}
          <div className="plan-cta-container">
            <button
              type="submit"
              id="btn-generate-plan"
              disabled={loading || problemStatement.trim().length < 10 || techStack.length === 0}
              className="plan-btn-generate"
            >
              {loading ? (
                <>
                  <svg
                    style={{ animation: 'spin 1s linear infinite' }}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  <span>Synthesizing Implementation Roadmap...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    <path d="M5 3v4" />
                    <path d="M19 17v4" />
                  </svg>
                  <span>Generate My Roadmap</span>
                </>
              )}
            </button>

            {/* Optional Save as Draft Link */}
            {onSaveDraft && (
              <div className="plan-draft-row">
                <button
                  type="button"
                  id="btn-save-draft"
                  disabled={loading}
                  onClick={handleSaveDraftClick}
                  className="plan-btn-draft"
                >
                  Save as Draft
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
