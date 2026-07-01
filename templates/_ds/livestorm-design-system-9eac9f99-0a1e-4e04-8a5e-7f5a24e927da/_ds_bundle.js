/* @ds-bundle: {"format":3,"namespace":"LivestormDesignSystem_9eac9f","components":[],"sourceHashes":{"ui_kits/marketing/FeatureGrid.jsx":"af0e03a1800a","ui_kits/marketing/Footer.jsx":"d7023030b8f1","ui_kits/marketing/Hero.jsx":"6b64892be57c","ui_kits/marketing/Nav.jsx":"f01d88a3dbde","ui_kits/marketing/Pricing.jsx":"c279c78f2589","ui_kits/marketing/Testimonial.jsx":"2856be3e316d","ui_kits/marketing/TrustedBy.jsx":"ee86ee597a63","ui_kits/marketing/ui.jsx":"06a8ae8f735a"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LivestormDesignSystem_9eac9f = window.LivestormDesignSystem_9eac9f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/marketing/FeatureGrid.jsx
try { (() => {
/* global React, Icon, Tag */

function FeatureGrid() {
  const features = [{
    icon: 'registration-page',
    title: 'Branded registration',
    body: 'Custom registration pages that match your brand — no subdomains, no weird URLs.'
  }, {
    icon: 'poll',
    title: 'Polls & Q&A',
    body: 'Keep your audience engaged with live polls, Q&A, and reactions in real time.'
  }, {
    icon: 'on-demand',
    title: 'On‑demand replays',
    body: 'Every session is automatically recorded, transcribed, and published to your library.'
  }, {
    icon: 'ai',
    title: 'AI summaries',
    body: 'Get instant transcripts, highlights, and follow‑up emails drafted for each session.'
  }, {
    icon: 'event-management',
    title: 'Event management',
    body: 'Handle invitations, reminders, and post‑event follow‑ups without leaving Livestorm.'
  }, {
    icon: 'trending-up',
    title: 'Deep analytics',
    body: 'See engagement minute‑by‑minute, export attendee lists, and sync to your CRM.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '96px 24px',
      background: '#F6F8F9'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1328,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      maxWidth: 720,
      margin: '0 auto 64px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    variant: "secondary",
    size: "s"
  }, "THE PLATFORM")), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Object Sans', sans-serif",
      fontSize: 48,
      lineHeight: '64px',
      fontWeight: 400,
      margin: '20px 0 16px',
      color: '#12262B'
    }
  }, "Everything you need to ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#0B42C3',
      fontWeight: 400
    }
  }, "engage your audience"), "."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: '28px',
      color: '#5D6D79',
      margin: 0
    }
  }, "From the first invite to the final follow\u2011up, Livestorm handles the plumbing so you can focus on the content.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 24
    }
  }, features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.title,
    style: {
      background: '#fff',
      borderRadius: 16,
      padding: 32,
      boxShadow: '0 4px 8px rgba(11,34,93,0.04),0 2px 4px rgba(11,34,93,0.04),0 1px 2px rgba(11,34,93,0.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      borderRadius: 12,
      background: '#F0F4FF',
      color: '#0B42C3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("h4", {
    style: {
      fontFamily: "'Object Sans', sans-serif",
      fontSize: 24,
      lineHeight: '32px',
      fontWeight: 500,
      margin: '0 0 8px',
      color: '#12262B'
    }
  }, f.title), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: '26px',
      color: '#5D6D79',
      margin: 0
    }
  }, f.body))))));
}
window.FeatureGrid = FeatureGrid;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/FeatureGrid.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Footer.jsx
try { (() => {
/* global React, Logo, Icon, Input, Button */

function Footer() {
  const groups = {
    'Product': ['Features', 'Pricing', 'Integrations', 'Changelog', "What's new"],
    'Solutions': ['Marketing', 'Sales', 'Customer Success', 'HR & Onboarding', 'Training'],
    'Resources': ['Blog', 'Webinars', 'Help center', 'API docs', 'Community'],
    'Company': ['About', 'Careers', 'Customers', 'Contact', 'Security']
  };
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: '#091316',
      color: '#fff',
      padding: '80px 24px 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1328,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.4fr repeat(4, 1fr)',
      gap: 48,
      paddingBottom: 64,
      borderBottom: '1px solid rgba(255,255,255,0.08)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Logo, {
    inverse: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 20,
      color: '#B7D9E1',
      fontSize: 14,
      lineHeight: '24px',
      maxWidth: 320
    }
  }, "The all-in-one video engagement platform for webinars, virtual events, and on-demand experiences."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      display: 'flex',
      gap: 10
    }
  }, ['linkedin', 'twitter', 'youtube', 'facebook'].map(s => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: 'rgba(255,255,255,0.06)',
      color: '#CED0D0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s,
    size: 16,
    color: "#CED0D0"
  }))))), Object.entries(groups).map(([title, items]) => /*#__PURE__*/React.createElement("div", {
    key: title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 500,
      color: '#fff',
      marginBottom: 16
    }
  }, title), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, items.map(i => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      fontSize: 14,
      color: '#CED0D0',
      cursor: 'pointer'
    }
  }, i)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 32,
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
      fontSize: 13,
      color: '#8094A3'
    }
  }, /*#__PURE__*/React.createElement("div", null, "\xA9 2026 Livestorm \xB7 Made in Paris"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("span", null, "Terms"), /*#__PURE__*/React.createElement("span", null, "Privacy"), /*#__PURE__*/React.createElement("span", null, "Cookies"), /*#__PURE__*/React.createElement("span", null, "Status")))));
}
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Footer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Hero.jsx
try { (() => {
/* global React, Button, Tag, Icon */

function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '80px 24px 96px',
      background: 'linear-gradient(180deg,#F0F4FF 0%,#FFFFFF 70%)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1328,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 64,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Tag, {
    variant: "secondary",
    size: "s"
  }, "NEW \xB7 AI video summaries"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Object Sans', sans-serif",
      fontSize: 60,
      lineHeight: '80px',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      margin: '20px 0 24px',
      color: '#12262B'
    }
  }, "Run webinars your audience ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#0B42C3',
      fontWeight: 400
    }
  }, "actually shows up"), " for."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 18,
      lineHeight: '28px',
      color: '#5D6D79',
      margin: 0,
      maxWidth: 520
    }
  }, "Branded registration, live polls, replays, and analytics \u2014 all in a single browser tab. No downloads for you, no downloads for your audience."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "l",
    icon: "arrow-right"
  }, "Book a demo"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "l"
  }, "Start free trial")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      marginTop: 32,
      fontSize: 14,
      color: '#5D6D79'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#17A679"
  }), " Free forever plan"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#17A679"
  }), " No credit card"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: "#17A679"
  }), " GDPR compliant"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 32,
      padding: 20,
      boxShadow: '0 32px 64px rgba(11,34,93,0.08),0 16px 32px rgba(11,34,93,0.04),0 8px 16px rgba(11,34,93,0.04),0 4px 8px rgba(11,34,93,0.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#091316',
      borderRadius: 20,
      aspectRatio: '16 / 10',
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 16,
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,#416A86,#27465D)',
      borderRadius: 12,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      color: '#fff',
      fontSize: 12,
      fontWeight: 500,
      background: 'rgba(0,0,0,0.4)',
      padding: '4px 10px',
      borderRadius: 6
    }
  }, "Sarah Chen \xB7 Host"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: '#BE3A37',
      color: '#fff',
      padding: '4px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      background: '#fff',
      borderRadius: '50%'
    }
  }), " LIVE")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,#5D6D79,#3F4950)',
      borderRadius: 10,
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,#78A1BB,#4880A3)',
      borderRadius: 10,
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'linear-gradient(135deg,#8094A3,#5D6D79)',
      borderRadius: 10,
      flex: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'inline-flex',
      gap: 8,
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      padding: 8,
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.1)'
    }
  }, ['room-mic', 'room-camera', 'screensharing', 'reactions', 'poll', 'room-record'].map(n => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: 'rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n,
    size: 16
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: -24,
      left: -28,
      background: '#fff',
      borderRadius: 16,
      padding: 16,
      boxShadow: '0 8px 16px rgba(11,34,93,0.04),0 4px 8px rgba(11,34,93,0.04),0 2px 4px rgba(11,34,93,0.04)',
      display: 'flex',
      gap: 14,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: '#F0F4FF',
      color: '#0B42C3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trending-up",
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: '#5D6D79'
    }
  }, "Avg. attendance"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 600
    }
  }, "54% ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#17A679',
      fontSize: 13
    }
  }, "\u2191 12%")))))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Nav.jsx
