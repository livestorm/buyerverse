'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The three required env vars. */
const SF_VARS = ['SF_LOGIN_URL', 'SF_CLIENT_ID', 'SF_CLIENT_SECRET'];

/** Set all three SF env vars to dummy values. */
function setSFEnv() {
  process.env.SF_LOGIN_URL = 'https://login.salesforce.example.com';
  process.env.SF_CLIENT_ID = 'test-client-id';
  process.env.SF_CLIENT_SECRET = 'test-client-secret';
}

/** Delete all three SF env vars. */
function clearSFEnv() {
  for (const k of SF_VARS) delete process.env[k];
}

/**
 * Build a fake fetch that:
 *  - Returns a token JSON for URLs containing `/oauth2/token`
 *  - Returns the given query result JSON for URLs containing `/query`
 *
 * @param {object} queryRecordsOrBody  The `records` array (or full body object) to return for query calls.
 * @returns {{ fake: Function, calls: Array<{ url: string, init: object }> }}
 */
function makeFakeFetch(queryRecordsOrBody) {
  const calls = [];
  const queryBody = Array.isArray(queryRecordsOrBody)
    ? { records: queryRecordsOrBody }
    : queryRecordsOrBody;

  const fake = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.includes('/oauth2/token')) {
      return {
        ok: true,
        json: async () => ({
          access_token: 'fake-access-token',
          instance_url: 'https://instance.salesforce.example.com',
        }),
      };
    }
    if (url.includes('/query')) {
      return {
        ok: true,
        json: async () => queryBody,
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };

  return { fake, calls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Ensure env is clean before each test group.
clearSFEnv();

// We require the module fresh; node:test runs this file in its own process so
// module cache is isolated from the rest of the test suite.
const { configured, lookup } = require('../salesforce');

test('configured() returns false when env vars are absent', () => {
  clearSFEnv();
  assert.equal(configured(), false);
});

test('configured() returns true when all three env vars are set', () => {
  setSFEnv();
  try {
    assert.equal(configured(), true);
  } finally {
    clearSFEnv();
  }
});

test('lookup throws {status:503} when not configured', async () => {
  clearSFEnv();
  const id = '001000000000001AAA'; // valid Account id
  await assert.rejects(
    () => lookup(id),
    (err) => {
      assert.equal(err.status, 503);
      assert.match(err.message, /not configured/i);
      return true;
    }
  );
});

test('Account lookup returns correct prefill values', async () => {
  setSFEnv();
  try {
    const id = '001000000000001AAA'; // 18-char, starts with 001
    const { fake, calls } = makeFakeFetch([
      { Name: 'Acme', Owner: { Name: 'Alex Martin', Email: 'alex@livestorm.co' } },
    ]);

    const result = await lookup(id, fake);

    assert.deepEqual(result.values, {
      prospect: 'Acme',
      am_name: 'Alex Martin',
      am_email: 'alex@livestorm.co',
    });

    // First call must be the token endpoint
    assert.ok(calls[0].url.includes('/oauth2/token'), 'first call is token endpoint');
    assert.equal(calls[0].init.method, 'POST');

    // Second call must be the query endpoint with Bearer header
    assert.ok(calls[1].url.includes('/query'), 'second call is query endpoint');
    assert.ok(calls[1].url.includes(encodeURIComponent('Account')), 'SOQL targets Account');
    assert.equal(calls[1].init.headers.Authorization, 'Bearer fake-access-token');
  } finally {
    clearSFEnv();
  }
});

test('Contact lookup returns correct prefill values', async () => {
  setSFEnv();
  try {
    const id = '003000000000001AAA'; // 18-char, starts with 003
    const { fake } = makeFakeFetch([
      { Account: { Name: 'Globex' }, Owner: { Name: 'Sam Lee', Email: 'sam@livestorm.co' } },
    ]);

    const result = await lookup(id, fake);

    assert.deepEqual(result.values, {
      prospect: 'Globex',
      am_name: 'Sam Lee',
      am_email: 'sam@livestorm.co',
    });
  } finally {
    clearSFEnv();
  }
});

test('lookup throws {status:400} for a bad (too short) id', async () => {
  setSFEnv();
  try {
    await assert.rejects(
      () => lookup('nope', makeFakeFetch([]).fake),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /invalid salesforce id/i);
        return true;
      }
    );
  } finally {
    clearSFEnv();
  }
});

test('lookup throws {status:400} for an unsupported id prefix', async () => {
  setSFEnv();
  try {
    // 15-char id starting with "500" — valid format, unsupported object type
    const id = '500000000000001';
    await assert.rejects(
      () => lookup(id, makeFakeFetch([]).fake),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /unsupported salesforce object/i);
        return true;
      }
    );
  } finally {
    clearSFEnv();
  }
});

test('lookup throws {status:404} when query returns zero records', async () => {
  setSFEnv();
  try {
    const id = '001000000000001AAA';
    const { fake } = makeFakeFetch([]);

    await assert.rejects(
      () => lookup(id, fake),
      (err) => {
        assert.equal(err.status, 404);
        assert.match(err.message, /not found/i);
        return true;
      }
    );
  } finally {
    clearSFEnv();
  }
});

test('lookup omits fields that are null/undefined on the record', async () => {
  setSFEnv();
  try {
    const id = '001000000000001AAA';
    // Owner is null → am_name and am_email should be absent
    const { fake } = makeFakeFetch([
      { Name: 'Acme', Owner: null },
    ]);

    const result = await lookup(id, fake);

    assert.deepEqual(result.values, { prospect: 'Acme' });
    assert.ok(!('am_name' in result.values), 'am_name should be absent');
    assert.ok(!('am_email' in result.values), 'am_email should be absent');
  } finally {
    clearSFEnv();
  }
});
