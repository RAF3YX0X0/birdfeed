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
  ['200+ vetted creatives. Since 2016.', '200+ vetted creatives. Open 24/7.'],
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
  apply(NUMBERS, false);
  if (!legal) apply(TRIAL, true);
  if (s !== src) { fs.writeFileSync(file, s); changed++; }
}
console.log(`client facts: ${changed} files changed`);
[...counts].sort((x, y) => y[1] - x[1]).forEach(([a, n]) => console.log(`  ${String(n).padStart(4)}  ${a.slice(0, 90)}`));
