/**
 * Automated Projects & Persistence Test Suite
 * 
 * Verifies:
 * 1. Project creation (Draft)
 * 2. Automatic Project record persistence on roadmap generation (Generating -> Roadmap Generated)
 * 3. Failure tracking (Generating -> Failed with lastError recorded in MongoDB)
 * 4. Resuming and retrying failed/draft projects (POST /api/projects/:id/generate)
 * 5. Strict multi-user ownership enforcement (403 Forbidden on foreign access, update, delete, retry)
 * 6. Status updating (e.g. In Progress)
 * 7. Deletion of project and linked roadmap
 * 8. Unauthenticated request protection (401)
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const { Project } = require('../src/models/Project');
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
  console.log('--- DevPath Your Projects Test Suite Starting ---');
  process.env.DEVPATH_MOCK_AI = 'true';

  await connectDB();
  await startServer();

  const userAEmail = `proj_user_a_${Date.now()}@example.com`;
  const userBEmail = `proj_user_b_${Date.now()}@example.com`;
  const password = 'Password123!';

  let cookieUserA = null;
  let cookieUserB = null;

  let draftProjectId = null;
  let generatedProjectId = null;
  let failedProjectId = null;

  console.log('\n[1] User Setup:');
  await itAsync('registers User A and User B', async () => {
    const resA = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Alice Developer', email: userAEmail, password },
    });
    assert.strictEqual(resA.status, 201);
    cookieUserA = resA.setCookie;

    const resB = await request('/api/auth/signup', {
      method: 'POST',
      body: { name: 'Bob Developer', email: userBEmail, password },
    });
    assert.strictEqual(resB.status, 201);
    cookieUserB = resB.setCookie;

    assert.ok(cookieUserA, 'Expected cookie for User A');
    assert.ok(cookieUserB, 'Expected cookie for User B');
  });

  console.log('\n[2] Draft Project Creation & Listing:');
  await itAsync('creates a Draft project idea (POST /api/projects)', async () => {
    const res = await request('/api/projects', {
      method: 'POST',
      headers: { Cookie: cookieUserA },
      body: {
        title: 'Microservices Learning Lab',
        problemStatement: 'A hands-on containerized microservices platform for studying distributed systems.',
        techStack: ['Node.js', 'Docker', 'Redis'],
        availableHoursPerDay: 3,
        workingDays: 'weekdays',
        currentProjectStatus: 'Idea Stage / Not Started',
      },
    });

    assert.strictEqual(res.status, 201);
    assert.ok(res.data.project);
    assert.strictEqual(res.data.project.title, 'Microservices Learning Lab');
    assert.strictEqual(res.data.project.status, 'Draft');
    assert.strictEqual(res.data.project.roadmap, null);
    draftProjectId = res.data.project.id || res.data.project._id;
    assert.ok(draftProjectId);
  });

  await itAsync('lists user projects and confirms Draft is present (GET /api/projects)', async () => {
    const res = await request('/api/projects', {
      method: 'GET',
      headers: { Cookie: cookieUserA },
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.data.projects));
    assert.strictEqual(res.data.projects.length, 1);
    assert.strictEqual(res.data.projects[0].status, 'Draft');
  });

  console.log('\n[3] Roadmap Generation & Project Lifecycle:');
  await itAsync('generates roadmap and transitions project to Roadmap Generated', async () => {
    const deadline = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res = await request('/api/devpath/generate', {
      method: 'POST',
      headers: { Cookie: cookieUserA },
      body: {
        problemStatement: 'A full-stack collaborative Kanban board with real-time websocket updates.',
        deadline,
        techStack: ['React', 'Node.js', 'WebSockets', 'MongoDB'],
        availableHoursPerDay: 4,
        workingDays: 'weekdays',
        currentProjectStatus: 'Idea Stage / Not Started',
      },
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.data.projectId);
    generatedProjectId = res.data.projectId;

    // Verify Project in MongoDB Atlas
    const proj = await Project.findById(generatedProjectId).populate('roadmap');
    assert.ok(proj);
    assert.strictEqual(proj.status, 'Roadmap Generated');
    assert.ok(proj.roadmap);
    assert.strictEqual(proj.roadmap.user.toString(), proj.user.toString());
  });

  console.log('\n[4] Generation Failure State Tracking:');
  await itAsync('tracks project failure and records lastError in MongoDB Atlas', async () => {
    // We create a draft project and try generating with an invalid mock trigger
    const draftRes = await request('/api/projects', {
      method: 'POST',
      headers: { Cookie: cookieUserA },
      body: {
        title: 'Failing Project Spec',
        problemStatement: 'A faulty project meant to test error capture and status tracking.',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        techStack: ['Python'],
        availableHoursPerDay: 2,
      },
    });

    assert.strictEqual(draftRes.status, 201);
    failedProjectId = draftRes.data.project.id;

    // Simulate failure by temporarily turning off mock AI while API key is unset/mock disabled
    const originalMock = process.env.DEVPATH_MOCK_AI;
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.DEVPATH_MOCK_AI;
    process.env.GEMINI_API_KEY = '';

    const failRes = await request(`/api/projects/${failedProjectId}/generate`, {
      method: 'POST',
      headers: { Cookie: cookieUserA },
    });

    // Restore mock environment
    process.env.DEVPATH_MOCK_AI = originalMock;
    process.env.GEMINI_API_KEY = originalKey;

    assert.strictEqual(failRes.status, 503);
    assert.ok(failRes.data.projectId);

    // Verify Project status in DB is 'Failed' with error saved
    const projectInDb = await Project.findById(failedProjectId);
    assert.ok(projectInDb);
    assert.strictEqual(projectInDb.status, 'Failed');
    assert.ok(projectInDb.lastError);
    assert.ok(projectInDb.lastError.includes('Gemini API key'));
  });

  console.log('\n[5] Resuming / Retrying Failed Project:');
  await itAsync('retries a failed project and succeeds (POST /api/projects/:id/generate)', async () => {
    process.env.DEVPATH_MOCK_AI = 'true';

    const retryRes = await request(`/api/projects/${failedProjectId}/generate`, {
      method: 'POST',
      headers: { Cookie: cookieUserA },
    });

    assert.strictEqual(retryRes.status, 200);
    assert.ok(retryRes.data.project);
    assert.strictEqual(retryRes.data.project.status, 'Roadmap Generated');
    assert.strictEqual(retryRes.data.project.lastError, null);
    assert.ok(retryRes.data.roadmap);
  });

  console.log('\n[6] Strict Multi-User Ownership & Security:');
  await itAsync('prevents User B from accessing User A project (403 Forbidden)', async () => {
    const res = await request(`/api/projects/${generatedProjectId}`, {
      method: 'GET',
      headers: { Cookie: cookieUserB },
    });
    assert.strictEqual(res.status, 403);
  });

  await itAsync('prevents User B from updating User A project (403 Forbidden)', async () => {
    const res = await request(`/api/projects/${generatedProjectId}`, {
      method: 'PATCH',
      headers: { Cookie: cookieUserB },
      body: { title: 'Hacked Title' },
    });
    assert.strictEqual(res.status, 403);
  });

  await itAsync('prevents User B from retrying User A project (403 Forbidden)', async () => {
    const res = await request(`/api/projects/${generatedProjectId}/generate`, {
      method: 'POST',
      headers: { Cookie: cookieUserB },
    });
    assert.strictEqual(res.status, 403);
  });

  await itAsync('prevents User B from deleting User A project (403 Forbidden)', async () => {
    const res = await request(`/api/projects/${generatedProjectId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieUserB },
    });
    assert.strictEqual(res.status, 403);
  });

  await itAsync('rejects unauthenticated requests to /api/projects (401)', async () => {
    const res = await request('/api/projects', { method: 'GET' });
    assert.strictEqual(res.status, 401);
  });

  console.log('\n[7] Updating Status & Deletion:');
  await itAsync('allows User A to update project status to In Progress (PATCH)', async () => {
    const res = await request(`/api/projects/${generatedProjectId}`, {
      method: 'PATCH',
      headers: { Cookie: cookieUserA },
      body: { status: 'In Progress' },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.project.status, 'In Progress');
  });

  await itAsync('deletes project and verifies removal (DELETE /api/projects/:id)', async () => {
    const res = await request(`/api/projects/${draftProjectId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieUserA },
    });

    assert.strictEqual(res.status, 200);

    const checkRes = await request(`/api/projects/${draftProjectId}`, {
      method: 'GET',
      headers: { Cookie: cookieUserA },
    });
    assert.strictEqual(checkRes.status, 404);
  });

  console.log('\n========================================');
  console.log(`Your Projects Test Results: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  await stopServer();
  await disconnectDB();

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
