import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/admin';

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
        Whitelisted admins can create, edit, and delete events here.
        CRUD UI to be added later.
      </p>
    </div>
  );
}
