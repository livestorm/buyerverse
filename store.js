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

    async recordView(slug) {
      await pool.query('UPDATE pages SET views = views + 1, last_viewed = now() WHERE slug = $1', [slug]);
    },

    async remove(slug) {
      const { rowCount } = await pool.query('DELETE FROM pages WHERE slug = $1', [slug]);
      return rowCount > 0;
    }
  };
} else {
  const pages = new Map();

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

    async recordView(slug) {
      const row = pages.get(slug);
      if (row) { row.views = (row.views || 0) + 1; row.last_viewed = new Date(); }
    },

    async remove(slug) {
      return pages.delete(slug);
    }
  };
}

module.exports = store;
