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
          views      BIGINT NOT NULL DEFAULT 0,
          last_viewed TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      // Columns added after the initial release.
      await pool.query('ALTER TABLE pages ADD COLUMN IF NOT EXISTS views BIGINT NOT NULL DEFAULT 0');
      await pool.query('ALTER TABLE pages ADD COLUMN IF NOT EXISTS last_viewed TIMESTAMPTZ');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS page_views (
          slug       TEXT NOT NULL,
          visitor    TEXT NOT NULL,
          viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS page_views_slug_idx ON page_views (slug)');
    },

    async get(slug) {
      const { rows } = await pool.query('SELECT slug, config, views, last_viewed, updated_at FROM pages WHERE slug = $1', [slug]);
      return rows[0] || null;
    },

    async list() {
      const { rows } = await pool.query('SELECT slug, config, views, last_viewed, updated_at FROM pages ORDER BY updated_at DESC');
      return rows;
    },

    async upsert(slug, config) {
      await pool.query(
        `INSERT INTO pages (slug, config) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET config = EXCLUDED.config, updated_at = now()`,
        [slug, JSON.stringify(config)]
      );
    },

    async recordView(slug, visitor) {
      await pool.query('UPDATE pages SET views = views + 1, last_viewed = now() WHERE slug = $1', [slug]);
      await pool.query('INSERT INTO page_views (slug, visitor) VALUES ($1, $2)', [slug, visitor]);
    },

    async stats() {
      const { rows } = await pool.query(
        `SELECT slug,
                COUNT(DISTINCT visitor)::int AS unique,
                COUNT(*) FILTER (WHERE viewed_at > now() - interval '7 days')::int AS last7
         FROM page_views
         GROUP BY slug`
      );
      const map = {};
      for (const r of rows) map[r.slug] = { unique: r.unique, last7: r.last7 };
      return map;
    },

    async remove(slug) {
      await pool.query('DELETE FROM page_views WHERE slug = $1', [slug]);
      const { rowCount } = await pool.query('DELETE FROM pages WHERE slug = $1', [slug]);
      return rowCount > 0;
    }
  };
} else {
  const pages = new Map();
  const events = [];

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

    async upsert(slug, config) {
      const prev = pages.get(slug);
      pages.set(slug, {
        slug, config, updated_at: new Date(),
        views: prev ? prev.views : 0,
        last_viewed: prev ? prev.last_viewed : null
      });
    },

    async recordView(slug, visitor) {
      const row = pages.get(slug);
      if (row) {
        row.views = (row.views || 0) + 1;
        row.last_viewed = new Date();
        events.push({ slug, visitor, viewed_at: new Date() });
      }
    },

    async stats() {
      const map = {};
      const now = new Date();
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      for (const e of events) {
        if (!map[e.slug]) map[e.slug] = { visitors: new Set(), last7: 0 };
        map[e.slug].visitors.add(e.visitor);
        if (e.viewed_at > cutoff) map[e.slug].last7++;
      }
      const result = {};
      for (const [slug, data] of Object.entries(map)) {
        result[slug] = { unique: data.visitors.size, last7: data.last7 };
      }
      return result;
    },

    async remove(slug) {
      // Drop events for this slug
      const idx = events.reduce((acc, e, i) => { if (e.slug === slug) acc.push(i); return acc; }, []);
      for (let i = idx.length - 1; i >= 0; i--) events.splice(idx[i], 1);
      return pages.delete(slug);
    }
  };
}

module.exports = store;
