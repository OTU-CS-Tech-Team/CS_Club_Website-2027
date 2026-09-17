import { redirect } from 'next/navigation';
import { Press_Start_2P, VT323 } from 'next/font/google';
import { createClient } from '@/lib/supabase/server';
import { mintCheckinToken } from './actions';
import Passport from './Passport';

const pixel = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-pixel', display: 'swap' });
const terminal = VT323({ weight: '400', subsets: ['latin'], variable: '--font-terminal', display: 'swap' });

export const metadata = {
  title: 'Member Passport — CS Club',
};

function shortName(fullName: string | null | undefined, email: string) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return email.split('@')[0];
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

export default async function PassportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: profile }, { data: stamps }, { qrDataUrl }] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
    supabase
      .from('passport_stamps')
      .select('id, label, points, awarded_at')
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false }),
    mintCheckinToken(),
  ]);

  return (
    <div className={`${pixel.variable} ${terminal.variable}`}>
      <Passport
        name={shortName(profile?.full_name, profile?.email ?? user.email ?? 'member')}
        stamps={stamps ?? []}
        initialQrDataUrl={qrDataUrl}
      />
    </div>
  );
}
