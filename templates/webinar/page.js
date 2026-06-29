/* ============================================================
   Livestorm — Webinar invitation
   i18n (FR inline / EN dictionary), scroll reveals,
   count-ups, header state.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Page config adapter ----------
     The server injects { template, values: <flat field values> }.
     Derived values (speaker initials, locale-formatted numbers) are
     computed here, not on the server. */
  var FALLBACK = {
    webinar_title: 'Webinars that actually convert',
    webinar_tagline: 'A 45-minute live session on turning registrations into pipeline.',
    session_date: 'Tuesday, May 6, 2026', session_time: '11:00 AM CET',
    duration_min: 45, seats: 500, language: 'English',
    prospect: 'Acme',
    speaker1_name: 'Jordan Lee', speaker1_role: 'Head of Webinars, Livestorm',
    speaker2_name: 'Sam Rivera', speaker2_role: 'Customer Success Lead, Livestorm',
    stat_attendees: 3000, stat_rating: 4.4, stat_companies: 5000,
    host_name: 'Alex Martin', host_email: 'alex.martin@livestorm.co'
  };
  var V = (window.PAGE_CONFIG && window.PAGE_CONFIG.values) || FALLBACK;

  function initials(name) {
    var parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(function (w) { return w[0] ? w[0].toUpperCase() : ''; }).join('') || '?';
  }

  // String values are interpolated into innerHTML-assigned dictionary
  // strings — escape every one of them.
  function escText(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  var P = escText(V.prospect);
  var DATE = escText(V.session_date);
  var SP1 = escText(V.speaker1_name);
  var SP2 = escText(V.speaker2_name);
  var DUR = parseInt(V.duration_min, 10) || 0;
  var SEATS = parseFloat(V.seats) || 0;
  var RATING = parseFloat(V.stat_rating) || 0;

  var nfEN = new Intl.NumberFormat('en-US');
  var nfEN1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function en(n) { return nfEN.format(n); }
  var nfFR = new Intl.NumberFormat('fr-FR');
  var nfFR1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function fr(n) { return nfFR.format(n); }

  /* ---------- EN dictionary (FR is the inline source of truth) ---------- */
  var EN = {
    'nav.agenda': 'Agenda',
    'nav.speakers': 'Speakers',
    'nav.why': 'Why attend',
    'nav.audience': 'Who it’s for',
    'nav.cta': 'Save my seat',

    'hero.live': 'Live',
    'hero.eyebrow': P + ' × Livestorm · Live webinar',
    'hero.cta1': 'Save my seat',
    'hero.cta2': 'View the agenda',
    'hero.chipDuration': '<strong>' + DUR + '</strong> min',

    'ticket.tag': 'Live webinar',
    'ticket.free': 'Free',
    'ticket.date': 'Date',
    'ticket.time': 'Time',
    'ticket.duration': 'Duration',
    'ticket.durationVal': DUR + ' min',
    'ticket.lang': 'Language',
    'ticket.with': 'With ' + SP1 + ' &amp; ' + SP2,
    'ticket.cta': 'Save my seat',
    'details.seatsNote': 'Only <strong>' + en(SEATS) + '</strong> live seats left — replay sent to everyone who registers.',

    'detail.browser': '100% in-browser — no downloads',
    'detail.interactive': 'Live chat, polls &amp; Q&amp;A',
    'detail.replay': 'Replay available to all registrants',
    'detail.rating': '<strong>' + nfEN1.format(RATING) + '/5</strong> on G2',

    'agenda.kicker': 'Agenda',
    'agenda.title': 'What you’ll <span class="hl">walk away with</span>',
    'agenda.lede': '45 practical minutes, built for the ' + P + ' teams — tactics you can apply at your very next event.',
    'agenda.a1t': 'Frame the business goal',
    'agenda.a1d': 'Pick the right format — demo, training, event — and the success metric that actually matters.',
    'agenda.a2t': 'Fill the room',
    'agenda.a2d': 'Registration pages that convert, automatic reminders and multi-channel promotion.',
    'agenda.a3t': 'Host to engage',
    'agenda.a3d': 'Live chat, polls, Q&amp;A and CTAs that turn an audience into a conversation.',
    'agenda.a4t': 'Repurpose &amp; measure',
    'agenda.a4d': 'Instant replay, AI-generated content and per-attendee data pushed to your CRM.',
    'agenda.a5t': 'Live Q&amp;A',
    'agenda.a5d': 'Bring your questions to our experts — answered live.',
    'agenda.learnKicker': 'You’ll leave with',
    'agenda.l1': 'A clear framework to plan a high-impact webinar',
    'agenda.l2': 'Registration-page templates that convert',
    'agenda.l3': 'A ready-to-use live-engagement checklist',
    'agenda.l4': 'A method to repurpose every session into content',

    'speakers.interlude': 'Your speakers',
    'speakers.kicker': 'The speakers',
    'speakers.title': 'Hosted by webinar experts',

    'why.kicker': 'Why attend',
    'why.title': '45 minutes that earn their place in your calendar',
    'why.w1t': 'Actionable tactics',
    'why.w1d': 'No theory: concrete levers you can put in place at your next event.',
    'why.w2t': 'Live demos',
    'why.w2d': 'See the platform in action — registration, live, engagement and analytics.',
    'why.w3t': 'Your questions, live',
    'why.w3d': 'A dedicated Q&amp;A to talk directly with our experts.',
    'why.w4t': 'Replay guaranteed',
    'why.w4d': 'Can’t make it? The replay lands in your inbox — register anyway.',
    'why.s1': 'customer companies',
    'why.s2': 'live attendees per session',
    'why.s3': 'average rating on G2',
    'why.s4': 'countries',

    'aud.kicker': 'Who it’s for',
    'aud.title': 'Built for teams that make webinars a growth channel',
    'aud.lede': 'Whether you’re launching your first webinar or scaling up, this session is for you.',
    'aud.a1': '<strong>Marketing &amp; Demand Gen</strong> teams',
    'aud.a2': '<strong>Sales &amp; Customer Success</strong> teams',
    'aud.a3': '<strong>Training &amp; Enablement</strong> teams',
    'aud.a4': '<strong>Events &amp; Communications</strong> leads',
    'aud.quote': '“With Livestorm, attendees at our webinars are highly engaged and far more likely to convert thanks to the interactive format. The platform is intuitive and complete — even after a year, not a single technical issue.”',
    'aud.quoteRole': 'Enterprise customer',

    'reg.kicker': 'Save your seat',
    'reg.title': 'Join us live on <span class="hl">' + DATE + '</span>',
    'reg.lede': 'Registration takes seconds. You’ll get your access link and a reminder before we start.',
    'reg.durationVal': DUR + ' min',
    'reg.hostLabel': 'Your contact',
    'reg.btn': 'Save my seat',

    'footer.note': 'Invitation prepared for ' + P + ' — live webinar on ' + DATE
  };

  /* ---------- FR value dictionary ----------
     Server substitutes raw values into FR copy; these keys restore
     French number formatting. Applied once, BEFORE the i18n engine
     snapshots frSource, so FR/EN switching keeps working. */
  var FR_VALUES = {
    'details.seatsNote': 'Plus que <strong>' + fr(SEATS) + '</strong> places en direct — replay envoyé à tous les inscrits.',
    'detail.rating': '<strong>' + nfFR1.format(RATING) + '/5</strong> sur G2'
  };
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (FR_VALUES[key] !== undefined) el.innerHTML = FR_VALUES[key];
  });

  /* ---------- Avatar initials ---------- */
  function setInitials(sel, name) {
    document.querySelectorAll(sel).forEach(function (el) { el.textContent = initials(name); });
  }
  setInitials('[data-sp1-initials]', V.speaker1_name);
  setInitials('[data-sp2-initials]', V.speaker2_name);
  setInitials('[data-host-initials]', V.host_name);

  /* ---------- per-touch overrides (message-match) ---------- */
  var TOUCH = '';
  try { TOUCH = new URLSearchParams(window.location.search).get('utm_content') || ''; } catch (e) {}
  var OVERRIDES = (window.PAGE_CONFIG && window.PAGE_CONFIG.variantOverrides && window.PAGE_CONFIG.variantOverrides[TOUCH]) || {};
  function applyOverrides() {
    if (!TOUCH) return;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (Object.prototype.hasOwnProperty.call(OVERRIDES, key)) el.textContent = OVERRIDES[key];
    });
  }

  /* ---------- i18n engine ---------- */
  var nodes = document.querySelectorAll('[data-i18n]');
  var frSource = new Map();
  nodes.forEach(function (el) { frSource.set(el, el.innerHTML); });
  applyOverrides();

  var currentLang = 'fr';

  function setLang(lang) {
    currentLang = lang;
    nodes.forEach(function (el) {
      if (lang === 'fr') {
        el.innerHTML = frSource.get(el);
      } else {
        var key = el.getAttribute('data-i18n');
        if (EN[key] !== undefined) el.innerHTML = EN[key];
      }
    });
    applyOverrides();
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
    });
    renderCounts(true);
    try { localStorage.setItem('buyerverse-lang', lang); } catch (e) { /* private mode */ }
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang')); });
  });

  /* ---------- Count-ups ---------- */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var countEls = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  var counted = new WeakSet();

  function fmt(el, value) {
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';
    var out = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
    var suffix = el.getAttribute('data-suffix-' + currentLang) || '';
    return out + suffix;
  }

  function renderCounts(finalOnly) {
    countEls.forEach(function (el) {
      if (finalOnly || counted.has(el)) {
        el.textContent = fmt(el, parseFloat(el.getAttribute('data-count')));
      }
    });
  }

  function countUp(el) {
    if (counted.has(el)) return;
    counted.add(el);
    var target = parseFloat(el.getAttribute('data-count'));
    if (reduced) { el.textContent = fmt(el, target); return; }
    var t0 = null, dur = 1200;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(el, target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(el, target);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.querySelectorAll('[data-count]').forEach(countUp);
        if (entry.target.hasAttribute('data-count')) countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
    countEls.forEach(function (el) { counted.add(el); });
    renderCounts(true);
  }

  renderCounts(true);

  /* ---------- Header state ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Restore language ---------- */
  var saved = null;
  try { saved = localStorage.getItem('buyerverse-lang'); } catch (e) { /* private mode */ }
  if (saved === 'en') setLang('en');
})();
