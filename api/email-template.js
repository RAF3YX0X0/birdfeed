// The branded HTML email the applicant receives after applying for the MAD
// 30-Day Visibility Challenge.
//
// Email is not the web. The rules this file follows, which are why it looks
// like markup from 2005:
//   - Tables, not flexbox or grid: Outlook renders through Word, which has no
//     support for either.
//   - Inline styles only. Gmail strips <style> blocks on forwarded mail and in
//     several of its apps, so anything that must survive is on the element.
//   - PNG, not SVG: Gmail refuses to render SVG at all.
//   - Absolute https URLs for every image, and width/height on each one so the
//     layout holds while images are still blocked, which is the default in
//     Outlook and in Gmail for an unknown sender.
//   - A system font stack. Satoshi is the brand face but a web font is
//     unreliable in email; this falls back cleanly everywhere.
//   - Everything readable with images off, because the first message from a
//     new sender is usually seen that way.

const BLUE = '#0066FF';
const INK = '#0A0A0A';
const MUTED = '#4B5563';
const LINE = '#E5E7EB';
const WASH = '#F5F7FA';
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// What the 30 days covers. Kept to what the client's own offer promises.
const INCLUDED = [
  'A Google Business Profile audit and optimization',
  'Local SEO and competitor analysis',
  'Up to 10 local citation actions',
  'Before and after visibility snapshots',
  'A personalized 90-day growth roadmap',
];

const STEPS = [
  ['1', 'We review your application', 'Your business, your Google presence and whether the challenge is a fit.'],
  ['2', 'We get in touch', 'If it is a fit, we will contact you about the next steps.'],
  ['3', 'The 30 days begin', 'We do the work and show you exactly what changed.'],
];

/**
 * @param {object} o
 * @param {string} o.firstName  the applicant's first name
 * @param {string} o.business   their business name
 * @param {string} o.site       absolute site origin, e.g. https://madmediamarketing.com
 * @param {string} o.email      our reply-to address
 */
