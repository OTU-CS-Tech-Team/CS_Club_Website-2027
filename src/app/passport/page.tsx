import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mintCheckinToken } from './actions';
import PassportQr from './PassportQr';

export default async function PassportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const { data: stamps } = await supabase
    .from('passport_stamps')
    .select('id, label, points, awarded_at')
    .eq('user_id', user.id)
    .order('awarded_at', { ascending: false });

  const totalPoints = stamps?.reduce((sum, stamp) => sum + stamp.points, 0) ?? 0;
  const { qrDataUrl } = await mintCheckinToken();

  return (
    <div className="page">
      <h1>Member Passport</h1>
      <p>{profile?.full_name || profile?.email}</p>
      <p>{totalPoints} points</p>

      <PassportQr initialQrDataUrl={qrDataUrl} />

      {stamps && stamps.length > 0 ? (
        <ul className="stamp-list">
          {stamps.map((stamp) => (
            <li key={stamp.id}>
              <strong>{stamp.label}</strong> — {stamp.points} pts (
              {new Date(stamp.awarded_at).toLocaleDateString()})
            </li>
          ))}
        </ul>
      ) : (
        <p>No stamps yet — come to an event to earn your first one.</p>
      )}
    </div>
  );
}
