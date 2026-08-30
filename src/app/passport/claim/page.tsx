import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/passport/claim?code=${encodeURIComponent(code ?? '')}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!code) {
    redirect('/passport');
  }

  const { data, error } = await supabase.rpc('claim_event_code', { p_code: code });

  return (
    <div className="page">
      <h1>Claim stamp</h1>
      {error ? (
        <p>
          {error.message.includes('Already claimed')
            ? 'You already claimed this stamp.'
            : "That code isn't valid."}
        </p>
      ) : (
        <p>
          Claimed <strong>{data?.label}</strong> — {data?.points} points!
        </p>
      )}
      <a href="/passport">Go to your passport</a>
    </div>
  );
}
