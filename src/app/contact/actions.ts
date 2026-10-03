'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin';
import {
  validateSuggestion,
  hasValidationErrors,
  SUGGESTION_CATEGORIES,
  type SuggestionCategory,
  type SuggestionFieldErrors,
  type SuggestionFields,
} from '@/lib/suggestionValidation';

export type SuggestionState =
  | { status: 'idle' }
  | {
      status: 'error';
      message?: string;
      fieldErrors?: SuggestionFieldErrors;
      values?: SuggestionFields;
    }
  | { status: 'success'; ref: string; category: SuggestionCategory };

const MIN_FILL_TIME_MS = 3000;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_PER_WINDOW = 3;
const RATE_LIMIT_MAX_PER_DAY = 10;

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim();
}

function hashSecret(): string {
  return (
    process.env.SUGGESTION_HASH_SECRET ??
    process.env.GUEST_CANCEL_SECRET ??
    process.env.CRON_SECRET ??
    'fallback-suggestion-secret'
  );
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getIpHash(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return sha256(`${ip}:${hashSecret()}`);
}

async function cleanupOldRateLimits(adminClient: ReturnType<typeof createAdminClient>) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await adminClient.from('suggestion_rate_limits').delete().lt('created_at', cutoff);
}

async function checkRateLimit(
  adminClient: ReturnType<typeof createAdminClient>,
  ipHash: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const dayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: recentEntries, error } = await adminClient
    .from('suggestion_rate_limits')
    .select('created_at')
    .eq('ip_hash', ipHash)
    .gte('created_at', dayStart.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Rate limit check failed', { code: error.code, message: error.message });
    return { allowed: true };
  }

  const entries = recentEntries ?? [];
  const windowCount = entries.filter(
    (e) => new Date(e.created_at) >= windowStart
  ).length;

  if (windowCount >= RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      allowed: false,
      reason: 'The mailbox is full right now. Try again in a few minutes.',
    };
  }

  if (entries.length >= RATE_LIMIT_MAX_PER_DAY) {
    return {
      allowed: false,
      reason: 'The mailbox is full right now. Try again later.',
    };
  }

  return { allowed: true };
}

async function recordRateLimit(
  adminClient: ReturnType<typeof createAdminClient>,
  ipHash: string
) {
  await adminClient.from('suggestion_rate_limits').insert({ ip_hash: ipHash });
}

export async function submitSuggestion(
  _prev: SuggestionState,
  formData: FormData
): Promise<SuggestionState> {
  try {
    const category = text(formData, 'category');
    const message = text(formData, 'message');
    const name = text(formData, 'name');
    const email = text(formData, 'email');
    const website = text(formData, 'website');
    const startedAtStr = text(formData, 'startedAt');

    const values: SuggestionFields = { category, message, name, email };

    if (website) {
      return { status: 'success', ref: 'CS-0000', category: 'other' };
    }

    const startedAt = parseInt(startedAtStr, 10);
    if (!Number.isNaN(startedAt) && Date.now() - startedAt < MIN_FILL_TIME_MS) {
      return { status: 'success', ref: 'CS-0000', category: 'other' };
    }

    const fieldErrors = validateSuggestion(values);
    if (hasValidationErrors(fieldErrors)) {
      return { status: 'error', fieldErrors, values };
    }

    if (!isAdminClientConfigured()) {
      return {
        status: 'error',
        message: 'The drop box is closed right now. Email us instead.',
        values,
      };
    }

    const adminClient = createAdminClient();
    const ipHash = await getIpHash();

    await cleanupOldRateLimits(adminClient);

    const rateCheck = await checkRateLimit(adminClient, ipHash);
    if (!rateCheck.allowed) {
      return { status: 'error', message: rateCheck.reason, values };
    }

    const { data, error } = await adminClient
      .from('suggestions')
      .insert({
        category: category as SuggestionCategory,
        message: message.trim(),
        name: name.trim() || null,
        email: email.trim() || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('submitSuggestion insert failed', {
        code: error.code,
        message: error.message,
      });

      if (error.code === '42P01') {
        return {
          status: 'error',
          message: 'The drop box is closed right now. Email us instead.',
          values,
        };
      }

      return {
        status: 'error',
        message: 'The drop box is jammed. Try again in a minute.',
        values,
      };
    }

    await recordRateLimit(adminClient, ipHash);

    revalidatePath('/admin');

    const ref = `CS-${data.id.slice(0, 4).toUpperCase()}`;
    return {
      status: 'success',
      ref,
      category: category as SuggestionCategory,
    };
  } catch (error) {
    console.error('submitSuggestion failed', error);
    return {
      status: 'error',
      message: 'The drop box is jammed. Try again in a minute.',
    };
  }
}
