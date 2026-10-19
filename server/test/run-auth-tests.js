/**
 * Automated Authentication Test Suite
 * Tests signup, login, session cookies, input validation, duplicate emails,
 * protected routes, and logout.
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');

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
  console.log('--- DevPath Auth Test Suite Starting ---');
  await connectDB();
  await startServer();

  const testEmail = `student_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authCookie = null;
  let authToken = null;

  console.log('\n[1] Registration (Signup):');
  await itAsync('POST /api/auth/signup creates user and sets HttpOnly cookie', async () => {
    const res = await request('/api/auth/signup', {
      method: 'POST',
      body: {
        name: 'Alex Student',
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.user.name, 'Alex Student');
    assert.strictEqual(res.data.user.email, testEmail.toLowerCase());
    assert.strictEqual(res.data.user.passwordHash, undefined); // Never expose hash!
    assert.ok(res.data.token, 'Token should be returned in response body');
    assert.ok(res.setCookie, 'Should set cookie header');
    assert.ok(res.setCookie.includes('token='), 'Cookie should contain token');
    assert.ok(res.setCookie.toLowerCase().includes('httponly'), 'Cookie must be HttpOnly');

    // Extract cookie value for subsequent tests
    authCookie = res.setCookie.split(';')[0];
    authToken = res.data.token;
  });

  await itAsync('POST /api/auth/signup rejects duplicate email with 409 Conflict', async () => {
    const res = await request('/api/auth/signup', {
      method: 'POST',
      body: {
        name: 'Another Alex',
        email: testEmail,
        password: 'AnotherPassword456!',
      },
    });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.data.error, 'Conflict');
  });

  await itAsync('POST /api/auth/signup validates inputs (rejects weak/empty password)', async () => {
    const res = await request('/api/auth/signup', {
      method: 'POST',
      body: {
        name: 'Short Pass',
        email: 'shortpass@example.com',
        password: '123', // Less than 6 chars
      },
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Validation Error');
  });

  console.log('\n[2] Authentication (Login):');
  await itAsync('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.email, testEmail.toLowerCase());
    assert.strictEqual(res.data.user.passwordHash, undefined);
    assert.ok(res.setCookie.includes('token='));
  });

  await itAsync('POST /api/auth/login returns generic 401 for incorrect password', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'WrongPassword999!',
      },
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.message, 'Invalid email or password.');
  });

  await itAsync('POST /api/auth/login returns generic 401 for non-existent email', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'ghost_nonexistent@example.com',
        password: testPassword,
      },
    });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.data.message, 'Invalid email or password.');
  });

  console.log('\n[3] Protected Current-User Endpoint:');
  await itAsync('GET /api/auth/me rejects unauthenticated request (401)', async () => {
    const res = await request('/api/auth/me');
    assert.strictEqual(res.status, 401);
  });

  await itAsync('GET /api/auth/me accepts valid HttpOnly cookie', async () => {
    const res = await request('/api/auth/me', {
      headers: {
        Cookie: authCookie,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.email, testEmail.toLowerCase());
    assert.strictEqual(res.data.user.name, 'Alex Student');
  });

  await itAsync('GET /api/auth/me accepts Authorization Bearer token header', async () => {
    const res = await request('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.user.email, testEmail.toLowerCase());
  });

  console.log('\n[4] Session Termination (Logout):');
  await itAsync('POST /api/auth/logout clears token cookie', async () => {
    const res = await request('/api/auth/logout', {
      method: 'POST',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.message, 'Logged out successfully');
    assert.ok(res.setCookie, 'Should set cookie deletion header');
  });

  console.log('\n[5] Health Check Preservation:');
  await itAsync('GET /api/health continues to return 200 OK', async () => {
    const res = await request('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, 'ok');
  });

  // Clean up test user
  await User.deleteOne({ email: testEmail });

  await stopServer();
  await disconnectDB();

  console.log(`\n========================================`);
  console.log(`Auth Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal auth test error:', err);
  process.exit(1);
});
