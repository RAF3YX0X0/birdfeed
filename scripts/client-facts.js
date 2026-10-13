// Puts the client's own facts (Client-Requirements-Questionnaire, 2026-10)
// in place of the figures and offers the site carried over from the cloned
// original. One ordered list of replacements, applied everywhere text lives:
// the pages, the original site's bundles, our partials, our motion code, and
// the generators (so a rebuild doesn't bring the old figures back).
//
//   - Contact: hello@madmediamarketing.com; calls are 30 minutes (the
//     client's Calendly event), not 20.
//   - "100+ customers in the US" instead of "20,000+ businesses"; no founding
//     year (none given), so "since 2016" goes; "Since 2016" stats become the
//     client's hours, 24/7.
//   - The offer: a free first month instead of the 14-day money-back
//     guarantee, on the marketing pages. The legal pages (privacy, terms,
//     refund) keep their wording until the client sends the trial's terms;
//     so do the refund-policy answer and the Pro plan's own FAQ.
//
// Safe to run again: every replacement's target text is gone after it runs.
//
//   node scripts/client-facts.js

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const CONTACT = [
  ['hello@feedbird.com', 'hello@madmediamarketing.com'],
  // Calls are booked on the client's Calendly, a 30-minute event.
  ['20-min demo', '30-min demo'],
  ['20-minute', '30-minute'],
  ['20 minutes. We', '30 minutes. We'],
  ['In 20 minutes, we', 'In 30 minutes, we'],
  // The demo pop-up, footers, explainers and the book-demo page's own title.
  ['FREE 20-MIN DEMO', 'FREE 30-MIN DEMO'],
  ['20-min call', '30-min call'],
  ['20-min meeting', '30-min meeting'],
  ['20-Minute Demo', '30-Minute Demo'],
  ['20 min · video call', '30 min · video call'],
  ['20 min \\xB7 video call', '30 min \\xB7 video call'],
  ['20 min · your strategist', '30 min · your strategist'],
  ["See if we're a fit, 20 min", "See if we're a fit, 30 min"],
  ['20 minutes: the platform', '30 minutes: the platform'],
  ['"20 minutes. <em>No pressure', '"30 minutes. <em>No pressure'],
  ["'20 minutes. <em>No pressure", "'30 minutes. <em>No pressure"],
];

const NUMBERS = [
  // Phrases first (they drop the founding year), then the bare figure.
  ['serving 20,000+ small businesses since 2016', 'serving 100+ small businesses across the US'],
  ['serving 20,000+ businesses since 2016', 'serving 100+ businesses across the US'],
  ['has served 20,000+ businesses since 2016', 'has served 100+ businesses across the US'],
  ['serves 20,000+ businesses since 2016', 'serves 100+ businesses across the US'],
  ['20,000+ businesses served since 2016', '100+ businesses served across the US'],
  ['Trusted by 20,000+ businesses since 2016.', 'Trusted by 100+ businesses across the US.'],
  ['trusted by 20,000+ businesses since 2016', 'trusted by 100+ businesses across the US'],
  ['its 20,000+ clients since 2016', 'its 100+ clients'],
  ['Businesses served since 2016', 'Businesses served across the US'],
  ['businesses served since 2016', 'businesses served across the US'],
  ['Since 2016 · 20,000+ businesses', 'Open 24/7 · 100+ businesses'],
  ['200+ vetted creatives. Since 2016.', 'Vetted creatives. Open 24/7.'],
  ['Served since 2016, from local shops to growing brands.', 'Across the US, from local shops to growing brands.'],
  ['{title:"2016: founded",text:"Started to make professional marketing affordable for small businesses."}', '{title:"St. Louis, Missouri",text:"Headquartered in St. Louis, serving businesses across the US."}'],
  ["{ title: '2016: founded', text: 'Started to make professional marketing affordable for small businesses.' }", "{ title: 'St. Louis, Missouri', text: 'Headquartered in St. Louis, serving businesses across the US.' }"],
  ['founded 2016, ', ''],
  [',"foundingDate":"2016"', ''],
  ['Nearly a decade refined', 'Open around the clock'],
  ['Refined for nearly a decade', 'Open around the clock'],
  ['Since 2016', '24/7'],
  ['<span class="abx-story__year" aria-hidden="true">2016</span>', '<span class="abx-story__year" aria-hidden="true">100+</span>'],
  ['data-count="20000"', 'data-count="100"'],
  ['20,000+', '100+'],
  [' since 2016', ''],
  // No company type or EU presence given: the client is in St. Louis.
  ['© 2026 MadMarketing, Inc. · US + EU', '© 2026 MadMarketing · St. Louis, MO'],
];

