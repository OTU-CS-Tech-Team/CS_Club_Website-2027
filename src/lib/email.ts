import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'CS Club <onboarding@resend.dev>';
const FONT = '-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';

// Email clients need inline styles, not a stylesheet — this is the one
// place the branded shell lives, so every email (event or newsletter)
// stays visually consistent.
function emailShell(bodyHtml: string) {
  return `
<div style="background:#f4f4f5;padding:32px 16px;font-family:${FONT};">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden;">
    <div style="background:#111111;padding:18px 28px;">
      <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.03em;">CS CLUB</span>
    </div>
    <div style="padding:28px;">
      ${bodyHtml}
    </div>
    <div style="padding:14px 28px;background:#fafafa;border-top:1px solid #e5e5e5;">
      <p style="margin:0;font-size:12px;color:#999999;">OTU Computer Science Club</p>
    </div>
  </div>
</div>`;
}

export function eventEmailHtml(opts: {
  heading: string;
  intro: string;
  title: string;
  when: string;
  location?: string | null;
}) {
  return emailShell(`
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#111111;">${opts.heading}</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#444444;">${opts.intro}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:16px;background:#f4f4f5;border-radius:6px;">
            <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111111;">${opts.title}</p>
            <p style="margin:0;font-size:14px;color:#555555;">
              ${opts.when}${opts.location ? ` &middot; ${opts.location}` : ''}
            </p>
          </td>
        </tr>
      </table>`);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Plain-text newsletter body -> paragraphs. Blank lines split paragraphs,
// single newlines within one become line breaks.
function textToParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#333333;">${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function newsletterEmailHtml(opts: { subject: string; body: string }) {
  return emailShell(`
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#111111;">${escapeHtml(opts.subject)}</h1>
      ${textToParagraphs(opts.body)}`);
}

// Plain-text alternatives — HTML-only email (no text/plain MIME part) is
// itself a minor spam signal on top of whatever's misconfigured DNS-side.
export function eventEmailText(opts: {
  heading: string;
  intro: string;
  title: string;
  when: string;
  location?: string | null;
}) {
  return `${opts.heading}\n\n${opts.intro}\n\n${opts.title}\n${opts.when}${opts.location ? ` - ${opts.location}` : ''}\n\nOTU Computer Science Club`;
}

export function newsletterEmailText(opts: { subject: string; body: string }) {
  return `${opts.subject}\n\n${opts.body}\n\nOTU Computer Science Club`;
}

// Best-effort — an email failing to send should never block the action
// that triggered it (RSVPing, a reminder sweep). Errors are logged, not thrown.
export async function sendEventEmail(
  to: string,
  subject: string,
  content: { heading: string; intro: string; title: string; when: string; location?: string | null }
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set — skipping email:', subject);
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: eventEmailHtml(content),
      text: eventEmailText(content),
    });
    if (error) console.error('Resend error:', error);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Plain single-recipient send that throws on failure (unlike sendEventEmail,
// which swallows errors for side-effect sends). Used for the newsletter's
// "send test to myself" — a real `to:`, not routed through the bcc-batch
// pattern below, since to === bcc-of-one when testing with your own address
// makes the message fully self-addressed, which is its own spam signal
// independent of any DNS/domain authentication.
export async function sendDirectEmail(to: string, subject: string, html: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set.');
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html, text });
  if (error) throw error;
}

const BCC_BATCH_SIZE = 45; // Resend caps `to` at 50; bcc is undocumented but kept well under that

// Unlike sendEventEmail, this reports what actually happened — a deliberate
// broadcast (newsletter) needs the admin to know if it failed, not have
// the error silently swallowed. One bad batch doesn't stop the rest.
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
  text: string
): Promise<{ sent: number; failed: number }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set.');
  }

  const resend = new Resend(apiKey);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BCC_BATCH_SIZE) {
    const batch = recipients.slice(i, i + BCC_BATCH_SIZE);
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: FROM, // real recipients are bcc'd so they don't see each other's address
        bcc: batch,
        subject,
        html,
        text,
      });
      if (error) throw error;
      sent += batch.length;
    } catch (error) {
      console.error('Newsletter batch failed:', error);
      failed += batch.length;
    }
  }

  return { sent, failed };
}
