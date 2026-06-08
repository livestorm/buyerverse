'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const notify = require('../notify');

test('notify is a no-op when SLACK_WEBHOOK_URL is unset', async () => {
  delete process.env.SLACK_WEBHOOK_URL;
  assert.equal(notify.configured(), false);
  // fetch must not be called when unconfigured
  const ok = await notify.send('hi', () => { throw new Error('fetch should not run'); });
  assert.equal(ok, false);
});

test('notify posts to the webhook when configured', async () => {
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/TEST';
  try {
    let captured = null;
    const fakeFetch = async (url, opts) => { captured = { url, opts }; return { ok: true }; };
    assert.equal(notify.configured(), true);
    assert.equal(await notify.proposalOpened('acme', 'Acme', fakeFetch), true);
    assert.equal(captured.url, 'https://hooks.slack.com/services/TEST');
    const payload = JSON.parse(captured.opts.body);
    assert.match(payload.text, /Acme/);
    assert.match(payload.text, /\/page\/acme/);
  } finally {
    delete process.env.SLACK_WEBHOOK_URL;
  }
});

test('notify.send swallows transport errors (never throws)', async () => {
  process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/TEST';
  try {
    assert.equal(await notify.send('x', async () => { throw new Error('network'); }), false);
    assert.equal(await notify.send('x', async () => ({ ok: false })), false);
  } finally {
    delete process.env.SLACK_WEBHOOK_URL;
  }
});
