// The Privacy Policy (/privacy/), Terms of Service (/terms/) and Refund &
// Cancellation Policy (/refund/),
// written from what the client has stated: the commercial rules, services and
// plans in scripts/offer-data.js (their "Services & Packages" document) and the
// trial terms (scripts/build-landing.js builds /trial-terms/). Where the client
// hasn't decided something (refund amounts, notice periods, governing law),
// the page points to the written agreement instead of inventing it.
//
// Plain pages: inject-fx.js adds the navbar, footer and FX layer;
// optimize-pages.js the SEO tags.
//
//   node scripts/build-legal-pages.js   (then build-fx.js, optimize-pages.js)
const fs = require('fs');
const path = require('path');
const O = require('./offer-data');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://madmediamarketing.com';
const EMAIL = 'hello@madmediamarketing.com';
const ADDRESS = 'MADMarketing, 2055 Craigshire Dr, St. Louis, MO 63146, United States';
const UPDATED = 'October 13, 2026';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Paragraph text may carry a link written as [label](href).
const text = (s) => esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

const plans = O.PLANS.map((p) => `${p.name} (${O.money(p.price)} per month)`).join(', ');
const families = O.FAMILIES.map((f) => f.name).join(', ');

// ---- Terms of Service ---------------------------------------------------------------------------
const TERMS = [
  ['1. Who we are and what these terms cover', [
    `These terms apply to your use of this website and to the services MADMarketing (“we”, “us”) provides to your business (“you”). MADMarketing is a digital marketing agency based at ${ADDRESS.replace('MADMarketing, ', '')}.`,
    'Every paid engagement is also governed by a written agreement or proposal that you approve before work begins. It sets out the scope, deliverables, billing, cancellation and service levels for your account. If your written agreement and these terms differ, your written agreement applies.',
  ], 'These terms are the ground rules. Your written agreement covers the details of your account, and it wins if the two differ.'],
  ['2. Our services', [
    `We offer services in six families: ${families}. Each service is described on its page under [Services](/services/), and what we deliver for you is the scope set out in your written agreement.`,
    'Work outside that scope, including multi-location work, substantial new page builds, on-site filming, custom integrations and high-volume creative production, is scoped and quoted separately before we start it.',
  ], 'We deliver what your agreement describes. Anything extra gets its own quote first.'],
  ['3. The free 30-Day Visibility Challenge', [
    `The ${O.CHALLENGE.name} is a defined 30-day scope of local SEO work for approved local businesses, with no agency fee, no credit card and no automatic subscription. Its full terms are on the [Trial Terms](/trial-terms/) page.`,
    'The free trial never turns into a paid subscription without your explicit approval.',
  ], 'The free trial is free, and it ends on its own unless you choose a plan.'],
  ['4. Plans, prices and payment', [
    `All prices are in US dollars. Our local SEO plans are ${plans}. ${O.FULL_GROWTH.name} and our other services are quoted to your scope. Current prices are on our [Pricing](/pricing/) page.`,
    'The price in your signed agreement applies to your agreement. We may change the prices on this website, but a change doesn’t alter an agreement you’ve already signed unless you agree to it in writing.',
    'How and when you’re invoiced, and how payment is taken, are set out in your written agreement.',
  ], 'Prices are in USD. You pay what your signed agreement says.'],
  ['5. What our fees don’t include', [
    'Unless they’re written into your agreement, our fees don’t include advertising spend, hosting, paid directory listings, premium software or extensive development. Media budgets and third-party costs are quoted separately, and any optional paid tool or service is approved by you in advance.',
    'Advertising spend is paid to the advertising platform under your own account, on that platform’s terms.',
  ], 'Ad spend and third-party costs are separate from our fees.'],
  ['6. Your accounts and access', [
    'You own your business profiles and advertising accounts, including your Google Business Profile and your ad accounts. We work through role-based access that you grant, and we never ask for your passwords. Never share a password with us or anyone else.',
    'You can remove our access at any time. If you do, work that depends on that access pauses until it’s restored.',
  ], 'Your accounts stay yours. We only ever ask for access, never passwords.'],
  ['7. Your part', [
    'To deliver the work on time, we rely on you for accurate business information, the access we need, and timely approvals and feedback. Delays on either side move the timeline.',
    'You confirm that you have the right to use any materials you give us, such as logos, photos, videos and copy, and that your offers and claims comply with the rules that apply to your business and industry.',
  ], 'Accurate information, access and approvals from you keep the work on schedule.'],
  ['8. Approvals and content', [
    'Where your scope includes creating or publishing content on your behalf, we follow the review and approval process set out in your agreement.',
    'Who owns the content we create for you, and how it may be used, is set out in your agreement. Third-party materials (such as licensed stock, fonts, music or software) remain subject to their own licences.',
  ], 'You review the work, and your agreement says who owns what.'],
  ['9. Results and guarantees', [
    'We guarantee the agreed work and transparent reporting. We do not guarantee Google positions, AI recommendations or mentions, review counts, traffic, return on ad spend (ROAS) or leads. Results depend on your market, competition, offer, budget and other factors outside our control, and they can take weeks or months.',
    'Directory publication and indexing, ad approvals and platform features are controlled by third parties such as Google and Meta. We can’t guarantee that a listing, ad or post will be accepted, published or indexed.',
  ], 'We promise the work and honest reporting, not rankings or leads.'],
  ['10. How we work', [
    'We follow legitimate practices. We don’t create fake reviews or manipulated engagement, our link outreach is legitimate, and email and SMS follow-up is permission-based.',
    'Where we use AI-assisted tools, such as for drafting responses or workflow support, a person reviews the output, and we apply privacy safeguards.',
  ], 'No fake reviews, no spam, and people check anything AI helps with.'],
  ['11. Case studies and showcasing your work', [
    'We only feature a client’s name, results or work, in case studies, testimonials or our portfolio, with that client’s authorization, and we only publish information we can verify.',
  ], 'We only show your work or results with your permission.'],
  ['12. Confidentiality and your information', [
    'We keep the non-public information you share with us confidential and use it only to deliver our services to you. Our [Privacy Policy](/privacy/) explains how we handle personal information.',
  ], 'What you share with us stays between us.'],
  ['13. Ending the engagement', [
    'Cancellation, notice and the end of an engagement are set out in your written agreement. See our [Refund & Cancellation Policy](/refund/). When an engagement ends, your accounts, profiles and data stay with you, and we remove or hand back any access you granted us.',
  ], 'Your agreement sets the terms for ending. Your accounts stay with you.'],
  ['14. Third-party platforms', [
    'Our services use third-party platforms such as Google, Meta, directories, CRMs and website platforms. Their own terms and policies apply to your use of them, and their decisions, such as suspensions, ad disapprovals or policy changes, are outside our control. We’ll tell you when something affects your account and what we recommend.',
  ], 'Google, Meta and other platforms set their own rules.'],
  ['15. This website', [
    'The information on this website is general. Figures in our case studies come from our reports or from public profiles, with their source and date shown, and describe past work for specific clients. They are not a promise of what we’ll achieve for you.',
  ], 'Case study figures are real and sourced, but your results will be your own.'],
  ['16. Changes to these terms and contact', [
    `We may update these terms from time to time. The date at the top shows when they last changed, and changes don’t alter a written agreement you’ve already signed. Questions? Email [${EMAIL}](mailto:${EMAIL}) or write to ${ADDRESS}.`,
  ], 'If these terms change, the date above changes too.'],
];

