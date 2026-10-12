// Applications for the MAD 30-Day Visibility Challenge (/free-local-seo/).
// A Vercel serverless function: it checks the application and delivers it by
// whichever channel is set up in the Vercel project's environment variables:
//   RESEND_API_KEY   email it through Resend (resend.com) to APPLY_TO
//                    (default hello@madmediamarketing.com) from APPLY_FROM
//   FORM_WEBHOOK_URL POST it as JSON (Zapier, Make, a Google Sheet script…)
// With neither set it answers 503, and the page falls back to opening a
// pre-filled email, so no application is lost.

const TO = process.env.APPLY_TO || 'hello@madmediamarketing.com';
const FROM = process.env.APPLY_FROM || 'MADMarketing <onboarding@resend.dev>';

const FIELDS = {
  name: ['Name', 100, true],
  email: ['Email', 200, true],
  phone: ['Phone', 40, false],
  role: ['Role', 60, true],
  business: ['Business', 150, true],
  website: ['Website', 300, false],
  industry: ['Industry', 100, true],
  location: ['City and state', 150, true],
  businessType: ['How customers reach them', 80, true],
  gbp: ['Google Business Profile', 80, true],
  agency: ['Working with an SEO agency', 40, true],
  before: ['Done a challenge before', 10, true],
  goals: ['Goals', 2000, false],
  authorized: ['Authorized for the business', 5, true],
  consent: ['Agreed to be contacted', 5, true],
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Per-instance rate limit: a few submissions per address per 10 minutes.
const recent = new Map();
function limited(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 600_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

function check(body) {
  if (!body || typeof body !== 'object') return { error: 'Please fill in the form.' };
  if (body.company_url) return { spam: true };
  const out = {};
  for (const [key, [label, max, required]] of Object.entries(FIELDS)) {
    const v = typeof body[key] === 'string' ? body[key].trim() : '';
    if (required && !v) return { error: `Please fill in: ${label}.` };
    if (v.length > max) return { error: `${label} is too long.` };
    out[key] = v;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) return { error: 'Please enter a valid email address.' };
  if (out.authorized !== 'yes' || out.consent !== 'yes') return { error: 'Please confirm both checkboxes.' };
  return { data: out };
}

// The criteria on the page that the answers can already rule out.
function eligibility(d) {
  const notes = [];
  if (d.before === 'Yes') notes.push('Says they have done a challenge before (one per business).');
  if (d.businessType === 'Online only') notes.push('Online-only business (no local customers).');
  if (d.agency === 'Yes') notes.push('Currently working with an SEO agency.');
  if (d.gbp === 'Yes, but I don’t have access') notes.push('Has a profile but no access yet.');
  return notes;
}

async function deliver(d, notes) {
  const rows = Object.entries(FIELDS).map(([k, [label]]) => [label, d[k] || '—']);
  const text = ['New 30-Day Visibility Challenge application', '', ...rows.map(([l, v]) => `${l}: ${v}`), '', notes.length ? 'Check: ' + notes.join(' ') : 'No eligibility flags.'].join('\n');
  const html = `<h2 style="font-family:Arial,sans-serif">New 30-Day Visibility Challenge application</h2>
<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows.map(([l, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#6B7280;vertical-align:top">${esc(l)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join('')}</table>
<p style="font-family:Arial,sans-serif;font-size:14px">${notes.length ? '<b>Check:</b> ' + notes.map(esc).join(' ') : 'No eligibility flags.'}</p>`;
  const sent = [];
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: d.email, subject: `Challenge application: ${d.business}`, text, html }),
    });
    if (!r.ok) throw new Error('email failed ' + r.status);
    sent.push('email');
  }
  if (process.env.FORM_WEBHOOK_URL) {
    const r = await fetch(process.env.FORM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ form: '30-day-visibility-challenge', submittedAt: new Date().toISOString(), ...d, eligibilityNotes: notes }),
    });
    if (!r.ok) throw new Error('webhook failed ' + r.status);
    sent.push('webhook');
  }
  return sent;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Use POST.' }));
  }
  res.setHeader('Content-Type', 'application/json');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) {
    res.statusCode = 429;
    return res.end(JSON.stringify({ error: 'Too many submissions. Please try again in a few minutes.' }));
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const c = check(body);
  if (c.spam) return res.end(JSON.stringify({ ok: true }));
  if (c.error) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: c.error }));
  }
  if (!process.env.RESEND_API_KEY && !process.env.FORM_WEBHOOK_URL) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ unavailable: true }));
  }
  try {
    await deliver(c.data, eligibility(c.data));
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error(e);
    res.statusCode = 502;
    res.end(JSON.stringify({ unavailable: true }));
  }
};

module.exports._test = { check, eligibility };
