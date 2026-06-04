/* ============================================================
   Galileo × Livestorm — i18n (FR inline / EN dictionary),
   scroll reveals, KPI count-ups, header state.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- EN dictionary (FR is the inline source of truth) ---------- */
  var EN = {
    'nav.partnership': 'Partnership',
    'nav.results': 'Results',
    'nav.why': 'Why Livestorm',
    'nav.offer': '2026 Offer',
    'nav.cta': 'Book a slot',

    'hero.eyebrow': 'Galileo × Livestorm · 2026 Renewal',
    'hero.title': 'Six years of <span class="grad">growth together</span>.<br>Ready for what’s next?',
    'hero.sub': 'Europe’s leading webinar platform helps Galileo schools attract, convert and engage students — from registration to replay, all in one place.',
    'hero.cta1': 'Book a slot',
    'hero.cta2': 'Explore the 2026 offer',
    'hero.chip1': '<strong>22,263</strong> attendees in 2025',
    'hero.chip2': '<strong>34</strong> schools supported',
    'hero.chip3': 'NPS <strong>7.7</strong>',

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
    'res.k2': 'Galileo users',
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
    'pil.p2note': '* Feature being deprecated, but kept fully operational for Galileo.',
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
    'pil.quoteRole': 'Field Marketing Specialist · Brevo',

    'offer.interlude': '2026 Renewal',
    'offer.kicker': 'Before / After',
    'offer.title': 'A new offer, built for your growth',
    'offer.beforeTag': 'Current contract — €120K / year',
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
    'offer.col1': '25,000 attendees',
    'offer.col2': '40,000 attendees',
    'offer.col3': '60,000 attendees',
    'offer.rowInit': 'Initial offer',
    'offer.rowRev': 'New revised offer',
    'offer.row1y': '✓ Contractual commitment → 1 year',
    'offer.row2y': '✓ Contractual commitment → 2 years',
    'offer.row3y': '✓ Contractual commitment → 3 years',
    'offer.best': 'Best value',
    'offer.p11': '€120,000 <em>/ yr</em>',
    'offer.p12': '€143,000 <em>/ yr</em>',
    'offer.p13': '€163,000 <em>/ yr</em>',
    'offer.p21': '€96,000 <em>/ yr</em>',
    'offer.p22': '€114,400 <em>/ yr</em>',
    'offer.p23': '€130,400 <em>/ yr</em>',
    'offer.p31': '€84,000 <em>/ yr</em>',
    'offer.p32': '€100,100 <em>/ yr</em>',
    'offer.p33': '€114,100 <em>/ yr</em>',
    'offer.p41': '€72,000 <em>/ yr</em>',
    'offer.p42': '€85,800 <em>/ yr</em>',
    'offer.p43': '€97,800 <em>/ yr</em>',
    'offer.ovTitle': 'What if you over-consume?',
    'offer.ovLede': 'If Galileo uses up most of its credits during the year, two options are available:',
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

    'footer.note': 'Confidential proposal prepared for Galileo Global Education — 2026'
  };

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
