/**
 * DevPath Controller
 * 
 * Responsibilities:
 * - Handle HTTP requests, responses, and errors
 * - Delegate generation business logic to devpath.service
 * - Persist generated roadmaps for authenticated users
 * - Manage user's saved roadmaps (list, get by ID, delete) with strict ownership enforcement
 */

const mongoose = require('mongoose');
const devpathService = require('../services/devpath.service');
const Roadmap = require('../models/Roadmap');
const { Project } = require('../models/Project');

/**
 * POST /api/devpath/generate
 * Generates roadmap via Gemini, tracks Project lifecycle, and persists to MongoDB if user is authenticated.
 */
async function createDevPath(req, res) {
  let project = null;

  try {
    // If user is authenticated, create or mark Project as 'Generating' before AI generation
    if (req.user && req.user._id) {
      try {
        if (req.body.projectId && mongoose.Types.ObjectId.isValid(req.body.projectId)) {
          project = await Project.findOne({ _id: req.body.projectId, user: req.user._id });
          if (project) {
            project.status = 'Generating';
            project.lastError = null;
            await project.save();
          }
        }

        if (!project) {
          const fallbackTitle = req.body.title ||
            (req.body.problemStatement?.length > 50
              ? req.body.problemStatement.slice(0, 50).trim() + '...'
              : req.body.problemStatement) ||
            'New Project Idea';

          project = await Project.create({
            user: req.user._id,
            title: fallbackTitle,
            status: 'Generating',
            inputs: {
              problemStatement: req.body.problemStatement,
              deadline: req.body.deadline,
              techStack: req.body.techStack || [],
              availableHoursPerDay: req.body.availableHoursPerDay,
              workingDays: req.body.workingDays || 'weekdays',
              currentProjectStatus: req.body.currentProjectStatus || 'Idea Stage / Not Started',
            },
          });
        }
      } catch (projErr) {
        console.error('[DevPathController] Error initializing project record:', projErr.message);
      }
    }

    // Generate DevPath roadmap via Gemini / feasibility engine
    let roadmapData;
    try {
      roadmapData = await devpathService.generateDevPath(req.body);
    } catch (genError) {
      // If AI generation fails, permanently record the failure status and error on the Project
      if (project) {
        try {
          if (genError.status === 400 && !req.body.projectId) {
            // Do not keep a project record for invalid/clarification-rejected new submissions
            await Project.findByIdAndDelete(project._id);
            project = null;
          } else {
            project.status = 'Failed';
            project.lastError = genError.message || 'Roadmap generation failed';
            await project.save();
          }
        } catch (saveErr) {
          console.error('[DevPathController] Error updating project failure state:', saveErr.message);
        }
      }
      throw genError;
    }

    // If user is authenticated, persist the roadmap in MongoDB and associate with project
    if (req.user && req.user._id) {
      try {
        const savedRoadmap = await Roadmap.create({
          user: req.user._id,
          project: project ? project._id : null,
          planId: roadmapData.planId,
          title: roadmapData.projectOverview?.title || project?.title || 'DevPath Project',
          meta: roadmapData.meta,
          projectOverview: roadmapData.projectOverview,
          recommendedStack: roadmapData.recommendedStack,
          skillGaps: roadmapData.skillGaps,
          feasibility: roadmapData.feasibility,
          phases: roadmapData.phases,
        });

        if (project) {
          project.status = 'Roadmap Generated';
          project.roadmap = savedRoadmap._id;
          if (roadmapData.projectOverview?.title) {
            project.title = roadmapData.projectOverview.title;
          }
          project.lastError = null;
          await project.save();
          roadmapData.projectId = project._id.toString();
        }

        roadmapData.id = savedRoadmap._id.toString();
        roadmapData._id = savedRoadmap._id.toString();
      } catch (dbErr) {
        console.error('[DevPathController] Database persistence error:', dbErr.message);
      }
    }

    return res.status(200).json(roadmapData);
  } catch (error) {
    const statusCode = error.status || 500;
    const responsePayload = {
      error: error.message || 'Internal Server Error',
    };

    if (error.details) {
      responsePayload.details = error.details;
    }
    if (error.code) {
      responsePayload.code = error.code;
    }
    if (project) {
      responsePayload.projectId = project._id.toString();
    }

    console.error(`[DevPathController] Error (${statusCode}):`, error.message);
    return res.status(statusCode).json(responsePayload);
  }
}

