/**
 * Project Routes
 * 
 * Maps authenticated user project endpoints:
 * - GET    /api/projects               (List user's projects with populated roadmaps)
 * - POST   /api/projects               (Create project idea / draft)
 * - GET    /api/projects/:id           (Fetch project with ownership check)
 * - PATCH  /api/projects/:id           (Update project status, title, or inputs)
 * - DELETE /api/projects/:id           (Delete project and its roadmap)
 * - POST   /api/projects/:id/generate  (Generate/retry roadmap for project)
 */

const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth.middleware');
const {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  retryProjectGeneration,
} = require('../controllers/project.controller');

// All project endpoints require valid user authentication
router.use(requireAuth);

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/generate', retryProjectGeneration);

module.exports = router;
