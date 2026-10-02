-- Attendance for people without an account lives on event_guests.
-- attended_at is set at check-in. rsvped is false when the row was
-- created at the door, so metrics can count them as attended without
-- counting them as an RSVP. Passport points stay on passport_stamps.
alter table event_guests add column if not exists attended_at timestamptz;
alter table event_guests add column if not exists rsvped boolean not null default true;

-- Door check-in only has an email, so student id can be empty.
alter table event_guests alter column student_id drop not null;
