/**
 * Automated Test Suite for Hallucination Prevention & Project Idea Validation
 * 
 * Verifies all 14 required cases:
 * 1. Empty input is rejected.
 * 2. Whitespace-only input is rejected.
 * 3. Random keyboard-mashing input is rejected.
 * 4. Repeated-character input is rejected.
 * 5. A clear, concise project idea is accepted.
 * 6. A detailed legitimate project idea is accepted.
 * 7. A legitimate technical project with acronyms is not incorrectly rejected.
 * 8. An understandable idea with missing details can proceed with disclosed assumptions.
 * 9. An unintelligible idea does not trigger full roadmap generation.
 * 10. An unrelated AI response is not accepted as a valid roadmap.
 * 11. Malformed AI JSON is handled without crashing the server.
 * 12. Feasibility calculations are not performed for rejected ideas.
 * 13. Invalid ideas are not persisted as generated roadmaps.
 * 14. A valid idea still generates and saves a roadmap successfully.
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Roadmap = require('../src/models/Roadmap');
const { Project } = require('../src/models/Project');
const { validateProjectIdea } = require('../src/utils/ideaValidator');
const devpathService = require('../src/services/devpath.service');

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
  return { status: res.status, data, headers: res.headers, rawCookies };
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
  console.log('--- DevPath Hallucination & Idea Validation Test Suite Starting ---');
  process.env.DEVPATH_MOCK_AI = 'true';

  await connectDB();
  await startServer();

  // Create clean test user
  const uniqueSuffix = Date.now().toString(36);
  const testUserEmail = `validator_${uniqueSuffix}@example.com`;
  const signupRes = await request('/api/auth/signup', {
    method: 'POST',
    body: {
      name: 'Validation Tester',
      email: testUserEmail,
      password: 'DevPathSecure2026!',
    },
  });

  assert.strictEqual(signupRes.status, 201, 'Test user signup should succeed');
  const authCookie = signupRes.rawCookies ? signupRes.rawCookies.split(';')[0] : '';
  const authHeaders = { Cookie: authCookie };

  const validBasePayload = {
    deadline: '2026-12-31',
    techStack: ['React', 'Node.js'],
    availableHoursPerDay: 3,
    currentProjectStatus: 'Idea Stage / Not Started',
    workingDays: 'weekdays',
  };

  console.log('\n[Phase 1: Deterministic Heuristic Input Validation]');

  // 1. Empty input is rejected
  await itAsync('1. Empty input is rejected', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: '',
      },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Validation Error');
  });

  // 2. Whitespace-only input is rejected
  await itAsync('2. Whitespace-only input is rejected', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: '            ',
      },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Validation Error');
  });

  // 3. Random keyboard-mashing input is rejected
  await itAsync('3. Random keyboard-mashing input is rejected (e.g., adasfsdghnufdyynrntutyjyj)', async () => {
    const res1 = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'adasfsdghnufdyynrntutyjyj',
      },
    });
    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.data.error, 'Validation Error');

    const res2 = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'asdfghjkl qwertyuiop zxcvbnm',
      },
    });
    assert.strictEqual(res2.status, 400);
    assert.strictEqual(res2.data.error, 'Validation Error');
  });

  // 4. Repeated-character input is rejected
  await itAsync('4. Repeated-character input is rejected', async () => {
    const res1 = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'aaaaaaaaaaaaaaaaaaaaa',
      },
    });
    assert.strictEqual(res1.status, 400);
    assert.strictEqual(res1.data.error, 'Validation Error');

    const res2 = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'abcabcabcabcabcabcabc',
      },
    });
    assert.strictEqual(res2.status, 400);
    assert.strictEqual(res2.data.error, 'Validation Error');
  });

  console.log('\n[Phase 2: Legitimate Technical Ideas Allowed]');

  // 5. A clear, concise project idea is accepted
  await itAsync('5. A clear, concise project idea is accepted', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'Pomodoro timer with sound alerts and task stats',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.projectOverview?.title);
    assert.ok(res.data.phases?.length > 0);
  });

  // 6. A detailed legitimate project idea is accepted
  await itAsync('6. A detailed legitimate project idea is accepted', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'A web-based collaborative markdown editor where students can edit study notes simultaneously with live cursor presence, syntax highlighting, and PDF document export.',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.projectOverview?.title);
    assert.ok(res.data.phases?.length > 0);
  });

  // 7. A legitimate technical project with acronyms is not incorrectly rejected
  await itAsync('7. A legitimate technical project with acronyms is not incorrectly rejected', async () => {
    const res1 = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'REST API in Go with JWT and PostgreSQL',
        techStack: ['Go', 'PostgreSQL'],
      },
    });
    assert.strictEqual(res1.status, 200);

    const res2 = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'CLI tool for AWS S3 and K8s deployment',
        techStack: ['Node.js'],
      },
    });
    assert.strictEqual(res2.status, 200);

    const res3 = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'WASM parser for AST syntax tree generation',
        techStack: ['Rust'],
      },
    });
    assert.strictEqual(res3.status, 200);
  });

  console.log('\n[Phase 3: AI Understanding Gate & Grounding]');

  // 8. An understandable idea with missing details can proceed with disclosed assumptions
  await itAsync('8. An understandable idea with missing details can proceed with disclosed assumptions', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'A simple book review notes tracker',
      },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.projectOverview);
    assert.ok(Array.isArray(res.data.projectOverview.assumptions));
    assert.ok(res.data.projectOverview.assumptions.length > 0, 'Disclosed assumptions should be present');
    assert.ok(Array.isArray(res.data.meta.assessment?.disclosedAssumptions));
  });

  // 9. An unintelligible idea does not trigger full roadmap generation
  await itAsync('9. An unintelligible idea does not trigger full roadmap generation', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'unintelligible concept with non-actionable goals and random jargon words',
      },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.code, 'CLARIFICATION_REQUIRED');
    assert.ok(res.data.details && res.data.details.length > 0);
    assert.strictEqual(res.data.phases, undefined, 'Phases should NOT be generated for unintelligible input');
    assert.strictEqual(res.data.feasibility, undefined, 'Feasibility should NOT be calculated');
  });

  // 10. An unrelated AI response is not accepted as a valid roadmap
  await itAsync('10. An unrelated AI response is not accepted as a valid roadmap', async () => {
    process.env.DEVPATH_TEST_UNRELATED_AI = 'true';
    try {
      await devpathService.generateDevPath({
        ...validBasePayload,
        problemStatement: 'A web-based collaborative markdown editor for students',
      });
      assert.fail('Should have thrown an error for unrelated AI response');
    } catch (err) {
      assert.strictEqual(err.status, 502);
      assert.strictEqual(err.code, 'RELEVANCE_CHECK_FAILED');
    } finally {
      delete process.env.DEVPATH_TEST_UNRELATED_AI;
    }
  });

  // 11. Malformed AI JSON is handled without crashing the server
  await itAsync('11. Malformed AI JSON is handled without crashing the server', async () => {
    const brokenJson = '{ "projectOverview": { title: unquoted, }';
    assert.doesNotThrow(() => {
      devpathService.extractCleanJson(brokenJson);
    });

    try {
      JSON.parse(brokenJson);
      assert.fail('Should fail parsing broken JSON');
    } catch (err) {
      // Confirmed parsing error
      assert.ok(err instanceof SyntaxError);
    }
  });

  console.log('\n[Phase 4: Feasibility & Persistence Safety]');

  // 12. Feasibility calculations are not performed for rejected ideas
  await itAsync('12. Feasibility calculations are not performed for rejected ideas', async () => {
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      body: {
        ...validBasePayload,
        problemStatement: 'adasfsdghnufdyynrntutyjyj',
      },
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.feasibility, undefined, 'Feasibility calculation must never run for rejected ideas');
  });

  // 13. Invalid ideas are not persisted as generated roadmaps
  await itAsync('13. Invalid ideas are not persisted as generated roadmaps', async () => {
    // Authenticated user sends meaningless input
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      headers: authHeaders,
      body: {
        ...validBasePayload,
        problemStatement: 'adasfsdghnufdyynrntutyjyj',
      },
    });
    assert.strictEqual(res.status, 400);

    // Verify no Roadmap was created
    const userRoadmapsRes = await request('/api/devpath/roadmaps', {
      method: 'GET',
      headers: authHeaders,
    });
    assert.strictEqual(userRoadmapsRes.status, 200);
    assert.strictEqual(userRoadmapsRes.data.roadmaps.length, 0, 'No roadmap should exist for the user');
  });

  // 14. A valid idea still generates and saves a roadmap successfully
  await itAsync('14. A valid idea still generates and saves a roadmap successfully', async () => {
    const validIdea = 'Interactive flashcard study tool with spaced repetition';
    const res = await request('/api/devpath/generate', {
      method: 'POST',
      headers: authHeaders,
      body: {
        ...validBasePayload,
        problemStatement: validIdea,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.data.id || res.data._id, 'Roadmap ID should be returned');
    assert.ok(res.data.feasibility, 'Feasibility should be computed for valid plan');
    assert.ok(res.data.phases?.length > 0, 'Phases should be generated');

    // Verify it is saved in MongoDB Atlas
    const userRoadmapsRes = await request('/api/devpath/roadmaps', {
      method: 'GET',
      headers: authHeaders,
    });
    assert.strictEqual(userRoadmapsRes.status, 200);
    assert.strictEqual(userRoadmapsRes.data.roadmaps.length, 1, 'Exactly 1 saved roadmap should exist');
    assert.strictEqual(userRoadmapsRes.data.roadmaps[0].id, res.data.id || res.data._id);
  });

  // Cleanup test user and roadmaps
  try {
    const user = await User.findOne({ email: testUserEmail });
    if (user) {
      await Roadmap.deleteMany({ user: user._id });
      await Project.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
    }
  } catch (cleanErr) {
    console.warn('Cleanup warning:', cleanErr.message);
  }

  await stopServer();
  await disconnectDB();

  console.log(`\n========================================`);
  console.log(`Hallucination & Validation Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
