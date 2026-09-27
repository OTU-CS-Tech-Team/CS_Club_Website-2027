import type { JobContentBlock, JobQuestion, JobSection } from '@/types/content';

export const MAX_JOB_QUESTIONS = 12;
export const MAX_CUSTOM_SECTIONS = 8;
export const MAX_STORED_SECTIONS = 3 + MAX_CUSTOM_SECTIONS + MAX_JOB_QUESTIONS;
export const MAX_QUESTION_PROMPT = 200;
export const MAX_QUESTION_ANSWER = 2000;
export const MAX_SECTION_TITLE = 80;
export const MAX_SECTION_BODY = 5000;

const QUESTION_ID = /^q[a-z0-9]{8,16}$/;
const SECTION_ID = /^s[a-z0-9]{8,16}$/;
const SECTION_MARKER = '\n\n[[job-sections]]\n';

const DUTIES_TITLE = "What you'll do";
const EXPERIENCE_TITLE = 'Ideal experience';

export function isMissingColumnError(error: { code?: string } | null | undefined) {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

export function createQuestionId() {
  return `q${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function createSectionId() {
  return `s${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

function questionsFrom(value: unknown) {
  const questions: JobQuestion[] = [];
  const seen = new Set<string>();
  if (!Array.isArray(value)) return questions;
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as { kind?: unknown; id?: unknown; prompt?: unknown; required?: unknown };
    if (record.kind !== 'question') continue;
    const id = typeof record.id === 'string' ? record.id : '';
    const prompt = typeof record.prompt === 'string' ? record.prompt.trim() : '';
    if (!QUESTION_ID.test(id) || !prompt || prompt.length > MAX_QUESTION_PROMPT || seen.has(id)) continue;
    seen.add(id);
    questions.push({ id, prompt, required: record.required !== false });
  }
  return questions.slice(0, MAX_JOB_QUESTIONS);
}

function contentFrom(value: unknown, description: string) {
  const blocks: JobContentBlock[] = [];
  const seen = new Set<string>();
  let hasDescription = false;
  let hasDuties = false;
  let hasExperience = false;
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const record = item as { kind?: unknown; id?: unknown; title?: unknown; body?: unknown };
      if (record.kind === 'description' && !hasDescription) {
        blocks.push({ id: 'role-description', title: 'Role description', body: description, builtin: 'description' });
        hasDescription = true;
        continue;
      }
      if (record.kind === 'duties' && !hasDuties) {
        const body = typeof record.body === 'string' ? record.body.slice(0, MAX_SECTION_BODY) : '';
        blocks.push({ id: 'what-youll-do', title: DUTIES_TITLE, body, builtin: 'duties' });
        hasDuties = true;
        continue;
      }
      if (record.kind === 'experience' && !hasExperience) {
        const body = typeof record.body === 'string' ? record.body.slice(0, MAX_SECTION_BODY) : '';
        blocks.push({ id: 'ideal-experience', title: EXPERIENCE_TITLE, body, builtin: 'experience' });
        hasExperience = true;
        continue;
      }
      if (record.kind !== 'section') continue;
      const id = typeof record.id === 'string' ? record.id : '';
      const title = typeof record.title === 'string' ? record.title.trim() : '';
      const body = typeof record.body === 'string' ? record.body.slice(0, MAX_SECTION_BODY) : '';
      if (!SECTION_ID.test(id) || !title || title.length > MAX_SECTION_TITLE || seen.has(id)) continue;
      seen.add(id);
      blocks.push({ id, title, body, builtin: null });
    }
  }
  if (!hasDescription) {
    blocks.unshift({ id: 'role-description', title: 'Role description', body: description, builtin: 'description' });
  }
  if (!hasDuties) blocks.push({ id: 'what-youll-do', title: DUTIES_TITLE, body: '', builtin: 'duties' });
  if (!hasExperience) blocks.push({ id: 'ideal-experience', title: EXPERIENCE_TITLE, body: '', builtin: 'experience' });
  return blocks;
}

