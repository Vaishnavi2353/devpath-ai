/**
 * Roadmap Model
 * 
 * Persists generated project execution roadmaps in MongoDB.
 * Links each roadmap to its owning User and stores the complete architectural plan,
 * feasibility calculations, phases, and task breakdowns.
 */

const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Roadmap must belong to a user'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    planId: {
      type: String,
      required: [true, 'Plan ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Roadmap title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    meta: {
      type: Object,
      required: true,
    },
    projectOverview: {
      type: Object,
      required: true,
    },
    recommendedStack: {
      type: Array,
      default: [],
    },
    skillGaps: {
      type: Array,
      default: [],
    },
    feasibility: {
      type: Object,
      required: true,
    },
    phases: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Returns a standardized representation for API responses
 */
roadmapSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    _id: this._id.toString(),
    project: this.project ? this.project.toString() : null,
    planId: this.planId,
    title: this.title,
    meta: this.meta,
    projectOverview: this.projectOverview,
    recommendedStack: this.recommendedStack,
    skillGaps: this.skillGaps,
    feasibility: this.feasibility,
    phases: this.phases,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Roadmap = mongoose.model('Roadmap', roadmapSchema);

module.exports = Roadmap;