// The cloned original's own proof, which isn't ours: its team size ("200+
// creatives", "fewer than 0.1% of applicants"), its rating ("4.6/5 from
// 800+ reviews") and its Scottsdale head office. Sentences lose the claim;
// stat blocks show a real figure instead: our biggest client's Google
// rating (The Gentry House, 5.0 from 201 reviews) or the number of client
// case studies (scripts/work-data.js). The compare page's facts about other
// companies (one is based in Scottsdale) are left alone.
const PROOF = [
  ["MadMarketing is headquartered in Scottsdale, Arizona and runs fully remote, with 200+ team members worldwide across the Americas, Europe, and Asia. Everyone works exclusively for MadMarketing; we don't subcontract, and every marketer and creative goes through a rigorous vetting process. We accept fewer than 0.1% of applicants.",
    'MadMarketing is headquartered in St. Louis, Missouri, and serves businesses across the US. Every marketer and creative on your account is vetted by our team.'],
  ['We have 200+ marketers and creatives and accept fewer than 0.1% of applicants. ', ''],
  ['200+ vetted creatives (under 0.1% of applicants) serving 100+ small businesses across the US.', 'vetted creatives serving 100+ small businesses across the US.'],
  ['About MadMarketing: 200+ Creatives, 100+ Businesses', 'About MadMarketing: 100+ Businesses Served'],
  ['200+ vetted marketers and creatives serving 100+ businesses across the US.', 'Vetted marketers and creatives serving 100+ businesses across the US.'],
  ['The all-in-one marketing platform where 200+ expert creatives', 'The all-in-one marketing platform where expert creatives'],
  ['dedicated team of 200+ real creatives', 'dedicated team of real creatives'],
  ['dedicated team of 200+ human creatives', 'dedicated team of human creatives'],
  ['A team of 200+ real creatives produces the work', 'A team of real creatives produces the work'],
  ['a team of 200+ vetted marketers, designers, writers, and editors', 'a team of vetted marketers, designers, writers, and editors'],
  ['200+ marketers, designers, and video editors', 'Marketers, designers, and video editors'],
  ['15+ services, 200+ vetted specialists, one platform.', '15+ services and vetted specialists on one platform.'],
  ['200+ real marketers &amp; designers', 'real marketers &amp; designers'],
  ['200+ real marketers & designers', 'real marketers & designers'],
  ['A 200+ person team on demand', 'A full team on demand'],
  ['`200+ real creatives`', '`Real creatives`'],
  ['>200+ real creatives<', '>Real creatives<'],
  ['Rated 4.6/5 by 100+ businesses.', 'Trusted by 100+ businesses.'],
  ['Rated 4.6/5 across 800+ reviews.', 'Real work for real clients.'],
  ['Hand-picked, trained creatives in the EU, US and Latin America, in your time zone, fluent in your market, accountable for every post.', 'Hand-picked, trained creatives, fluent in your market, accountable for every post.'],
  ['<dt>Real creatives on the team</dt><dd data-count="200" data-suffix="+">200+</dd>', '<dt>Client case studies</dt><dd data-count="10">10</dd>'],
  ['<dt>Average rating, 800+ reviews</dt><dd>4.6/5</dd>', '<dt>Biggest client on Google</dt><dd>5.0★</dd>'],
  ['4.6/5 avg rating', '5.0★ biggest client on Google'],
  ['4.6 / 5', 'Open 24/7'],
  ['200+ vetted creatives. Open 24/7.', 'Vetted creatives. Open 24/7.'],
  ['200+ vetted creatives', 'Vetted creatives'],
];
// The cloned site's own terms (month-to-month, cancel from a dashboard,
// its product platform) on the pages that still carry them, as the client's
// rules have it: every plan starts with a written agreement (scripts/offer-data.js).
const OFFER = [
  ['None. Plans are month-to-month, and the demo is completely free with no obligation to sign up.', 'None. The call is free, with no obligation. If you go ahead, your plan starts with a written agreement.'],
  ['Most clients are onboarded within a few days of the call, and your first batch of content typically arrives within 5–7 business days of submitting your brief.', 'After the call we send you a scope and a quote. Once you approve it in writing, we start onboarding and agree the timeline for your first deliverables with you.'],
  ['One of our demo specialists. They run these calls every day, know the product inside out, and can pull up real examples from your industry on the spot.', 'A member of our team, who can walk you through real examples of our work and answer your questions.'],
  ["We learn about your business and goals, walk you through how MadMarketing works with a live look at the platform, show examples from your industry, and recommend the right services. It's a conversation, not a hard pitch.", "We learn about your business and goals, walk you through how MADMarketing works, show examples of our work, and recommend the right services. It's a conversation, not a hard pitch."],
  ['No contracts, cancel anytime', 'A written agreement first'],
  ['Month-to-month. Pause or cancel from your dashboard in one click.', 'Every plan starts with a written agreement that sets out billing, cancellation and deliverables.'],
];

