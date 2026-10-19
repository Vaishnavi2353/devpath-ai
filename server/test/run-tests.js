/**
 * Automated Test Suite for DevPath Backend
 * Tests validation, feasibility math, endpoint contracts, error handling, and health check.
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { calculateFeasibility, normalizeWorkingDays, calculateWorkingDaysCount } = require('../src/utils/feasibility');
const { devPathZodSchema } = require('../src/middleware/validateDevPath');

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('--- DevPath Test Suite Starting ---');
  await startServer();

  console.log('\n[1] Health Check:');
  await itAsync('GET /api/health returns 200 and expected payload', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
    assert.strictEqual(res.data.service, 'DevPath API');
  });

  console.log('\n[2] Feasibility Utility Logic:');
  it('correctly counts working days for weekdays (Mon-Fri)', () => {
    const start = new Date(2026, 9, 1); // Thu
    const deadline = '2026-10-09'; // Fri
    const set = normalizeWorkingDays('weekdays');
    const days = calculateWorkingDaysCount(deadline, set, start);
    // Thu Oct 1, Fri Oct 2, Mon Oct 5, Tue Oct 6, Wed Oct 7, Thu Oct 8, Fri Oct 9 = 7 days
    assert.strictEqual(days, 7);
  });

  it('correctly handles all days (7-day week)', () => {
    const start = new Date(2026, 9, 1); // Thu
    const deadline = '2026-10-07'; // Wed
    const set = normalizeWorkingDays('all');
    const days = calculateWorkingDaysCount(deadline, set, start);
    // Oct 1 to Oct 7 inclusive = 7 days
    assert.strictEqual(days, 7);
  });

  it('correctly counts custom days (e.g. Mon, Wed, Fri)', () => {
    const start = new Date(2026, 9, 1); // Thu
    const deadline = '2026-10-09'; // Fri
    const set = normalizeWorkingDays(['mon', 'wed', 'fri']);
    const days = calculateWorkingDaysCount(deadline, set, start);
    // Fri Oct 2, Mon Oct 5, Wed Oct 7, Fri Oct 9 = 4 days
    assert.strictEqual(days, 4);
  });

  it('evaluates FEASIBLE threshold (<= 75% capacity)', () => {
    const res = calculateFeasibility({
      deadline: '2026-10-10',
      availableHoursPerDay: 4,
      workingDays: 'all',
      tasks: [{ estimatedHours: 20 }], // Available: 10 days * 4 = 40h. Ratio = 20/40 = 0.5
      referenceDate: new Date(2026, 9, 1),
    });
    assert.strictEqual(res.status, 'FEASIBLE');
    assert.strictEqual(res.bufferHours, 20);
    assert.strictEqual(res.feasibilityRatio, 0.5);
  });

  it('evaluates TIGHT threshold (75% - 100% capacity)', () => {
    const res = calculateFeasibility({
      deadline: '2026-10-10',
      availableHoursPerDay: 4,
      workingDays: 'all',
      tasks: [{ estimatedHours: 35 }], // Ratio = 35/40 = 0.88
      referenceDate: new Date(2026, 9, 1),
    });
    assert.strictEqual(res.status, 'TIGHT');
    assert.strictEqual(res.bufferHours, 5);
  });

  it('evaluates UNFEASIBLE threshold (> 100% capacity)', () => {
    const res = calculateFeasibility({
      deadline: '2026-10-10',
      availableHoursPerDay: 4,
      workingDays: 'all',
      tasks: [{ estimatedHours: 45 }], // Ratio = 45/40 = 1.13
      referenceDate: new Date(2026, 9, 1),
    });
    assert.strictEqual(res.status, 'UNFEASIBLE');
    assert.strictEqual(res.bufferHours, -5);
  });

  it('handles past deadline safely with 0 available capacity', () => {
    const res = calculateFeasibility({
      deadline: '2020-01-01',
      availableHoursPerDay: 4,
      workingDays: 'all',
      tasks: [{ estimatedHours: 10 }],
      referenceDate: new Date(2026, 9, 1),
    });
    assert.strictEqual(res.status, 'UNFEASIBLE');
    assert.strictEqual(res.totalAvailableHours, 0);
  });

  console.log('\n[3] Input Validation Middleware:');
  await itAsync('rejects requests with missing required fields (400)', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {},
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Validation Error');
    assert.ok(Array.isArray(res.data.details));
  });

  await itAsync('rejects requests with past deadline', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        problemStatement: 'Building an automated testing tool for web developers',
        deadline: '2020-01-01',
        techStack: ['Node.js'],
        availableHoursPerDay: 3,
        currentProjectStatus: 'Idea',
        workingDays: 'weekdays',
      },
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.details.some((d) => d.includes('past')));
  });

  await itAsync('rejects requests with availableHoursPerDay > 24 or <= 0', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        problemStatement: 'Building an automated testing tool for web developers',
        deadline: '2026-12-31',
        techStack: ['Node.js'],
        availableHoursPerDay: 28,
        currentProjectStatus: 'Idea',
        workingDays: 'weekdays',
      },
    });
    assert.strictEqual(res.status, 400);
  });

  console.log('\n[4] Contract Aliases & Generation Flow:');
  await itAsync('accepts aliases (projectStatement, knownTechStack, projectStatus) and generates plan', async () => {
    process.env.DEVPATH_MOCK_AI = 'true';
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        projectStatement: 'A collaborative real-time study planner for students',
        deadline: '2026-12-15',
        knownTechStack: 'React, Node.js, Express',
        availableHoursPerDay: '3.5',
        projectStatus: 'Planning phase',
        workingDays: 'weekdays',
      },
    });

    assert.strictEqual(res.status, 200);
    const body = res.data;

    // Verify top-level contract keys
    assert.ok(body.planId.startsWith('plan_'));
    assert.ok(body.meta.createdAt);
    assert.strictEqual(body.meta.inputs.problemStatement, 'A collaborative real-time study planner for students');
    assert.deepStrictEqual(body.meta.inputs.techStack, ['React', 'Node.js', 'Express']);
    assert.strictEqual(body.meta.inputs.availableHoursPerDay, 3.5);

    // Verify projectOverview
    assert.ok(body.projectOverview.title);
    assert.ok(body.projectOverview.summary);
    assert.ok(body.projectOverview.targetScope);

    // Verify recommendedStack
    assert.ok(Array.isArray(body.recommendedStack));
    assert.ok(body.recommendedStack.length > 0);
    assert.ok(body.recommendedStack[0].name);
    assert.ok(body.recommendedStack[0].category);
    assert.strictEqual(typeof body.recommendedStack[0].matchedStudentSkill, 'boolean');

    // Verify skillGaps (no estimatedLearningHours)
    assert.ok(Array.isArray(body.skillGaps));
    if (body.skillGaps.length > 0) {
      assert.ok(body.skillGaps[0].skill);
      assert.ok(body.skillGaps[0].severity);
      assert.ok(body.skillGaps[0].recommendation);
      assert.strictEqual(body.skillGaps[0].estimatedLearningHours, undefined);
    }

    // Verify feasibility
    assert.ok(['FEASIBLE', 'TIGHT', 'UNFEASIBLE'].includes(body.feasibility.status));
    assert.strictEqual(typeof body.feasibility.totalEstimatedHours, 'number');
    assert.strictEqual(typeof body.feasibility.totalAvailableHours, 'number');
    assert.strictEqual(typeof body.feasibility.bufferHours, 'number');
    assert.ok(body.feasibility.advisory);

    // Verify phases and tasks
    assert.ok(Array.isArray(body.phases));
    assert.ok(body.phases.length > 0);
    const firstPhase = body.phases[0];
    assert.ok(firstPhase.id.startsWith('phase_'));
    assert.ok(firstPhase.title);
    assert.strictEqual(typeof firstPhase.order, 'number');
    assert.ok(Array.isArray(firstPhase.tasks));

    const firstTask = firstPhase.tasks[0];
    assert.ok(firstTask.id.startsWith('task_'));
    assert.ok(firstTask.title);
    assert.ok(firstTask.description);
    assert.ok(firstTask.module);
    assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(firstTask.priority));
    assert.ok(['MVP', 'STRETCH', 'FUTURE'].includes(firstTask.tier));
    assert.strictEqual(typeof firstTask.estimatedHours, 'number');
    assert.ok(Array.isArray(firstTask.prerequisites));
    assert.ok(Array.isArray(firstTask.steps));
    assert.ok(firstTask.steps.length >= 2, 'Task should have at least 2 actionable steps');
    assert.ok(Array.isArray(firstTask.acceptanceCriteria));
    assert.ok(firstTask.acceptanceCriteria.length >= 1, 'Task should have acceptance criteria');
    assert.ok(Array.isArray(firstTask.definitionOfDone));
    assert.ok(firstTask.definitionOfDone.length >= 1, 'Task should have definition of done');
    assert.strictEqual(firstTask.status, 'todo'); // Initial status must be todo
  });

  console.log('\n[5] Missing Gemini API Key Error Handling:');
  await itAsync('returns safe 503 error when Gemini API key is missing and mock is disabled', async () => {
    delete process.env.DEVPATH_MOCK_AI;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;

    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        problemStatement: 'Building an automated testing tool for web developers',
        deadline: '2026-12-31',
        techStack: ['Node.js'],
        availableHoursPerDay: 3,
        currentProjectStatus: 'Idea',
        workingDays: 'weekdays',
      },
    });

    assert.strictEqual(res.status, 503);
    assert.ok(res.data.error.includes('Gemini API key is not configured'));
  });

  await stopServer();

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
