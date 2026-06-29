/* ============================================================
   Prospect — Mature events program
   ============================================================ */
(function () {
  'use strict';

  var FALLBACK = {
    first_name: 'Sarah', last_name: 'Chen', title: 'VP of Marketing',
    company: 'Acme Corp', industry: 'SaaS', use_case: '',
    current_platform: '', crm: '', observation: '',
    pain_1: 'Hard to attribute revenue to specific events or sessions',
    pain_2: '',
    am_name: 'Alex Martin', am_title: 'Account Executive, Livestorm',
    am_email: 'alex.martin@livestorm.co', cal_link: ''
  };
  var V = (window.PAGE_CONFIG && window.PAGE_CONFIG.values) || FALLBACK;

  function initials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0] ? w[0].toUpperCase() : ''; }).join('') || '?';
  }
  function hide(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }
  function setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text || ''; }

  /* ── Industry + use-case copy library ─────────────────────────────── */

  function normIndustry(s) {
    s = (s || '').toLowerCase();
    if (/public|government|gouvernement|admin|procurement|ugap|collecti|secteur/.test(s)) return 'public sector';
    if (/health|sant|medic|pharma|clinic|hospital/.test(s)) return 'healthcare';
    if (/financ|bank|invest|asset|insurance|wealth/.test(s)) return 'financial services';
    if (/retail|commerce|e-com|ecom|consumer|brand/.test(s)) return 'retail';
    if (/educat|school|university|higher.ed|learning|training.org/.test(s)) return 'education';
    if (/tech|saas|software|b2b/.test(s)) return 'tech';
    return s;
  }

  function normUseCase(s) {
    s = (s || '').toLowerCase();
    if (/showcase|valoris|offre|catalog/.test(s)) return 'product showcase';
    if (/customer.educ|client.educ|patient|hcp|kol|clinical/.test(s)) return 'customer education';
    if (/train|formation|educat|onboard|learn/.test(s)) return 'training';
    if (/thought.?lead|expertise/.test(s)) return 'thought leadership';
    if (/partner|resell|distribut|channel/.test(s)) return 'partner enablement';
    if (/pipeline|demand.gen|lead.gen|revenue/.test(s)) return 'pipeline generation';
    return s;
  }

  var COPY = {
    'public sector': {
      'product showcase': {
        scaleSectionTitle: 'Scale your offer showcase programme without adding headcount',
        scaleSectionSub: "The constraint at this stage isn't content or ideas — it's the operational model. Here's how teams like yours run more sessions without adding more people.",
        uc1Title: 'A repeatable format for every product category',
        uc1Desc: "Your team runs from one playbook — registration page, reminder sequence, session structure, post-event follow-up. Each product category gets its own edition; the format is standardised. Every session improves the template, not the effort to run it.",
        uc2Title: 'Product managers self-serve their own sessions',
        uc2Desc: "Your product managers run their own offer showcases without going through a central team. Same platform, same analytics, same data output — without the bottleneck. A product launch, an acheteur briefing, a prescripteur update — anyone can run one.",
        uc3Title: 'One platform: showcases, training, and buyer briefings',
        uc3Desc: "Product showcases, prescripteur training, internal team briefings, partner sessions. One platform, one analytics layer, one data integration. Not separate tools for each event type with different reporting structures."
      },
      '': {
        scaleSectionTitle: 'Scale your public sector events programme without scaling headcount',
        uc1Title: 'A repeatable format across every programme type',
        uc1Desc: "Your team runs from a single playbook regardless of session type — offer showcase, buyer training, partner briefing. The format is standardised; the content changes. Every session makes the template better, not harder to run.",
        uc2Title: 'Team members self-serve their own sessions',
        uc2Desc: "Product managers, training leads, and communications teams run their own sessions without central resource. Same platform, same analytics, same data output — without the bottleneck of one team owning all events.",
        uc3Title: 'One platform for every public sector event format',
        uc3Desc: "Product showcases, buyer training, partner briefings, internal team sessions. One platform, one analytics layer, one consistent reporting structure. Not different tools for each team with incompatible data."
      }
    },
    'healthcare': {
      'customer education': {
        scaleSectionTitle: 'Scale your clinical education programme without scaling your team',
        scaleSectionSub: "At this stage, the constraint is operational: how to run more sessions, across more products and indications, without burning out the team responsible.",
        uc1Title: 'A repeatable format for every product and indication',
        uc1Desc: "One playbook covers every product's education programme — invitation, session structure, clinical Q&A format, post-event follow-up. Your MSL and KAM teams run from the same framework. Each session improves the template.",
        uc2Title: 'Medical affairs, MSLs, and KAMs self-serve',
        uc2Desc: "Field teams run their own targeted education sessions without requesting a central resource. Same platform, same compliance-reviewed format, same data output — without the bottleneck of a central events team.",
        uc3Title: 'One platform: HCP education, training, and compliance briefings',
        uc3Desc: "Clinical education, internal MSL training, compliance briefings, KOL roundtables. One platform, one analytics layer, one data integration. Consistent structure across every event type — no reconciling outputs from different tools."
      },
      '': {
        scaleSectionTitle: 'Scale your healthcare events programme without adding headcount',
        uc1Title: 'A repeatable format for every clinical event type',
        uc1Desc: "One playbook covers clinical education, partner briefings, internal training, and KOL roundtables. Your field teams run from the same framework. Each session improves the template, not the operational load.",
        uc2Title: 'Field teams self-serve their own sessions',
        uc2Desc: "MSLs, KAMs, and medical affairs teams run their own targeted sessions without going through a central resource. Same platform, same format, same compliance baseline — without the bottleneck.",
        uc3Title: 'One platform across every healthcare event format',
        uc3Desc: "HCP education, internal MSL training, compliance briefings, advisory boards. One platform, one analytics layer, one consistent data structure. Not separate tools for each function with incompatible reporting."
      }
    },
    'financial services': {
      'thought leadership': {
        scaleSectionTitle: 'Scale your thought leadership programme without scaling production',
        scaleSectionSub: "The constraint isn't insight or expertise — it's the operational overhead of producing, distributing, and following up on each session. Here's how the firms doing this well have solved it.",
        uc1Title: 'A repeatable format for every market event type',
        uc1Desc: "One playbook covers every client event — quarterly market briefing, product launch, regulatory update, investor roundtable. The format is standardised; the content changes. Each session improves the template, not the effort to run it.",
        uc2Title: 'Advisors and portfolio managers self-serve client briefings',
        uc2Desc: "Your relationship managers run targeted client briefings without going through marketing. Same platform, same analytics, same compliance baseline — without the bottleneck. More sessions, same team size.",
        uc3Title: 'One platform: client events, internal training, compliance briefings',
        uc3Desc: "Client webinars, internal advisor training, regulatory briefings, fund launches. One platform, one analytics layer, one compliance-ready record. Not four separate tools with different data structures and different reporting cycles."
      },
      '': {
        scaleSectionTitle: 'Scale your financial services events programme without adding overhead',
        uc1Title: 'A repeatable format across every event type',
        uc1Desc: "Client briefings, market updates, product launches, regulatory updates — one playbook covers all of them. The format is standardised; the content changes. Every session improves the template and reduces the production overhead.",
        uc2Title: 'Relationship managers and analysts self-serve',
        uc2Desc: "Your front-office teams run their own client events without going through a central resource. Same platform, same compliance baseline, same analytics — without the bottleneck of a central events function.",
        uc3Title: 'One platform: client events, training, compliance',
        uc3Desc: "Client webinars, internal training, compliance briefings. One platform, one analytics layer, one compliance-ready data structure. Not separate tools with separate reporting that need to be reconciled each quarter."
      }
    },
    'retail': {
      '': {
        scaleSectionTitle: 'Scale your retail events programme without adding headcount',
        uc1Title: 'A repeatable format for every product launch and training cycle',
        uc1Desc: "One playbook covers seasonal previews, product training, partner briefings, and store manager updates. The format is standardised; the content changes. Each session improves the template and reduces the overhead per launch.",
        uc2Title: 'Brand, training, and regional teams self-serve',
        uc2Desc: "Brand teams, training leads, and regional managers run their own sessions without a central resource. Same platform, same analytics, same data output — without the bottleneck. More sessions, same team size.",
        uc3Title: 'One platform: product launches, training, partner sessions',
        uc3Desc: "Product launches, store manager training, supplier briefings, partner events. One platform, one analytics layer, one consistent data structure. Not different tools for each team type with incompatible outputs."
      }
    },
    'education': {
      '': {
        scaleSectionTitle: 'Scale your engagement programme without adding administrative overhead',
        uc1Title: 'A repeatable format for every audience and programme type',
        uc1Desc: "One playbook covers open days, programme information sessions, alumni engagement events, and corporate partnerships. The format is standardised; the content changes. Each session improves the template.",
        uc2Title: 'Faculty and admissions teams self-serve their own sessions',
        uc2Desc: "Programme directors, admissions staff, and department heads run their own sessions without a central resource. Same platform, same analytics, same data output — without the bottleneck of one team owning all events.",
        uc3Title: 'One platform: student recruitment, alumni, and CPD',
        uc3Desc: "Prospective student sessions, alumni engagement, continuing professional development, corporate partnerships. One platform, one analytics layer. Not separate tools for each function with different reporting structures."
      }
    },
    'tech': {
      'pipeline generation': {
        scaleSectionTitle: 'Scale your demand generation programme without scaling headcount',
        scaleSectionSub: "At this stage, the constraint isn't content or audience — it's operational throughput. Here's how B2B SaaS teams running mature webinar programmes scale volume without adding people.",
        uc1Title: 'A repeatable format for every campaign and funnel stage',
        uc1Desc: "One playbook covers your top-of-funnel thought leadership series, your mid-funnel product sessions, your bottom-of-funnel group demos. The format is standardised; the content and audience change. Each session improves the template and reduces the marginal cost per event.",
        uc2Title: 'Sales and marketing self-serve their own sessions',
        uc2Desc: "Your AEs run their own group demos; your content team runs their own thought leadership sessions — without going through a central events function. Same platform, same analytics, same CRM integration. More sessions, same team size.",
        uc3Title: 'One platform: demand gen, product demos, and customer success',
        uc3Desc: "Demand generation webinars, group product demos, customer onboarding sessions, quarterly business reviews. One platform, one analytics layer, one CRM sync. Not separate tools for each team with incompatible engagement data."
      },
      'thought leadership': {
        scaleSectionTitle: 'Scale your thought leadership programme without scaling production overhead',
        scaleSectionSub: "The constraint at this stage isn't expertise — it's the operational model for turning that expertise into a consistent, high-volume output. Here's how B2B SaaS teams have solved it.",
        uc1Title: 'A repeatable format for every expert and topic series',
        uc1Desc: "One playbook covers every session type — practitioner roundtable, analyst briefing, customer story panel. Your content team runs from the same framework; the topic and presenter change. Each session improves the template and builds your content library.",
        uc2Title: 'Subject-matter experts self-serve their own sessions',
        uc2Desc: "Your product managers, solutions engineers, and domain experts run their own sessions without going through marketing. Same platform, same recording and repurposing workflow, same analytics — without the bottleneck of a central team.",
        uc3Title: 'One platform: thought leadership, product, and customer success',
        uc3Desc: "Thought leadership series, product webinars, customer education sessions, partner enablement. One platform, one analytics layer, one data integration. Not separate tools for each team with different reporting and different content workflows."
      },
      '': {
        scaleSectionTitle: 'Scale your webinar programme without scaling your team',
        scaleSectionSub: "At this stage, the constraint is operational throughput — how to run more sessions across more use cases without adding headcount or creating bottlenecks.",
        uc1Title: 'A repeatable format across every session type',
        uc1Desc: "Demand generation, product demos, customer onboarding, thought leadership — one playbook covers all of them. Your team runs from the same framework; the content and audience change. Each session improves the template and reduces production overhead.",
        uc2Title: 'Sales, marketing, and CS self-serve their own sessions',
        uc2Desc: "Your AEs run their own group demos; your content team runs their own series; your CS team runs their own onboarding. Same platform, same analytics, same CRM integration — without every session going through a central events team.",
        uc3Title: 'One platform across the entire revenue funnel',
        uc3Desc: "Top-of-funnel webinars, mid-funnel product sessions, customer success programmes. One platform, one analytics layer, one data integration. Not separate tools for each team that produce incompatible engagement data."
      }
    }
  };

  function getCopy(industry, useCase) {
    var byInd = COPY[industry];
    if (!byInd) return {};
    return byInd[useCase] || byInd[''] || {};
  }

  function applyCopy(copy) {
    var map = [
      ['scale-title', 'scaleSectionTitle'],
      ['scale-sub', 'scaleSectionSub'],
      ['uc-title-1', 'uc1Title'], ['uc-desc-1', 'uc1Desc'],
      ['uc-title-2', 'uc2Title'], ['uc-desc-2', 'uc2Desc'],
      ['uc-title-3', 'uc3Title'], ['uc-desc-3', 'uc3Desc']
    ];
    map.forEach(function (pair) {
      if (copy[pair[1]]) setText(pair[0], copy[pair[1]]);
    });
  }

  var copy = getCopy(normIndustry(V.industry), normUseCase(V.use_case));
  applyCopy(copy);

  /* ── Optional fields ───────────────────────────────────────────────── */
  if (!(V.observation || '').trim()) { hide('observation-block'); }
  if (!(V.pain_2 || '').trim()) { hide('pain-item-2'); }

  /* ── CRM-specific note in data section ─────────────────────────────── */
  var crm = (V.crm || '').trim();
  if (crm) {
    var noteEl = document.getElementById('crm-note');
    var crmInline = document.getElementById('crm-name-inline');
    if (noteEl && crmInline) {
      crmInline.textContent = crm;
      noteEl.style.display = 'block';
    }
  }

  /* ── Current platform hero sub tweak ───────────────────────────────── */
  var platform = (V.current_platform || '').trim();
  if (platform) {
    var subEl = document.getElementById('hero-sub-text');
    if (subEl) {
      subEl.textContent = "You've solved the production problem on " + platform + " — you're running events, repurposing content, building an audience. The next conversation is about revenue attribution. What specifically did your events programme contribute to pipeline last quarter? Most teams at this stage can't answer that precisely. That's usually a data and integration problem, not a measurement problem.";
    }
  }

  /* ── AM avatar ─────────────────────────────────────────────────────── */
  setText('am-avatar', initials(V.am_name));
  setText('hero-avatar', initials(V.am_name));

  /* ── CTA href ──────────────────────────────────────────────────────── */
  var ctaHref = (V.cal_link || '').trim() || ('mailto:' + V.am_email);
  ['main-cta', 'hero-cta'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.href = ctaHref;
  });

  /* ── Scroll reveals ────────────────────────────────────────────────── */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Sticky header ─────────────────────────────────────────────────── */
  var hdr = document.querySelector('.site-header');
  function onScroll() { if (hdr) hdr.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Active nav ────────────────────────────────────────────────────── */
  var links = document.querySelectorAll('.site-nav a');
  if ('IntersectionObserver' in window && links.length) {
    var nIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id;
          links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('section[id]').forEach(function (s) { nIO.observe(s); });
  }

})();
