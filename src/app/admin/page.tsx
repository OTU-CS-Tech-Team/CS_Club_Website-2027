import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import CreateEventForm from './CreateEventForm';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect('/');
  }

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <p>
        Create an event, then use <Link href="/admin/checkin">Event Check-in</Link> to scan
        members' passport QR codes as they arrive.
      </p>
      <CreateEventForm />
    </div>
  );
}
