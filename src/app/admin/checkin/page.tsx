import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import CheckinScanner from './CheckinScanner';

export const metadata = {
  title: 'Event Check-in',
};

export const dynamic = 'force-dynamic';

export default async function CheckinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await isAdmin(supabase, user?.id))) {
    redirect('/');
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .order('starts_at', { ascending: false });

  return (
    <div className="page">
      <h1>Event Check-in</h1>
      <p>Pick today&apos;s event, then scan each member&apos;s passport QR as they arrive.</p>
      <CheckinScanner events={events ?? []} />
    </div>
  );
}
