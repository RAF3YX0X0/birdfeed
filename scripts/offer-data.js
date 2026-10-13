// What MADMarketing sells and what it costs: the one source for the service
// pages, the pricing page, the homepage's plans, the ad landing page and
// the menus. From the client's "Services & Packages" document (2026-10).
// The words follow that document; nothing here adds a service, a
// deliverable or a price to it.
//
// The document calls the rate card "proposed launch pricing" and the add-on
// ranges "brainstorming estimates, not approved prices": the add-ons are
// listed by name and their ranges stay off the site until the client
// approves them (SHOW_ADDON_PRICES).

const SHOW_ADDON_PRICES = false;

// Six families. Each service: [name, what it covers].
const FAMILIES = [
  {
    key: 'search', name: 'MAD Search', tag: 'Local SEO & organic visibility',
    services: [
      ['Local SEO', 'Local keyword and competitor research, business listing consistency, on-page local signals, visibility monitoring and monthly reporting.'],
      ['Google Business Profile / Google Maps SEO', 'Profile audit, eligible field optimization, categories, services, business information, review workflow guidance and geo-grid observations.'],
      ['Citation Management', 'Submission or correction actions on relevant directories. Third-party acceptance or indexing is not guaranteed.'],
      ['Technical & On-Page SEO', 'Indexing, crawlability, redirects, canonicals, metadata, internal linking, page structure, technical audits and prioritized fixes.'],
      ['Content SEO', 'Search-intent mapping, service pages, editorial planning, content refreshes and helpful resource development.'],
      ['E-commerce SEO', 'Category and product SEO and technical recommendations, quoted based on store complexity.'],
    ],
  },
  {
    key: 'ai', name: 'MAD AI Visibility', tag: 'AEO & GEO',
    services: [
      ['Answer Engine Optimization (AEO)', 'Answer-first content, question research, FAQs, clear service definitions and structured information.'],
      ['Generative Engine Optimization (GEO)', 'Entity clarity, AI-search readiness audits, useful evidence-backed content and observed AI brand mention tracking.'],
      ['Structured Data', 'Appropriate organization, service, breadcrumb and other supported schema recommendations.'],
      ['AI Visibility Audits', 'Documented prompt testing, observed mentions, content gaps and an improvement roadmap. No inclusion guarantee.'],
    ],
  },
  {
    key: 'performance', name: 'MAD Performance', tag: 'Paid acquisition',
    services: [
      ['Google Ads', 'Search campaign strategy, keyword planning, ad copy, negative keywords, tracking, bidding reviews and reporting.'],
      ['Meta Ads', 'Facebook and Instagram creative strategy, audience testing, lead funnels, retargeting and performance reviews.'],
      ['Additional Paid Channels', 'TikTok, LinkedIn, YouTube and other channels where relevant and separately scoped.'],
      ['Measurement & Retargeting', 'GA4, GTM, pixels, conversion APIs where applicable, event design and funnel analysis.'],
    ],
  },
  {
    key: 'social', name: 'MAD Social & Creative', tag: 'Social media and creative',
    services: [
      ['Social Media Management', 'Channel strategy, content calendars, posting workflows, moderation scope and reporting.'],
      ['Creative Production', 'Graphics, carousels, short-form reels, ad creatives, video edits and brand-aligned messaging.'],
      ['Branding', 'Identity systems, creative direction, brand guidelines and campaign concepts.'],
      ['UGC & Influencer Support', 'Creator briefs, sourcing support and campaign coordination, subject to separate budgets.'],
    ],
  },
  {
    key: 'web', name: 'MAD Web & Conversion', tag: 'Websites and conversion',
    services: [
      ['Website Development', 'WordPress and Shopify development or improvement, responsive pages and technical handoff.'],
      ['Landing Pages', 'Offer positioning, UX copy, lead forms, booking integrations and conversion-focused page design.'],
      ['Conversion Rate Optimization', 'Form friction, CTA clarity, page hierarchy, user journeys, analytics and iterative testing.'],
      ['Website Maintenance', 'Updates, monitoring and maintenance as separately defined.'],
    ],
  },
  {
    key: 'automation', name: 'MAD Automation', tag: 'CRM and follow-up',
    services: [
      ['CRM Setup', 'GoHighLevel or other suitable CRM pipeline configuration, stages and lead routing.'],
      ['Lead Follow-Up', 'Permission-based email and SMS reminders, booking workflows, notifications and handoffs.'],
      ['AI-Assisted Workflows', 'Response drafting and workflow support with review and privacy safeguards.'],
      ['Reporting Automation', 'Dashboards, KPI summaries and integration of lead-source and sales-stage data.'],
    ],
  },
];

