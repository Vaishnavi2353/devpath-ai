/**
 * Automated Roadmap Persistence Test Suite
 * Tests MongoDB roadmap persistence, listing, single roadmap retrieval,
 * deletion, and strict multi-user ownership isolation.
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Roadmap = require('../src/models/Roadmap');

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

  const rawCookies = res.headers.get('set-cookie');
  const data = await res.json().catch(() => null);

  return { status: res.status, data, setCookie: rawCookies };
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
  console.log('--- DevPath Roadmap Persistence Test Suite Starting ---');
  process.env.DEVPATH_MOCK_AI = 'true';

  await connectDB();
  await startServer();

  const userAEmail = `user_a_${Date.now()}@example.com`;
  const userBEmail = `user_b_${Date.now()}@example.com`;
  const password = 'Password123!';

  let cookieUserA = null;
  let cookieUserB = null;
  let userARoadmapId = null;

  console.log('\n[1] User Setup:');
  await itAsync('registers User A and User B', async () => {
    const resA = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'User A', email: userAEmail, password },
    });
    assert.strictEqual(resA.status, 201);
    cookieUserA = resA.setCookie.split(';')[0];

    const resB = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'User B', email: userBEmail, password },
    });
    assert.strictEqual(resB.status, 201);
    cookieUserB = resB.setCookie.split(';')[0];
  });

  console.log('\n[2] Roadmap Generation & Automatic Persistence:');
  await itAsync('generates and persists roadmap for authenticated User A', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      headers: { Cookie: cookieUserA },
      body: {
        problemStatement: 'A collaborative real-time study planner for university students',
        deadline: '2026-11-25',
        techStack: ['React', 'Node.js'],
        availableHoursPerDay: 3,
        currentProjectStatus: 'Idea Stage',
        workingDays: 'weekdays',
      },
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.data.id || res.data._id, 'Response should contain persisted MongoDB ID');
    userARoadmapId = res.data.id || res.data._id;

    // Check directly in MongoDB
    const inDb = await Roadmap.findById(userARoadmapId);
    assert.ok(inDb, 'Roadmap must exist in MongoDB');
    assert.strictEqual(inDb.title, res.data.projectOverview.title);
  });

  console.log('\n[3] Roadmap Retrieval (Listing & Single):');
  await itAsync('GET /api/devpath/roadmaps returns User A saved roadmaps', async () => {
    const res = await request('/api/devpath/roadmaps', {
      headers: { Cookie: cookieUserA },
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.roadmaps));
    assert.strictEqual(res.data.roadmaps.length, 1);
    assert.strictEqual(res.data.roadmaps[0].id, userARoadmapId);
  });

  await itAsync('GET /api/devpath/roadmaps/:id returns single roadmap for User A', async () => {
    const res = await request(`/api/devpath/roadmaps/${userARoadmapId}`, {
      headers: { Cookie: cookieUserA },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.roadmap.id, userARoadmapId);
    assert.ok(res.data.roadmap.phases);
    assert.ok(res.data.roadmap.feasibility);
  });

  console.log('\n[4] Security & Ownership Enforcement:');
  await itAsync('rejects User B trying to fetch User A roadmap with 403 Forbidden', async () => {
    const res = await request(`/api/devpath/roadmaps/${userARoadmapId}`, {
      headers: { Cookie: cookieUserB },
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
  });

  await itAsync('rejects User B trying to delete User A roadmap with 403 Forbidden', async () => {
    const res = await request(`/api/devpath/roadmaps/${userARoadmapId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieUserB },
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
  });

  await itAsync('rejects unauthenticated requests to /api/devpath/roadmaps with 401', async () => {
    const res = await request('/api/devpath/roadmaps');
    assert.strictEqual(res.status, 401);
  });

  console.log('\n[5] Task Status Update & Persistence:');
  await itAsync('allows User A to update task status and subtasks via PATCH /api/devpath/roadmaps/:id/tasks/:taskId', async () => {
    const roadmap = await Roadmap.findById(userARoadmapId);
    assert.ok(roadmap.phases && roadmap.phases.length > 0);
    const targetTaskId = roadmap.phases[0].tasks[0].id;

    const res = await request(`/api/devpath/roadmaps/${userARoadmapId}/tasks/${targetTaskId}`, {
      method: 'PATCH',
      headers: { Cookie: cookieUserA },
      body: {
        status: 'in_progress',
        completedSteps: [0],
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.taskId, targetTaskId);
    assert.strictEqual(res.data.task.status, 'in_progress');

    // Confirm persisted in MongoDB
    const updatedInDb = await Roadmap.findById(userARoadmapId);
    const dbTask = updatedInDb.phases[0].tasks.find((t) => t.id === targetTaskId);
    assert.strictEqual(dbTask.status, 'in_progress');
    assert.deepStrictEqual(dbTask.completedSteps, [0]);
  });

  await itAsync('rejects User B trying to update User A task with 403 Forbidden', async () => {
    const roadmap = await Roadmap.findById(userARoadmapId);
    const targetTaskId = roadmap.phases[0].tasks[0].id;

    const res = await request(`/api/devpath/roadmaps/${userARoadmapId}/tasks/${targetTaskId}`, {
      method: 'PATCH',
      headers: { Cookie: cookieUserB },
      body: { status: 'done' },
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error, 'Forbidden');
  });

  console.log('\n[6] Roadmap Deletion:');
  await itAsync('allows User A to delete their own roadmap', async () => {
    const res = await request(`/api/devpath/roadmaps/${userARoadmapId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieUserA },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.message, 'Roadmap deleted successfully');

    // Confirm deleted from MongoDB
    const checkDb = await Roadmap.findById(userARoadmapId);
    assert.strictEqual(checkDb, null);
  });

  await itAsync('GET /api/devpath/roadmaps returns empty list after deletion', async () => {
    const res = await request('/api/devpath/roadmaps', {
      headers: { Cookie: cookieUserA },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.roadmaps.length, 0);
  });

  // Cleanup test users and test roadmaps
  await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
  await Roadmap.deleteMany({ planId: { $regex: '^plan_' } });

  await stopServer();
  await disconnectDB();

  console.log(`\n========================================`);
  console.log(`Persistence Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal persistence test error:', err);
  process.exit(1);
});