function applicationReceived({ firstName, business, site, email }) {
  const li = (text) => `
              <tr>
                <td style="padding:0 0 10px;font:400 15px/1.5 ${FONT};color:${MUTED}" valign="top">
                  <span style="color:${BLUE};font-weight:700">&#10003;</span>&nbsp;&nbsp;${esc(text)}
                </td>
              </tr>`;

  const step = ([n, title, text]) => `
              <tr>
                <td width="34" valign="top" style="padding:0 0 18px">
                  <div style="width:26px;height:26px;border-radius:13px;background:${BLUE};color:#ffffff;font:700 13px/26px ${FONT};text-align:center">${n}</div>
                </td>
                <td valign="top" style="padding:0 0 18px">
                  <div style="font:700 15px/1.4 ${FONT};color:${INK}">${esc(title)}</div>
                  <div style="font:400 14px/1.55 ${FONT};color:${MUTED};padding-top:3px">${esc(text)}</div>
                </td>
              </tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>We received your application</title>
</head>
<body style="margin:0;padding:0;background:${WASH}">
<!-- Shown in the inbox list beside the subject, then hidden. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0">We have your application for the 30-Day Visibility Challenge. Here is what happens next.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WASH}">
  <tr>
    <td align="center" style="padding:28px 12px 40px">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">

        <tr>
          <td align="left" style="padding:0 4px 18px">
            <a href="${site}/" style="text-decoration:none">
              <img src="${site}/assets/email-logo.png" width="190" height="28" alt="MADMarketing" style="display:block;border:0;outline:none;height:auto">
            </a>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;border-radius:18px;border:1px solid ${LINE}">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

              <tr>
                <td style="padding:34px 34px 0">
                  <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#EBF3FF;font:700 11px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${BLUE}">Application received</div>
                  <h1 style="margin:18px 0 0;font:800 27px/1.2 ${FONT};color:${INK};letter-spacing:-.02em">Thanks, ${esc(firstName)} &mdash;<br>we have your application.</h1>
                  <p style="margin:14px 0 0;font:400 16px/1.6 ${FONT};color:${MUTED}">
                    We have received your application for the <strong style="color:${INK}">MAD 30-Day Visibility Challenge</strong>${business ? ` for <strong style="color:${INK}">${esc(business)}</strong>` : ''}. Our team will review your business, your Google presence and your eligibility, and come back to you.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:26px 34px 0">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${WASH};border-radius:14px">
                    <tr>
                      <td style="padding:20px 22px">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td valign="middle" style="font:900 40px/1 ${FONT};color:${BLUE};letter-spacing:-.04em">$0</td>
                            <td valign="middle" style="padding-left:14px;font:700 15px/1.3 ${FONT};color:${INK}">
                              Agency fee<br>
                              <span style="font-weight:400;color:${MUTED}">for the 30 days</span>
                            </td>
                          </tr>
                        </table>
                        <div style="font:400 13.5px/1.5 ${FONT};color:${MUTED};padding-top:12px">No credit card. No automatic subscription. No obligation to continue.</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:28px 34px 0">
                  <div style="font:700 12px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${INK};padding-bottom:14px">What happens next</div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${STEPS.map(step).join('')}
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:8px 34px 0">
                  <div style="height:1px;background:${LINE};font-size:0;line-height:0">&nbsp;</div>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 34px 0">
                  <div style="font:700 12px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:${INK};padding-bottom:14px">What the 30 days covers</div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${INCLUDED.map(li).join('')}
                  </table>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:26px 34px 34px">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-radius:999px;background:${BLUE}">
                        <a href="${site}/case-studies/" style="display:inline-block;padding:14px 30px;font:700 15px/1 ${FONT};color:#ffffff;text-decoration:none;border-radius:999px">See our client results</a>
                      </td>
                    </tr>
                  </table>
                  <div style="font:400 13px/1.5 ${FONT};color:${MUTED};padding-top:14px">Questions in the meantime? Just reply to this email.</div>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:22px 6px 0">
            <div style="font:700 14px/1.5 ${FONT};color:${INK}">Think MAD. Grow Beyond Ordinary.</div>
            <div style="font:400 13px/1.6 ${FONT};color:${MUTED};padding-top:6px">
              MADMarketing &middot; 2055 Craigshire Dr, St. Louis, MO 63146<br>
              <a href="mailto:${email}" style="color:${BLUE};text-decoration:none">${email}</a> &middot;
              <a href="${site}/" style="color:${BLUE};text-decoration:none">madmediamarketing.com</a>
            </div>
            <div style="font:400 11.5px/1.5 ${FONT};color:#9CA3AF;padding-top:14px">
              You are receiving this because you applied for the 30-Day Visibility Challenge at madmediamarketing.com. Results and rankings vary; the challenge is open to eligible businesses.
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  // The plain-text part. Not a fallback nobody sees: spam filters compare it
  // with the HTML, and some people read mail this way by choice.
  const text = [
    `Thanks, ${firstName} - we have your application.`,
    '',
    `We have received your application for the MAD 30-Day Visibility Challenge${business ? ` for ${business}` : ''}. Our team will review your business, your Google presence and your eligibility, and come back to you.`,
    '',
    '$0 agency fee for the 30 days. No credit card. No automatic subscription. No obligation to continue.',
    '',
    'WHAT HAPPENS NEXT',
    ...STEPS.map(([n, t, d]) => `${n}. ${t} - ${d}`),
    '',
    'WHAT THE 30 DAYS COVERS',
    ...INCLUDED.map((t) => `- ${t}`),
    '',
    `See our client results: ${site}/case-studies/`,
    'Questions in the meantime? Just reply to this email.',
    '',
    'Think MAD. Grow Beyond Ordinary.',
    'MADMarketing, 2055 Craigshire Dr, St. Louis, MO 63146',
    `${email} | ${site}`,
  ].join('\n');

  return { html, text };
}

module.exports = { applicationReceived };