// The service pages (the client's suggested navigation), each under the
// family it belongs to. [path, menu name, one line for menus]
const PAGES = [
  { family: 'search', href: '/services/local-seo/', name: 'Local SEO', line: 'Get found by customers nearby' },
  { family: 'search', href: '/services/google-maps-seo/', name: 'Google Maps SEO', line: 'A complete Google Business Profile' },
  { family: 'search', href: '/services/seo/', name: 'SEO', line: 'Technical, on-page and content SEO' },
  { family: 'ai', href: '/services/ai-search-optimization/', name: 'AI Search Visibility', line: 'AEO and GEO: be understood by AI search' },
  { family: 'performance', href: '/services/google-ads/', name: 'Google Ads', line: 'Search campaigns built on outcomes' },
  { family: 'performance', href: '/services/meta-ads/', name: 'Meta Ads', line: 'Facebook and Instagram advertising' },
  { family: 'social', href: '/services/social-media-marketing/', name: 'Social Media Marketing', line: 'Management, creative and branding' },
  { family: 'web', href: '/services/web-design/', name: 'Web Design & Conversion', line: 'Websites, landing pages and CRO' },
  { family: 'automation', href: '/services/marketing-automation/', name: 'Marketing Automation', line: 'CRM, follow-up and reporting' },
];

// Local SEO monthly packages (launch pricing, USD).
const PLANS = [
  {
    key: 'local', name: 'MAD Local', price: 199, tagline: 'Entry-level local presence management',
    short: 'Essential Google Business Profile and local listing management.',
    items: [
      'Google Business Profile management',
      'Up to 5 appropriate citation submissions or corrections per month',
      '2 Google Business Profile updates/posts per month',
      'Review-response support',
      'Agreed local keyword monitoring',
      'Monthly performance summary',
    ],
  },
  {
    key: 'growth', name: 'MAD Local Growth', price: 449, tagline: 'Ongoing local growth: the plan we recommend', recommended: true, builds: 'MAD Local',
    short: 'Ongoing Google Maps optimization, citations, website SEO improvements, and competitor monitoring.',
    items: [
      'Up to 10 citation actions per month (instead of 5)',
      '4 Google Business Profile updates/posts per month (instead of 2)',
      'Optimization of up to 2 existing website pages per month',
      'Review-request workflow setup',
      'Competitor observations and monthly strategy review',
    ],
  },
  {
    key: 'authority', name: 'MAD Search Authority', price: 599, tagline: 'Deeper website and local search optimization', builds: 'MAD Local Growth',
    short: 'Advanced local and website SEO, content optimization, and AI-search readiness.',
    items: [
      'Technical SEO monitoring and priority recommendations',
      '2 scoped content or page deliverables per month',
      'Legitimate local link outreach',
      'Basic AEO/GEO recommendations',
      'Conversion tracking review',
    ],
  },
];
const FULL_GROWTH = {
  key: 'full', name: 'MAD Full Growth', price: null, tagline: 'Multi-channel growth partnership',
  short: 'A custom combination of SEO, paid ads, social media, website/CRO and automation.',
  items: [
    'Custom combination of SEO, paid ads, social media, website/CRO and automation',
    'Defined deliverables, account responsibilities and reporting cadence',
    'Media budgets and third-party costs quoted separately',
  ],
};
const FROM = Math.min(...PLANS.map((p) => p.price)); // the lowest monthly plan

// The free entry offer.
const CHALLENGE = {
  name: 'MAD 30-Day Visibility Challenge',
  who: 'For approved local businesses with an existing verified Google Business Profile.',
  terms: ['$0 agency fee', 'No credit card', 'No automatic subscription'],
  items: [
    'Google Business Profile audit and eligible optimization',
    'Local keyword and competitor analysis',
    'Up to 10 citation submission/correction actions',
    'Baseline and follow-up local search visibility snapshots',
    'Ethical customer review-growth recommendations',
    'Personalized 90-day growth roadmap and transparent final report',
  ],
  note: 'Delivery is subject to eligibility, available capacity, timely client approvals and account access. No rankings, traffic, directory publication, AI mentions, or lead volumes are guaranteed.',
};

// Optional add-ons. [name, range, unit] (the ranges aren't approved prices yet).
const ADDONS = [
  ['AI Search Visibility Audit', '$99–$199', 'one-time'],
  ['AI Visibility Optimization', '$199–$399', '/ month'],
  ['AI Lead Response Automation', '$199–$499', 'setup + usage'],
  ['AI Review Response Assistant', '$49–$99', '/ month'],
  ['AI Content Repurposing', '$149–$299', '/ month'],
  ['AI Marketing Reporting', '$49–$149', '/ month'],
];

// How we work with clients (the document's commercial rules, as they read to a customer).
const RULES = [
  ['Prices are in US dollars', 'Each plan starts with a written agreement that sets out billing, cancellation, service levels and deliverables.'],
  ['What a plan doesn’t include', 'Advertising spend, hosting, paid directory listings, premium software and extensive development are excluded unless they’re written into your agreement.'],
  ['What needs its own scope', 'Multi-location work, substantial new page builds, on-site filming, custom integrations and high-volume creative production are scoped and quoted separately.'],
  ['Your accounts stay yours', 'You own your business profiles and advertising accounts. We work through role-based access and never ask for your passwords.'],
  ['No guaranteed outcomes', 'We don’t guarantee Google positions, AI recommendations, review counts, traffic, ROAS or leads. We guarantee the agreed work and transparent reporting.'],
  ['The free trial stays free', 'The 30-day challenge never turns into a paid subscription without your explicit approval.'],
];

const money = (n) => '$' + n.toLocaleString('en-US');

module.exports = { SHOW_ADDON_PRICES, FAMILIES, PAGES, PLANS, FULL_GROWTH, FROM, CHALLENGE, ADDONS, RULES, money };