/**
 * GET /api/devpath/roadmaps
 * Lists all roadmaps owned by the authenticated user, newest first.
 */
async function getUserRoadmaps(req, res) {
  try {
    const roadmaps = await Roadmap.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = roadmaps.map((r) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      planId: r.planId,
      title: r.title,
      meta: r.meta,
      projectOverview: r.projectOverview,
      recommendedStack: r.recommendedStack,
      skillGaps: r.skillGaps,
      feasibility: r.feasibility,
      phases: r.phases,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return res.status(200).json({ roadmaps: formatted });
  } catch (error) {
    console.error('[DevPathController.getUserRoadmaps] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve saved roadmaps.',
    });
  }
}

/**
 * GET /api/devpath/roadmaps/:id
 * Fetches a single roadmap by ID with strict ownership verification.
 */
async function getRoadmapById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid roadmap ID format.',
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Roadmap not found.',
      });
    }

    // Ownership check: must belong to requesting user
    if (roadmap.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this roadmap.',
      });
    }

    return res.status(200).json({
      roadmap: roadmap.toSafeObject(),
    });
  } catch (error) {
    console.error('[DevPathController.getRoadmapById] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch roadmap.',
    });
  }
}

/**
 * DELETE /api/devpath/roadmaps/:id
 * Deletes a roadmap owned by the authenticated user.
 */
async function deleteRoadmapById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid roadmap ID format.',
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Roadmap not found.',
      });
    }

    // Ownership check: must belong to requesting user
    if (roadmap.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this roadmap.',
      });
    }

    // Unlink roadmap from any project referencing it
    await Project.updateMany(
      { roadmap: id, user: req.user._id },
      { $set: { roadmap: null, status: 'Draft' } }
    ).catch((err) => console.warn('[DevPathController] Warning unlinking project:', err.message));

    await Roadmap.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Roadmap deleted successfully',
      id,
    });
  } catch (error) {
    console.error('[DevPathController.deleteRoadmapById] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete roadmap.',
    });
  }
}

/**
 * PATCH /api/devpath/roadmaps/:id/tasks/:taskId
 * Updates task status and optional subtasks progress in a saved roadmap owned by authenticated user.
 */
async function updateRoadmapTask(req, res) {
  try {
    const { id, taskId } = req.params;
    const { status, completedSteps } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid roadmap ID format.',
      });
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Roadmap not found.',
      });
    }

    // Ownership check: must belong to requesting user
    if (roadmap.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to modify this roadmap.',
      });
    }

    let foundTask = null;
    let taskFound = false;

    if (Array.isArray(roadmap.phases)) {
      for (const phase of roadmap.phases) {
        if (Array.isArray(phase.tasks)) {
          const t = phase.tasks.find((task) => task.id === taskId);
          if (t) {
            taskFound = true;
            if (status) {
              t.status = status;
            }
            if (Array.isArray(completedSteps)) {
              t.completedSteps = completedSteps;
            }
            foundTask = t;
            break;
          }
        }
      }
    }

    if (!taskFound) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Task ${taskId} not found in roadmap.`,
      });
    }

    roadmap.markModified('phases');
    await roadmap.save();

    return res.status(200).json({
      message: 'Task updated successfully',
      taskId,
      task: foundTask,
    });
  } catch (error) {
    console.error('[DevPathController.updateRoadmapTask] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update roadmap task.',
    });
  }
}

module.exports = {
  createDevPath,
  getUserRoadmaps,
  getRoadmapById,
  deleteRoadmapById,
  updateRoadmapTask,
};
