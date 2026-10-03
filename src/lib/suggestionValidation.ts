export const SUGGESTION_CATEGORIES = [
  'event_idea',
  'workshop',
  'feedback',
  'just_saying_hi',
  'other',
] as const;

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  event_idea: 'Event idea',
  workshop: 'Workshop',
  feedback: 'Feedback',
  just_saying_hi: 'Just saying hi',
  other: 'Other',
};

export const CATEGORY_EMOJI: Record<SuggestionCategory, string> = {
  event_idea: '🎉',
  workshop: '🛠',
  feedback: '💬',
  just_saying_hi: '👋',
  other: '✨',
};

export type SuggestionFields = {
  category: string;
  message: string;
  name: string;
  email: string;
};

export type SuggestionFieldErrors = Partial<Record<keyof SuggestionFields, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MESSAGE_MIN_LENGTH = 10;
export const MESSAGE_MAX_LENGTH = 2000;
export const NAME_MAX_LENGTH = 120;
export const EMAIL_MAX_LENGTH = 254;

export function validateSuggestion(input: SuggestionFields): SuggestionFieldErrors {
  const errors: SuggestionFieldErrors = {};

  if (!input.category || !SUGGESTION_CATEGORIES.includes(input.category as SuggestionCategory)) {
    errors.category = 'Please select a category.';
  }

  const messageTrimmed = input.message.trim();
  if (!messageTrimmed) {
    errors.message = 'Write us a message first.';
  } else if (messageTrimmed.length < MESSAGE_MIN_LENGTH) {
    errors.message = `Write at least ${MESSAGE_MIN_LENGTH} characters so we know what you mean (${messageTrimmed.length}/${MESSAGE_MIN_LENGTH}).`;
  } else if (messageTrimmed.length > MESSAGE_MAX_LENGTH) {
    errors.message = `Keep it under ${MESSAGE_MAX_LENGTH.toLocaleString()} characters.`;
  }

  const nameTrimmed = input.name.trim();
  if (nameTrimmed.length > NAME_MAX_LENGTH) {
    errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  }

  const emailTrimmed = input.email.trim();
  if (emailTrimmed) {
    if (emailTrimmed.length > EMAIL_MAX_LENGTH) {
      errors.email = `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`;
    } else if (!EMAIL_RE.test(emailTrimmed)) {
      errors.email = "That email doesn't look quite right.";
    }
  }

  return errors;
}

export function hasValidationErrors(errors: SuggestionFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
