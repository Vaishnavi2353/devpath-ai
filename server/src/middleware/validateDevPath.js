/**
 * DevPath Input Validation Middleware
 * 
 * Responsibilities:
 * - Validate and normalize user inputs using Zod
 * - Retain compatibility with aliases from server_old (projectStatement, knownTechStack, projectStatus)
 * - Support explicit working schedules: 'all', 'weekdays', or custom day arrays
 * - Guard against past deadlines, malformed dates, unreasonable limits, and empty inputs
 * - Return clear, actionable error messages
 */

const { z } = require('zod');
const { validateProjectIdea } = require('../utils/ideaValidator');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const VALID_DAY_NAMES = new Set([
  'sunday', 'sun',
  'monday', 'mon',
  'tuesday', 'tue',
  'wednesday', 'wed',
  'thursday', 'thu',
  'friday', 'fri',
  'saturday', 'sat',
]);

const devPathZodSchema = z.object({
  projectId: z.string().trim().optional(),
  title: z.string().trim().max(200).optional(),

  problemStatement: z
    .string({ required_error: 'Problem statement is required.' })
    .trim()
    .min(10, 'Problem statement must be at least 10 characters long to generate a realistic plan.')
    .max(2500, 'Problem statement must not exceed 2500 characters.')
    .superRefine((val, ctx) => {
      const validation = validateProjectIdea(val);
      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.details && validation.details[0]
            ? validation.details[0].replace(/^problemStatement:\s*/, '')
            : (validation.error || 'The project description appears to be random or incomplete. Please describe what you want to build in clear words.'),
        });
      }
    }),

  deadline: z
    .string({ required_error: 'Deadline is required.' })
    .regex(DATE_REGEX, 'Deadline must be in YYYY-MM-DD format.')
    .refine((val) => {
      const parts = val.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return !isNaN(d.getTime()) && d.getFullYear() === parts[0] && d.getMonth() === parts[1] - 1 && d.getDate() === parts[2];
    }, 'Deadline must be a valid calendar date.')
    .refine((val) => {
      const parts = val.split('-').map(Number);
      const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return deadlineDate >= todayStart;
    }, 'Deadline cannot be in the past. Please select today or a future date.'),

  techStack: z
    .array(z.string().trim().min(1, 'Technology name cannot be blank.').max(60, 'Technology name cannot exceed 60 characters.'))
    .min(1, 'At least one technology or skill must be specified.')
    .max(30, 'Tech stack cannot exceed 30 technologies.'),

  availableHoursPerDay: z
    .number({
      required_error: 'Available hours per day is required.',
      invalid_type_error: 'Available hours per day must be a number.',
    })
    .gt(0, 'Available hours per day must be greater than 0.')
    .lte(24, 'Available hours per day cannot exceed 24.'),

  currentProjectStatus: z
    .string({ required_error: 'Current project status is required.' })
    .trim()
    .min(2, 'Current project status must be at least 2 characters long.')
    .max(100, 'Current project status must not exceed 100 characters.'),

  workingDays: z
    .union([
      z.enum(['all', 'all_days', 'weekdays', 'weekdays_only']),
      z.array(
        z.union([
          z.string().trim().refine((str) => VALID_DAY_NAMES.has(str.toLowerCase()), {
            message: 'Invalid day name in workingDays.',
          }),
          z.number().int().min(0).max(6),
        ])
      ).min(1, 'At least one working day must be selected when specifying a custom schedule.'),
    ], {
      required_error: 'Working schedule (workingDays) is required. Choose "all", "weekdays", or select specific days.',
      invalid_type_error: 'workingDays must be "all", "weekdays", or an array of active days.',
    }),
});

/**
 * Pre-processes and normalizes request body before running Zod validation
 */
function preprocessInput(rawBody = {}) {
  const body = { ...rawBody };

  // 1. Alias handling: problemStatement / projectStatement
  if (body.problemStatement === undefined && body.projectStatement !== undefined) {
    body.problemStatement = body.projectStatement;
  }

  // 2. Alias handling: techStack / knownTechStack
  let rawTech = body.techStack ?? body.knownTechStack;
  if (typeof rawTech === 'string') {
    body.techStack = rawTech
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  } else if (Array.isArray(rawTech)) {
    body.techStack = rawTech
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());
  }

  // 3. Alias handling: currentProjectStatus / projectStatus
  if (body.currentProjectStatus === undefined && body.projectStatus !== undefined) {
    body.currentProjectStatus = body.projectStatus;
  }

  // 4. Coerce availableHoursPerDay if passed as numeric string
  if (body.availableHoursPerDay !== undefined && typeof body.availableHoursPerDay === 'string') {
    const num = Number(body.availableHoursPerDay);
    if (!isNaN(num)) {
      body.availableHoursPerDay = num;
    }
  }

  // 5. Trim string inputs
  if (typeof body.problemStatement === 'string') {
    body.problemStatement = body.problemStatement.trim();
  }
  if (typeof body.deadline === 'string') {
    body.deadline = body.deadline.trim();
  }
  if (typeof body.currentProjectStatus === 'string') {
    body.currentProjectStatus = body.currentProjectStatus.trim();
  }

  return body;
}

/**
 * Express middleware
 */
function validateDevPathInput(req, res, next) {
  const preprocessed = preprocessInput(req.body);
  const result = devPathZodSchema.safeParse(preprocessed);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const details = issues.map((err) => {
      const field = err.path.join('.') || 'input';
      return `${field}: ${err.message}`;
    });

    return res.status(400).json({
      error: 'Validation Error',
      details,
      fieldErrors: typeof result.error.flatten === 'function' ? result.error.flatten().fieldErrors : {},
    });
  }

  // Replace req.body with the sanitized and validated data
  req.body = result.data;
  return next();
}

module.exports = {
  validateDevPathInput,
  devPathZodSchema,
};
