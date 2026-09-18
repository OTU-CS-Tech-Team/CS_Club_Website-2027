-- Free-text "suggestions for future events" captured with an RSVP,
-- for both signed-in members (event_rsvps) and guests (event_guests).
alter table event_rsvps add column if not exists suggestions text;
alter table event_guests add column if not exists suggestions text;
