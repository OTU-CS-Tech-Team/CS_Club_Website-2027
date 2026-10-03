-- Performance indexes for admin dashboard and check-in queries.
-- These are on frequently filtered/joined columns that lack indexes.
-- Tables defined in this repo's migrations are indexed here.

-- event_rsvps: filter by event_id on check-in and dashboard RSVP queries
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);

-- event_guests: filter by event_id on check-in and dashboard guest queries
CREATE INDEX IF NOT EXISTS idx_event_guests_event_id ON event_guests(event_id);

-- passport_stamps: filter by event_id on attendance tracking
-- Also filter by user_id for per-user passport queries
CREATE INDEX IF NOT EXISTS idx_passport_stamps_event_id ON passport_stamps(event_id);
CREATE INDEX IF NOT EXISTS idx_passport_stamps_user_id ON passport_stamps(user_id);

-- career_applications: filter by job_id for responses dialog
CREATE INDEX IF NOT EXISTS idx_career_applications_job_id ON career_applications(job_id);

-- profiles: email lookups are common for matching RSVPs to profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- events: order by starts_at is common in admin and public queries
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at DESC);

-- jobs: order by created_at and filter by is_active
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active) WHERE is_active = true;

-- mailing_list_subscribers: filter by confirmed status
-- (email already has a unique constraint which creates an index)
CREATE INDEX IF NOT EXISTS idx_mailing_list_subscribers_confirmed
  ON mailing_list_subscribers(confirmed) WHERE confirmed = true;
