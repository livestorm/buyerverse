/* ============================================================
   Prospect — No events program
   ============================================================ */
(function () {
  'use strict';

  var FALLBACK = {
    first_name: 'Sarah', last_name: 'Chen', title: 'VP of Marketing',
    company: 'Acme Corp', industry: 'SaaS', use_case: '',
    observation: '',
    pain_1: 'Generating qualified pipeline beyond paid channels is getting harder',
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
    return s;
  }

  var COPY = {
    'public sector': {
      'product showcase': {
        heroSub: 'In public procurement, buyers assess hundreds of referenced products — most from a catalogue page. A webinar changes that: you present your offer in context, demonstrate real-world value, and answer objections live. Product teams in your space doing this regularly reach hundreds of acheteurs and prescripteurs per session, for a fraction of the cost of a physical event.',
        ucSectionTitle: 'Three things webinars do for public sector product teams',
        ucSectionSub: "These aren't generic benefits. They're what the product managers already running offer-showcase webinars say they couldn't achieve any other way.",
        uc1Title: 'Showcase referenced offers to buyers at scale',
        uc1Desc: 'A single session on a new product reference can reach hundreds of acheteurs and prescripteurs simultaneously — the people who drive purchasing decisions for collectivités. You present once; everyone hears the same message, asks questions live, and leaves with the context they need to act.',
        uc2Title: 'Reach acheteurs and prescripteurs in one session',
        uc2Desc: "In public sector procurement, the person who specifies and the person who buys are often different. A webinar puts both in the same room at the same time — same demonstration, same Q&A — without running two separate events or two separate travel budgets.",
        uc3Title: '40% of your audience watches on replay',
        uc3Desc: 'Public sector buyers have constrained schedules — many who register won\'t attend live. On average, 40% of an audience engages through the replay. Your session keeps educating buyers and answering objections long after the live date, without any extra effort from your team.'
      },
      'training': {
        heroSub: 'Training public sector buyers and prescripteurs traditionally means travel, room bookings, and geographic limits. A webinar changes the economics: one session, hundreds of participants, no constraint. The teams running regular training programmes are building product knowledge across their buyer communities that static documents and individual calls cannot replicate.',
        ucSectionTitle: 'What a webinar training programme gives public sector teams',
        ucSectionSub: 'The most effective public sector training programmes share one thing: they reach everyone at once, and the content keeps working after the session ends.',
        uc1Title: 'Train hundreds of buyers and prescripteurs simultaneously',
        uc1Desc: 'A single training session reaches 200+ participants at once — acheteurs, prescripteurs, collectivités from every region — without the logistics of an in-person event. Your expert presents once; everyone learns at the same time, wherever they are.',
        uc2Title: '40% engage on replay, on their own schedule',
        uc2Desc: "Public sector buyers have full agendas. Replays extend every session's reach by 40% without any additional effort from your team. Participants catch up when it suits them — no need to run the same training twice.",
        uc3Title: 'Every session builds your permanent knowledge base',
        uc3Desc: "Replay, transcript, Q&A summary — each session automatically builds your training library. New buyers joining later watch the replay. Your team stops answering the same product questions repeatedly and starts pointing people to the resource."
      },
      '': {
        heroSub: 'In public sector organisations, reaching acheteurs, prescripteurs, and collectivités at scale — without travel constraints — is a real operational challenge. A webinar programme is how forward-thinking teams solve it: present offers, train communities, build regular touchpoints with hundreds of stakeholders at once.',
        ucSectionTitle: 'What a webinar programme does for public sector teams',
        ucSectionSub: "Whether you're showcasing new offers, training buyers, or building a community of prescripteurs — these are the outcomes teams in your space report.",
        uc1Title: 'Reach buyers and prescripteurs across every region',
        uc1Desc: 'Public sector stakeholders are geographically dispersed. A webinar reaches all of them simultaneously — live demonstration, Q&A, engagement — without travel, without logistics, without running the same session for each region.',
        uc2Title: 'Showcase offers beyond the catalogue',
        uc2Desc: "A catalogue entry tells buyers what a product is. A webinar shows them what it does in practice — context, demonstration, live objection-handling. That's the difference between a reference and a purchase decision.",
        uc3Title: '40% more reach via replay',
        uc3Desc: "Public sector buyers have demanding schedules. On average, 40% of registered participants watch the replay. Your content reaches more of your target audience without any incremental effort from your team."
      }
    },
    'healthcare': {
      'customer education': {
        heroSub: "Healthcare decisions are complex and information-dense — and busy clinicians, procurement teams, and administrators don't have time for lengthy sales processes. A webinar gives you 45 focused minutes to educate the right stakeholders, demonstrate clinical context, and address the questions that typically delay purchase decisions. The teams doing this are shortening their cycles and improving product adoption.",
        ucSectionTitle: 'What a webinar programme does for healthcare teams',
        ucSectionSub: "Clinical education, procurement briefings, product demonstrations — these are the outcomes healthcare teams with a webinar programme report.",
        uc1Title: 'Educate clinical and procurement stakeholders together',
        uc1Desc: "In healthcare, clinical decision-makers and procurement are often siloed. A webinar puts both in the same session — live demonstration, clinical context, Q&A that addresses both perspectives — without running separate meetings for each audience.",
        uc2Title: 'Complex products need more than a data sheet',
        uc2Desc: "A webinar gives you the time and format to show, not just tell — live demonstrations, clinical scenarios, peer presenter credibility. The healthcare teams seeing the best results treat webinars as their primary product education channel.",
        uc3Title: 'Build a reusable clinical education library',
        uc3Desc: "Every session creates a permanent resource: replay, transcript, Q&A summary. Your medical affairs and sales teams stop fielding the same questions. The replay becomes a gated asset generating qualified leads long after the live date."
      },
      '': {
        heroSub: "Healthcare buyers are rigorous — they need to understand clinical context, evidence, and practical application before they make decisions. A webinar gives your team the time and format to educate at depth: live demonstrations, expert presenters, real Q&A. The teams building regular webinar programmes in healthcare are creating an education engine that scales.",
        ucSectionTitle: 'What a webinar programme does for healthcare teams',
        ucSectionSub: "From clinical education to procurement briefings — these are the outcomes healthcare teams with a webinar programme consistently report.",
        uc1Title: 'Reach the full decision-making team in one session',
        uc1Desc: "Healthcare purchasing decisions involve multiple stakeholders — clinicians, procurement, pharmacy, administration. A webinar puts all of them in the same session with the same information, without coordinating multiple individual meetings.",
        uc2Title: 'Depth of education that a data sheet can\'t replicate',
        uc2Desc: "You have 45 minutes and a live audience that chose to show up. Use it to demonstrate clinical application, share evidence in context, and answer the specific questions that usually delay decisions. That's not a pitch — it's a clinical education session.",
        uc3Title: 'Your content keeps working after the session',
        uc3Desc: "Replay, transcript, Q&A documentation — each session builds a library that trains future buyers without additional effort from your team. New stakeholders joining mid-year watch the replay. Your message reaches beyond the live attendees."
      }
    },
    'financial services': {
      'thought leadership': {
        heroSub: "In financial services, trust is built through demonstrated expertise — and expertise is demonstrated through quality live content. A webinar puts your analysts, portfolio managers, and specialists in front of clients and prospects as credible, accessible experts. The teams building regular programmes are creating a thought leadership presence that no newsletter or white paper can replicate.",
        ucSectionTitle: 'What a webinar programme does for financial services teams',
        ucSectionSub: "From investor briefings to client education — these are the outcomes the financial services teams with an established webinar programme consistently report.",
        uc1Title: 'Position your team as the accessible experts',
        uc1Desc: "A live webinar with your portfolio managers or analysts builds credibility that written content can't match. Clients ask questions, hear live answers from real people, and leave with a relationship — not just a document.",
        uc2Title: 'Reach qualified investors and prospects at scale',
        uc2Desc: "Rather than individual advisor calls, a single webinar reaches hundreds of clients and prospects simultaneously — market updates, product launches, regulatory briefings. Same expertise, dramatically higher reach, same presenting team.",
        uc3Title: 'Self-qualified leads from replay and search',
        uc3Desc: "Prospects who find your replay through search or referral are self-selecting — they sought out your content. Engagement data tells you who watched, for how long, and what they asked. Your team follows up with context, not a cold intro."
      },
      '': {
        heroSub: "Financial services buyers make careful, informed decisions — and they do their research before they talk to anyone. A webinar programme puts your expertise in front of them during that research phase: live market commentary, product briefings, regulatory updates. The teams building this are becoming the default source of insight for their clients and prospects.",
        ucSectionTitle: 'What a webinar programme does for financial services teams',
        ucSectionSub: "Client education, investor briefings, thought leadership — these are the specific outcomes financial services teams report from a consistent webinar programme.",
        uc1Title: 'Client education at scale',
        uc1Desc: "Your relationship managers can only hold so many individual calls. A webinar reaches hundreds of clients simultaneously — the same market update, the same product briefing, the same regulatory context — without multiplying your team's time.",
        uc2Title: 'Build trust through live expertise',
        uc2Desc: "Live interaction builds trust that static content can't. Clients who attend your webinars hear your analysts answer questions live, see your team's depth of knowledge in real time, and leave with a relationship that a PDF can't create.",
        uc3Title: 'Qualified leads from replay and search',
        uc3Desc: "The replay becomes a permanent lead generation asset. Prospects who find it organically are already interested in your topic. Engagement data tells you who watched, how long, and what they engaged with — your team follows up knowing exactly why they're relevant."
      }
    },
    'retail': {
      '': {
        heroSub: "Retail teams running strong digital programmes use webinars as their primary channel for product launches, buyer education, and channel partner training — without the travel budget of a physical roadshow. A single session can reach store managers, regional buyers, and channel partners simultaneously, anywhere.",
        ucSectionTitle: 'Three things a webinar programme does for retail teams',
        ucSectionSub: "Whether the goal is product education, channel partner training, or B2B buyer engagement — these are the outcomes retail teams with a webinar programme consistently report.",
        uc1Title: 'Launch products to buyers and partners simultaneously',
        uc1Desc: "A seasonal preview or product launch webinar reaches store buyers, regional managers, and channel partners in a single session — same message, same demonstration, same Q&A, without a physical roadshow or multiple regional events.",
        uc2Title: 'Train your entire retail network from one session',
        uc2Desc: "Store staff, franchise managers, and channel partners need the same product knowledge. A webinar delivers it once to everyone — consistent messaging, live Q&A, and a replay for anyone who joins the network later.",
        uc3Title: 'Engage B2B buyers between trade shows',
        uc3Desc: "Trade shows happen twice a year. Webinars happen whenever you have something worth saying. Teams running regular buyer education sessions are staying front of mind throughout the buying cycle — not just at the moments their competitors are also present."
      }
    },
    'education': {
      '': {
        heroSub: "Education institutions are natural webinar audiences — you already have communities of prospective students, alumni, and professional learners who want to hear from you. The teams building webinar programmes in education are creating a direct, live engagement channel that open days and newsletters can't replicate.",
        ucSectionTitle: 'Three things a webinar programme does for education institutions',
        ucSectionSub: "Student recruitment, alumni engagement, professional development — these are the specific outcomes education teams with a webinar programme consistently report.",
        uc1Title: 'Reach prospective students before they apply',
        uc1Desc: "Programme information sessions, faculty Q&As, student life panels — a webinar puts the right person in front of the right prospective student at the moment they're deciding. 175 average registrants per session on Livestorm — self-selected, high-intent individuals.",
        uc2Title: 'Build an engaged alumni and professional community',
        uc2Desc: "Alumni want to stay connected; they just need a reason to engage. Regular webinars — industry insights, career panels, research briefings — give your community a consistent touchpoint that a newsletter can't match.",
        uc3Title: 'Scale continuing professional development and partnerships',
        uc3Desc: "CPD and corporate training partnerships generate meaningful revenue. A webinar programme makes them scalable: the same expert delivers to hundreds of professionals simultaneously, with a replay that extends the reach further."
      }
    },
    'tech': {
      'pipeline generation': {
        heroSub: "Most SaaS teams I speak with are investing in content — blogs, newsletters, gated assets. But there's one channel that puts you in front of buyers while they're actively evaluating, builds trust in real time, and generates demand that compounds. I put this page together to show you what that looks like for teams at your stage.",
        ucSectionTitle: 'Three things a webinar programme does for B2B tech teams',
        ucSectionSub: "These are the specific outcomes the B2B SaaS teams building a webinar programme say they couldn't achieve with content alone.",
        uc1Title: 'Marketing: top-of-funnel that compounds over time',
        uc1Desc: "Run a monthly thought leadership series and keep people coming back. Registered audiences that grow session by session, all opted-in and interested in your category. It builds an audience that content marketing can't build at the same speed.",
        uc2Title: 'Sales: group demos that compress cycles',
        uc2Desc: "Run live sessions for groups of prospects at once — group education that moves multiple deals forward without scheduling 10 individual calls. Engagement data (questions, polls, CTA clicks) tells your team exactly who to follow up with first and why.",
        uc3Title: 'One session → weeks of pipeline-generating content',
        uc3Desc: "That 60-minute session contains enough material to fuel your content calendar — replay, clips, blog post, nurture emails, AI-ready transcript. For every 100 people who attend live, 1,700 are reached through repurposing."
      },
      'thought leadership': {
        heroSub: "The SaaS teams building real authority in their category are the ones turning their internal expertise into live content. A product specialist, an analyst, a practitioner — give them 45 minutes and a focused topic, and you're in front of hundreds of potential buyers who chose to show up. That's a different quality of attention than a sponsored post.",
        ucSectionTitle: 'Three things a thought leadership webinar programme does for tech teams',
        uc1Title: 'Build category authority through live expertise',
        uc1Desc: "A monthly expert series positions your team as the people who understand this space best. Live Q&A is the proof — it's impossible to fake depth of knowledge when your audience is asking real questions in real time.",
        uc2Title: 'Attract buyers who are actively researching',
        uc2Desc: "People who register for a thought leadership webinar are in research mode. They're evaluating options, building conviction, comparing perspectives. You want to be in front of them during that process — not after they've already decided.",
        uc3Title: 'Turn expertise into a long-tail content engine',
        uc3Desc: "A single expert session becomes clips, a blog post, a LinkedIn article, a nurture email. Your team's knowledge reaches beyond the live audience — and keeps generating interest long after the session ends."
      },
      '': {
        heroSub: "Most tech teams I speak with are investing in content — blogs, newsletters, gated assets. But there's one channel that puts you in front of buyers while they're actively making decisions, builds trust in real time, and generates demand that compounds. I put this page together to show you what that looks like for teams at your stage.",
        ucSectionTitle: 'Three things a webinar programme does for tech teams',
        ucSectionSub: "These are the specific outcomes B2B tech teams with a webinar programme say they couldn't achieve with content marketing alone.",
        uc1Title: 'Marketing: top-of-funnel that compounds',
        uc1Desc: "Run a monthly thought leadership series and keep people coming back. 175 average registrants per session on Livestorm — all opted-in, interested in your category. It builds an audience that grows over time.",
        uc2Title: 'Sales: group demos that accelerate pipeline',
        uc2Desc: "Run live sessions for groups of prospects at once — group education that moves multiple deals forward without 10 individual calls. Engagement data tells you exactly who to follow up with first.",
        uc3Title: 'One session → weeks of content',
        uc3Desc: "That 60-minute session contains enough material to fuel your content calendar — replay, clips, blog, nurture emails. For every 100 who attend live, 1,700 are reached through repurposing."
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
      ['usecases-title', 'ucSectionTitle'],
      ['usecases-sub', 'ucSectionSub'],
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
