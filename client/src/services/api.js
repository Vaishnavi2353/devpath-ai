/**
 * Centralized API Client
 * 
 * Configures base URL and credentials handling.
 * In development, requests to /api are proxied by Vite to http://localhost:5000.
 * In production (Vercel), VITE_API_URL points to the backend (e.g., on Render).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Universal fetch wrapper that includes credentials (HttpOnly cookies) automatically
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Ensure cookies are sent with cross-origin & proxied requests
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data?.details || [];
    error.fieldErrors = data?.fieldErrors || {};
    throw error;
  }

  return data;
}

// Authentication API methods
export const authApi = {
  signup: (payload) => apiRequest('/api/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: payload }),
  googleAuth: (payload) => apiRequest('/api/auth/google', { method: 'POST', body: payload }),
  getCurrentUser: () => apiRequest('/api/auth/me', { method: 'GET' }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
};

// DevPath Roadmap API methods
export const devpathApi = {
  generateRoadmap: (payload) => apiRequest('/api/devpath/generate', { method: 'POST', body: payload }),
  getSavedRoadmaps: () => apiRequest('/api/devpath/roadmaps', { method: 'GET' }),
  getRoadmapById: (id) => apiRequest(`/api/devpath/roadmaps/${id}`, { method: 'GET' }),
  deleteRoadmap: (id) => apiRequest(`/api/devpath/roadmaps/${id}`, { method: 'DELETE' }),
  updateTaskStatus: (roadmapId, taskId, payload) =>
    apiRequest(`/api/devpath/roadmaps/${roadmapId}/tasks/${taskId}`, { method: 'PATCH', body: payload }),
  checkHealth: () => apiRequest('/api/health', { method: 'GET' }),
};

// DevPath Projects API methods
export const projectsApi = {
  getProjects: () => apiRequest('/api/projects', { method: 'GET' }),
  getProjectById: (id) => apiRequest(`/api/projects/${id}`, { method: 'GET' }),
  createProject: (payload) => apiRequest('/api/projects', { method: 'POST', body: payload }),
  updateProject: (id, payload) => apiRequest(`/api/projects/${id}`, { method: 'PATCH', body: payload }),
  deleteProject: (id) => apiRequest(`/api/projects/${id}`, { method: 'DELETE' }),
  retryProject: (id) => apiRequest(`/api/projects/${id}/generate`, { method: 'POST' }),
};

