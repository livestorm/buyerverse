'use strict';

/**
 * Outbound activity notifications — optional, off unless configured.
 *
 * Posts a short message to a Slack Incoming Webhook so an account manager
 * hears when a prospect engages with a proposal. Entirely no-op (returns
 * false, never throws) unless SLACK_WEBHOOK_URL is set, so the rest of the
 * app behaves identically with or without it.
 *
 * Required env var:
 *   SLACK_WEBHOOK_URL   https://hooks.slack.com/services/...
 */

/** True iff a notification channel is configured. */
function configured() {
  return Boolean(process.env.SLACK_WEBHOOK_URL);
}

/**
 * Fire-and-forget a message. Resolves true on delivery, false otherwise.
 * Never rejects — callers shouldn't have to guard notifications.
 * @param {string} text
 * @param {typeof fetch} [fetchImpl=fetch]
 * @returns {Promise<boolean>}
 */
async function send(text, fetchImpl = fetch) {
  if (!configured()) return false;
  try {
    const res = await fetchImpl(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(text).slice(0, 500) }),
    });
    return Boolean(res && res.ok);
  } catch (e) {
    return false;
  }
}

/** A prospect opened a proposal for the first time. */
function proposalOpened(slug, prospect, fetchImpl) {
  const who = prospect ? `${prospect} ` : '';
  return send(`👀 Proposal opened — ${who}/page/${slug}`, fetchImpl);
}

module.exports = { configured, send, proposalOpened };
