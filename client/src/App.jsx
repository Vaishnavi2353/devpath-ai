/**
 * DevPath AI — Main Application Entrypoint
 * 
 * Orchestrates user authentication lifecycle, session restoration,
 * prompt-centered project dashboard, dedicated roadmap results page,
 * permanent MongoDB Atlas persistence, and execution tracking.
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Header from './components/Header';
import AuthLayout from './components/auth/AuthLayout';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import YourProjectsList from './components/YourProjectsList';
import SavedRoadmapsList from './components/SavedRoadmapsList';
import PlanForm from './components/PlanForm';
import RoadmapView from './components/RoadmapView';
import LoadingSkeleton from './components/LoadingSkeleton';
import ErrorAlert from './components/ErrorAlert';
import { devpathApi, projectsApi } from './services/api';

function DevPathDashboard() {
  const { user, logout } = useAuth();

  // Navigation tab state: 'projects' | 'roadmaps' | 'new-plan'
  const [activeTab, setActiveTab] = useState('new-plan');

  // Projects & Roadmaps state
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Active roadmap view state (null when browsing dashboard/projects)
  const [roadmapData, setRoadmapData] = useState(null);
  const [roadmapStep, setRoadmapStep] = useState('overview'); // 'overview' | 'phases'
  const [taskStatuses, setTaskStatuses] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [initialFormValues, setInitialFormValues] = useState(null);

  // Synchronize active roadmap and step with URL query params and sessionStorage
  const syncRoadmapUrl = useCallback((roadmapId, step) => {
    try {
      const url = new URL(window.location.href);
      if (roadmapId) {
        url.searchParams.set('roadmap', roadmapId);
        url.searchParams.set('step', step || 'overview');
        sessionStorage.setItem('devpath_active_roadmap_id', roadmapId);
        sessionStorage.setItem('devpath_active_roadmap_step', step || 'overview');
      } else {
        url.searchParams.delete('roadmap');
        url.searchParams.delete('step');
        sessionStorage.removeItem('devpath_active_roadmap_id');
        sessionStorage.removeItem('devpath_active_roadmap_step');
      }
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    } catch (err) {
      console.warn('URL sync error:', err.message);
    }
  }, []);

  // Refresh user projects from MongoDB Atlas
  const refreshProjects = useCallback(async () => {
    try {
      const data = await projectsApi.getProjects();
      setProjects(data?.projects || []);
    } catch (err) {
      console.warn('Failed to refresh projects:', err.message);
    }
  }, []);

  // Refresh saved roadmaps from MongoDB Atlas
  const refreshRoadmaps = useCallback(async () => {
    try {
      const data = await devpathApi.getSavedRoadmaps();
      setSavedRoadmaps(data?.roadmaps || []);
    } catch (err) {
      console.warn('Failed to refresh saved roadmaps:', err.message);
    }
  }, []);

  // Fetch initial projects and roadmaps on mount / session restore
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [projectsRes, roadmapsRes] = await Promise.allSettled([
          projectsApi.getProjects(),
          devpathApi.getSavedRoadmaps(),
        ]);

        if (isMounted) {
          const urlParams = new URLSearchParams(window.location.search);
          const initialRoadmapId = urlParams.get('roadmap') || sessionStorage.getItem('devpath_active_roadmap_id');
          const initialStep = urlParams.get('step') || sessionStorage.getItem('devpath_active_roadmap_step') || 'overview';

          if (projectsRes.status === 'fulfilled') {
            const fetchedProjects = projectsRes.value?.projects || [];
            setProjects(fetchedProjects);
            if (!initialRoadmapId) {
              if (fetchedProjects.length > 0) {
                setActiveTab('projects');
              } else {
                setActiveTab('new-plan');
              }
            }
          }

          if (roadmapsRes.status === 'fulfilled') {
            const fetchedRoadmaps = roadmapsRes.value?.roadmaps || [];
            setSavedRoadmaps(fetchedRoadmaps);

            // Restore active roadmap & step across browser refresh
            if (initialRoadmapId) {
              const matched = fetchedRoadmaps.find((r) => (r.id === initialRoadmapId || r._id === initialRoadmapId));
              if (matched) {
                setRoadmapData(matched);
                setRoadmapStep(initialStep === 'phases' ? 'phases' : 'overview');
                const initialStatuses = {};
                if (matched.phases) {
                  matched.phases.forEach((p) => {
                    p.tasks?.forEach((t) => {
                      initialStatuses[t.id] = t.status || 'todo';
                    });
                  });
                }
                setTaskStatuses(initialStatuses);
              } else {
                devpathApi.getSavedRoadmap(initialRoadmapId).then((res) => {
                  const r = res?.roadmap || res;
                  if (r && isMounted) {
                    setRoadmapData(r);
                    setRoadmapStep(initialStep === 'phases' ? 'phases' : 'overview');
                    const initialStatuses = {};
                    if (r.phases) {
                      r.phases.forEach((p) => {
                        p.tasks?.forEach((t) => {
                          initialStatuses[t.id] = t.status || 'todo';
                        });
                      });
                    }
                    setTaskStatuses(initialStatuses);
                  }
                }).catch(() => {
                  syncRoadmapUrl(null, null);
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error loading initial DevPath data:', err.message);
      } finally {
        if (isMounted) {
          setLoadingProjects(false);
          setLoadingSaved(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [syncRoadmapUrl]);

  // Handle plan generation (backend automatically saves Project record and Roadmap)
  const handleGeneratePlan = async (formData) => {
    setGenerating(true);
    setGenerationError(null);

    try {
      const data = await devpathApi.generateRoadmap(formData);
      setRoadmapData(data);
      setRoadmapStep('overview'); // STEP 2: Navigate immediately to Project Overview

      // Initialize in-memory task statuses
      const initialStatuses = {};
      if (data.phases) {
        data.phases.forEach((phase) => {
          phase.tasks.forEach((task) => {
            initialStatuses[task.id] = task.status || 'todo';
          });
        });
      }
      setTaskStatuses(initialStatuses);
      setInitialFormValues(null);

      const roadmapId = data.id || data._id;
      if (roadmapId) {
        syncRoadmapUrl(roadmapId, 'overview');
      }

      // Refresh both projects and roadmaps lists from Atlas
      await Promise.all([refreshProjects(), refreshRoadmaps()]);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Plan generation error:', err);
      setGenerationError({
        message: err.message || 'Unable to generate roadmap.',
        code: err.code,
        details: err.details && err.details.length > 0
          ? err.details
          : [err.message || 'Please check that the server is running and has a valid Gemini API key.'],
      });
      await refreshProjects();
    } finally {
      setGenerating(false);
    }
  };

  // Save idea as Draft directly to MongoDB Atlas
  const handleSaveDraft = async (formData) => {
    try {
      await projectsApi.createProject({
        ...formData,
        status: 'Draft',
      });
      await refreshProjects();
      setInitialFormValues(null);
      setActiveTab('projects');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(`Failed to save project draft: ${err.message}`);
    }
  };

  // Retry generating a Failed or Draft project
  const handleRetryProject = async (projectId) => {
    setGenerationError(null);
    try {
      const res = await projectsApi.retryProject(projectId);
      if (res.roadmap) {
        handleSelectSavedRoadmap(res.roadmap);
      }
      await Promise.all([refreshProjects(), refreshRoadmaps()]);
    } catch (err) {
      setGenerationError({
        message: err.message || 'Failed to retry roadmap generation.',
        details: err.details || [],
      });
      await refreshProjects();
    }
  };

  // Edit draft or failed idea in configuration form
  const handleEditInForm = (inputs) => {
    setInitialFormValues(inputs);
    setRoadmapData(null);
    setActiveTab('new-plan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update project status (e.g. In Progress, Roadmap Generated)
  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    try {
      await projectsApi.updateProject(projectId, { status: newStatus });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );
    } catch (err) {
      alert(`Failed to update project status: ${err.message}`);
    }
  };

  // Delete project and its associated roadmap
  const handleDeleteProject = async (projectId) => {
    try {
      await projectsApi.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      await refreshRoadmaps();
      if (roadmapData && (roadmapData.projectId === projectId || roadmapData.id === projectId)) {
        setRoadmapData(null);
        setTaskStatuses({});
      }
    } catch (err) {
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  // Open a saved roadmap for viewing (defaults to Project Overview flow)
  const handleSelectSavedRoadmap = async (selected, step = 'overview') => {
    if (!selected) return;

    let fullRoadmap = selected;
    if (typeof selected === 'string') {
      try {
        const res = await devpathApi.getSavedRoadmap(selected);
        fullRoadmap = res.roadmap || res;
      } catch (err) {
        console.error('Failed to load roadmap by ID:', err);
        return;
      }
    } else if (selected && !selected.phases && (selected.id || selected._id)) {
      try {
        const res = await devpathApi.getSavedRoadmap(selected.id || selected._id);
        fullRoadmap = res.roadmap || res;
      } catch (err) {
        console.error('Failed to fetch full roadmap details:', err);
      }
    }

    setRoadmapData(fullRoadmap);
    setRoadmapStep(step);
    const roadmapId = fullRoadmap?.id || fullRoadmap?._id;
    if (roadmapId) {
      syncRoadmapUrl(roadmapId, step);
    }

    const initialStatuses = {};
    if (fullRoadmap?.phases) {
      fullRoadmap.phases.forEach((phase) => {
        phase.tasks?.forEach((task) => {
          initialStatuses[task.id] = task.status || 'todo';
        });
      });
    }
    setTaskStatuses(initialStatuses);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step change between 'overview' and 'phases' without re-calling Gemini
  const handleStepChange = (newStep) => {
    setRoadmapStep(newStep);
    const roadmapId = roadmapData?.id || roadmapData?._id;
    if (roadmapId) {
      syncRoadmapUrl(roadmapId, newStep);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete a roadmap from Saved Roadmaps view
  const handleDeleteSavedRoadmap = async (id) => {
    try {
      await devpathApi.deleteRoadmap(id);
      setSavedRoadmaps((prev) => prev.filter((r) => r.id !== id));
      await refreshProjects();
      if (roadmapData && (roadmapData.id === id || roadmapData._id === id)) {
        setRoadmapData(null);
        setRoadmapStep('overview');
        syncRoadmapUrl(null, null);
        setTaskStatuses({});
      }
    } catch (err) {
      alert(`Failed to delete roadmap: ${err.message}`);
    }
  };

  const handleUpdateTaskStatus = (taskId, newStatus, completedSteps) => {
    setTaskStatuses((prev) => ({
      ...prev,
      [taskId]: newStatus,
    }));

    // If roadmap is saved to MongoDB, persist task update in background
    const roadmapId = roadmapData?.id || roadmapData?._id;
    if (roadmapId) {
      devpathApi
        .updateTaskStatus(roadmapId, taskId, {
          status: newStatus,
          ...(completedSteps ? { completedSteps } : {}),
        })
        .catch((err) => {
          console.warn('Could not persist task status to MongoDB:', err.message);
        });
    }
  };

  const handleReset = () => {
    setRoadmapData(null);
    setRoadmapStep('overview');
    setTaskStatuses({});
    setGenerationError(null);
    syncRoadmapUrl(null, null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#F8F6F0',
      color: '#252923',
    }}>
      <Header
        onReset={handleReset}
        hasPlan={Boolean(roadmapData)}
        user={user}
        onLogout={logout}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setRoadmapData(null);
          setRoadmapStep('overview');
          syncRoadmapUrl(null, null);
        }}
      />

      <main style={{ flex: 1, padding: '36px 0 64px' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Global Error Banner */}
          {generationError && (
            <ErrorAlert
              error={generationError}
              onRetry={() => setGenerationError(null)}
            />
          )}

          {/* Loading Skeleton during AI Generation */}
          {generating && <LoadingSkeleton />}

          {/* State 1: When no roadmap is actively opened */}
          {!roadmapData && !generating && (
            <>
              {/* Tab 1: Your Projects View */}
              {activeTab === 'projects' && (
                <YourProjectsList
                  projects={projects}
                  loading={loadingProjects}
                  onOpenRoadmap={handleSelectSavedRoadmap}
                  onRetryProject={handleRetryProject}
                  onEditInForm={handleEditInForm}
                  onUpdateProjectStatus={handleUpdateProjectStatus}
                  onDeleteProject={handleDeleteProject}
                  onCreateNew={() => {
                    setInitialFormValues(null);
                    setActiveTab('new-plan');
                  }}
                />
              )}

              {/* Tab 2: Saved Roadmaps View */}
              {activeTab === 'roadmaps' && (
                <SavedRoadmapsList
                  roadmaps={savedRoadmaps}
                  loading={loadingSaved}
                  onSelectRoadmap={handleSelectSavedRoadmap}
                  onDeleteRoadmap={handleDeleteSavedRoadmap}
                  onCreateNew={() => {
                    setInitialFormValues(null);
                    setActiveTab('new-plan');
                  }}
                />
              )}

              {/* Tab 3: New Project Plan Form View */}
              {activeTab === 'new-plan' && (
                <PlanForm
                  key={initialFormValues ? JSON.stringify(initialFormValues) : 'empty-plan-form'}
                  onSubmit={handleGeneratePlan}
                  onSaveDraft={handleSaveDraft}
                  loading={generating}
                  initialValues={initialFormValues}
                  externalError={generationError}
                  onClearExternalError={() => setGenerationError(null)}
                />
              )}
            </>
          )}

          {/* State 2: Dedicated Roadmap Results Page (Step 2 & 3: Overview, Step 4: Phases) */}
          {roadmapData && !generating && (
            <RoadmapView
              roadmapData={roadmapData}
              roadmapStep={roadmapStep}
              onStepChange={handleStepChange}
              taskStatuses={taskStatuses}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onBackToProjects={() => {
                handleReset();
                setActiveTab('projects');
              }}
              onBackToDashboard={() => {
                handleReset();
                setActiveTab('new-plan');
              }}
              onDeleteRoadmap={handleDeleteSavedRoadmap}
            />
          )}
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: '#FFFFFF',
        padding: '24px 0',
        textAlign: 'center',
        fontSize: '0.84rem',
        color: 'var(--text-muted)',
      }}>
        <div className="container">
          DevPath AI • Intelligent, capacity-aware software project planning
        </div>
      </footer>
    </div>
  );
}

function DevPathAuthView() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'

  return (
    <AuthLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'login' ? (
        <LoginForm onSwitchToSignup={() => setActiveTab('signup')} />
      ) : (
        <SignupForm onSwitchToLogin={() => setActiveTab('login')} />
      )}
    </AuthLayout>
  );
}

function MainContent() {
  const { user, loading } = useAuth();

  // Show clean spinner while restoring session on mount/refresh
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-main)',
        gap: '16px',
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'var(--signature-cta-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--signature-glow)',
        }}>
          <svg className="spinner" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Restoring DevPath session...
        </p>
      </div>
    );
  }

  // If user is logged in, show protected dashboard; otherwise show minimalist auth
  return user ? <DevPathDashboard /> : <DevPathAuthView />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}