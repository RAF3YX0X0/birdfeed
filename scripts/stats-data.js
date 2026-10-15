// Delivered results, by service, for the homepage's "results" section.
//
// EVERY figure here is copied from a client export in the local Stats/ folder
// (gitignored: Google Ads screenshots, the Google Ads case study PDF, a Meta
// account snapshot, a Shopify dashboard and a daily ad report sheet) or from
// scripts/work-data.js, which holds the published case studies. Nothing is
// estimated, rounded up or combined across accounts.
//
// Rules this file follows, so the charts stay honest:
//   - Before and after are only compared on RATE metrics (conversion rate,
//     cost per conversion) unless both windows and both budgets are shown,
//     because the exports cover windows of different lengths.
//   - Totals from separate screenshots are never added together: they may be
//     the same account over overlapping windows.
//   - Currencies are kept as the export shows them (AED, USD, GBP, PKR). The
//     AED exports print the symbol as 'dh'; we label it AED, because 'dh' is
//     the conventional abbreviation for the Moroccan dirham and this is a UAE
//     account. Only the label changed, never a figure.
//   - Accounts the client hasn't cleared by name stay anonymous; the named
//     ones (Smart Cities UAE, The Gentry House) are published case studies.
//
// `fmt` controls how a number is drawn, not what it means:
//   pct = a percentage, money = a currency amount, num = a plain count.

const SOURCE_ADS = 'Google Ads account exports supplied by the client';

// ---- Google Ads ------------------------------------------------------------------------------
const ADS = {
  key: 'ads',
  tab: 'Google Ads',
  name: 'Google Ads',
  href: '/services/google-ads/',
  lede: 'Search campaigns rebuilt around intent: themed ad groups, negative keywords, tested ad copy and landing pages that can actually convert the clicks.',
  // Account A: the Google Ads case study. The "before" window covers years of
  // earlier spend and the "after" two months, so only the two rate metrics are
  // compared. Conversions (836 vs 141.50) and spend (AED 67.2K vs AED 3.14K) are
  // deliberately left out: those windows aren't the same length.
  charts: [
    {
      kind: 'delta',
      title: 'Conversion rate, one account',
      note: 'Before, then after two months of restructuring',
      unit: '%',
      fmt: 'pct',
      better: 'up',
      rows: [['Before', 2.44], ['After', 14.45]],
      caption: '5.9× the conversion rate on the same account.',
      source: 'Google Ads case study and account screenshots (AED account)',
    },
    {
      kind: 'delta',
      title: 'Cost per conversion, same account',
      note: 'Before, then after two months',
      unit: 'AED',
      fmt: 'money',
      better: 'down',
      rows: [['Before', 78.05], ['After', 22.21]],
      caption: 'Each conversion cost 72% less.',
      source: 'Google Ads case study and account screenshots (AED account)',
    },
    {
      kind: 'delta',
      title: 'Cost per conversion, a second account',
      note: 'Sep 12 – Dec 12 2024, then Dec 13 2024 – Feb 13 2025',
      unit: 'AED',
      fmt: 'money',
      better: 'down',
      rows: [['Before', 522], ['After', 51.45]],
      caption: 'Conversions went from 22 to 256 across the two windows, on AED 11.5K then AED 13.2K of spend.',
      source: `${SOURCE_ADS} (AED account)`,
    },
  ],
  // Separate accounts, shown separately: these screenshots may overlap in time,
  // so they are never summed into one "total conversions" figure.
  table: {
    title: 'Three more accounts, as exported',
    cols: ['Spend', 'Conversions', 'Cost per conversion'],
    rows: [
      ['Account 1', '$37.7K', '1.46K', '$25.75'],
      ['Account 2', '$22.1K', '1.17K', '$18.95'],
      ['Account 3', '$14.5K', '621', '$23.41'],
    ],
    note: 'Each row is one account’s own export. They cover different periods and are not added together.',
    source: SOURCE_ADS,
  },
  stats: [
    { value: '20.95%', label: 'Conversion rate on a UK account', sub: '18.9K impressions, £0.15 average cost per click' },
    { value: '19.78%', label: 'Conversion rate on another UK account', sub: '37.5K impressions, £0.21 average cost per click' },
    { value: '17.40%', label: 'Click-through rate on a US account', sub: '4.74K clicks from 27.2K impressions' },
  ],
};

