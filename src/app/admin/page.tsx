import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';
import CreateEventCodeForm from './CreateEventCodeForm';

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
      <p>Create a QR code for an event — members scan it to claim a passport stamp.</p>
      <CreateEventCodeForm />
    </div>
  );
}
