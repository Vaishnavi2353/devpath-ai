/**
 * Project Controller
 * 
 * Manages user project ideas, generation lifecycle, retry mechanisms,
 * and CRUD operations with strict multi-user ownership enforcement.
 */

const mongoose = require('mongoose');
const { Project, PROJECT_STATUSES } = require('../models/Project');
const Roadmap = require('../models/Roadmap');
const devpathService = require('../services/devpath.service');
const { validateProjectIdea } = require('../utils/ideaValidator');

/**
 * GET /api/projects
 * Lists all projects owned by the authenticated user, recent/updated first.
 */
async function listProjects(req, res) {
  try {
    const projects = await Project.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('roadmap')
      .lean();

    const formatted = projects.map((p) => {
      let formattedRoadmap = null;
      if (p.roadmap && typeof p.roadmap === 'object' && p.roadmap._id) {
        formattedRoadmap = {
          ...p.roadmap,
          id: p.roadmap._id.toString(),
          _id: p.roadmap._id.toString(),
        };
      }

      // If roadmap document is missing, fallback status to Draft so user can generate it
      let effectiveStatus = p.status;
      if (!formattedRoadmap && (p.status === 'Roadmap Generated' || p.status === 'In Progress')) {
        effectiveStatus = 'Draft';
      }

      // If roadmap is generated, any prior transient error is cleared
      let effectiveLastError = p.lastError || null;
      if (effectiveStatus === 'Roadmap Generated' || effectiveStatus === 'In Progress') {
        effectiveLastError = null;
      }

      return {
        id: p._id.toString(),
        _id: p._id.toString(),
        user: p.user ? p.user.toString() : null,
        title: p.title,
        status: effectiveStatus,
        inputs: p.inputs,
        roadmap: formattedRoadmap,
        lastError: effectiveLastError,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return res.status(200).json({ projects: formatted });
  } catch (error) {
    console.error('[ProjectController.listProjects] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve projects.',
    });
  }
}

/**
 * POST /api/projects
 * Creates a project record (e.g. as Draft or initial idea submission).
 */
async function createProject(req, res) {
  try {
    const {
      title,
      problemStatement,
      deadline,
      techStack,
      availableHoursPerDay,
      workingDays,
      currentProjectStatus,
      status,
    } = req.body;

    const validation = validateProjectIdea(problemStatement);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validation.error || 'A valid problem statement or project idea is required.',
        details: validation.details || [validation.error],
      });
    }

    const initialTitle = (title && typeof title === 'string' && title.trim())
      ? title.trim()
      : (problemStatement.length > 50 ? problemStatement.slice(0, 50).trim() + '...' : problemStatement.trim());

    const initialStatus = status && PROJECT_STATUSES.includes(status) ? status : 'Draft';

    const project = await Project.create({
      user: req.user._id,
      title: initialTitle,
      status: initialStatus,
      inputs: {
        problemStatement: problemStatement.trim(),
        deadline: deadline || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        techStack: Array.isArray(techStack) ? techStack : [],
        availableHoursPerDay: Number(availableHoursPerDay) || 3,
        workingDays: workingDays || 'weekdays',
        currentProjectStatus: currentProjectStatus || 'Idea Stage / Not Started',
      },
    });

    return res.status(201).json({
      message: 'Project created successfully',
      project: project.toSafeObject(),
    });
  } catch (error) {
    console.error('[ProjectController.createProject] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create project.',
    });
  }
}

/**
 * GET /api/projects/:id
 * Fetches a single project with strict ownership verification and populated roadmap.
 */
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid project ID format.',
      });
    }

    const project = await Project.findById(id).populate('roadmap');
    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found.',
      });
    }

    // Ownership check: must belong to requesting user
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this project.',
      });
    }

    return res.status(200).json({
      project: project.toSafeObject(),
    });
  } catch (error) {
    console.error('[ProjectController.getProjectById] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve project.',
    });
  }
}

/**
 * PATCH /api/projects/:id
 * Updates project details (status, title, inputs) with ownership check.
 */
async function updateProject(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid project ID format.',
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found.',
      });
    }

    // Ownership check
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to modify this project.',
      });
    }

    const { title, status, inputs } = req.body;

    if (title && typeof title === 'string') {
      project.title = title.trim();
    }

    if (status) {
      if (!PROJECT_STATUSES.includes(status)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `Invalid status. Must be one of: ${PROJECT_STATUSES.join(', ')}`,
        });
      }
      project.status = status;
    }

    if (inputs && typeof inputs === 'object') {
      project.inputs = {
        ...project.inputs,
        ...inputs,
      };
    }

    await project.save();

    return res.status(200).json({
      message: 'Project updated successfully',
      project: project.toSafeObject(),
    });
  } catch (error) {
    console.error('[ProjectController.updateProject] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update project.',
    });
  }
}

/**
 * DELETE /api/projects/:id
 * Deletes a project and any associated roadmap with ownership verification.
 */
async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid project ID format.',
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found.',
      });
    }

    // Ownership check
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this project.',
      });
    }

    // Delete associated roadmap if one exists
    if (project.roadmap) {
      await Roadmap.findByIdAndDelete(project.roadmap).catch((err) =>
        console.warn('[ProjectController] Warning: failed to delete associated roadmap:', err.message)
      );
    }

    await Project.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Project deleted successfully',
      id,
    });
  } catch (error) {
    console.error('[ProjectController.deleteProject] Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete project.',
    });
  }
}

/**
 * POST /api/projects/:id/generate
 * Generates or retries roadmap generation for an existing Draft or Failed project.
 */
async function retryProjectGeneration(req, res) {
  let project = null;
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invalid project ID format.',
      });
    }

    project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found.',
      });
    }

    // Ownership check
    if (project.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to generate this project.',
      });
    }

    // Set status to Generating immediately
    project.status = 'Generating';
    project.lastError = null;
    await project.save();

    // Generate DevPath roadmap via service
    const roadmapData = await devpathService.generateDevPath(project.inputs);

    // Save Roadmap in MongoDB
    const savedRoadmap = await Roadmap.create({
      user: req.user._id,
      project: project._id,
      planId: roadmapData.planId,
      title: roadmapData.projectOverview?.title || project.title,
      meta: roadmapData.meta,
      projectOverview: roadmapData.projectOverview,
      recommendedStack: roadmapData.recommendedStack,
      skillGaps: roadmapData.skillGaps,
      feasibility: roadmapData.feasibility,
      phases: roadmapData.phases,
    });

    // Update project status to Roadmap Generated
    project.status = 'Roadmap Generated';
    project.roadmap = savedRoadmap._id;
    if (roadmapData.projectOverview?.title) {
      project.title = roadmapData.projectOverview.title;
    }
    project.lastError = null;
    await project.save();

    roadmapData.id = savedRoadmap._id.toString();
    roadmapData._id = savedRoadmap._id.toString();
    roadmapData.projectId = project._id.toString();

    return res.status(200).json({
      message: 'Roadmap generated successfully for project',
      project: project.toSafeObject(),
      roadmap: roadmapData,
    });
  } catch (error) {
    console.error('[ProjectController.retryProjectGeneration] Error:', error.message);

    if (project) {
      try {
        project.status = 'Failed';
        project.lastError = error.message || 'Roadmap generation failed';
        await project.save();
      } catch (saveErr) {
        console.error('[ProjectController] Error saving failure state:', saveErr.message);
      }
    }

    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      error: error.message || 'Roadmap generation failed',
      details: error.details || [],
      projectId: project ? project._id.toString() : null,
    });
  }
}

module.exports = {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  retryProjectGeneration,
};
