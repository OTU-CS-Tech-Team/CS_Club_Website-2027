import type { ClubEvent } from './landing';

export type ManagedEvent = ClubEvent & {
  starts_at?: string;
  ends_at?: string | null;
  start_time?: string;
  end_time?: string;
  points?: number;
  created_at?: string;
  updated_at?: string;
};

export type ClubJob = {
  id: string;
  title: string;
  category: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};
