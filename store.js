'use strict';

/*
 * Page storage. Postgres when DATABASE_URL is set (Render), otherwise
 * an in-memory Map so the builder can be developed locally without a
 * database — with the obvious caveat that pages vanish on restart.
 */

const DATABASE_URL = process.env.DATABASE_URL;

let store;

if (DATABASE_URL) {
  const { Pool } = require('pg');
  // Render's internal connection strings (dpg-…-a) don't need TLS;
  // external ones (….render.com) do, with Render-managed certs.
  const ssl = /render\.com/.test(DATABASE_URL) ? { rejectUnauthorized: false } : false;
  const pool = new Pool({ connectionString: DATABASE_URL, ssl });

  store = {
    kind: 'postgres',

    async init() {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS pages (
          slug       TEXT PRIMARY KEY,
          config     JSONB NOT NULL,
          status     TEXT,
          views      BIGINT NOT NULL DEFAULT 0,
          last_viewed TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      // Columns added after the initial release.
      await pool.query('ALTER TABLE pages ADD COLUMN IF NOT EXISTS views BIGINT NOT NULL DEFAULT 0');
      await pool.query('ALTER TABLE pages ADD COLUMN IF NOT EXISTS last_viewed TIMESTAMPTZ');
      await pool.query('ALTER TABLE pages ADD COLUMN IF NOT EXISTS status TEXT');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS page_views (
          slug         TEXT NOT NULL,
          visitor      TEXT NOT NULL,
          utm_source   TEXT,
          utm_medium   TEXT,
          utm_campaign TEXT,
          viewed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS page_views_slug_idx ON page_views (slug)');
      // UTM columns added after page_views shipped.
      await pool.query('ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_source TEXT');
      await pool.query('ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_medium TEXT');
      await pool.query('ALTER TABLE page_views ADD COLUMN IF NOT EXISTS utm_campaign TEXT');
      // Engagement events reported by the public page beacon:
      //   kind='section' (section=id reached), 'dwell' (value=seconds), 'depth' (value=percent)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS page_events (
          slug    TEXT NOT NULL,
          visitor TEXT NOT NULL,
          kind    TEXT NOT NULL,
          section TEXT,
          value   INTEGER,
          at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS page_events_slug_idx ON page_events (slug)');
    },

    async get(slug) {
      // Rows from before the status column existed were already live → 'published'.
      const { rows } = await pool.query("SELECT slug, config, COALESCE(status, 'published') AS status, views, last_viewed, updated_at FROM pages WHERE slug = $1", [slug]);
      return rows[0] || null;
    },

    async list() {
      const { rows } = await pool.query("SELECT slug, config, COALESCE(status, 'published') AS status, views, last_viewed, updated_at FROM pages ORDER BY updated_at DESC");
      return rows;
    },

    async upsert(slug, config, status) {
      await pool.query(
        `INSERT INTO pages (slug, config, status) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET config = EXCLUDED.config, status = EXCLUDED.status, updated_at = now()`,
        [slug, JSON.stringify(config), status || 'draft']
      );
    },

    async recordView(slug, visitor, utm) {
      utm = utm || {};
      const seen = await pool.query('SELECT 1 FROM page_views WHERE slug = $1 AND visitor = $2 LIMIT 1', [slug, visitor]);
      const firstView = seen.rowCount === 0;
      await pool.query('UPDATE pages SET views = views + 1, last_viewed = now() WHERE slug = $1', [slug]);
      await pool.query(
        'INSERT INTO page_views (slug, visitor, utm_source, utm_medium, utm_campaign) VALUES ($1, $2, $3, $4, $5)',
        [slug, visitor, utm.source || null, utm.medium || null, utm.campaign || null]
      );
      return { firstView };
    },

    // Beacon engagement: dedupe section reaches per visitor; dwell/depth append.
    // Returns the sections newly reached by this visitor (for activity notifications).
    async recordEngagement(slug, visitor, p) {
      p = p || {};
      const sections = Array.isArray(p.sections) ? p.sections : [];
      let newSections = [];
      if (sections.length) {
        const ex = await pool.query("SELECT DISTINCT section FROM page_events WHERE slug = $1 AND visitor = $2 AND kind = 'section'", [slug, visitor]);
        const had = new Set(ex.rows.map(r => r.section));
        newSections = sections.filter(s => !had.has(s));
        for (const s of newSections) {
          await pool.query("INSERT INTO page_events (slug, visitor, kind, section) VALUES ($1, $2, 'section', $3)", [slug, visitor, s]);
        }
      }
      if (Number.isFinite(p.dwell)) await pool.query("INSERT INTO page_events (slug, visitor, kind, value) VALUES ($1, $2, 'dwell', $3)", [slug, visitor, p.dwell]);
      if (Number.isFinite(p.depth)) await pool.query("INSERT INTO page_events (slug, visitor, kind, value) VALUES ($1, $2, 'depth', $3)", [slug, visitor, p.depth]);
      return { newSections };
    },

    async stats() {
      const blank = () => ({ unique: 0, last7: 0, sources: {}, dwell: 0, depth: 0, sections: {} });
      const map = {};
      const { rows } = await pool.query(
        `SELECT slug,
                COUNT(DISTINCT visitor)::int AS unique,
                COUNT(*) FILTER (WHERE viewed_at > now() - interval '7 days')::int AS last7
         FROM page_views
         GROUP BY slug`
      );
      for (const r of rows) { map[r.slug] = blank(); map[r.slug].unique = r.unique; map[r.slug].last7 = r.last7; }
      // Per-source breakdown (utm_source; blank/absent → "(direct)").
      const src = await pool.query(
        `SELECT slug, COALESCE(NULLIF(utm_source, ''), '(direct)') AS src, COUNT(*)::int AS c
         FROM page_views GROUP BY slug, src`
      );
      for (const r of src.rows) { (map[r.slug] || (map[r.slug] = blank())).sources[r.src] = r.c; }
      // Engagement: distinct visitors per section + avg of per-visitor max dwell/depth.
      const sec = await pool.query("SELECT slug, section, COUNT(DISTINCT visitor)::int AS c FROM page_events WHERE kind = 'section' AND section IS NOT NULL GROUP BY slug, section");
      for (const r of sec.rows) { (map[r.slug] || (map[r.slug] = blank())).sections[r.section] = r.c; }
      const dwell = await pool.query("SELECT slug, AVG(mx)::int AS v FROM (SELECT slug, visitor, MAX(value) AS mx FROM page_events WHERE kind = 'dwell' GROUP BY slug, visitor) q GROUP BY slug");
      for (const r of dwell.rows) { (map[r.slug] || (map[r.slug] = blank())).dwell = r.v; }
      const depth = await pool.query("SELECT slug, AVG(mx)::int AS v FROM (SELECT slug, visitor, MAX(value) AS mx FROM page_events WHERE kind = 'depth' GROUP BY slug, visitor) q GROUP BY slug");
      for (const r of depth.rows) { (map[r.slug] || (map[r.slug] = blank())).depth = r.v; }
      return map;
    },

    async remove(slug) {
      await pool.query('DELETE FROM page_views WHERE slug = $1', [slug]);
      await pool.query('DELETE FROM page_events WHERE slug = $1', [slug]);
      const { rowCount } = await pool.query('DELETE FROM pages WHERE slug = $1', [slug]);
      return rowCount > 0;
    }
  };
} else {
  const pages = new Map();
  const events = [];
  const engagementEvents = []; // { slug, visitor, kind, section, value }

  store = {
    kind: 'memory',

    async init() {
      console.warn('store: DATABASE_URL not set — using in-memory storage (pages are lost on restart)');
    },

    async get(slug) {
      return pages.get(slug) || null;
    },

    async list() {
      return Array.from(pages.values()).sort((a, b) => b.updated_at - a.updated_at);
    },

    async upsert(slug, config, status) {
      const prev = pages.get(slug);
      pages.set(slug, {
        slug, config, status: status || 'draft', updated_at: new Date(),
        views: prev ? prev.views : 0,
        last_viewed: prev ? prev.last_viewed : null
      });
    },

    async recordView(slug, visitor, utm) {
      const row = pages.get(slug);
      if (!row) return { firstView: false };
      const firstView = !events.some(e => e.slug === slug && e.visitor === visitor);
      row.views = (row.views || 0) + 1;
      row.last_viewed = new Date();
      events.push({ slug, visitor, viewed_at: new Date(), utm: utm || {} });
      return { firstView };
    },

    async recordEngagement(slug, visitor, p) {
      p = p || {};
      const sections = Array.isArray(p.sections) ? p.sections : [];
      const had = new Set(engagementEvents.filter(e => e.slug === slug && e.visitor === visitor && e.kind === 'section').map(e => e.section));
      const newSections = sections.filter(s => !had.has(s));
      for (const s of newSections) engagementEvents.push({ slug, visitor, kind: 'section', section: s });
      if (Number.isFinite(p.dwell)) engagementEvents.push({ slug, visitor, kind: 'dwell', value: p.dwell });
      if (Number.isFinite(p.depth)) engagementEvents.push({ slug, visitor, kind: 'depth', value: p.depth });
      return { newSections };
    },

    async stats() {
      const map = {};
      const now = new Date();
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      for (const e of events) {
        if (!map[e.slug]) map[e.slug] = { visitors: new Set(), last7: 0, sources: {} };
        map[e.slug].visitors.add(e.visitor);
        if (e.viewed_at > cutoff) map[e.slug].last7++;
        const src = (e.utm && e.utm.source) || '(direct)';
        map[e.slug].sources[src] = (map[e.slug].sources[src] || 0) + 1;
      }
      const result = {};
      for (const [slug, data] of Object.entries(map)) {
        result[slug] = { unique: data.visitors.size, last7: data.last7, sources: data.sources, dwell: 0, depth: 0, sections: {} };
      }
      // Engagement: distinct visitors per section + avg of per-visitor max dwell/depth.
      const ensure = (slug) => (result[slug] || (result[slug] = { unique: 0, last7: 0, sources: {}, dwell: 0, depth: 0, sections: {} }));
      const secVisitors = {};       // slug -> section -> Set(visitor)
      const maxByVisitor = {};      // kind -> slug -> visitor -> max value
      for (const e of engagementEvents) {
        if (e.kind === 'section') {
          ((secVisitors[e.slug] = secVisitors[e.slug] || {})[e.section] = secVisitors[e.slug][e.section] || new Set()).add(e.visitor);
        } else if (e.kind === 'dwell' || e.kind === 'depth') {
          const k = maxByVisitor[e.kind] = maxByVisitor[e.kind] || {};
          const s = k[e.slug] = k[e.slug] || {};
          s[e.visitor] = Math.max(s[e.visitor] || 0, e.value);
        }
      }
      for (const [slug, secs] of Object.entries(secVisitors)) {
        const m = ensure(slug);
        for (const [sec, set] of Object.entries(secs)) m.sections[sec] = set.size;
      }
      const avg = (obj) => { const v = Object.values(obj); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; };
      for (const [slug, byV] of Object.entries(maxByVisitor.dwell || {})) ensure(slug).dwell = avg(byV);
      for (const [slug, byV] of Object.entries(maxByVisitor.depth || {})) ensure(slug).depth = avg(byV);
      return result;
    },

    async remove(slug) {
      // Drop events for this slug
      const idx = events.reduce((acc, e, i) => { if (e.slug === slug) acc.push(i); return acc; }, []);
      for (let i = idx.length - 1; i >= 0; i--) events.splice(idx[i], 1);
      const eidx = engagementEvents.reduce((acc, e, i) => { if (e.slug === slug) acc.push(i); return acc; }, []);
      for (let i = eidx.length - 1; i >= 0; i--) engagementEvents.splice(eidx[i], 1);
      return pages.delete(slug);
    }
  };
}

module.exports = store;