// Stat blocks: a figure and its label are separate text in the markup and
// separate strings in the bundles, so each is swapped whole, the same way in
// both (a page's server markup has to match what its bundle renders).
const TEAM = ['Real creatives on the team', 'Writers & SEO specialists', 'Marketers & specialists', 'vetted marketers & writers', 'Vetted in-house creatives', 'Vetted creatives', 'vetted marketers & creatives', 'Creatives fulfilling for you', 'real creatives, never AI slop'];
const NODES = [
  ['Avg rating · 800+ reviews', 'Biggest client on Google'],
  ['· 800+ reviews', '· biggest client on Google'],
  ['800+ reviews', 'biggest client on Google'],
  ['avg rating', 'biggest client on Google'],
  ['4.6/5', '5.0★'],
  ['200+', '10'],
  ...TEAM.map((t) => [t, 'Client case studies']),
];

// Marketing pages only (see LEGAL below). Specific sentences first.
const TRIAL = [
  ['14-day money back · no contracts · cancel anytime', 'First month free · no contracts · cancel anytime'],
  ['From $99/mo · cancel anytime · 14-day satisfaction guarantee', 'From $99/mo · cancel anytime · first month free'],
  ['From $99/mo · no contract · 14-day guarantee', 'From $99/mo · no contract · first month free'],
  ['Every plan is month-to-month with a 14-day money-back guarantee', 'Every plan is month-to-month, and your first month is free'],
  ['every plan is month-to-month with a 14-day money-back guarantee', 'every plan is month-to-month, and your first month is free'],
  ['month-to-month with no contract, backed by a 14-day satisfaction guarantee', 'month-to-month with no contract, and your first month is free'],
  ['every new plan is backed by a 14-day satisfaction guarantee', 'every new plan starts with a free first month'],
  ['Every new subscription is backed by our 14-day satisfaction guarantee.', 'Your first month is on us. See the work, the process and the results before you pay.'],
  ['and a 14-day satisfaction guarantee on every new plan', 'and a free first month on every new plan'],
  ['no contract and a 14-day money-back guarantee', 'no contract and a free first month'],
  ['with a 14-day money-back guarantee on email design', 'with a free first month'],
  ['carries a 14-day money-back guarantee and no contract', 'starts with a free first month and no contract'],
  ['with a 14-day money-back guarantee on creative services', 'with a free first month'],
  ['with no contracts and a 14-day satisfaction guarantee on creative services', 'with no contracts and a free first month'],
  ['and a 14-day satisfaction guarantee on creative services', 'and a free first month'],
  ['No contracts and a 14-day satisfaction guarantee on creative work seal it', 'No contracts and a free first month seal it'],
  ['with a 7-day cancellation notice and a 14-day satisfaction guarantee', 'with a 7-day cancellation notice and a free first month'],
  ['If none of it is right, the 14-day guarantee has you covered, as long as you haven’t approved or scheduled any of it.', 'And your first month is free, so you see the work before you pay for it.'],
  ['Revisions are included, and the 14-day satisfaction guarantee covers your first batch if you haven’t approved or scheduled any of it.', 'Revisions are included, and your first month is free.'],
  [", and creative services are backed by a 14-day satisfaction guarantee if it still isn't right and you haven't approved or scheduled any of it.", ', and your first month is free.'],
  ['[`Money-back guarantee`,`14 days on creative services`', '[`Risk-free start`,`First month free`'],
  ['[`Money-back guarantee`,`14 days`', '[`Risk-free start`,`First month free`'],
  ['14-day money-back, cancel anytime', 'First month free, cancel anytime'],
  ['14-day money-back guarantee', 'First month free'],
  ['14-day money-back', 'First month free'],
  ['14-day money back', 'First month free'],
  ['"14-day satisfaction"', '"First month free"'],
  ['14-day satisfaction', 'First month free'],
  // The guarantee section (our partials; the cloned original keeps its
  // heading, which inject-fx.js uses to find it).
  ['Not happy with your first batch? <em>Get your money back.</em>', 'Try MadMarketing <em>free for a month.</em>'],
  ['<li><b>14 full days</b> to review your first batch and work through revisions with your team.</li>', '<li><b>A full month</b> of real work from your team, made for your brand.</li>'],
  ['<li><b>Full refund</b> of your first month if you’re still not satisfied and haven’t approved or scheduled any of it.</li>', '<li><b>No contracts.</b> Keep going after your free month, or cancel anytime.</li>'],
  ['>Get started risk-free</a>', '>Start your free month</a>'],
  ['<a class="hx-btn hx-btn--white" href="/refund/">Read the full policy</a>', '<a class="hx-btn hx-btn--white" href="/book-demo/">Book a demo</a>'],
  ['<small>Day</small><b>14</b><span>Satisfaction<br>guarantee</span>', '<small>Month</small><b>1</b><span>Free<br>trial</span>'],
  ['<b>100%</b><span>First-month<br>refund</span>', '<b>$0</b><span>For your<br>first month</span>'],
  ['<li><b>Day 1</b><span>Your first batch lands</span></li>', '<li><b>Week 1</b><span>Your first batch lands</span></li>'],
  ['<li><b>Days 2–13</b><span>Revisions with your team</span></li>', '<li><b>Weeks 2–4</b><span>More work, revised with you</span></li>'],
  ['<li><b>Day 14</b><span>Keep it, or get a refund</span></li>', '<li><b>Month 2</b><span>Keep going, or cancel</span></li>'],
  ['14-day guarantee', 'First month free'],
];

