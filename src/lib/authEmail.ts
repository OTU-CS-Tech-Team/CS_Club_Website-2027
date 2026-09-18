// Accounts are Ontario Tech only. Mirrored by the Before User Created hook in
// supabase/migrations/20260917120000_profiles_trigger_and_domain_hook.sql —
// change both together.
export const ALLOWED_EMAIL_DOMAIN = 'ontariotechu.net';

export const EMAIL_DOMAIN_MESSAGE = `Club accounts use your Ontario Tech email (@${ALLOWED_EMAIL_DOMAIN}).`;

export function isAllowedAuthEmail(email: string | null | undefined) {
  return Boolean(email?.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`));
}