export function presentJob(description: string, stored: unknown) {
  const markerAt = description.lastIndexOf(SECTION_MARKER);
  const visible = markerAt === -1 ? description : description.slice(0, markerAt);
  let embedded: unknown = null;
  if (markerAt !== -1) {
    try {
      embedded = JSON.parse(description.slice(markerAt + SECTION_MARKER.length));
    } catch {
      embedded = null;
    }
  }
  const source = Array.isArray(embedded) ? embedded : stored;
  const questions = questionsFrom(source);
  const content = contentFrom(source, visible).map((block) => (
    block.builtin === 'description' ? { ...block, body: visible } : block
  ));
  return { description: visible, content, questions };
}

function isDefaultPosting(sections: JobSection[]) {
  return sections.length === 3
    && sections[0]?.kind === 'description'
    && sections[1]?.kind === 'duties'
    && !sections[1].body.trim()
    && sections[2]?.kind === 'experience'
    && !sections[2].body.trim();
}

export function packJobDescription(description: string, sections: JobSection[]) {
  if (isDefaultPosting(sections)) return description;
  return `${description}${SECTION_MARKER}${JSON.stringify(sections)}`;
}

export function parseSubmittedPosting(
  raw: string,
): { ok: true; description: string; sections: JobSection[] } | { ok: false; message: string } {
  let parsed: unknown;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return { ok: false, message: 'The job details could not be read. Try again.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, message: 'The job details could not be read. Try again.' };
  }
  const record = parsed as { content?: unknown; questions?: unknown };
  if (!Array.isArray(record.content)) return { ok: false, message: 'Add a role description before saving.' };

  const sections: JobSection[] = [];
  const seen = new Set<string>();
  let description = '';
  let descriptions = 0;
  let duties = 0;
  let experiences = 0;
  let custom = 0;
  for (const item of record.content) {
    if (!item || typeof item !== 'object') return { ok: false, message: 'One of the job sections is invalid.' };
    const block = item as { builtin?: unknown; id?: unknown; title?: unknown; body?: unknown };
    const body = typeof block.body === 'string' ? block.body.trim() : '';
    if (body.length > MAX_SECTION_BODY) return { ok: false, message: 'One of the job sections is too long.' };
    if (block.builtin === 'description') {
      descriptions += 1;
      if (descriptions > 1) return { ok: false, message: 'The role description can only appear once.' };
      if (!body) return { ok: false, message: 'Enter a role description.' };
      description = body;
      sections.push({ kind: 'description' });
      continue;
    }
    if (block.builtin === 'duties') {
      duties += 1;
      if (duties > 1) return { ok: false, message: "What you'll do can only appear once." };
      sections.push({ kind: 'duties', body });
      continue;
    }
    if (block.builtin === 'experience') {
      experiences += 1;
      if (experiences > 1) return { ok: false, message: 'Ideal experience can only appear once.' };
      sections.push({ kind: 'experience', body });
      continue;
    }
    const id = typeof block.id === 'string' ? block.id : '';
    const title = typeof block.title === 'string' ? block.title.trim() : '';
    if (!SECTION_ID.test(id) || seen.has(id)) return { ok: false, message: 'One of the extra sections is invalid.' };
    if (!title) return { ok: false, message: 'Enter a heading for every extra section.' };
    if (title.length > MAX_SECTION_TITLE) return { ok: false, message: 'A section heading is too long.' };
    if (!body) return { ok: false, message: `Enter the copy for "${title}".` };
    seen.add(id);
    custom += 1;
    sections.push({ kind: 'section', id, title, body });
  }
  if (descriptions !== 1) return { ok: false, message: 'Enter a role description.' };
  if (duties !== 1 || experiences !== 1) return { ok: false, message: 'Keep the standard job sections in the posting.' };
  if (custom > MAX_CUSTOM_SECTIONS) return { ok: false, message: `You can add up to ${MAX_CUSTOM_SECTIONS} extra sections.` };

  const questions = Array.isArray(record.questions) ? record.questions : [];
  const questionIds = new Set<string>();
  for (const item of questions) {
    if (!item || typeof item !== 'object') return { ok: false, message: 'One of the application questions is invalid.' };
    const question = item as { id?: unknown; prompt?: unknown; required?: unknown };
    const id = typeof question.id === 'string' ? question.id : '';
    const prompt = typeof question.prompt === 'string' ? question.prompt.trim() : '';
    if (!QUESTION_ID.test(id) || questionIds.has(id)) return { ok: false, message: 'One of the application questions is invalid.' };
    if (!prompt) return { ok: false, message: 'Enter a prompt for every application question.' };
    if (prompt.length > MAX_QUESTION_PROMPT) return { ok: false, message: 'A question prompt is too long.' };
    questionIds.add(id);
    sections.push({ kind: 'question', id, prompt, required: question.required !== false });
  }
  if (questionIds.size > MAX_JOB_QUESTIONS) {
    return { ok: false, message: `You can add up to ${MAX_JOB_QUESTIONS} application questions.` };
  }
  if (sections.length > MAX_STORED_SECTIONS) {
    return { ok: false, message: 'This posting has too many sections and questions to save together.' };
  }
  return { ok: true, description, sections };
}

