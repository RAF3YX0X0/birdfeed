// Per service page: its own work (from the portfolio) and the case studies
// whose service matches it (fx/cases.json). Used by scripts/build-sections.js.
const META = ['client-a-ecommerce-scaling', 'client-b-high-acquisition-cost', 'client-c-vocational-training', 'client-d-mass-market-volume'];
const SEO = ['diy-to-thriving-seo-backlinks', 'act-for-pain', 'psychology-in-the-park'];
const POSTS = ['natures-glow-emporium', 'tanseys', 'casa-m-spice-co', 'miss-sprinkles-gelato'];
const posts = { title: 'Posts we’ve <em>made.</em>', lede: 'Real posts, designed and written by our team for clients across industries.' };

module.exports = {
  'social-media-management': { work: 'posts', workCopy: posts, cases: POSTS, label: 'social media clients' },
  'social-media-services': { work: 'posts', workCopy: posts, cases: [...POSTS.slice(0, 2), 'district-raleigh', 'ingrid-s-clay'], label: 'social media clients' },
  'short-form-video': { work: 'videos', workCopy: { title: 'Videos we’ve <em>made.</em>', lede: 'Real short-form videos edited by our team. Hover (or scroll on a phone) to play.' }, cases: ['ingrid-s-clay', 'casa-m-spice-co'], label: 'short-form video clients' },
  'ugc-videos': { work: 'ugc', workCopy: { title: 'UGC from <em>our creators.</em>', lede: 'Real creator videos made for our clients. Hover (or scroll on a phone) to play.' } },
  'instagram-growth': { cases: ['district-raleigh', 'a-pensive-mans-coffee'], label: 'Instagram growth clients' },
  'meta-ads-management': { cases: META, label: 'Meta ads clients' },
  'ppc-services': { cases: META, label: 'paid ads clients' },
  'ad-creative': { cases: META, label: 'ad accounts we create for' },
  'email-design': { cases: ['supplement-spot', 'upcode', 'client-b-high-acquisition-cost'], label: 'email clients' },
  'seo-services': { cases: SEO, label: 'SEO clients' },
  'managed-seo': { cases: SEO, label: 'SEO clients' },
  'seo-blog-posts': { cases: ['act-for-pain', 'psychology-in-the-park'], label: 'SEO blog clients' },
  'seo-backlinks': { cases: ['diy-to-thriving-seo-backlinks'], label: 'link building clients' },
};
