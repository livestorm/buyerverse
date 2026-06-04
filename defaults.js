'use strict';

/*
 * Default page config — the original Galileo proposal. Used to seed
 * the `galileo` page on first boot and as the reference shape for
 * validation. Keep in sync with the fallback in app.js (the client
 * cannot import this file).
 */

module.exports = {
  GALILEO: {
    prospect: 'Galileo',
    am: {
      name: 'Tiphaine Lemerle',
      email: 'tiphaine.lemerle@livestorm.co'
    },
    kpis: {
      schools: 34,
      users: 589,
      sessions: 1210,
      registrants: 39351,
      attendees: 22263,
      rate: 57,
      nps: 7.7
    },
    pricing: {
      currentAnnual: 120000,
      volumes: [25000, 40000, 60000],
      discounts: [20, 30, 40],
      initial: [120000, 143000, 163000]
    }
  }
};
