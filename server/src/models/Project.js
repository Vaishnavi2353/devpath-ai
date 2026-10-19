/**
 * Project Model
 * 
 * Persists user project ideas, generation attempts, lifecycle statuses,
 * and references to generated roadmaps in MongoDB Atlas.
 * 
 * Supported Statuses:
 * - Draft: Saved project idea, not yet generated
 * - Generating: Roadmap generation in progress
 * - Roadmap Generated: Gemini generated architecture & feasibility roadmap saved
 * - In Progress: User actively building and implementing tasks
 * - Failed: Roadmap generation attempt failed (retains inputs & error for retry)
 */

const mongoose = require('mongoose');

const PROJECT_STATUSES = [
  'Draft',
  'Generating',
  'Roadmap Generated',
  'In Progress',
  'Failed',
];

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must belong to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: {
        values: PROJECT_STATUSES,
        message: '{VALUE} is not a valid project status',
      },
      default: 'Draft',
      index: true,
    },
    inputs: {
      problemStatement: {
        type: String,
        required: [true, 'Problem statement is required'],
        trim: true,
      },
      deadline: {
        type: String,
        required: [true, 'Deadline is required'],
      },
      techStack: {
        type: [String],
        default: [],
      },
      availableHoursPerDay: {
        type: Number,
        required: [true, 'Available hours per day is required'],
      },
      workingDays: {
        type: mongoose.Schema.Types.Mixed,
        default: 'weekdays',
      },
      currentProjectStatus: {
        type: String,
        default: 'Idea Stage / Not Started',
      },
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      default: null,
      index: true,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Standardized API response serializer
 */
projectSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    user: this.user ? this.user.toString() : null,
    title: this.title,
    status: this.status,
    inputs: this.inputs,
    roadmap: this.roadmap,
    lastError: this.lastError,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Project = mongoose.model('Project', projectSchema);

module.exports = {
  Project,
  PROJECT_STATUSES,
};
