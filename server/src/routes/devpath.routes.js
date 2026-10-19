/**
 * DevPath Route Definition
 * 
 * Maps endpoints for:
 * - POST   /api/devpath/generate       (Generates plan; persists if authenticated)
 * - GET    /api/devpath/roadmaps       (Lists authenticated user's roadmaps)
 * - GET    /api/devpath/roadmaps/:id   (Fetches single roadmap with ownership check)
 * - DELETE /api/devpath/roadmaps/:id   (Deletes roadmap with ownership check)
 */

const express = require('express');
const router = express.Router();

const { validateDevPathInput } = require('../middleware/validateDevPath');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const {
  createDevPath,
  getUserRoadmaps,
  getRoadmapById,
  deleteRoadmapById,
  updateRoadmapTask,
} = require('../controllers/devpath.controller');

// Generation endpoint (persists to DB when user is authenticated)
router.post('/generate', optionalAuth, validateDevPathInput, createDevPath);

// Authenticated user roadmap management
router.get('/roadmaps', requireAuth, getUserRoadmaps);
router.get('/roadmaps/:id', requireAuth, getRoadmapById);
router.delete('/roadmaps/:id', requireAuth, deleteRoadmapById);
router.patch('/roadmaps/:id/tasks/:taskId', requireAuth, updateRoadmapTask);

module.exports = router;
