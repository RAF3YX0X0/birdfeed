// Applications for the MAD 30-Day Visibility Challenge (the ads landing page,
// /free-local-seo/). A Vercel serverless function: it checks the
// application, flags anything the qualification rules need a person to look
// at, and delivers it through whatever is set up in the Vercel project's
// environment variables:
//   FORM_WEBHOOK_URL POST it as JSON to the CRM (or Zapier / Make / a Google
//                    Sheet script), as a "New Application" with its flags
//                    and ad attribution (UTM, gclid, fbclid);
//   RESEND_API_KEY   email it to APPLY_TO (default hello@madmediamarketing.com)
//                    and send the applicant the confirmation email, from
//                    APPLY_FROM (an address on a domain verified in Resend).
// With neither set it answers 503, and the page falls back to opening a
// pre-filled email, so no application is lost.

const TO = process.env.APPLY_TO || 'hello@madmediamarketing.com';
const FROM = process.env.APPLY_FROM || 'MADMarketing <onboarding@resend.dev>';

// name: [label, max length, required]
const FIELDS = {
  fullName: ['Full name', 100, true],
  email: ['Business email', 200, true],
  business: ['Business name', 150, true],
  industry: ['Industry', 100, true],
  website: ['Website', 300, false],
  gbpLink: ['Google Business Profile link', 500, false],
  gbpVerified: ['Profile verified', 10, true],
  phone: ['Phone', 40, true],
  city: ['City', 100, true],
  state: ['State', 100, true],
  country: ['Country', 60, true],
  challenge: ['Biggest local marketing challenge', 2000, false],
  authorized: ['Owner or authorized decision-maker', 5, true],
  consent: ['Agreed to be contacted', 5, true],
};
const TRACKING = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'referrer', 'page'];

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
  if (!['Yes', 'No', 'Unsure'].includes(out.gbpVerified)) return { error: 'Please say whether your Google Business Profile is verified.' };
  if (out.authorized !== 'yes' || out.consent !== 'yes') return { error: 'Please confirm both checkboxes.' };
  const tracking = {};
  for (const k of TRACKING) if (typeof body[k] === 'string' && body[k].trim()) tracking[k] = body[k].trim().slice(0, 300);
  return { data: out, tracking };
}

// The qualification rules the answers can already speak to. Nothing is
// rejected automatically: these are notes for the person reviewing it.
function flags(d) {
  const notes = [];
  if (d.gbpVerified === 'No') notes.push('No verified Google Business Profile (required before trial activation).');
  if (d.gbpVerified === 'Unsure') notes.push('Profile verification unknown: check before activation.');
  if (!d.gbpLink) notes.push('No profile link given.');
  if (d.country !== 'United States') notes.push(`Outside the US (${d.country}): confirm the market is supported.`);
  if (!d.website) notes.push('No website (preferred, not required).');
  return notes;
}

const firstName = (n) => n.split(/\s+/)[0] || n;

async function resend(payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('email failed ' + r.status);
}

async function deliver(d, tracking, notes) {
  if (process.env.FORM_WEBHOOK_URL) {
    const r = await fetch(process.env.FORM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ form: 'mad-30-day-visibility-challenge', status: 'New Application', submittedAt: new Date().toISOString(), ...d, ...tracking, qualificationNotes: notes }),
    });
    if (!r.ok) throw new Error('webhook failed ' + r.status);
  }
  if (process.env.RESEND_API_KEY) {
    const rows = [...Object.entries(FIELDS).map(([k, [label]]) => [label, d[k] || '—']), ...Object.entries(tracking)];
    const text = ['New MAD 30-Day Visibility Challenge application', '', ...rows.map(([l, v]) => `${l}: ${v}`), '', notes.length ? 'To check: ' + notes.join(' ') : 'No qualification flags.'].join('\n');
    const html = `<h2 style="font-family:Arial,sans-serif">New 30-Day Visibility Challenge application</h2>
<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows.map(([l, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#6B7280;vertical-align:top">${esc(l)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join('')}</table>
<p style="font-family:Arial,sans-serif;font-size:14px">${notes.length ? '<b>To check:</b> ' + notes.map(esc).join(' ') : 'No qualification flags.'}</p>`;
    await resend({ from: FROM, to: [TO], reply_to: d.email, subject: `Challenge application: ${d.business}`, text, html });
    // The applicant's confirmation (the client's template).
    const hi = `Hi ${firstName(d.fullName)},`;
    const body = 'Thanks for applying for the MAD 30-Day Visibility Challenge! Our team will review your business, Google presence and eligibility. If your business qualifies, we’ll contact you with next steps.';
    await resend({
      from: FROM,
      to: [d.email],
      reply_to: TO,
      subject: 'We received your MAD Visibility Challenge application',
      text: `${hi}\n\n${body}\n\nThink MAD. Grow Beyond Ordinary.\nThe MADMarketing Team\n${TO}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0A0A0A"><p>${esc(hi)}</p><p>${esc(body)}</p><p><b>Think MAD. Grow Beyond Ordinary.</b><br>The MADMarketing Team<br><a href="mailto:${TO}">${TO}</a></p></div>`,
    }).catch((e) => console.error('confirmation not sent', e));
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ error: 'Use POST.' }));
  }
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
    await deliver(c.data, c.tracking, flags(c.data));
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error(e);
    res.statusCode = 502;
    res.end(JSON.stringify({ unavailable: true }));
  }
};

module.exports._test = { check, flags };
