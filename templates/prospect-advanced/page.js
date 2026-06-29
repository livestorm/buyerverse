/* ============================================================
   Prospect — Mature events program
   ============================================================ */
(function () {
  'use strict';

  var FALLBACK = {
    first_name: 'Sarah', last_name: 'Chen', title: 'VP of Marketing',
    company: 'Acme Corp', industry: 'SaaS',
    current_platform: '', crm: '', observation: '',
    pain_1: 'Hard to attribute revenue to specific events or sessions',
    pain_2: '',
    am_name: 'Alex Martin', am_title: 'Account Executive, Livestorm',
    am_email: 'alex.martin@livestorm.co', cal_link: ''
  };
  var V = (window.PAGE_CONFIG && window.PAGE_CONFIG.values) || FALLBACK;

  function initials(name) {
    return String(name).trim().split(/\s+/).slice(0,2)
      .map(function(w){ return w[0] ? w[0].toUpperCase() : ''; }).join('') || '?';
  }
  function hide(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }
  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text || ''; }

  /* Optional fields */
  if (!(V.observation || '').trim()) { hide('observation-block'); }
  if (!(V.pain_2 || '').trim())      { hide('pain-item-2'); }

  /* CRM-specific note in data section */
  var crm = (V.crm || '').trim();
  if (crm) {
    var noteEl = document.getElementById('crm-note');
    var crmInline = document.getElementById('crm-name-inline');
    if (noteEl && crmInline) {
      crmInline.textContent = crm;
      noteEl.style.display = 'block';
    }
  }

  /* Current platform in hero sub */
  var platform = (V.current_platform || '').trim();
  if (platform) {
    var subEl = document.getElementById('hero-sub-text');
    if (subEl) {
      subEl.textContent = 'You\'ve solved the production problem on ' + platform + ' — you\'re running events, repurposing content, building an audience. The next conversation is about revenue attribution. What specifically did your events program contribute to pipeline last quarter? Most teams at this stage can\'t answer that precisely. That\'s usually a data and integration problem, not a measurement problem.';
    }
  }

  /* AM avatar */
  setText('am-avatar', initials(V.am_name));
  setText('hero-avatar', initials(V.am_name));

  /* CTA href */
  var ctaHref = (V.cal_link || '').trim() || ('mailto:' + V.am_email);
  ['main-cta', 'hero-cta'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.href = ctaHref;
  });

  /* Scroll reveals */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('in'); });
  }

  /* Header stuck state */
  var hdr = document.querySelector('.site-header');
  function onScroll() { if (hdr) hdr.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Active nav */
  var links = document.querySelectorAll('.site-nav a');
  if ('IntersectionObserver' in window && links.length) {
    var nIO = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          var id = e.target.id;
          links.forEach(function(a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('section[id]').forEach(function(s) { nIO.observe(s); });
  }

})();
