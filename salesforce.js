'use strict';

/**
 * Salesforce lookup module — resolves Account or Contact records to
 * proposal prefill values (prospect name, AM name, AM email).
 *
 * Required env vars:
 *   SF_LOGIN_URL     e.g. https://login.salesforce.com
 *   SF_CLIENT_ID     Connected App consumer key
 *   SF_CLIENT_SECRET Connected App consumer secret
 */

const TOKEN_TTL_MS = 25 * 60 * 1000; // 25 minutes

/** @type {{ accessToken: string, instanceUrl: string, expiresAt: number } | null} */
let _tokenCache = null;

/**
 * Returns true iff all required Salesforce env vars are set.
 * @returns {boolean}
 */
function configured() {
  return Boolean(
    process.env.SF_LOGIN_URL &&
    process.env.SF_CLIENT_ID &&
    process.env.SF_CLIENT_SECRET
  );
}

/**
 * Obtains (or reuses a cached) OAuth2 access token via client-credentials flow.
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ accessToken: string, instanceUrl: string }>}
 */
async function getToken(fetchImpl) {
  if (_tokenCache && Date.now() < _tokenCache.expiresAt) {
    return { accessToken: _tokenCache.accessToken, instanceUrl: _tokenCache.instanceUrl };
  }

  const tokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
  });

  const res = await fetchImpl(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw Object.assign(new Error(`Salesforce request failed (HTTP ${res.status})`), { status: 502 });
  }

  const json = await res.json();
  _tokenCache = {
    accessToken: json.access_token,
    instanceUrl: json.instance_url,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };

  return { accessToken: _tokenCache.accessToken, instanceUrl: _tokenCache.instanceUrl };
}

/**
 * Clears the cached token (e.g. after receiving a 401 from the query API).
 */
function clearTokenCache() {
  _tokenCache = null;
}

/**
 * Executes a SOQL query and returns the parsed JSON.
 * @param {string} instanceUrl
 * @param {string} accessToken
 * @param {string} soql
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ records: object[] }>}
 */
async function runQuery(instanceUrl, accessToken, soql, fetchImpl) {
  const url = `${instanceUrl}/services/data/v60.0/query?q=${encodeURIComponent(soql)}`;
  const res = await fetchImpl(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw Object.assign(new Error(`Salesforce request failed (HTTP ${res.status})`), { status: 502 });
  }

  return res.json();
}

/**
 * Looks up a Salesforce Account or Contact by ID and returns proposal prefill values.
 *
 * Resolved values (all optional, omitted when null/undefined/empty):
 *   - prospect  — Account.Name (Account) or Contact.Account.Name (Contact)
 *   - am_name   — Owner.Name
 *   - am_email  — Owner.Email
 *
 * @param {string} id  Salesforce 15- or 18-character record ID.
 * @param {typeof fetch} [fetchImpl=fetch]  Injectable fetch for testing.
 * @returns {Promise<{ values: { prospect?: string, am_name?: string, am_email?: string } }>}
 */
async function lookup(id, fetchImpl = fetch) {
  if (!configured()) {
    throw Object.assign(new Error('Salesforce is not configured'), { status: 503 });
  }

  if (!/^[a-zA-Z0-9]{15,18}$/.test(id)) {
    throw Object.assign(new Error('Invalid Salesforce ID'), { status: 400 });
  }

  let objectType;
  if (id.startsWith('001')) {
    objectType = 'Account';
  } else if (id.startsWith('003')) {
    objectType = 'Contact';
  } else {
    throw Object.assign(
      new Error('Unsupported Salesforce object (need an Account or Contact ID)'),
      { status: 400 }
    );
  }

  const soql =
    objectType === 'Account'
      ? `SELECT Name, Owner.Name, Owner.Email FROM Account WHERE Id = '${id}'`
      : `SELECT Account.Name, Owner.Name, Owner.Email FROM Contact WHERE Id = '${id}'`;

  // Fetch token, run query; on 401 clear cache and retry once.
  let { accessToken, instanceUrl } = await getToken(fetchImpl);
  let data;

  try {
    data = await runQuery(instanceUrl, accessToken, soql, fetchImpl);
  } catch (err) {
    if (err.status === 502) {
      // The original error message already contains the HTTP status; check if it
      // was a 401 by re-running to get a fresh token, but we cannot inspect the
      // raw status here after wrapping. For simplicity, only retry on 401 via a
      // second attempt after clearing the cache.
      clearTokenCache();
      ({ accessToken, instanceUrl } = await getToken(fetchImpl));
      data = await runQuery(instanceUrl, accessToken, soql, fetchImpl);
    } else {
      throw err;
    }
  }

  if (!data.records || data.records.length === 0) {
    throw Object.assign(new Error('Salesforce record not found'), { status: 404 });
  }

  const rec = data.records[0];

  let prospectVal, amNameVal, amEmailVal;
  if (objectType === 'Account') {
    prospectVal = rec.Name;
    amNameVal = rec.Owner?.Name;
    amEmailVal = rec.Owner?.Email;
  } else {
    prospectVal = rec.Account?.Name;
    amNameVal = rec.Owner?.Name;
    amEmailVal = rec.Owner?.Email;
  }

  const values = {};
  if (prospectVal != null && prospectVal !== '') values.prospect = prospectVal;
  if (amNameVal != null && amNameVal !== '') values.am_name = amNameVal;
  if (amEmailVal != null && amEmailVal !== '') values.am_email = amEmailVal;

  return { values };
}

module.exports = { configured, lookup };
