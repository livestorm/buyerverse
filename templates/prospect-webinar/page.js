/* ============================================================
   Prospect — Runs webinars, no repurposing
   ============================================================ */
(function () {
  'use strict';

  var FALLBACK = {
    first_name: 'Sarah', last_name: 'Chen', title: 'VP of Marketing',
    company: 'Acme Corp', industry: 'SaaS', use_case: '', current_platform: '',
    observation: '',
    pain_1: 'Webinar recordings are published once and forgotten',
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
    if (/train|formation|educat|onboard|learn/.test(s)) return 'training';
    if (/thought.?lead|expertise/.test(s)) return 'thought leadership';
    if (/customer.educ|client.educ|patient|hcp|kol|clinical/.test(s)) return 'customer education';
    if (/partner|resell|distribut|channel/.test(s)) return 'partner enablement';
    if (/pipeline|demand.gen|lead.gen|revenue/.test(s)) return 'pipeline generation';
    return s;
  }

  var COPY = {
    'public sector': {
      'product showcase': {
        heroSub: "You're running sessions to showcase your referenced offers — that's the right instinct. The gap most teams hit next isn't production, it's extraction: a 60-minute live session on a new product line contains enough material to serve your buyers for weeks. Most of it gets left on the table.",
        assetSectionTitle: 'One offer showcase session, multiple buyer touchpoints',
        assetSectionSub: "Public sector buyers engage with content differently from B2B buyers. Here's what teams in your space extract from a single session to keep the conversation going.",
        uc1Title: 'Highlight clips for buyer communications',
        uc1Desc: '60–90 second clips of your best demonstration moments — key product features, answered objections, practical application. Shareable in follow-up emails to acheteurs and prescripteurs, on your intranet, in team briefings. Zero re-production cost, sourced directly from the live session.',
        uc2Title: 'Turn Q&A into buyer FAQ documentation',
        uc2Desc: "The questions your audience asked live are the objections every buyer has. Package them as a Q&A guide or product brief. The most common questions become the document that replaces 20 individual follow-up emails — and helps new buyers self-qualify.",
        uc3Title: 'Transcript as searchable reference material',
        uc3Desc: "Auto-generated transcripts become a permanent, searchable knowledge base — for your own team, for new buyers arriving later, for prescripteurs who want to reference specific specifications. One session's content, available forever."
      },
      '': {
        heroSub: "You're running sessions — that's the foundation. The teams getting the most from their programmes figured out that the live session is just the first distribution channel. What you produce from the recording determines whether that 60 minutes keeps working for days or for months.",
        assetSectionTitle: 'One session, multiple formats for different audiences',
        uc1Title: 'Highlight clips for internal and external comms',
        uc1Desc: "Key moments from your session — edited into 60–90 second clips — shareable with buyers who missed the live date, distributable through your existing communication channels, useful for onboarding new stakeholders to the topic.",
        uc2Title: 'Q&A into permanent FAQ and product documentation',
        uc2Desc: "Every question asked live is a knowledge gap in your buyer community. Compiled and packaged, those answers train the next cohort before they even register. The FAQ document improves with every session you run.",
        uc3Title: 'Transcript as reusable reference resource',
        uc3Desc: "A searchable record of everything covered, every claim made, every question answered. Useful for buyers, for new team members, for anyone who needs to reference the detail without watching the full replay."
      }
    },
    'healthcare': {
      'customer education': {
        heroSub: "You're already running clinical education sessions — that's significant. The teams getting the most from their programmes treat each session as the starting point, not the endpoint. A 60-minute HCP webinar contains enough clinical evidence, demonstration, and Q&A material to run your education engine for weeks.",
        assetSectionTitle: 'One clinical education session, multiple HCP touchpoints',
        assetSectionSub: "From MSL resources to regulatory documentation — here's what healthcare teams extract from a single session.",
        uc1Title: 'Clinical highlight clips for field teams',
        uc1Desc: "Key clinical moments from your session — evidence presentation, case study highlights, specialist answers — clipped into shareable assets for your MSL and KAM teams. Peer-to-peer credibility without peer-to-peer scheduling.",
        uc2Title: 'Q&A into medical information and clinical FAQ',
        uc2Desc: "The questions HCPs ask live are the exact information gaps that delay prescribing or procurement decisions. Compiled into a medical information document, they answer objections before they're raised and improve with every session.",
        uc3Title: 'Transcript as MSL resource and regulatory record',
        uc3Desc: "Auto-generated transcripts give your MSL team a searchable reference for every clinical claim made live. They also provide a documentation record for regulatory requirements — one output that simultaneously serves two teams."
      },
      '': {
        heroSub: "You're running sessions — good foundation. The healthcare teams getting the most from their programmes extract more than a replay link from each session. A 60-minute clinical or product webinar is raw material for your MSL team, your field team, and your regulatory documentation. Most of it goes unused.",
        assetSectionTitle: 'One session, multiple assets for clinical and commercial teams',
        uc1Title: 'Clinical and product clips for field teams',
        uc1Desc: "Key session moments — clinical evidence, demonstration, expert commentary — clipped for your MSL, KAM, and sales teams to use in follow-up conversations. Reduces the gap between what HCPs hear at the session and what they hear in the field.",
        uc2Title: 'Q&A into FAQ and clinical documentation',
        uc2Desc: "The questions your audience asked live are the information gaps your entire buyer community has. Package them as a FAQ or medical information document that trains future buyers before they even register for a session.",
        uc3Title: 'Transcript as searchable knowledge base and record',
        uc3Desc: "Every session produces a full, searchable text record. Useful for your medical affairs team as a regulatory-ready document. Useful for new MSLs who need to get up to speed. One output that serves compliance and training simultaneously."
      }
    },
    'financial services': {
      'thought leadership': {
        heroSub: "You're running sessions — market briefings, product launches, client updates. The firms building a genuine thought leadership presence from their webinar programme treat each session as the beginning of a distribution cycle, not the end of it. Your analysts present once; your content reaches clients and prospects for weeks.",
        assetSectionTitle: 'One market briefing, a full quarter of client content',
        assetSectionSub: "From client comms to compliance records — here's how financial services teams maximise every session.",
        uc1Title: 'Market commentary clips for client distribution',
        uc1Desc: "The 60–90 second highlight from your analyst's market update — distributed to clients via email, posted to LinkedIn by your advisors, shared in client portals. One recording, multiple touchpoints across your relationship manager network.",
        uc2Title: 'Key insights as research notes and client briefings',
        uc2Desc: "Package the session's main themes as a written market commentary or investment note. Your analysts present once; your written output doubles the reach. Relationship managers get a brief they can share without summarising the session themselves.",
        uc3Title: 'Transcript as compliance documentation and archive',
        uc3Desc: "Every webinar produces a full transcript: a compliance-ready record of what was said, by whom, and when. Indexed and searchable. The audit trail your compliance team needs, generated automatically without anyone having to create it manually."
      },
      '': {
        heroSub: "You're running sessions — client briefings, product updates, market commentary. The financial services firms getting the most from their webinar programme treat each session as the start of a content cycle: what you produce from the recording determines how long that 60 minutes keeps generating value.",
        assetSectionTitle: 'One session, multiple client and compliance outputs',
        uc1Title: 'Clips for relationship managers and client communications',
        uc1Desc: "Key moments from your session — market insight, product explanation, analyst commentary — clipped and distributable. Your relationship managers share them with relevant clients without summarising the full session themselves.",
        uc2Title: 'Written output for clients who prefer reading',
        uc2Desc: "Your live session contains enough insight material for a client briefing note, a market commentary, or a product FAQ. Some clients watch replays; others prefer reading. One session, both formats covered.",
        uc3Title: 'Transcript as compliance record and searchable archive',
        uc3Desc: "A full text record of every session: who said what, when. Useful for compliance review, for new joiners who need context, for clients who want to reference a specific claim. Generated automatically — no manual documentation required."
      }
    },
    'retail': {
      'training': {
        heroSub: "You're running sessions — good. Retail teams with strong training programmes use their webinars as the cornerstone of a broader learning system: the live session trains once, the replay trains everyone who joins later, and the extracted assets become the onboarding library for new store and channel teams.",
        assetSectionTitle: 'One training session, a full learning library',
        assetSectionSub: "From product launch clips to onboarding guides — here's what retail training teams extract from a single session.",
        uc1Title: 'Product launch clips for store and channel teams',
        uc1Desc: "Short, shareable clips of your best product demonstration moments — new season previews, feature highlights, handling tips. Distributable to store managers, channel partners, and regional teams without running separate sessions for each location.",
        uc2Title: 'Q&A into product knowledge guides',
        uc2Desc: "The questions your retail teams ask live are the knowledge gaps every new hire will have. Packaged as a product knowledge guide or FAQ, they become onboarding material that improves with every product launch you run.",
        uc3Title: 'Transcript as permanent training reference',
        uc3Desc: "A searchable record of everything covered — product specs, brand positioning, handling guidance. New store hires watch the replay; experienced staff reference the transcript. Your training library builds itself."
      },
      '': {
        heroSub: "You're running sessions — the foundation is there. Retail and consumer brands getting the most from their webinar programmes treat each session as raw material for their training, buyer education, and partner communication workflows. A 60-minute session contains more reusable content than most teams extract from it.",
        assetSectionTitle: 'One session, multiple formats for different retail audiences',
        uc1Title: 'Product and brand clips for teams and partners',
        uc1Desc: "Short clips from your session — product demonstrations, brand story, key messages — distributable to retail partners, store teams, and channel managers. Same content, delivered to every team, without running the same session multiple times.",
        uc2Title: 'Q&A into buyer and partner FAQs',
        uc2Desc: "The questions your audience asks live are the same questions every buyer, partner, and store manager has. Package them as a FAQ that reduces repetitive follow-up and builds product knowledge across your network.",
        uc3Title: 'Transcript as searchable brand and product reference',
        uc3Desc: "A full record of your session: product positioning, key messages, answers to objections. Your teams reference it; your partners use it for training. One session builds a knowledge base that keeps working."
      }
    },
    'education': {
      '': {
        heroSub: "You're running sessions — good foundation. Education organisations getting the most from their webinar programmes treat each session as the starting point for a broader engagement strategy: the live session reaches one cohort; the replay, the clips, and the content reach every cohort that follows.",
        assetSectionTitle: 'One session, a full semester of engagement content',
        uc1Title: 'Programme preview clips for prospective students',
        uc1Desc: "Short clips from your information sessions, open days, or academic webinars — shareable in enrolment communications, on your website, via social. Prospective students who couldn't attend live get the same message without you running a second session.",
        uc2Title: 'Q&A into information packs and FAQs',
        uc2Desc: "The questions prospective students ask live are the questions every applicant has. Package them as an information pack or FAQ that reduces your admissions team's repetitive correspondence and answers objections before they're raised.",
        uc3Title: 'Transcript as accessible learning resource',
        uc3Desc: "Every session becomes a permanent, accessible record — a resource for students who need to revisit content, for staff who were absent, for accessibility compliance. One session's effort, a permanent library entry."
      }
    },
    'tech': {
      'pipeline generation': {
        heroSub: "You're running sessions — good foundation. The SaaS teams getting the most from their webinar programmes treat each session as the start of a demand-generation cycle: the live session converts intent, the replay compounds reach, and the repurposed content works for weeks.",
        assetSectionTitle: 'One session, a full pipeline-generation cycle',
        assetSectionSub: "From demo clips to nurture sequences — here's what B2B tech teams extract from a single webinar to keep their pipeline moving.",
        uc1Title: 'Demo and insight clips for sales follow-up',
        uc1Desc: "Short clips from your session — product demonstration moments, objection handling, customer proof — shareable by your sales team in follow-up sequences. Your AEs get relevant context to send instead of a generic replay link.",
        uc2Title: 'Q&A into qualification and nurture content',
        uc2Desc: "The questions prospects ask live are the objections every buyer has. Package them as a FAQ or objection-handling guide that shortens your sales cycle — and turns your live session into evergreen nurture content.",
        uc3Title: 'Transcript as AI-ready content and search asset',
        uc3Desc: "Auto-generated transcripts fuel your content team: blog post, LinkedIn post, email copy — all drafted from the session, not from scratch. Your replay becomes findable through search. One session, weeks of output."
      },
      'thought leadership': {
        heroSub: "You're running sessions — the foundation is there. The SaaS teams building genuine category authority use their webinar content as the start of a distribution cycle: the live session earns attention, the repurposed content sustains it across channels.",
        assetSectionTitle: 'One expert session, a full content cycle',
        assetSectionSub: "From LinkedIn clips to written commentary — here's how B2B tech teams maximise every thought leadership session.",
        uc1Title: 'Expert clips for social and outbound',
        uc1Desc: "The strongest insight moments from your session — clipped into 60–90 second segments — distributable on LinkedIn, shareable in cold outbound, usable in nurture. Your analyst or practitioner's expertise reaches far beyond the live attendees.",
        uc2Title: 'Key themes as written commentary and newsletter content',
        uc2Desc: "Package the session's main arguments as a written piece — market commentary, a practitioner's guide, a newsletter edition. Different format, same expertise, extended reach to the audience that prefers reading over watching.",
        uc3Title: 'Transcript as long-tail search and AI-ready asset',
        uc3Desc: "A full text record of your session becomes findable through organic search months after the live date. It also gives your content team a complete source document to generate written content without starting from scratch."
      },
      '': {
        heroSub: "You're running sessions — good foundation. The B2B tech teams getting the most from their webinar programmes treat each session as the beginning of a content cycle, not the end of one. What you extract from the recording determines how long that 60 minutes keeps generating pipeline.",
        assetSectionTitle: 'One session, multiple pipeline-generating outputs',
        uc1Title: 'Clips for sales and social distribution',
        uc1Desc: "Key moments from your session — product demonstration, objection handling, expert insight — clipped and distributable. Your sales team shares them in follow-up; your marketing team posts them on LinkedIn. One recording, multiple channels.",
        uc2Title: 'Q&A into nurture content and objection handling',
        uc2Desc: "The questions your audience asked live are the questions every buyer has. Package them as a FAQ or objection-handling guide that works for sales sequences and nurture emails — without your team writing it from scratch.",
        uc3Title: 'Transcript as content source and search asset',
        uc3Desc: "A full session transcript gives your content team a complete source document — blog post, newsletter, LinkedIn post, all drafted in minutes. The replay becomes searchable and findable, generating registrations long after the live date."
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
      ['hero-sub-text', 'heroSub'],
      ['assets-title', 'assetSectionTitle'],
      ['assets-sub', 'assetSectionSub'],
      ['uc-title-1', 'uc1Title'], ['uc-desc-1', 'uc1Desc'],
      ['uc-title-2', 'uc2Title'], ['uc-desc-2', 'uc2Desc'],
      ['uc-title-3', 'uc3Title'], ['uc-desc-3', 'uc3Desc']
    ];
    map.forEach(function (pair) {
      if (copy[pair[1]]) setText(pair[0], copy[pair[1]]);
    });
  }

  var industry = normIndustry(V.industry);
  var useCase = normUseCase(V.use_case);
  var copy = getCopy(industry, useCase);
  applyCopy(copy);

  /* ── Optional fields ───────────────────────────────────────────────── */
  if (!(V.observation || '').trim()) { hide('observation-block'); }
  if (!(V.pain_2 || '').trim()) { hide('pain-item-2'); }

  /* ── Platform hero sub tweak (only if no copy library heroSub) ─────── */
  var platform = (V.current_platform || '').trim();
  if (platform && !copy.heroSub) {
    var subEl = document.getElementById('hero-sub-text');
    if (subEl) {
      subEl.textContent = "You're already running webinars on " + platform + " — that's a real foundation. The teams getting the most from their events programmes figured out one thing: the live session is just the beginning. What happens after — replays, repurposed content, follow-up sequences — is where the real value compounds.";
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