// Forms: the white-label application posted to the cloned original's own
// automation webhook (so applicants' details went to someone else). Until
// the client has a form service, it opens the applicant's email app with the
// application filled in, addressed to the client.
const FORMS = [
  ['try{fetch(`https://hook.eu2.make.com/8x1pqyjxqbff3l54vzhq6d201avbaj13`,{method:`POST`,mode:`no-cors`,headers:{"Content-Type":`application/json`},body:JSON.stringify(o)}).catch(()=>{})}catch{}',
    'try{let b=[`Email: ${o.email}`,`Website: ${o.website}`,`Clients: ${o.clients}`,`Services: ${o.servicesText}`,`Why: ${o.why}`].join(`\\n`);window.location.href=`mailto:hello@madmediamarketing.com?subject=${encodeURIComponent(`White-label application`)}&body=${encodeURIComponent(b)}`}catch{}'],
];

// Legal pages keep the trial wording as is (and the facts script itself).
const LEGAL = [/^privacy\//, /^terms\//, /^refund\//, /^_astro\/fb-legal\./, /^fx\/partials\/heroes\/(privacy|terms|refund)\.html$/];
// Answers that describe the refund policy itself, and the Pro plan's own
// guarantee FAQ, stay as they are (they follow the legal terms).
const KEEP = ['What is your refund policy?', 'Is there a money-back guarantee?'];

function files() {
  const out = [];
  const walk = (dir, test) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!['node_modules', '.git', 'dist'].includes(e.name)) walk(p, test); } else if (test(p)) out.push(p);
    }
  };
  // Pages: every */index.html at the top level, and the homepage.
  out.push(path.join(ROOT, 'index.html'));
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    const p = path.join(ROOT, e.name, 'index.html');
    if (e.isDirectory() && fs.existsSync(p)) out.push(p);
  }
  walk(path.join(ROOT, '_astro'), (p) => p.endsWith('.js'));
  walk(path.join(ROOT, 'fx', 'partials'), (p) => /\.(html|json)$/.test(p));
  for (const f of fs.readdirSync(path.join(ROOT, 'fx'))) if (f.endsWith('.js')) out.push(path.join(ROOT, 'fx', f));
  for (const f of fs.readdirSync(path.join(ROOT, 'scripts'))) if (/\.(js|json)$/.test(f) && f !== 'client-facts.js') out.push(path.join(ROOT, 'scripts', f));
  return out;
}

