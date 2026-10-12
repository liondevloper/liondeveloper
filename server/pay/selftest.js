/**
 * Integration test for the payments platform API.
 * Boots the real Express app on an ephemeral port and drives it over HTTP.
 *
 *   npm run test:pay
 *
 * It writes one merchant row with a reserved email and deletes it again, because
 * this database is shared with the published site.
 */
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import { initDatabase } from '../db.js';
import { pool } from '../db.js';

const TEST_EMAIL = 'selftest+pay@lion.invalid';
const TEST_PASSWORD = 'correct horse battery';

let passed = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
}

async function main() {
  await initDatabase();
  await pool.query('DELETE FROM pay_merchants WHERE email = $1', [TEST_EMAIL]);

  const server = createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/pay`;

  let cookie = '';
  const call = async (path, options = {}) => {
    const res = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(cookie ? { cookie } : {}),
        ...(options.headers || {}),
      },
    });
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const value of setCookie) {
      const [pair] = value.split(';');
      if (pair.startsWith('pay_merchant=')) cookie = pair;
    }
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  };

  console.log('\nMilestone 1: merchant accounts\n');

  await check('GET /config reports all three modes and marks live as real money', async () => {
    const { status, body } = await call('/config');
    assert.equal(status, 200);
    const modes = Object.fromEntries(body.modes.map((m) => [m.mode, m]));
    assert.deepEqual(Object.keys(modes).sort(), ['hyperswitch_live', 'hyperswitch_sandbox', 'mock']);
    assert.equal(modes.mock.available, true);
    assert.equal(modes.hyperswitch_live.movesRealMoney, true);
    assert.equal(body.defaultMode, 'mock');
  });

  await check('unconfigured modes are reported unavailable with a reason', async () => {
    const { body } = await call('/config');
    const modes = Object.fromEntries(body.modes.map((m) => [m.mode, m]));
    for (const mode of ['hyperswitch_sandbox', 'hyperswitch_live']) {
      if (!modes[mode].available) assert.ok(modes[mode].reason.length > 0, `${mode} gives no reason`);
    }
  });

  await check('GET /merchants/me without a session is 401', async () => {
    const { status } = await call('/merchants/me');
    assert.equal(status, 401);
  });

  await check('registration rejects a short password', async () => {
    const { status, body } = await call('/merchants/register', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: 'short', businessName: 'Selftest' }),
    });
    assert.equal(status, 400);
    assert.match(body.error, /10 characters/);
  });

  await check('registration rejects a malformed email', async () => {
    const { status } = await call('/merchants/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email', password: TEST_PASSWORD, businessName: 'Selftest' }),
    });
    assert.equal(status, 400);
  });

  await check('registration creates the merchant and signs them in', async () => {
    const { status, body } = await call('/merchants/register', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        businessName: 'Selftest Traders',
        contactPhone: '9999999999',
      }),
    });
    assert.equal(status, 201);
    assert.match(body.merchant.id, /^mer_[0-9a-f]{24}$/);
    assert.equal(body.merchant.email, TEST_EMAIL);
    assert.equal(body.merchant.liveAccess, false, 'new merchants must not start with live access');
    assert.ok(cookie.startsWith('pay_merchant='), 'no session cookie was set');
  });

  await check('the API never returns the password hash', async () => {
    const { body } = await call('/merchants/me');
    assert.equal(JSON.stringify(body).includes('password'), false);
  });

  await check('the session cookie is httpOnly', async () => {
    const res = await fetch(`${base}/merchants/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    const header = (res.headers.getSetCookie?.() || []).find((v) => v.startsWith('pay_merchant='));
    assert.ok(header, 'login set no cookie');
    assert.match(header, /HttpOnly/i);
  });

  await check('a merchant session cannot open the website admin panel', async () => {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/auth/me`, {
      headers: { cookie: cookie.replace('pay_merchant=', 'lion_admin=') },
    });
    assert.equal(res.status, 401, 'merchant token was accepted as an admin token');
  });

  await check('duplicate registration is rejected', async () => {
    const { status } = await call('/merchants/register', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, businessName: 'Copycat' }),
    });
    assert.equal(status, 409);
  });

  await check('login with a wrong password is rejected', async () => {
    const res = await fetch(`${base}/merchants/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: 'wrong wrong wrong' }),
    });
    assert.equal(res.status, 401);
  });

  await check('login returns the merchant and /me agrees', async () => {
    const login = await call('/merchants/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    assert.equal(login.status, 200);
    const me = await call('/merchants/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.merchant.id, login.body.merchant.id);
    assert.equal(me.body.merchant.businessName, 'Selftest Traders');
  });

  await check('logout ends the session', async () => {
    await call('/merchants/logout', { method: 'POST' });
    cookie = '';
    const { status } = await call('/merchants/me');
    assert.equal(status, 401);
  });

  await check('a tampered session token is rejected', async () => {
    cookie = 'pay_merchant=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZXJfZmFrZSJ9.not-a-real-signature';
    const { status } = await call('/merchants/me');
    assert.equal(status, 401);
    cookie = '';
  });

  await pool.query('DELETE FROM pay_merchants WHERE email = $1', [TEST_EMAIL]);
  await new Promise((resolve) => server.close(resolve));
  await pool.end();

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    console.log(`failed: ${failures.join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
