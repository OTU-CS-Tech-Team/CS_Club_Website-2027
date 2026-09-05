'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import {
  sendBulkEmail,
  sendDirectEmail,
  newsletterEmailHtml,
  newsletterEmailText,
} from '@/lib/email';
import { getGeneralMemberEmails } from '@/lib/members';

export async function sendNewsletter(subject: string, body: string, testOnly = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAdmin(supabase, user?.id))) {
    throw new Error('Not authorized.');
  }

  const trimmedSubject = subject.trim();
  const trimmedBody = body.trim();
  if (!trimmedSubject || !trimmedBody) {
    throw new Error('Subject and body are required.');
  }

  const html = newsletterEmailHtml({ subject: trimmedSubject, body: trimmedBody });
  const text = newsletterEmailText({ subject: trimmedSubject, body: trimmedBody });

  if (testOnly) {
    if (!user!.email) {
      throw new Error('Your account has no email on file.');
    }
    // direct single send, not the bcc-batch path below — bcc'ing yourself
    // to yourself makes the message fully self-addressed (from === to),
    // which is its own spam signal regardless of DNS authentication
    await sendDirectEmail(user!.email, `[TEST] ${trimmedSubject}`, html, text);
    return { sent: 1, failed: 0 };
  }

  const admin = createAdminClient();
  const recipients = await getGeneralMemberEmails(admin);

  if (recipients.length === 0) {
    throw new Error('No members to send to.');
  }

  const { sent, failed } = await sendBulkEmail(recipients, trimmedSubject, html, text);

  await admin.from('newsletters').insert({
    subject: trimmedSubject,
    body: trimmedBody,
    sent_by: user!.id,
    recipient_count: sent,
  });

  if (sent === 0) {
    throw new Error('Sending failed — nobody received this newsletter.');
  }

  return { sent, failed };
}