// ---- Refund & Cancellation Policy ----------------------------------------------------------------------
const REFUND = [
  ['1. The short version', [
    'The free 30-Day Visibility Challenge costs nothing and needs no card, so there’s nothing to refund. For paid plans, billing, cancellation and refunds are set out in your written agreement, which you approve before you pay anything.',
  ], null],
  ['2. The free 30-Day Visibility Challenge', [
    `There’s no agency fee, no credit card and no automatic subscription. When the 30 days end, the trial simply ends, and it never turns into a paid plan without your explicit approval. Full details are on the [Trial Terms](/trial-terms/) page.`,
    'If you approve an optional third-party paid tool or service during the trial, you pay for it separately, and it follows that provider’s own policy.',
  ], 'The trial is free and ends on its own. Nothing to cancel, nothing to refund.'],
  ['3. Monthly plans', [
    `Our monthly plans (${plans}) and quoted services such as ${O.FULL_GROWTH.name} each start with a written agreement. It sets out how you’re billed, the notice needed to cancel, and how fees for work already delivered are handled.`,
    'We agree these terms with you before you pay, so you know exactly where you stand.',
  ], 'Your agreement spells out billing and cancellation before you pay.'],
  ['4. Cancelling a plan', [
    `To cancel, email [${EMAIL}](mailto:${EMAIL}) from the account contact listed in your agreement. We’ll confirm the cancellation and the date it takes effect under your agreement, finish or wrap up work in progress as agreed, and remove or hand back any access you granted us.`,
    'Your profiles, ad accounts and data are yours, so they stay with you when a plan ends.',
  ], 'Email us to cancel. Your accounts stay with you.'],
  ['5. Refunds', [
    'Whether a fee is refundable, and how much, is set out in your written agreement. If you believe we haven’t delivered the agreed work, tell us. We’ll review it against your agreement and our records of the work, and reply in writing.',
    'Because results depend on factors outside our control, we guarantee the agreed work and transparent reporting rather than specific rankings, traffic, ROAS or leads.',
  ], 'Refunds follow your agreement, and we always review a concern you raise.'],
  ['6. Advertising spend and third-party costs', [
    'Advertising spend is paid to the platform (such as Google or Meta) under your own account, and unused or spent budget is a matter between you and that platform. Hosting, paid directory listings, premium software and other third-party costs follow their providers’ own refund policies.',
  ], 'Ad spend and third-party costs follow the platform’s or provider’s own policy.'],
  ['7. Raising a concern', [
    `Email [${EMAIL}](mailto:${EMAIL}) with your business name, the plan or service concerned and what went wrong. If you think a charge is wrong, please contact us first, as we can usually resolve it quickly.`,
  ], 'Contact us first. We can usually sort it out quickly.'],
  ['8. Changes and contact', [
    `We may update this policy from time to time. The date at the top shows when it last changed, and changes don’t alter a written agreement you’ve already signed. Questions? Email [${EMAIL}](mailto:${EMAIL}) or write to ${ADDRESS}.`,
  ], null],
];

