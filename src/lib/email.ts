import { Resend } from 'resend';

const FROM = process.env.RESEND_FROM_EMAIL ?? 'CS Club <onboarding@resend.dev>';

// Email clients need inline styles, not a stylesheet — this is the one
// place that layout lives, so both emails stay visually consistent.
export function eventEmailHtml(opts: {
  heading: string;
  intro: string;
  title: string;
  when: string;
  location?: string | null;
}) {
  const font = "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  return `
<div style="background:#f4f4f5;padding:32px 16px;font-family:${font};">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden;">
    <div style="background:#111111;padding:18px 28px;">
      <span style="color:#ffffff;font-size:15px;font-weight:700;letter-spacing:0.03em;">CS CLUB</span>
    </div>
    <div style="padding:28px;">
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
    </div>
    <div style="padding:14px 28px;background:#fafafa;border-top:1px solid #e5e5e5;">
      <p style="margin:0;font-size:12px;color:#999999;">OTU Computer Science Club</p>
    </div>
  </div>
</div>`;
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
    });
    if (error) console.error('Resend error:', error);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}
