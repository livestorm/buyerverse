/* ============================================================
   Livestorm — i18n (FR inline / EN dictionary),
   scroll reveals, KPI count-ups, header state.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Page config adapter ----------
     The server injects { template, values: <flat field values> }.
     Rebuild the structured CFG the dictionaries below consume; derived
     values (price rows, initials) are computed here, not on the server. */
  var FALLBACK = {
    prospect: 'Acme', am_name: 'Alex Martin', am_email: 'alex.martin@livestorm.co',
    kpi_schools: 30, kpi_users: 600, kpi_sessions: 1200, kpi_registrants: 40000,
    kpi_attendees: 22000, kpi_rate: 55, kpi_nps: 8,
    price_current: 120000, vol_1: 25000, vol_2: 40000, vol_3: 60000,
    price_1: 120000, price_2: 143000, price_3: 163000,
    discount_1: 20, discount_2: 30, discount_3: 40
  };
  var V = (window.PAGE_CONFIG && window.PAGE_CONFIG.values) || FALLBACK;

  function initials(name) {
    var parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(function (w) { return w[0] ? w[0].toUpperCase() : ''; }).join('') || '?';
  }

  var discounts = [V.discount_1, V.discount_2, V.discount_3];
  var initial = [V.price_1, V.price_2, V.price_3];
  var CFG = {
    prospect: V.prospect,
    am: { name: V.am_name, email: V.am_email, initials: initials(V.am_name) },
    kpis: { schools: V.kpi_schools, users: V.kpi_users, sessions: V.kpi_sessions,
            registrants: V.kpi_registrants, attendees: V.kpi_attendees,
            rate: V.kpi_rate, nps: V.kpi_nps },
    pricing: {
      currentAnnual: V.price_current,
      volumes: [V.vol_1, V.vol_2, V.vol_3],
      discounts: discounts,
      initial: initial,
      rows: discounts.map(function (d) {
        return initial.map(function (p) { return Math.round(p * (1 - d / 100)); });
      })
    }
  };

  var nfEN = new Intl.NumberFormat('en-US');
  var nfEN1 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function en(n) { return nfEN.format(n); }
  function eur(n) { return '€' + nfEN.format(n) + ' <em>/ yr</em>'; }

  // P is interpolated into innerHTML-assigned dictionary strings — escape it.
  function escText(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  var P = escText(CFG.prospect);
  var PR = CFG.pricing;

  /* ---------- EN dictionary (FR is the inline source of truth) ---------- */
  var EN = {
    'nav.partnership': 'Partnership',
    'nav.results': 'Results',
    'nav.why': 'Why Livestorm',
    'nav.offer': '2026 Offer',
    'nav.cta': 'Book a slot',

    'hero.eyebrow': P + ' × Livestorm · 2026 Renewal',
    'hero.title': 'Six years of <span class="grad">growth together</span>.<br>Ready for what’s next?',
    'hero.sub': 'Europe’s leading webinar platform helps ' + P + ' schools attract, convert and engage students — from registration to replay, all in one place.',
    'hero.cta1': 'Book a slot',
    'hero.cta2': 'Explore the 2026 offer',
    'hero.chip1': '<strong>' + en(CFG.kpis.attendees) + '</strong> attendees in 2025',
    'hero.chip2': '<strong>' + en(CFG.kpis.schools) + '</strong> schools supported',
    'hero.chip3': 'NPS <strong>' + nfEN1.format(CFG.kpis.nps) + '</strong>',

    'trust.g2': '<strong>4.4/5</strong> · 1,000+ G2 reviews',
    'trust.iso': 'ISO 27001 &amp; Cybervadis',
    'trust.gdpr': 'GDPR compliant',
    'trust.uptime': '<strong>99.98%</strong> uptime',
    'trust.customers': '<strong>5,000+</strong> customers',
    'trust.label': 'Trusted by',

    'rel.kicker': 'The partnership',
    'rel.title': 'A partnership built to last',
    'rel.lede': 'For almost <strong>6 years</strong> we’ve been working together to optimise your operations — attracting and converting students across your schools, and much more.',
    'rel.sixCaption': 'years working together',
    'rel.uc1t': 'Pre-enrolment',
    'rel.uc1d': 'Admissions sessions, virtual open days, training sessions (CVs, interviews…)',
    'rel.uc2t': 'In school',
    'rel.uc2d': 'Remote teaching sessions.',
    'rel.uc3t': 'Community',
    'rel.uc3d': 'Community engagement (e.g. Elephorm).',
    'rel.uc4t': 'Internal comms',
    'rel.uc4d': 'Announcements, themed days, and more.',
    'rel.growthTitle': 'A growing partnership 🚀',
    'rel.growthSub': 'Attendees per year — more schools and more students on board, every year.',
    'rel.g2021': '8,818',
    'rel.g2022': '6,888',
    'rel.g2023': '13,236',
    'rel.g2024': '17,160',
    'rel.g2025': '22,268',
    'rel.g2026': '3,985',
    'rel.gNow': 'to date',

    'res.kicker': '2025 — Key figures',
    'res.title': 'Results that speak for themselves',
    'res.k1': 'Schools',
    'res.k2': P + ' users',
    'res.k3': 'Sessions',
    'res.k4': 'Registrants',
    'res.k5': 'Attendees',
    'res.k6': 'Attendance rate',
    'res.schoolsTitle': 'Schools with the most attendees',
    'res.s1': '7,100',
    'res.s2': '3,700',
    'res.s3': '1,850',
    'res.s4': '1,480',
    'res.s5': '1,330',
    'res.s6': '1,230',
    'res.s7': '1,210',
    'res.s8': '1,190',
    'res.npsKicker': 'Increasingly positive feedback',
    'res.npsNote': '(average across 57 users)',
    'res.f1': 'Tool reliability',
    'res.f2': 'Product improvements',
    'res.f3': 'Onboarding of new schools',
    'res.f4': 'Users at ease with the tool',

    'why.interlude': 'Why Livestorm',
    'why.value': 'We help you <span class="hl">create the best webinar experience</span> for hosts, speakers and attendees — to drive the <span class="hl">maximum business results</span>.',
    'why.st1': 'Clients',
    'why.st2y': 'yrs',
    'why.st2': 'Founded in 2016',
    'why.st3': 'Employees',
    'why.st4': 'Countries',
    'why.platformTitle': 'An end-to-end platform',
    'why.platformLede': 'We’re <span class="hl">not just another video-conferencing tool</span>: from promotion to live to repurposing your content — everything, in one place.',
    'why.p1t': 'Registration',
    'why.p1a': 'Optimised registration pages',
    'why.p1b': 'Automatic confirmation',
    'why.p1c': 'Scheduled reminders',
    'why.p2t': 'Live',
    'why.p2a': '100% in-browser, no downloads',
    'why.p2b': 'Up to 3,000 attendees',
    'why.p2c': 'Live &amp; semi-live events',
    'why.p3t': 'Engagement',
    'why.p3a': 'Chat, polls, Q&amp;A upvoting',
    'why.p3b': 'Real-time CTAs',
    'why.p3c': 'Handouts &amp; breakout rooms',
    'why.p4t': 'Repurposing &amp; Replay',
    'why.p4a': 'Instant recording',
    'why.p4b': 'AI turns it into ready-to-publish content',
    'why.p5t': 'Analytics',
    'why.p5a': 'Granular per-attendee data: attendance, interactions, clicks',
    'why.p5b': 'Livestorm MCP: instant AI-powered insights',
    'why.appTitle': 'Our approach',
    'why.appLede': 'A webinar isn’t as simple as it looks. As experts, we optimise every step of your funnel to build a true <span class="hl">growth engine</span>.',
    'why.a1t': 'Plan',
    'why.a1d': 'Coaching, content, preparation',
    'why.a2t': 'Promote',
    'why.a2d': 'Optimised registration pages',
    'why.a3t': 'Host',
    'why.a3d': 'Live engagement tools',
    'why.a4t': 'Analyse',
    'why.a4d': 'Data to improve continuously',
    'why.cycleCenter': 'Audience growth<br>→ Lead generation',

    'pil.kicker': 'Our pillars',
    'pil.title': 'Five reasons to keep going together',
    'pil.p1t': 'Effortless execution',
    'pil.p1d': 'Create webinars in seconds and invite your team and partners with ease. <span class="hl">No downloads</span>: click the link, you’re live.',
    'pil.p1s1': 'higher attendance',
    'pil.p1s2': 'time saved with Livestorm',
    'pil.p2t': 'Maximum business impact',
    'pil.p2d': 'Every event becomes a conversation — and above all, a conversion 💰',
    'pil.p2f1': 'Live chat',
    'pil.p2f2': 'Q&amp;A with upvotes',
    'pil.p2f3': 'Advanced polls',
    'pil.p2f4': 'CTAs',
    'pil.p2f5': 'Breakout rooms&nbsp;*',
    'pil.p2ai': 'A Livestorm event doesn’t stop when you switch off the camera: AI turns it into high-impact content for all your channels.',
    'pil.p2note': '* Feature being deprecated, but kept fully operational for ' + P + '.',
    'pil.p3t': 'An integrated solution',
    'pil.p3d': 'Collect your audience’s key data and <span class="hl">send it instantly to your Sales &amp; Marketing tools</span> to optimise conversions even further.',
    'pil.p4t': 'Trusted advisors',
    'pil.p4d': 'A dedicated team of <strong>20 experts</strong>, with a <span class="hl">named Customer Success Manager</span>. Support in French and English, across all your time zones. Contractual SLAs.',
    'pil.p5t': 'Security &amp; reliability',
    'pil.p5a': 'Maximum security — <strong>ISO 27001 &amp; Cybervadis</strong>',
    'pil.p5b': 'Your data protected — <strong>GDPR</strong>',
    'pil.p5c': 'A smooth experience for up to <strong>3,000 live attendees</strong>',
    'pil.p5d': 'Rock-solid stability: <strong>99.98% uptime</strong>',
    'pil.quote': '“With Livestorm, attendees at our demo webinars are highly engaged. They’re also more likely to convert thanks to the highly interactive format. Livestorm is a very intuitive, complete platform. Even after a year, I still haven’t run into a single technical issue — it’s very reliable.”',
    'pil.quoteRole': 'Enterprise customer',

    'offer.interlude': '2026 Renewal',
    'offer.kicker': 'Before / After',
    'offer.title': 'A new offer, built for your growth',
    'offer.beforeTag': 'Current contract — €' + en(Math.round(PR.currentAnnual / 1000)) + 'K / year',
    'offer.b1': '<strong>Registrant-based</strong> pricing (annual pack, counted monthly)',
    'offer.b2': 'Team members attending events are <strong>counted as registrants</strong>',
    'offer.b3': '<strong>34 schools on contract</strong> — extra fees to add new schools',
    'offer.afterTag': 'New proposal',
    'offer.a1': '<strong>Attendee-based</strong> pricing → no more double counting; you pay for neither no-shows nor emails already in your base',
    'offer.a2': '<strong>Team members no longer count</strong> against your consumption',
    'offer.a3': '<strong>Unlimited workspaces</strong>, at no extra cost',
    'offer.ultTitle': 'Enterprise Ultimate plan',
    'offer.u1': '<strong>34</strong> Livestorm workspaces',
    'offer.u2': '<strong>58,000</strong> active-contact credits over the year',
    'offer.u3': 'Unlimited events',
    'offer.u4': '<strong>36h</strong> of 1-to-1 or group services (+ 4 Business Reviews)',
    'offer.u5': 'VIP support &amp; SLA',
    'offer.u6': 'RTMP streaming',
    'offer.u7': 'Up to 12h per event',
    'offer.u8': 'Up to 25 live speakers',
    'offer.u9': '100K API calls / month',
    'offer.u10': 'GDPR compliant &amp; ISO 27001',
    'offer.tableCaption': '2026 commercial proposals',
    'offer.tableTitle': 'Commercial proposals',
    'offer.col1': en(PR.volumes[0]) + ' attendees',
    'offer.col2': en(PR.volumes[1]) + ' attendees',
    'offer.col3': en(PR.volumes[2]) + ' attendees',
    'offer.rowInit': 'Initial offer',
    'offer.rowRev': 'New revised offer',
    'offer.row1y': '✓ Contractual commitment → 1 year',
    'offer.row2y': '✓ Contractual commitment → 2 years',
    'offer.row3y': '✓ Contractual commitment → 3 years',
    'offer.pill1': '-' + en(PR.discounts[0]) + '%',
    'offer.pill2': '-' + en(PR.discounts[1]) + '%',
    'offer.pill3': '-' + en(PR.discounts[2]) + '%',
    'offer.best': 'Best value',
    'offer.p11': eur(PR.initial[0]),
    'offer.p12': eur(PR.initial[1]),
    'offer.p13': eur(PR.initial[2]),
    'offer.p21': eur(PR.rows[0][0]),
    'offer.p22': eur(PR.rows[0][1]),
    'offer.p23': eur(PR.rows[0][2]),
    'offer.p31': eur(PR.rows[1][0]),
    'offer.p32': eur(PR.rows[1][1]),
    'offer.p33': eur(PR.rows[1][2]),
    'offer.p41': eur(PR.rows[2][0]),
    'offer.p42': eur(PR.rows[2][1]),
    'offer.p43': eur(PR.rows[2][2]),
    'offer.ovTitle': 'What if you over-consume?',
    'offer.ovLede': 'If ' + P + ' uses up most of its credits during the year, two options are available:',
    'offer.ov1': '<strong>Early renewal</strong> — based on a new, higher annual volume.',
    'offer.ov2': '<strong>Top-up credits</strong> — using the price grid opposite.',
    'offer.ovNote1': 'The smartest scenario is still to start with the offer best matched to your growing needs — avoiding over-billing and administrative overhead.',
    'offer.ovNote2': 'We stay flexible: any over-billing situation will be discussed ahead of time to find the best compromise.',
    'offer.ovGridTitle': 'Overage / out of plan',
    'offer.ovQty': 'Quantity',
    'offer.ovPrice': 'Price per attendee',
    'offer.ovq1': '1,000',
    'offer.ovq2': '5,000',
    'offer.ovq3': '10,000',
    'offer.ovq4': '20,000',
    'offer.ovp1': '€2.00',
    'offer.ovp2': '€1.70',
    'offer.ovp3': '€1.50',
    'offer.ovp4': '€1.20',

    'risk.kicker': 'The cost of switching',
    'risk.title': 'Switching tools carries significant hidden costs',
    'risk.r1t': 'Technical debt',
    'risk.r1a': '<strong>Hidden costs:</strong> custom development to rebuild an advanced Salesforce integration.',
    'risk.r1b': '<strong>Lost time:</strong> data migration and a full reconfiguration of your workflows.',
    'risk.r1c': '<strong>Manpower:</strong> many working hours re-committed to configuring a new tool.',
    'risk.r2t': 'The human impact',
    'risk.r2a': '<strong>Productivity dip:</strong> the learning curve of a new tool.',
    'risk.r2b': '<strong>Operational risk:</strong> disruption of processes that already work.',
    'risk.solTitle': 'Your challenges, our answers',
    'risk.pr1': 'Registrant-based pricing',
    'risk.sl1': 'Attendee-based pricing',
    'risk.pr2': 'Extra cost when adding a school',
    'risk.sl2': 'Flat plan with unlimited schools',
    'risk.pr3': 'Sending ESG data to multiple Salesforce orgs',
    'risk.sl3': 'Under review by our technical team (2 possible solutions)',

    'cta.thanks': 'Thank you for your attention 🙏',
    'cta.kicker': 'Your account manager',
    'cta.btn': 'Book a slot in my calendar',

    'footer.note': 'Confidential proposal prepared for ' + P + ' — 2026'
  };

  /* ---------- FR value dictionary ----------
     The server substitutes raw values into the FR copy; these keys
     restore French number formatting. Applied once at load, BEFORE the
     i18n engine snapshots frSource, so FR/EN switching keeps working. */
  var nfFR = new Intl.NumberFormat('fr-FR');
  var nfFR1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function fr(n) { return nfFR.format(n); }
  function frEur(n) { return fr(n) + ' € <em>/ an</em>'; }

  var FR_VALUES = {
    'hero.chip1': '<strong>' + fr(CFG.kpis.attendees) + '</strong> participants en 2025',
    'hero.chip2': '<strong>' + fr(CFG.kpis.schools) + '</strong> écoles accompagnées',
    'hero.chip3': 'NPS <strong>' + nfFR1.format(CFG.kpis.nps) + '</strong>',
    'offer.beforeTag': 'Contrat actuel — ' + fr(Math.round(PR.currentAnnual / 1000)) + ' K€ / an',
    'offer.col1': fr(PR.volumes[0]) + ' participants',
    'offer.col2': fr(PR.volumes[1]) + ' participants',
    'offer.col3': fr(PR.volumes[2]) + ' participants',
    'offer.p11': frEur(PR.initial[0]), 'offer.p12': frEur(PR.initial[1]), 'offer.p13': frEur(PR.initial[2]),
    'offer.p21': frEur(PR.rows[0][0]), 'offer.p22': frEur(PR.rows[0][1]), 'offer.p23': frEur(PR.rows[0][2]),
    'offer.p31': frEur(PR.rows[1][0]), 'offer.p32': frEur(PR.rows[1][1]), 'offer.p33': frEur(PR.rows[1][2]),
    'offer.p41': frEur(PR.rows[2][0]), 'offer.p42': frEur(PR.rows[2][1]), 'offer.p43': frEur(PR.rows[2][2])
  };
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (FR_VALUES[key] !== undefined) el.innerHTML = FR_VALUES[key];
  });

  var amInitialsEl = document.querySelector('[data-am-initials]');
  if (amInitialsEl) amInitialsEl.textContent = CFG.am.initials;

  /* ---------- i18n engine ---------- */
  var nodes = document.querySelectorAll('[data-i18n]');
  var frSource = new Map(); // element -> original FR innerHTML
  nodes.forEach(function (el) { frSource.set(el, el.innerHTML); });

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

  /* ---------- KPI count-ups ---------- */
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

  // The server substitutes raw values; format them per locale right away
  // so pre-reveal text matches the old server-formatted rendering.
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