// ---- Privacy Policy (from what the site actually collects: the challenge application
// form and api/free-local-seo.js, the Calendly booking embed, email/phone/WhatsApp
// links, a few browser-storage entries (see /cookie-policy/); no analytics or advertising tools installed) ----
const PRIVACY = [
  ['1. Who we are', [
    `This policy explains how MADMarketing (“we”, “us”) collects and uses personal information through this website and when we work with your business. You can reach us at [${EMAIL}](mailto:${EMAIL}) or ${ADDRESS}.`,
  ], 'This covers our website and our work with you.'],
  ['2. What we collect', [
    'When you apply for the free 30-Day Visibility Challenge: your full name, business email, business name, industry, website, Google Business Profile link, whether your profile is verified, phone number, city, state and country, the marketing challenge you describe, and your confirmation that you’re authorized to act for the business and agree to be contacted.',
    'With your application we also record how you found us: the campaign details in the link you followed (UTM tags and the Google or Meta click identifier), the page that referred you and the page you applied from.',
    'When you email, call or message us on WhatsApp, we receive what you send us. When you book a call, the details you enter in the booking calendar (provided by Calendly) are shared with us.',
    'Our website host processes standard technical information, such as your IP address and browser details, to deliver pages and protect the site. Our application form also uses your IP address briefly to limit repeated submissions.',
    'The login page doesn’t send the email address you type anywhere: online sign-in isn’t open yet.',
  ], 'We collect what you put in the application, how you found us, and what you send us.'],
  ['3. Cookies, storage and analytics', [
    'We don’t use advertising or analytics cookies, and we don’t track you across other websites. The site keeps a few small entries in your browser’s storage so it works the way you’d expect, for example so the opening animation plays only once per visit. They stay on your device. Our live chat, provided by Chatway, sets its own cookies so a conversation continues between pages, and it keeps whatever you type in it. Our [Cookie Policy](/cookie-policy/) lists them.',
    'If we add analytics or advertising tools, such as Google Analytics or the Meta Pixel, to measure our ads, we’ll update this policy and the Cookie Policy before they go live.',
  ], 'No tracking cookies today. We’ll update this page before that changes.'],
  ['4. How we use your information', [
    'To review your application and its eligibility, contact you about it and send you a confirmation; to answer your questions and arrange calls; to deliver the services we agree with you; to understand which of our campaigns bring in applications; and to keep the site secure and meet our legal obligations.',
    'We contact you about your application because you asked us to. Any other follow-up messages, by email or SMS, are permission-based, and you can opt out at any time.',
  ], 'We use it to handle your application, talk to you and do the work.'],
  ['5. Who we share it with', [
    'We don’t sell your personal information. We share it only with the services that help us run our business: our website host, the email delivery and CRM tools we use to receive and follow up on applications, and Calendly for booking calls. They may use it only to provide their service to us.',
    'We may also disclose information when the law requires it, or to protect our rights and the safety of others.',
  ], 'We never sell your information.'],
  ['6. Your business accounts', [
    'When we work on your Google Business Profile, advertising accounts or other tools, we do it through role-based access you grant. We use the information in those accounts only to deliver the agreed services, keep it confidential, and never ask for your passwords. You can remove our access at any time.',
  ], 'We only use your account data to do the agreed work.'],
  ['7. How long we keep it', [
    'We keep application information for as long as we need it to review your application and follow up with you, and client information for as long as the engagement lasts and as needed to meet our legal and accounting obligations. You can ask us to delete your information at any time.',
  ], 'We keep it only as long as we need it, and you can ask us to delete it.'],
  ['8. Your choices and rights', [
    `You can ask us to tell you what personal information we hold about you, correct it, delete it, or stop contacting you. Email [${EMAIL}](mailto:${EMAIL}) and we’ll respond in line with the law that applies to you. Depending on where you live, you may have additional rights under local privacy laws.`,
  ], 'Ask us any time to see, correct or delete your information.'],
  ['9. Security', [
    'Our website uses encrypted connections (HTTPS), and access to applications and client information is limited to the people who need it. No method of sending or storing data is completely secure, but we work to protect your information.',
  ], 'We protect your information and limit who can see it.'],
  ['10. Where your information is processed', [
    'We’re based in the United States, and your information is processed in the United States. If you contact us from another country, your information is transferred to and processed in the United States.',
  ], null],
  ['11. Children', [
    'Our website and services are for businesses. They aren’t directed at children, and we don’t knowingly collect personal information from children under 13.',
  ], null],
  ['12. Other websites', [
    'Links to Facebook, WhatsApp, Google and other services take you to their sites, where their own privacy policies apply.',
  ], null],
  ['13. Changes and contact', [
    `We may update this policy from time to time. The date at the top shows when it last changed. Questions or requests? Email [${EMAIL}](mailto:${EMAIL}) or write to ${ADDRESS}.`,
  ], null],
];

