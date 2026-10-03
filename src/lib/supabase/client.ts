import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

type MockClient = {
  auth: {
    getSession: () => Promise<{ data: { session: null } }>;
    getUser: () => Promise<{ data: { user: null } }>;
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } };
    signOut: () => Promise<{ error: null }>;
    signInWithPassword: () => Promise<{ error: { message: string } }>;
    signInWithOAuth: () => Promise<{ error: { message: string } }>;
    signUp: () => Promise<{ data: { session: null; user: null }; error: { message: string } }>;
    resetPasswordForEmail: () => Promise<{ error: { message: string } }>;
    updateUser: () => Promise<{ error: { message: string } }>;
  };
  from: () => { select: () => { eq: () => { maybeSingle: () => Promise<{ data: null }> } } };
};

function createMockClient(): MockClient {
  const noopSub = { data: { subscription: { unsubscribe: () => {} } } };
  const errorResult = { error: { message: 'Supabase is not configured' } };
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => noopSub,
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => errorResult,
      signInWithOAuth: async () => errorResult,
      signUp: async () => ({ data: { session: null, user: null }, ...errorResult }),
      resetPasswordForEmail: async () => errorResult,
      updateUser: async () => errorResult,
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  };
}

// ReturnType<typeof createBrowserClient> doesn't resolve cleanly against
// its generic/overloaded signature (silently collapses to `any`), so this
// is typed explicitly instead — return right after the assignment so
// narrowing is unambiguous either way.
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return createMockClient() as unknown as SupabaseClient;
  }
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
