'use server';

import { createHmac } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase/admin';
import { isTableOrFunctionMissing } from '@/lib/supabaseErrors';
import {
  validateSuggestion,
  hasValidationErrors,
  type SuggestionCategory,
  type SuggestionFieldErrors,
  type SuggestionFields,
} from '@/lib/suggestionValidation';

export type SuggestionState =
  | { status: 'idle'; submissionId?: undefined }
  | {
      status: 'error';
      submissionId: string;
      message?: string;
      fieldErrors?: SuggestionFieldErrors;
      values?: SuggestionFields;
    }
  | { status: 'success'; submissionId: string; ref: string; category: SuggestionCategory };

const MIN_FILL_TIME_MS = 3000;
const DROP_BOX_CLOSED_MSG = 'The drop box is closed right now. Email us instead.';

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim();
}

function getHashSecret(): string | null {
  return (
    process.env.SUGGESTION_HASH_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null
  );
}

function hmacSha256(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('hex');
}

async function getIpHash(): Promise<string | null> {
  const secret = getHashSecret();
  if (!secret) return null;

  const headersList = await headers();
  const realIp = headersList.get('x-real-ip');
  const forwarded = headersList.get('x-forwarded-for');
  const ip = realIp?.trim() || forwarded?.split(',')[0]?.trim() || 'unknown';
  return hmacSha256(ip, secret);
}

export async function submitSuggestion(
  _prev: SuggestionState,
  formData: FormData
): Promise<SuggestionState> {
  const submissionId = text(formData, 'submissionId') || crypto.randomUUID();
  
  try {
    const category = text(formData, 'category');
    const message = text(formData, 'message');
    const name = text(formData, 'name');
    const email = text(formData, 'email');
    const website = text(formData, 'website');
    const startedAtStr = text(formData, 'startedAt');

    const values: SuggestionFields = { category, message, name, email };

    if (website) {
      return { status: 'success', submissionId, ref: 'CS-0000', category: 'other' };
    }

    const startedAt = parseInt(startedAtStr, 10);
    const now = Date.now();
    if (
      !startedAtStr ||
      Number.isNaN(startedAt) ||
      startedAt > now ||
      now - startedAt < MIN_FILL_TIME_MS
    ) {
      return {
        status: 'error',
        submissionId,
        message: 'That was quick, give it a second and send again.',
        values,
      };
    }

    const fieldErrors = validateSuggestion(values);
    if (hasValidationErrors(fieldErrors)) {
      return { status: 'error', submissionId, fieldErrors, values };
    }

    if (!isAdminClientConfigured()) {
      return { status: 'error', submissionId, message: DROP_BOX_CLOSED_MSG, values };
    }

    const ipHash = await getIpHash();
    if (!ipHash) {
      console.error('submitSuggestion: no hash secret configured');
      return { status: 'error', submissionId, message: DROP_BOX_CLOSED_MSG, values };
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient.rpc('submit_suggestion', {
      p_ip_hash: ipHash,
      p_category: category as SuggestionCategory,
      p_message: message.trim(),
      p_name: name.trim() || null,
      p_email: email.trim() || null,
    });

    if (error) {
      console.error('submitSuggestion rpc failed', {
        code: error.code,
        message: error.message,
      });

      if (isTableOrFunctionMissing(error)) {
        return { status: 'error', submissionId, message: DROP_BOX_CLOSED_MSG, values };
      }

      return {
        status: 'error',
        submissionId,
        message: 'The drop box is jammed. Try again in a minute.',
        values,
      };
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result || result.status === 'rate_limited') {
      return {
        status: 'error',
        submissionId,
        message: 'The mailbox is full right now. Try again in a few minutes.',
        values,
      };
    }

    if (result.status !== 'ok' || !result.id) {
      return {
        status: 'error',
        submissionId,
        message: 'The drop box is jammed. Try again in a minute.',
        values,
      };
    }

    revalidatePath('/admin');

    const ref = `CS-${String(result.id).slice(0, 4).toUpperCase()}`;
    return {
      status: 'success',
      submissionId,
      ref,
      category: category as SuggestionCategory,
    };
  } catch (error) {
    console.error('submitSuggestion failed', error);
    return {
      status: 'error',
      submissionId,
      message: 'The drop box is jammed. Try again in a minute.',
    };
  }
}