export type JobAnswer = { id: string; prompt: string; answer: string };

export const RESUME_PACK_MARKER = '[[resume]]';
export const ANSWERS_PACK_MARKER = '[[answers]]';
export const RESUME_PATH_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|doc|docx)$/i;

export function missingColumnName(error: { message?: string } | null | undefined) {
  const message = error?.message ?? '';
  return message.match(/'([^']+)' column/)?.[1]
    ?? message.match(/column (?:"[^"]+"\.)?"?([a-z0-9_]+)"? does not exist/i)?.[1]
    ?? null;
}

export function normalizeAnswers(value: unknown): JobAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as { id?: unknown; prompt?: unknown; answer?: unknown };
    const prompt = typeof record.prompt === 'string' ? record.prompt.trim() : '';
    const answer = typeof record.answer === 'string' ? record.answer.trim() : '';
    if (!prompt && !answer) return [];
    return [{ id: typeof record.id === 'string' ? record.id : '', prompt, answer }];
  });
}

export function packApplicationFallback(ideas: string, answers: JobAnswer[], resumePath: string) {
  const parts = [`${RESUME_PACK_MARKER}\n${resumePath}`];
  if (answers.length) parts.push(`${ANSWERS_PACK_MARKER}\n${JSON.stringify(answers)}`);
  if (ideas) parts.push(ideas);
  return parts.join('\n\n').slice(0, 2000);
}

export function recoverPackedIdeas(raw: string | null): { ideas: string; answers: JobAnswer[]; resumePath: string | null } {
  if (!raw) return { ideas: '', answers: [], resumePath: null };
  let text = raw;
  let resumePath: string | null = null;
  let answers: JobAnswer[] = [];

  const resumeAt = text.indexOf(RESUME_PACK_MARKER);
  if (resumeAt >= 0) {
    const after = text.slice(resumeAt + RESUME_PACK_MARKER.length).replace(/^\n/, '');
    const line = after.split('\n', 1)[0]?.trim() ?? '';
    if (RESUME_PATH_PATTERN.test(line)) resumePath = line;
    text = `${text.slice(0, resumeAt)}${after.slice(after.startsWith(line) ? line.length : after.indexOf('\n') + 1)}`;
  } else {
    const legacy = text.match(/\n\nResume: (\S+)\s*$/);
    if (legacy && RESUME_PATH_PATTERN.test(legacy[1] ?? '')) {
      resumePath = legacy[1] ?? null;
      text = text.slice(0, legacy.index);
    }
  }

  const answersAt = text.indexOf(ANSWERS_PACK_MARKER);
  if (answersAt >= 0) {
    const json = text.slice(answersAt + ANSWERS_PACK_MARKER.length).trim();
    text = text.slice(0, answersAt);
    try {
      answers = normalizeAnswers(JSON.parse(json));
    } catch {
      answers = [];
    }
  }

  return { ideas: text.trim(), answers, resumePath };
}

export function readQuestionAnswers(
  questions: JobQuestion[],
  read: (name: string) => string,
): { ok: true; answers: JobAnswer[] } | { ok: false; message: string } {
  const answers: JobAnswer[] = [];
  for (const question of questions) {
    const answer = read(`question:${question.id}`).trim();
    if (!answer) {
      if (question.required) return { ok: false, message: `Please answer "${question.prompt}".` };
      continue;
    }
    if (answer.length > MAX_QUESTION_ANSWER) return { ok: false, message: 'One of your answers is too long.' };
    answers.push({ id: question.id, prompt: question.prompt, answer });
  }
  return { ok: true, answers };
}
