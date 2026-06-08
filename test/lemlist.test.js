'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const lemlist = require('../lemlist');

test('lemlist is a no-op (503) when LEMLIST_API_KEY is unset', async () => {
  delete process.env.LEMLIST_API_KEY;
  assert.equal(lemlist.configured(), false);
  await assert.rejects(
    () => lemlist.pushProposalLink({ campaignId: 'c1', email: 'a@b.co', proposalUrl: 'https://x/y' }, () => { throw new Error('fetch should not run'); }),
    (e) => e.status === 503
  );
});

test('pushProposalLink validates inputs', async () => {
  process.env.LEMLIST_API_KEY = 'k';
  try {
    await assert.rejects(() => lemlist.pushProposalLink({ campaignId: '', email: 'a@b.co', proposalUrl: 'u' }, () => {}), (e) => e.status === 400);
    await assert.rejects(() => lemlist.pushProposalLink({ campaignId: 'c1', email: 'not-an-email', proposalUrl: 'u' }, () => {}), (e) => e.status === 400);
  } finally { delete process.env.LEMLIST_API_KEY; }
});

test('pushProposalLink: creates the lead then sets proposalUrl, with Basic auth', async () => {
  process.env.LEMLIST_API_KEY = 'secret-key';
  try {
    const calls = [];
    const fakeFetch = async (url, opts) => {
      calls.push({ url, opts });
      if (/\/campaigns\/.+\/leads\/$/.test(url)) return { ok: true, status: 200, text: async () => JSON.stringify({ _id: 'lead123' }) };
      return { ok: true, status: 200, text: async () => '' }; // variables endpoint
    };
    const res = await lemlist.pushProposalLink({ campaignId: 'camp1', email: 'jane@acme.com', proposalUrl: 'https://buyerverse.onrender.com/page/acme/tok' }, fakeFetch);
    assert.equal(res.leadId, 'lead123');
    assert.equal(calls.length, 2);
    // step 1: create lead in campaign
    assert.match(calls[0].url, /\/api\/campaigns\/camp1\/leads\/$/);
    assert.equal(JSON.parse(calls[0].opts.body).email, 'jane@acme.com');
    // step 2: set the proposalUrl custom variable (URL-encoded query param)
    assert.match(calls[1].url, /\/api\/leads\/lead123\/variables\?proposalUrl=https%3A%2F%2Fbuyerverse/);
    // Basic auth = base64 of ":<key>"
    const expected = 'Basic ' + Buffer.from(':secret-key').toString('base64');
    assert.equal(calls[0].opts.headers.Authorization, expected);
    assert.equal(calls[1].opts.headers.Authorization, expected);
  } finally { delete process.env.LEMLIST_API_KEY; }
});

test('pushProposalLink maps auth/not-found errors', async () => {
  process.env.LEMLIST_API_KEY = 'k';
  try {
    await assert.rejects(
      () => lemlist.pushProposalLink({ campaignId: 'c', email: 'a@b.co', proposalUrl: 'u' }, async () => ({ ok: false, status: 401, text: async () => '' })),
      (e) => e.status === 502 && /authentication failed/.test(e.message)
    );
    await assert.rejects(
      () => lemlist.pushProposalLink({ campaignId: 'c', email: 'a@b.co', proposalUrl: 'u' }, async () => ({ ok: false, status: 404, text: async () => '' })),
      (e) => e.status === 404
    );
  } finally { delete process.env.LEMLIST_API_KEY; }
});
