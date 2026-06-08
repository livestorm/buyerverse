'use strict';

/**
 * lemlist integration — push a proposal's share link onto a campaign lead as a
 * custom variable, so an outreach sequence can reference {{proposalUrl}} and
 * every prospect receives their own unguessable proposal URL.
 *
 * No single call sets a custom variable by email, so it's two documented steps:
 *   1. POST /campaigns/{id}/leads/   create/insert the lead, returns its _id
 *   2. POST /leads/{_id}/variables?proposalUrl=...   set the custom variable
 *
 * Auth is HTTP Basic with an empty login and the API key as the password.
 * Entirely no-op (throws 503) unless LEMLIST_API_KEY is set.
 *
 * Required env var:
 *   LEMLIST_API_KEY
 */

const BASE = 'https://api.lemlist.com/api';

/** True iff the lemlist API key is configured. */
function configured() {
  return Boolean(process.env.LEMLIST_API_KEY);
}

function authHeader() {
  return 'Basic ' + Buffer.from(':' + process.env.LEMLIST_API_KEY).toString('base64');
}

/** Map a lemlist HTTP status to a caller-facing error. */
function fail(status) {
  if (status === 401 || status === 403) return Object.assign(new Error('lemlist authentication failed — check LEMLIST_API_KEY'), { status: 502 });
  if (status === 404) return Object.assign(new Error('lemlist campaign or lead not found'), { status: 404 });
  return Object.assign(new Error(`lemlist request failed (HTTP ${status})`), { status: 502 });
}

async function request(method, path, fetchImpl, body) {
  const headers = { Authorization: authHeader() };
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetchImpl(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw fail(res.status);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

/**
 * Add (or insert) a lead into a campaign and set its proposalUrl variable.
 * @param {{campaignId:string,email:string,proposalUrl:string}} args
 * @param {typeof fetch} [fetchImpl=fetch]
 * @returns {Promise<{leadId:string}>}
 */
async function pushProposalLink({ campaignId, email, proposalUrl }, fetchImpl = fetch) {
  if (!configured()) throw Object.assign(new Error('lemlist is not configured'), { status: 503 });
  if (!campaignId || typeof campaignId !== 'string') throw Object.assign(new Error('A lemlist campaign ID is required'), { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) throw Object.assign(new Error('A valid recipient email is required'), { status: 400 });

  // 1) create/insert the lead in the campaign (returns its id)
  const lead = await request('POST', `/campaigns/${encodeURIComponent(campaignId)}/leads/`, fetchImpl, { email });
  const leadId = lead._id || lead.id;
  if (!leadId) throw Object.assign(new Error('lemlist did not return a lead id'), { status: 502 });

  // 2) set the proposalUrl custom variable (query params per the lemlist API)
  await request('POST', `/leads/${encodeURIComponent(leadId)}/variables?proposalUrl=${encodeURIComponent(proposalUrl)}`, fetchImpl);
  return { leadId };
}

module.exports = { configured, pushProposalLink };
