/**
 * Checks if a Supabase/PostgREST error indicates a missing table or function.
 * Handles both Postgres error codes and PostgREST error codes.
 */
export function isTableOrFunctionMissing(error: { code?: string } | null | undefined): boolean {
  if (!error?.code) return false;
  return ['42P01', 'PGRST205', '42883', 'PGRST202'].includes(error.code);
}
