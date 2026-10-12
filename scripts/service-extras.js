// Per service page: its own work (from the portfolio) and the case studies
// whose service matches it (fx/cases.json, from scripts/work-data.js). Used
// by scripts/build-sections.js. A page with no matching client shows none.
const SOCIAL = ['the-gentry-house', 'tiktak-moving', 'freshul', 'wezatech'];
const posts = { title: 'Posts we’ve <em>made.</em>', lede: 'Real posts, designed and written by our team for our clients.' };

module.exports = {
  'social-media-management': { work: 'posts', workCopy: posts, cases: SOCIAL, label: 'social media clients' },
  'social-media-services': { work: 'posts', workCopy: posts, cases: [...SOCIAL.slice(0, 3), 'luxury-connection-tourism'], label: 'social media clients' },
  'short-form-video': { work: 'videos', workCopy: { title: 'Videos we’ve <em>made.</em>', lede: 'Real short-form videos made by our team for our clients. Hover (or scroll on a phone) to play.' }, cases: ['the-gentry-house', 'freshul', 'tiktak-moving', 'pink-salt'], label: 'short-form video clients' },
  'ugc-videos': { work: 'ugc', workCopy: { title: 'Creator videos <em>we’ve run.</em>', lede: 'Real creator reels from our clients’ campaigns. Hover (or scroll on a phone) to play.' }, cases: ['freshul'], label: 'creator campaigns' },
  'meta-ads-management': { cases: ['the-gentry-house', 'freshul', 'she-avenue'], label: 'Meta ads clients' },
  'ppc-services': { cases: ['smart-cities-uae'], label: 'paid search clients' },
  'google-ads-management': { cases: ['smart-cities-uae'], label: 'Google Ads clients' },
  'ad-creative': { cases: ['the-gentry-house', 'freshul', 'she-avenue'], label: 'ad creative clients' },
  'conversion-tracking': { cases: ['smart-cities-uae'], label: 'tracking clients' },
  'landing-pages': { cases: ['the-gentry-house', 'growzium'], label: 'web clients' },
  'seo-services': { cases: ['the-gentry-house', 'smart-cities-uae'], label: 'search clients' },
  'managed-seo': { cases: ['the-gentry-house', 'smart-cities-uae'], label: 'search clients' },
};
