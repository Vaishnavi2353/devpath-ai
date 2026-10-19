/**
 * DevPath Input Validation Middleware
 * Responsibility: Validates the 5 MVP inputs before reaching the controller.
 *
 * 5 MVP Inputs:
 * 1. Problem / Project Statement (problemStatement)
 * 2. Deadline (deadline)
 * 3. Tech Stack student already knows (techStack)
 * 4. Available Hours Per Day (availableHoursPerDay)
 * 5. Current Project Status (currentProjectStatus)
 */

function validateDevPathInput(req, res, next) {
  const errors = [];
  const body = req.body || {};

  // 1. Problem / Project Statement
  const rawProblemStatement = body.problemStatement ?? body.projectStatement;
  if (!rawProblemStatement || typeof rawProblemStatement !== 'string' || !rawProblemStatement.trim()) {
    errors.push('Problem/project statement is required and must be a non-empty string.');
  }

  // 2. Deadline
  const rawDeadline = body.deadline;
  if (!rawDeadline) {
    errors.push('Deadline is required.');
  } else {
    const parsedDate = new Date(rawDeadline);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Deadline must be a valid date string (e.g., YYYY-MM-DD).');
    }
  }

  // 3. Tech Stack the student already knows
  const rawTechStack = body.techStack ?? body.knownTechStack;
  let normalizedTechStack = [];

  if (!rawTechStack) {
    errors.push('Tech stack is required.');
  } else if (Array.isArray(rawTechStack)) {
    normalizedTechStack = rawTechStack
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());

    if (normalizedTechStack.length === 0) {
      errors.push('Tech stack array must contain at least one valid technology string.');
    }
  } else if (typeof rawTechStack === 'string' && rawTechStack.trim().length > 0) {
    normalizedTechStack = rawTechStack
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (normalizedTechStack.length === 0) {
      errors.push('Tech stack must contain at least one valid technology.');
    }
  } else {
    errors.push('Tech stack must be an array of strings or a comma-separated string.');
  }

  // 4. Available Hours Per Day
  const rawHours = body.availableHoursPerDay;
  const numericHours = Number(rawHours);
  if (rawHours === undefined || rawHours === null || isNaN(numericHours)) {
    errors.push('Available hours per day is required and must be a number.');
  } else if (numericHours <= 0 || numericHours > 24) {
    errors.push('Available hours per day must be greater than 0 and at most 24.');
  }

  // 5. Current Project Status
  const rawStatus = body.currentProjectStatus ?? body.projectStatus;
  if (!rawStatus || typeof rawStatus !== 'string' || !rawStatus.trim()) {
    errors.push('Current project status is required and must be a non-empty string.');
  }

  // If validation fails, return 400 Bad Request with all error details
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors,
    });
  }

  // Normalize request body with standard field names for downstream handlers
  req.body = {
    problemStatement: rawProblemStatement.trim(),
    deadline: rawDeadline,
    techStack: normalizedTechStack,
    availableHoursPerDay: numericHours,
    currentProjectStatus: rawStatus.trim(),
  };

  return next();
}

module.exports = {
  validateDevPathInput,
};