const DOCS = [['/terms/', 'Terms of Service'], ['/privacy/', 'Privacy Policy'], ['/refund/', 'Refund & Cancellation'], ['/trial-terms/', 'Trial Terms'], ['/cookie-policy/', 'Cookie Policy']];

function page({ slug, title, description, eyebrow, h1, lede, sections }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#F5F7FA">
<link rel="canonical" href="${SITE}/${slug}/">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}/${slug}/">
<link rel="icon" type="image/svg+xml" href="/assets/madmarketing-mark-v2.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/madmarketing-icon-32-v2.png">
<link rel="apple-touch-icon" href="/assets/madmarketing-apple-touch-v2.png">
<link rel="preload" as="font" type="font/woff2" href="/fonts/satoshi-variable.woff2" crossorigin>
<style>
@font-face{font-family:Satoshi;font-style:normal;font-weight:300 900;font-display:swap;src:url(/fonts/satoshi-variable.woff2) format("woff2")}
@font-face{font-family:"Satoshi Fallback";src:local("Arial");ascent-override:93.3%;descent-override:22.17%;line-gap-override:9.24%;size-adjust:108.25%}
body{margin:0;background:#F5F7FA;color:#0A0A0A;font-family:Satoshi,"Satoshi Fallback",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.lg-in{max-width:860px;margin:0 auto;padding:150px 24px 110px}
.lg .lg-k{display:inline-flex;align-items:center;gap:14px;margin:0;font-size:12px!important;line-height:1.3!important;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#4B5563}
.lg .lg-k::before{content:'';width:34px;height:1.5px;background:linear-gradient(90deg,rgba(0,102,255,0),#0066FF)}
.lg h1{margin:20px 0 0;font-size:clamp(36px,5vw,60px);font-weight:700;line-height:1.04;letter-spacing:-.031em;text-wrap:balance}
.lg h1 em{font-style:normal;color:#0066FF}
.lg .lg-lede{margin:18px 0 0;font-size:18px!important;line-height:1.6!important;color:#4B5563}
.lg .lg-meta{margin:14px 0 0;font-size:14px!important;color:#6B7280}
.lg-docs{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 0;padding:0;list-style:none}
.lg-docs a{display:inline-block;padding:8px 14px;border-radius:999px;background:#fff;box-shadow:0 0 0 1px #E5E7EB;color:#0A0A0A;font-size:14px;font-weight:600;text-decoration:none}
.lg-docs a[aria-current]{background:#0A0A0A;color:#fff;box-shadow:none}
.lg-sec{margin:22px 0 0;padding:28px;border-radius:24px;background:#fff;box-shadow:0 0 0 1px #E5E7EB}
.lg-sec:first-of-type{margin-top:40px}
.lg-sec h2{margin:0;font-size:21px;font-weight:700;letter-spacing:-.02em}
.lg .lg-sec p{margin:12px 0 0;font-size:16px!important;line-height:1.7!important;color:#1F2937}
.lg-sec a,.lg-lede a{color:#0066FF}
.lg .lg-plain{margin:16px 0 0;padding:14px 16px;border-radius:14px;background:#EBF3FF;font-size:14.5px!important;line-height:1.55!important;color:#0040A0}
.lg-plain b{display:block;margin-bottom:2px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0066FF}
@media(max-width:720px){.lg-in{padding:120px 16px 80px}.lg-sec{padding:22px}}
</style>
</head>
<body>
<main class="lg"><div class="lg-in">
  <p class="lg-k">${esc(eyebrow)}</p>
  <h1>${h1}</h1>
  <p class="lg-lede">${esc(lede)}</p>
  <p class="lg-meta">Last updated ${UPDATED}</p>
  <ul class="lg-docs" aria-label="Legal documents">${DOCS.map(([h, t]) => `<li><a href="${h}"${h === `/${slug}/` ? ' aria-current="page"' : ''}>${esc(t)}</a></li>`).join('')}</ul>
${sections.map(([h, ps, plain]) => `  <section class="lg-sec">
    <h2>${esc(h)}</h2>
${ps.map((p) => `    <p>${text(p)}</p>`).join('\n')}${plain ? `\n    <p class="lg-plain"><b>In plain terms</b>${esc(plain)}</p>` : ''}
  </section>`).join('\n')}
</div></main>
</body>
</html>
`;
}

const out = [
  ['privacy', page({
    slug: 'privacy',
    title: 'Privacy Policy | MADMarketing',
    description: 'How MADMarketing collects and uses personal information: what the 30-day challenge application collects, who we share it with, no tracking cookies, and your choices.',
    eyebrow: 'Legal',
    h1: 'Privacy <em>Policy.</em>',
    lede: 'What we collect, why, and what you can ask us to do with it. We never sell your information.',
    sections: PRIVACY,
  })],
  ['terms', page({
    slug: 'terms',
    title: 'Terms of Service | MADMarketing',
    description: 'The terms for using MADMarketing’s website and services: written agreements, prices in USD, your accounts and access, no guaranteed rankings or leads, and how we work.',
    eyebrow: 'Legal',
    h1: 'Terms of <em>Service.</em>',
    lede: 'The ground rules for working with MADMarketing, in plain language. Your written agreement covers the details of your account.',
    sections: TERMS,
  })],
  ['refund', page({
    slug: 'refund',
    title: 'Refund & Cancellation Policy | MADMarketing',
    description: 'How refunds and cancellation work at MADMarketing: the free 30-day challenge has no fee and no automatic subscription, and paid plans follow a written agreement.',
    eyebrow: 'Legal',
    h1: 'Refund &amp; <em>Cancellation.</em>',
    lede: 'How cancelling and refunds work, for the free 30-day challenge and for paid plans.',
    sections: REFUND,
  })],
];
for (const [slug, html] of out) {
  fs.mkdirSync(path.join(ROOT, slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, slug, 'index.html'), html);
}
console.log('legal pages: /privacy/ /terms/ /refund/');
