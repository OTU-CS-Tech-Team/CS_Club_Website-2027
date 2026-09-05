import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/admin';
import { getGeneralMemberEmails } from '@/lib/members';
import NewsletterForm from './NewsletterForm';

export default async function NewsletterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAdmin(supabase, user?.id))) {
    redirect('/');
  }

  const admin = createAdminClient();
  const [recipients, { data: past }] = await Promise.all([
    getGeneralMemberEmails(admin),
    admin
      .from('newsletters')
      .select('id, subject, recipient_count, sent_at')
      .order('sent_at', { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="page">
      <h1>Newsletter</h1>
      <p>Send a club update to every general member (who applied via the careers page) — not just anyone with a website login.</p>
      <NewsletterForm recipientCount={recipients.length} />

      {past && past.length > 0 && (
        <div>
          <h2>Recently sent</h2>
          <ul className="stamp-list">
            {past.map((newsletter) => (
              <li key={newsletter.id}>
                <strong>{newsletter.subject}</strong> — {newsletter.recipient_count} recipient(s) (
                {new Date(newsletter.sent_at).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