const counts = new Map();
let changed = 0;
for (const file of files()) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const src = fs.readFileSync(file, 'utf8');
  let s = src;
  const legal = LEGAL.some((re) => re.test(rel));
  // Is this spot inside one of the kept answers? (Its question comes shortly
  // before, with no other question in between.)
  const BOUNDARY = ['{q:`', '],[`', '</details>', '"@type":"Question"'];
  const inKept = (before) => KEEP.some((k) => {
    const i = before.lastIndexOf(k);
    return i !== -1 && !BOUNDARY.some((m) => before.indexOf(m, i + k.length) !== -1);
  });
  const apply = (pairs, guard) => pairs.forEach(([a, b]) => {
    const parts = s.split(a);
    if (parts.length === 1) return;
    let n = 0;
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      if (guard && inKept(out.slice(-700))) out += a + parts[i];
      else { out += b + parts[i]; n++; }
    }
    s = out;
    if (n) counts.set(a, (counts.get(a) || 0) + n);
  });
  apply(CONTACT, false);
  apply(FORMS, false);
  // Markup escapes what the bundles write plainly (& and ').
  const markup = /\.(html|json)$/.test(rel);
  const escHtml = (t) => t.replace(/&/g, '&amp;').replace(/'/g, '&#x27;');
  const LIST = [...PROOF, ...OFFER];
  apply(markup ? [...LIST, ...LIST.map(([a, b]) => [escHtml(a), escHtml(b)]).filter(([a], i) => a !== LIST[i][0])] : LIST, false);
  // Legal pages keep their own trial wording, but their menu is the shared
  // one, whose bundle already says "First month free".
  for (const [a, b] of legal ? [...NODES, ['14-day guarantee', 'First month free']] : NODES) {
    const re = markup ? new RegExp(`>(\\s*)${escHtml(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*)<`, 'g') : null;
    const lit = markup ? null : new RegExp(`([\`"])(\\s*)${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*)\\1`, 'g');
    const n = (s.match(markup ? re : lit) || []).length;
    if (!n) continue;
    s = markup ? s.replace(re, `>$1${escHtml(b)}$2<`) : s.replace(lit, `$1$2${b}$3$1`);
    counts.set('node: ' + a, (counts.get('node: ' + a) || 0) + n);
  }
  apply(NUMBERS, false);
  if (!legal) apply(TRIAL, true);
  if (s !== src) { fs.writeFileSync(file, s); changed++; }
}
console.log(`client facts: ${changed} files changed`);
[...counts].sort((x, y) => y[1] - x[1]).forEach(([a, n]) => console.log(`  ${String(n).padStart(4)}  ${a.slice(0, 90)}`));
