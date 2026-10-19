/**
 * Feasibility Calculation Utility
 * 
 * Deterministic scheduling and capacity calculations.
 * The backend is the single source of truth for all arithmetic and feasibility classifications.
 */

const DAY_NAME_MAP = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

/**
 * Normalizes workingDays input into a Set of day indices (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * Supported formats:
 * - 'all' or 'all_days' -> [0, 1, 2, 3, 4, 5, 6]
 * - 'weekdays' or 'weekdays_only' -> [1, 2, 3, 4, 5]
 * - Array of day names/abbreviations or numbers: ['mon', 'wed', 'fri'] or [1, 3, 5]
 */
function normalizeWorkingDays(workingDays) {
  if (!workingDays || workingDays === 'all' || workingDays === 'all_days') {
    return new Set([0, 1, 2, 3, 4, 5, 6]);
  }

  if (workingDays === 'weekdays' || workingDays === 'weekdays_only') {
    return new Set([1, 2, 3, 4, 5]);
  }

  if (Array.isArray(workingDays)) {
    const daySet = new Set();
    for (const item of workingDays) {
      if (typeof item === 'number' && item >= 0 && item <= 6) {
        daySet.add(item);
      } else if (typeof item === 'string') {
        const key = item.trim().toLowerCase();
        if (DAY_NAME_MAP[key] !== undefined) {
          daySet.add(DAY_NAME_MAP[key]);
        }
      }
    }
    if (daySet.size > 0) {
      return daySet;
    }
  }

  // Default fallback if unknown format: standard weekdays (Mon-Fri)
  return new Set([1, 2, 3, 4, 5]);
}

/**
 * Calculates number of eligible working days between startDate and deadline (inclusive).
 * Convention:
 * - Start date: beginning of the current calendar day (00:00:00)
 * - Deadline: end of the deadline day (23:59:59)
 * - Includes both the start date and the deadline day if they match workingDays.
 * 
 * @param {string|Date} deadline - Deadline date ('YYYY-MM-DD' or Date)
 * @param {Set<number>} workingDaySet - Set of active day-of-week indices
 * @param {Date} [referenceDate] - Optional start date for testing, defaults to current time
 * @returns {number} count of available working days
 */
function calculateWorkingDaysCount(deadline, workingDaySet, referenceDate = new Date()) {
  let deadlineDate;
  if (typeof deadline === 'string') {
    const parts = deadline.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      // Create local date to avoid UTC shifting
      deadlineDate = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    } else {
      deadlineDate = new Date(deadline);
    }
  } else {
    deadlineDate = new Date(deadline);
  }

  if (isNaN(deadlineDate.getTime())) {
    return 0;
  }

  const startDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0
  );

  // If deadline is in the past
  if (deadlineDate < startDate) {
    return 0;
  }

  let count = 0;
  const cursor = new Date(startDate);

  // Iterate day by day from start to deadline
  while (cursor <= deadlineDate) {
    if (workingDaySet.has(cursor.getDay())) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/**
 * Generates an advisory message based on the feasibility ratio and metrics.
 */
function getFeasibilityAdvisory(status, totalEstimatedHours, totalAvailableHours, bufferHours) {
  if (totalAvailableHours === 0) {
    return 'The deadline has already passed or no working days are scheduled. Please adjust your deadline or availability.';
  }

  if (status === 'FEASIBLE') {
    return `Great news! Your estimated effort (${totalEstimatedHours}h) fits comfortably within your available capacity (${totalAvailableHours}h) with a ${bufferHours}h safety buffer.`;
  }

  if (status === 'TIGHT') {
    return `Your plan is tightly budgeted (${totalEstimatedHours}h estimated vs ${totalAvailableHours}h available). You have a slim ${bufferHours}h buffer. Stick to MVP phases and defer stretch tasks if you encounter roadblocks.`;
  }

  // UNFEASIBLE
  const deficit = Math.abs(bufferHours);
  return `Warning: Estimated project effort (${totalEstimatedHours}h) exceeds your total available time (${totalAvailableHours}h) by ${deficit} hours. To make this realistic, extend your deadline, increase daily hours, or cut stretch and future tasks.`;
}

/**
 * Main feasibility calculation function.
 * 
 * @param {Object} params
 * @param {string|Date} params.deadline - 'YYYY-MM-DD'
 * @param {number} params.availableHoursPerDay - Daily hours capacity
 * @param {string|Array} params.workingDays - Schedule preference
 * @param {Array} params.tasks - Flattened list of tasks or phases
 * @param {Date} [params.referenceDate] - Optional start date for testing
 * 
 * @returns {Object} Feasibility breakdown
 */
function calculateFeasibility({
  deadline,
  availableHoursPerDay,
  workingDays,
  tasks = [],
  referenceDate = new Date(),
}) {
  const safeHoursPerDay = Math.max(0, Number(availableHoursPerDay) || 0);
  const workingDaySet = normalizeWorkingDays(workingDays);
  const workingDaysCount = calculateWorkingDaysCount(deadline, workingDaySet, referenceDate);

  const totalAvailableHours = Math.round(workingDaysCount * safeHoursPerDay * 10) / 10;

  // Flatten tasks if phases were provided
  let flatTasks = [];
  if (Array.isArray(tasks)) {
    for (const item of tasks) {
      if (item && Array.isArray(item.tasks)) {
        flatTasks.push(...item.tasks);
      } else if (item && typeof item === 'object') {
        flatTasks.push(item);
      }
    }
  }

  // Sum estimated hours safely
  let totalEstimatedHours = 0;
  for (const task of flatTasks) {
    const rawHours = Number(task.estimatedHours);
    if (!isNaN(rawHours) && rawHours > 0) {
      totalEstimatedHours += rawHours;
    }
  }
  totalEstimatedHours = Math.round(totalEstimatedHours * 10) / 10;

  const bufferHours = Math.round((totalAvailableHours - totalEstimatedHours) * 10) / 10;

  let feasibilityRatio = 0;
  let status = 'UNFEASIBLE';

  if (totalAvailableHours <= 0) {
    feasibilityRatio = totalEstimatedHours > 0 ? Infinity : 0;
    status = 'UNFEASIBLE';
  } else {
    feasibilityRatio = Math.round((totalEstimatedHours / totalAvailableHours) * 100) / 100;

    // Thresholds:
    // FEASIBLE: ratio <= 0.75 (estimated effort is at most 75% of available capacity)
    // TIGHT: ratio > 0.75 and <= 1.0
    // UNFEASIBLE: ratio > 1.0
    if (feasibilityRatio <= 0.75) {
      status = 'FEASIBLE';
    } else if (feasibilityRatio <= 1.0) {
      status = 'TIGHT';
    } else {
      status = 'UNFEASIBLE';
    }
  }

  const advisory = getFeasibilityAdvisory(
    status,
    totalEstimatedHours,
    totalAvailableHours,
    bufferHours
  );

  return {
    status,
    totalEstimatedHours,
    totalAvailableHours,
    workingDaysCount,
    bufferHours,
    feasibilityRatio: isFinite(feasibilityRatio) ? feasibilityRatio : 999,
    advisory,
  };
}

module.exports = {
  normalizeWorkingDays,
  calculateWorkingDaysCount,
  calculateFeasibility,
  getFeasibilityAdvisory,
};
