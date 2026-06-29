/* ============================================================
   Livestorm — Prospect landing page JS
   - Reads PAGE_CONFIG.values for dynamic behaviour
   - Derives: AM initials, CTA href (cal link vs email), hides
     empty optional fields, scroll reveals
   ============================================================ */

(function () {
  'use strict';

  var FALLBACK = {
    first_name: 'Sarah', last_name: 'Chen', title: 'VP of Marketing',
    company: 'Acme Corp', industry: 'SaaS',
    hero_headline: 'The webinar platform built for teams like yours.',
    hero_sub: 'Livestorm helps marketing teams run high-converting webinars, product demos, and virtual events — without the complexity.',
    challenge_1: 'Scattered tools slow down event production',
    challenge_2: 'Low attendee engagement hurts pipeline quality',
    challenge_3: 'Hard to prove event ROI to the business',
    usecase_1_title: 'One platform, every event format',
    usecase_1_desc: 'From registration pages to post-event replays, Livestorm handles every step — no plugins, no downloads, no duct-tape integrations.',
    usecase_2_title: 'Built-in engagement that converts',
    usecase_2_desc: 'Polls, Q&A with upvoting, CTAs, and chat keep your audience active. Every interaction is captured and flows into your CRM automatically.',
    usecase_3_title: 'Analytics that prove ROI',
    usecase_3_desc: 'Attendance rates, engagement scores, replay views — all surfaced in real time and synced to Salesforce or HubSpot.',
    comp_1_name: 'Zoom Webinars', comp_1_gap: 'Built for meetings, not marketing events — limited registration flows and no built-in CRM sync',
    comp_2_name: 'ON24',          comp_2_gap: 'Enterprise-heavy, slow to set up, and expensive — hard to justify for growing teams',
    comp_3_name: 'Demio',         comp_3_gap: 'Limited analytics, no on-demand experience, and weak CRM integrations',
    am_name: 'Alex Martin', am_title: 'Account Executive, Livestorm',
    am_email: 'alex.martin@livestorm.co', cal_link: ''
  };

  var V = (window.PAGE_CONFIG && window.PAGE_CONFIG.values) || FALLBACK;

  /* ---- Helper: HTML-escape for innerHTML use ---- */
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = (s == null) ? '' : String(s);
    return d.innerHTML;
  }

  /* ---- AM avatar initials ---- */
  function initials(name) {
    var parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(function (w) { return w[0] ? w[0].toUpperCase() : ''; }).join('') || '?';
  }

  /* ---- Populate AM avatar ---- */
  var avatarEl = document.getElementById('am-avatar');
  if (avatarEl) { avatarEl.textContent = initials(V.am_name); }

  /* ---- CTA: prefer cal_link, fall back to mailto ---- */
  var calLink = (V.cal_link || '').trim();
  var ctaHref = calLink || ('mailto:' + V.am_email);

  var mainCtaBtn = document.getElementById('main-cta-btn');
  if (mainCtaBtn) { mainCtaBtn.href = ctaHref; }

  var heroCta = document.getElementById('hero-cta-primary');
  if (heroCta) { heroCta.href = ctaHref; }

  /* ---- Competitor table column headers ---- */
  function setTextIfEl(id, text) {
    var el = document.getElementById(id);
    if (el) { el.textContent = text || ''; }
  }
  setTextIfEl('comp1-head', V.comp_1_name);
  setTextIfEl('comp2-head', V.comp_2_name);
  setTextIfEl('comp3-head', V.comp_3_name);

  /* ---- Hide optional cards when their content is empty ---- */
  function hideIfEmpty(cardId, value) {
    if (!value || !String(value).trim()) {
      var card = document.getElementById(cardId);
      if (card) { card.style.display = 'none'; }
    }
  }
  hideIfEmpty('challenge-3-card', V.challenge_3);
  hideIfEmpty('usecase-3-card',   V.usecase_3_title);
  hideIfEmpty('gap-card-1', V.comp_1_name);
  hideIfEmpty('gap-card-2', V.comp_2_name);
  hideIfEmpty('gap-card-3', V.comp_3_name);

  /* ---- Also hide table columns for empty competitors ---- */
  function hideTableCol(headId, colIndex) {
    var head = document.getElementById(headId);
    if (!head || head.textContent.trim()) { return; }
    /* hide all <td>/<th> at colIndex (1-based) in the compare-table */
    var table = document.querySelector('.compare-table');
    if (!table) { return; }
    var rows = table.querySelectorAll('tr');
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll('th, td');
      if (cells[colIndex]) { cells[colIndex].style.display = 'none'; }
    }
  }
  hideTableCol('comp1-head', 2);
  hideTableCol('comp2-head', 3);
  hideTableCol('comp3-head', 4);

  /* ---- Scroll reveal via IntersectionObserver ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(function (el) {
      io.observe(el);
    });
  } else {
    /* Fallback: show everything immediately */
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---- Active nav link on scroll ---- */
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.site-nav a');

  if ('IntersectionObserver' in window && navLinks.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(function (s) { navIO.observe(s); });
  }

})();