// ---- Meta ads and e-commerce -----------------------------------------------------------------
const PAID_SOCIAL = {
  key: 'meta',
  tab: 'Meta Ads',
  name: 'Meta Ads & e-commerce',
  href: '/services/meta-ads/',
  lede: 'Facebook and Instagram campaigns measured the way a shop measures them: spend in, orders and revenue out.',
  charts: [
    {
      kind: 'split',
      title: 'Ad spend against sales',
      note: '29 July – 20 August 2024, one store',
      unit: 'Rs',
      fmt: 'money',
      rows: [['Ad spend', 45663.94], ['Sales', 134143]],
      caption: '2.94× return on ad spend from 56 orders.',
      source: 'Daily ad report supplied by the client (PKR)',
    },
  ],
  stats: [
    { value: '2.94×', label: 'Return on ad spend', sub: 'Rs 45,664 spent, Rs 134,143 in sales' },
    { value: '+39%', label: 'Gross sales on a Shopify store', sub: 'Rs 645,695 over 15 Oct – 2 Nov 2024, against the previous period' },
    { value: '+33%', label: 'Orders over the same period', sub: '57 orders; total sales up 48%' },
    { value: '7.4%', label: 'Click-through rate on a Meta account', sub: '20.3K reach at Rs 7.63 per link click, 9 Jul – 7 Aug 2026' },
  ],
};

// ---- Search and web --------------------------------------------------------------------------
// Smart Cities UAE: a published case study, named with the client's permission.
// Figures from our own monthly performance report for February 2025.
const SEARCH = {
  key: 'seo',
  tab: 'SEO & Web',
  name: 'SEO & web',
  href: '/services/seo/',
  lede: 'Search campaigns, website fixes and tracking, set up together so every visit can be counted and improved.',
  charts: [
    {
      kind: 'bars',
      title: 'Where the website’s visits came from',
      note: 'Smart Cities UAE, February 2025',
      fmt: 'num',
      unit: '',
      rows: [['Direct', 183], ['Organic search', 148], ['Paid search', 85], ['Referral', 18], ['Organic social', 12]],
      caption: 'Sessions in the first month of work, by source.',
      source: 'Monthly performance report, February 2025 (Google Analytics)',
    },
  ],
  stats: [
    { value: '4.29%', label: 'Click-through rate in month one', sub: '56 clicks from 1,305 impressions' },
    { value: '13.43%', label: 'Conversion rate in month one', sub: 'A first-ever Google Ads account' },
    { value: 'AED 4.27', label: 'Average cost per click', sub: 'On AED 239.14 of ad spend' },
    { value: '930', label: 'Website page views', sub: '302 active users, 3 forms and 4 call clicks' },
  ],
  linkText: 'Read the Smart Cities UAE case study',
  linkHref: '/case-studies/#smart-cities-uae',
};

// ---- Social media and creative ---------------------------------------------------------------
// The Gentry House: a published case study, named with the client's permission.
const SOCIAL = {
  key: 'social',
  tab: 'Social & Creative',
  name: 'Social media & creative',
  href: '/services/social-media-marketing/',
  lede: 'Posts, reels and a Google Business Profile looked after together, so the work shows up where customers actually choose.',
  charts: [
    {
      kind: 'bars',
      title: 'What reviewers mention most',
      note: 'The Gentry House, Google reviews',
      fmt: 'num',
      unit: '',
      rows: [['Attention to detail', 15], ['Fade cut', 6], ['Hot towel treatment', 4], ['Straight razor shave', 3]],
      caption: 'Review topics on the profile we manage.',
      source: 'Google Maps review topics, checked 13 October 2026',
    },
    {
      kind: 'bars',
      title: 'Reviews by platform',
      note: 'The Gentry House, both rated 5.0',
      fmt: 'num',
      unit: '',
      rows: [['Google', 201], ['Booksy', 79]],
      caption: '280 reviews across the two, with a perfect rating on each.',
      source: 'Google Maps and Booksy, checked 13 October 2026',
    },
  ],
  stats: [
    { value: '5.0★', label: 'Google rating we maintain', sub: 'The Gentry House, from 201 reviews' },
    { value: '55', label: 'Photos on that Google profile', sub: 'Shot and published by us' },
    { value: '110', label: 'Pieces of creative in our portfolio', sub: '93 posts, 14 videos and 3 creator reels' },
  ],
  linkText: 'Browse the work',
  linkHref: '/examples/',
};

const GROUPS = [ADS, PAID_SOCIAL, SEARCH, SOCIAL];

module.exports = { GROUPS };
