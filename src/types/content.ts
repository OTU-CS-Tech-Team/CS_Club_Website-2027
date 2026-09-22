import type { ClubEvent } from './landing';

export type ManagedEvent = ClubEvent & {
  starts_at?: string;
  ends_at?: string | null;
  start_time?: string;
  end_time?: string;
  points?: number;
  is_published?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type JobBuiltin = 'description' | 'duties' | 'experience';

export type JobSection =
  | { kind: 'description' }
  | { kind: 'duties'; body: string }
  | { kind: 'experience'; body: string }
  | { kind: 'section'; id: string; title: string; body: string }
  | { kind: 'question'; id: string; prompt: string; required: boolean };

export type JobContentBlock = {
  id: string;
  title: string;
  body: string;
  builtin: JobBuiltin | null;
};

export type JobQuestion = {
  id: string;
  prompt: string;
  required: boolean;
};

export type ClubJob = {
  id: string;
  title: string;
  category: string;
  description: string;
  is_active: boolean;
  closes_at?: string | null;
  commitment?: string | null;
  location?: string | null;
  content?: JobContentBlock[];
  questions?: JobQuestion[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type JobApplication = {
  id: string;
  job_id: string;
  first_name: string;
  last_name: string;
  ontario_tech_email: string;
  student_id: string;
  year_of_study: string;
  program_of_study: string;
  ideas: string;
  resume_path: string | null;
  answers: Array<{ id: string; prompt: string; answer: string }>;
  created_at: string | null;
};

export type EventAttendee = {
  id: string;
  event_id: string;
  name: string;
  email: string;
  student_id: string | null;
  year_of_study: string | null;
  suggestions: string | null;
  points: number | null;
  kind: 'member' | 'guest';
  status: 'attended' | 'confirmed' | 'pending';
};
