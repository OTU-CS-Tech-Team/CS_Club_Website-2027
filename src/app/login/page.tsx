import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LoginForm from './LoginForm';
import styles from './login.module.css';

export const metadata = {
  title: 'Executive login — CS Club',
  description: 'Secure CS Club executive dashboard login.',
};

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (userData.user) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (admin) redirect('/admin');
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.kicker}>Executive access</p>
        <h1>Welcome back.</h1>
        <p className={styles.copy}>Sign in with your whitelisted executive account.</p>
        <LoginForm />
      </section>
    </div>
  );
}