try { (() => {
/* global React, Logo, Button, Icon */
const {
  useState
} = React;
function Nav() {
  const [open, setOpen] = useState(null);
  const link = {
    color: '#12262B',
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4
  };
  const items = ['Product', 'Solutions', 'Pricing', 'Resources', 'Customers'];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #EAEEF1'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1328,
      margin: '0 auto',
      padding: '0 24px',
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement(Logo, null), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 4
    }
  }, items.map(it => /*#__PURE__*/React.createElement("a", {
    key: it,
    style: link,
    onMouseEnter: () => setOpen(it),
    onMouseLeave: () => setOpen(null)
  }, it, it !== 'Pricing' && it !== 'Customers' && /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 14
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("a", {
    style: link
  }, "Log in"), /*#__PURE__*/React.createElement(Button, {
    size: "m",
    variant: "secondary"
  }, "Start free"), /*#__PURE__*/React.createElement(Button, {
    size: "m",
    variant: "primary",
    icon: "arrow-right"
  }, "Book a demo"))));
}
window.Nav = Nav;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Nav.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Pricing.jsx
try { (() => {
/* global React, Button, Icon, Tag */
const {
  useState: useStatePricing
} = React;
function Pricing() {
  const [annual, setAnnual] = useStatePricing(true);
  const plans = [{
    name: 'Free',
    price: 0,
    tagline: 'For trying things out',
    features: ['Up to 30 attendees', '20-min sessions', 'Basic analytics', 'Livestorm branding'],
    cta: 'Start free',
    variant: 'secondary'
  }, {
    name: 'Pro',
    price: annual ? 79 : 99,
    tagline: 'For growing webinar programs',
    features: ['Up to 500 attendees', '4-hour sessions', 'Custom branding', 'CRM integrations', 'Live polls & Q&A'],
    cta: 'Start free trial',
    variant: 'primary',
    highlight: true
  }, {
    name: 'Business',
    price: annual ? 189 : 229,
    tagline: 'For marketing & sales teams',
    features: ['Up to 3,000 attendees', '12-hour sessions', 'On-demand library', 'Advanced analytics', 'Priority support'],
    cta: 'Book a demo',
    variant: 'secondary'
  }, {
    name: 'Enterprise',
    price: null,
    tagline: 'For global programs',
    features: ['Unlimited attendees', 'SSO + SAML', 'Dedicated CSM', 'Custom SLA', 'HIPAA / GDPR'],
    cta: 'Contact sales',
    variant: 'secondary'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '96px 24px',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1328,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    variant: "secondary",
    size: "s"
  }, "PRICING"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Object Sans', sans-serif",
      fontSize: 48,
      lineHeight: '64px',
      fontWeight: 400,
      margin: '20px 0 16px',
      color: '#12262B'
    }
  }, "Pick a plan that ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#0B42C3',
      fontWeight: 400
    }
  }, "grows with you"), "."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      padding: 4,
      background: '#F6F8F9',
      borderRadius: 12,
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAnnual(true),
    style: {
      padding: '8px 20px',
      border: 0,
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      fontFamily: "'Object Sans', sans-serif",
      background: annual ? '#fff' : 'transparent',
      color: '#12262B',
      cursor: 'pointer',
      boxShadow: annual ? '0 1px 2px rgba(13,22,38,0.07)' : 'none'
    }
  }, "Annual \xB7 save 20%"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setAnnual(false),
    style: {
      padding: '8px 20px',
      border: 0,
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 500,
      fontFamily: "'Object Sans', sans-serif",
      background: !annual ? '#fff' : 'transparent',
      color: '#12262B',
      cursor: 'pointer',
      boxShadow: !annual ? '0 1px 2px rgba(13,22,38,0.07)' : 'none'
    }
  }, "Monthly"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 20
    }
  }, plans.map(p => /*#__PURE__*/React.createElement("div", {
    key: p.name,
    style: {
      background: p.highlight ? '#051752' : '#fff',
      color: p.highlight ? '#fff' : '#12262B',
      borderRadius: 16,
      padding: 28,
      border: p.highlight ? 0 : '1px solid #EAEEF1',
      boxShadow: p.highlight ? '0 16px 32px rgba(11,34,93,0.12)' : '0 2px 4px rgba(11,34,93,0.04),0 1px 2px rgba(11,34,93,0.04)',
      position: 'relative'
    }
  }, p.highlight && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 20,
      right: 20,
      fontSize: 11,
      fontWeight: 600,
      padding: '4px 10px',
      borderRadius: 6,
      background: '#447CFD',
      color: '#fff'
    }
  }, "MOST POPULAR"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 500
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: p.highlight ? '#B3CAFE' : '#5D6D79',
      marginTop: 4
    }
  }, p.tagline), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: '20px 0 4px',
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, p.price === null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 36,
      fontWeight: 500
    }
  }, "Custom") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 48,
      fontWeight: 500,
      letterSpacing: '-0.02em'
    }
  }, "$", p.price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: p.highlight ? '#B3CAFE' : '#5D6D79'
    }
  }, "/mo"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: p.highlight ? 'rgba(255,255,255,0.12)' : '#EAEEF1',
      margin: '20px 0'
    }
  }), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      fontSize: 14
    }
  }, p.features.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: {
      display: 'flex',
      gap: 8,
      color: p.highlight ? '#fff' : '#3F4950'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    color: p.highlight ? '#85E0D1' : '#17A679'
  }), " ", f))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: p.variant,
    size: "m"
  }, p.cta)))))));
}
window.Pricing = Pricing;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Pricing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Testimonial.jsx
try { (() => {
/* global React, Icon, Button */

function Testimonial() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '96px 24px',
      background: '#12262B',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 960,
      margin: '0 auto',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 2,
      color: '#FED348',
      marginBottom: 24
    }
  }, Array.from({
    length: 5
  }).map((_, i) => /*#__PURE__*/React.createElement(Icon, {
    key: i,
    name: "star",
    size: 20,
    color: "#FED348"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Object Sans', sans-serif",
      fontSize: 40,
      lineHeight: '56px',
      fontWeight: 400,
      color: '#fff'
    }
  }, "\"We moved our entire demand\u2011gen program to Livestorm and ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#85E0D1',
      fontWeight: 400
    }
  }, "attendance jumped 54%"), ". The replays keep driving pipeline for weeks.\""), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 32,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: 'linear-gradient(135deg,#447CFD,#0B42C3)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 500,
      fontSize: 16
    }
  }, "Mara Delgado"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#B7D9E1',
      fontSize: 14
    }
  }, "VP Marketing \xB7 Finora"))), /*#__PURE__*/React.createElement(Button, {
    variant: "onDark",
    size: "l",
    icon: "arrow-right"
  }, "Read the case study"))));
}
window.Testimonial = Testimonial;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Testimonial.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/TrustedBy.jsx
try { (() => {
/* global React */

function TrustedBy() {
  const brands = ['SHOPIFY', 'INTERCOM', 'SPENDESK', 'BREVO', 'L\u2019OR\u00C9AL', 'PIPEDRIVE', 'SAP'];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '48px 24px',
      borderTop: '1px solid #EAEEF1',
      borderBottom: '1px solid #EAEEF1',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1328,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      fontSize: 14,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: '#8094A3',
      fontWeight: 500,
      marginBottom: 24
    }
  }, "Trusted by 10,000+ teams worldwide"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 32,
      flexWrap: 'wrap'
    }
  }, brands.map(b => /*#__PURE__*/React.createElement("div", {
    key: b,
    style: {
      fontFamily: "'Object Sans', sans-serif",
      fontSize: 20,
      fontWeight: 600,
      color: '#A4B5C1',
      letterSpacing: '-0.01em'
    }
  }, b)))));
}
window.TrustedBy = TrustedBy;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/TrustedBy.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/ui.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
const {
  useState
} = React;
function Icon({
  name,
  size = 18,
  color
}) {
  // map a handful of icons used by the marketing kit; codepoint = 0xE900 + index (see assets/icon-glyph-map.json)
  // Codepoint = 0xE900 + index in the icon array (see assets/icon-glyph-map.json)
  const map = {
    'arrow-right': 0xE903,
    'check': 0xE907,
    'play': 0xE93A,
    'pause': 0xE935,
    'calendar': 0xE906,
    'menu': 0xE92E,
    'x': 0xE962,
    'chevron-down': 0xE908,
    'linkedin': 0xE929,
    'twitter': 0xE959,
    'youtube': 0xE963,
    'facebook': 0xE917,
    'ai': 0xE901,
    'poll': 0xE93C,
    'reactions': 0xE93F,
    'on-demand': 0xE932,
    'event-management': 0xE914,
    'registration-page': 0xE941,
    'zap': 0xE964,
    'globe': 0xE91C,
    'shield': 0xE94E,
    'users': 0xE95D,
    'trending-up': 0xE958,
    'graduation-cap': 0xE91E,
    'message-circle': 0xE92F,
    'star': 0xE952,
    'room-mic': 0xE946,
    'room-camera': 0xE943,
    'screensharing': 0xE949,
    'room-record': 0xE947
  };
  const ch = map[name] ? String.fromCharCode(map[name]) : '';
  return /*#__PURE__*/React.createElement("i", {
    className: "ls-icon",
    style: {
      fontFamily: 'Icon Font',
      fontStyle: 'normal',
      fontSize: size,
      lineHeight: 1,
      color,
      display: 'inline-flex'
    }
  }, ch);
}
function Button({
  children,
  variant = 'primary',
  size = 'l',
  icon,
  href,
  onClick,
  disabled
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: "'Object Sans', sans-serif",
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: 12,
    border: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 300ms cubic-bezier(0,0,0.2,1)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.4 : 1
  };
  const sizes = {
    m: {
      height: 40,
      padding: '0 12px',
      fontSize: 18
    },
    l: {
      height: 48,
      padding: '0 24px',
      fontSize: 18
    }
  };
  const variants = {
    primary: {
      background: '#0B42C3',
      color: '#fff'
    },
    onDark: {
      background: '#477580',
      color: '#fff'
    },
    // Winter Green — reserved for dark surfaces only
    secondary: {
      background: '#EAEEF1',
      color: '#12262B'
    },
    text: {
      background: 'transparent',
      color: '#232B2F',
      fontWeight: 600,
      padding: 0,
      height: 50
    }
  };
  const [hover, setHover] = useState(false);
  const hoverBg = {
    primary: '#05299E',
    onDark: '#335D67',
    secondary: '#C8D3DA',
    text: 'transparent'
  }[variant];
  const Tag = href ? 'a' : 'button';
  return /*#__PURE__*/React.createElement(Tag, {
    href: href,
    onClick: onClick,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      background: hover && !disabled ? hoverBg : variants[variant].background
    }
  }, children, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 18
  }));
}
function Tag({
  children,
  variant = 'secondary',
  live,
  size = 'm'
}) {
  const variants = {
    primary: {
      background: '#0B42C3',
      color: '#fff'
    },
    secondary: {
      background: '#F0F4FF',
      color: '#0B42C3'
    },
    success: {
      background: '#DFF7F3',
      color: '#0C7C59'
    },
    warning: {
      background: '#FFF4D1',
      color: '#5A3802'
    }
  };
  const sizes = {
    s: {
      height: 24,
      padding: '0 8px',
      fontSize: 12,
      lineHeight: '16px'
    },
    m: {
      height: 32,
      padding: '0 16px',
      fontSize: 14
    }
  };
  const style = live ? {
    background: '#BE3A37',
    color: '#fff'
  } : variants[variant];
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontWeight: 600,
      borderRadius: 8,
      fontFamily: "'Object Sans', sans-serif",
      ...sizes[size],
      ...style
    }
  }, live && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      background: '#fff',
      borderRadius: '50%'
    }
  }), children);
}
function Input({
  size = 'xl',
  placeholder,
  ...props
}) {
  const sizes = {
    m: {
      height: 40,
      padding: '0 12px',
      fontSize: 14,
      borderRadius: 12
    },
    l: {
      height: 48,
      padding: '0 16px',
      fontSize: 18,
      borderRadius: 12
    },
    xl: {
      height: 72,
      padding: '0 24px',
      fontSize: 18,
      borderRadius: 24
    }
  };
  return /*#__PURE__*/React.createElement("input", _extends({
    placeholder: placeholder,
    style: {
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid #C8D3DA',
      background: '#fff',
      color: '#12262B',
      fontFamily: "'Object Sans', sans-serif",
      outline: 'none',
      transition: 'border 300ms cubic-bezier(0,0,0.2,1)',
      ...sizes[size]
    },
    onFocus: e => e.target.style.borderColor = '#0B42C3',
    onBlur: e => e.target.style.borderColor = '#C8D3DA'
  }, props));
}
function Logo({
  inverse = false,
  height = 28
}) {
  const src = inverse ? '../../assets/logo-white.svg' : '../../assets/logo-black.svg';
  return /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: "Livestorm",
    style: {
      height,
      display: 'block'
    }
  });
}
Object.assign(window, {
  Icon,
  Button,
  Tag,
  Input,
  Logo
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/ui.jsx", error: String((e && e.message) || e) }); }

})();
