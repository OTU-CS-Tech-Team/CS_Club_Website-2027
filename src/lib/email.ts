import { Resend } from 'resend';

function resolveFrom() {
  const raw = process.env.RESEND_FROM_EMAIL ?? 'CS Club <onboarding@resend.dev>';
  const address = raw.match(/<([^>]+)>/)?.[1]?.trim() || raw.trim();
  // Resend wants a normal display name; bare "domain <email>" is easy to misparse.
  return `CS Club <${address}>`;
}

const FROM = resolveFrom();
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
  cancelUrl?: string;
  confirmUrl?: string;
}) {
  const actionBlock = opts.confirmUrl
    ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#666666;">
        <a href="${opts.confirmUrl}" style="color:#111111;font-weight:600;">Click here to confirm your RSVP</a>
      </p>`
    : opts.cancelUrl
      ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#666666;">
        <a href="${opts.cancelUrl}" style="color:#111111;font-weight:600;">Click here to cancel your RSVP</a>
      </p>`
      : '';
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
      </table>
      ${actionBlock}`);
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
  cancelUrl?: string;
  confirmUrl?: string;
}) {
  const actionLine = opts.confirmUrl
    ? `\n\nConfirm your RSVP: ${opts.confirmUrl}`
    : opts.cancelUrl
      ? `\n\nClick here to cancel your RSVP: ${opts.cancelUrl}`
      : '';
  return `${opts.heading}\n\n${opts.intro}\n\n${opts.title}\n${opts.when}${opts.location ? ` - ${opts.location}` : ''}${actionLine}\n\nOTU Computer Science Club`;
}

export function newsletterEmailText(opts: { subject: string; body: string }) {
  return `${opts.subject}\n\n${opts.body}\n\nOTU Computer Science Club`;
}

// Returns whether the message actually went out. Callers that must stay
// best-effort (cron reminders) can ignore the result; RSVP surfaces it.
export async function sendEventEmail(
  to: string,
  subject: string,
  content: {
    heading: string;
    intro: string;
    title: string;
    when: string;
    location?: string | null;
    cancelUrl?: string;
    confirmUrl?: string;
  }
): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY not set — skipping email:', subject);
    return { sent: false, error: 'RESEND_API_KEY is not set.' };
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
    if (error) {
      console.error('Resend error:', error);
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Resend rejected the email.';
      return { sent: false, error: message };
    }
    return { sent: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Failed to send email.',
    };
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
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html, text });
  if (error) {
    const message =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Resend rejected the email.';
    throw new Error(message);
  }
  if (!data?.id) {
    throw new Error('Resend did not return a message id.');
  }
}

// One message per recipient so addresses stay private (no shared To: list).
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

  const unique = Array.from(
    new Set(recipients.map((email) => email.trim().toLowerCase()).filter(Boolean)),
  );
  if (unique.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const resend = new Resend(apiKey);
  let sent = 0;
  let failed = 0;
  let lastError: unknown = null;

  for (const to of unique) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject,
        html,
        text,
      });
      if (error) throw error;
      sent += 1;
    } catch (error) {
      console.error('Newsletter recipient failed:', to, error);
      lastError = error;
      failed += 1;
    }
  }

  if (sent === 0 && lastError) {
    const message =
      lastError instanceof Error
        ? lastError.message
        : typeof lastError === 'object' && lastError && 'message' in lastError
          ? String((lastError as { message: unknown }).message)
          : 'Newsletter send failed.';
    throw new Error(message);
  }
  return { sent, failed };
}

