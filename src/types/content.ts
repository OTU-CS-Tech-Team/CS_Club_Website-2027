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

export type ClubJob = {
  id: string;
  title: string;
  category: string;
  description: string;
  is_active: boolean;
  closes_at?: string | null;
  commitment?: string | null;
  location?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
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
