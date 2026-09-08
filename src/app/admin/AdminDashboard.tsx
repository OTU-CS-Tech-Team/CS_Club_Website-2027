'use client';

import { useActionState, useCallback, useDeferredValue, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ClubJob, EventAttendee, ManagedEvent } from '@/types/content';
import type { MailingListSubscriber } from '@/lib/members';
import { validateEventForm } from '@/lib/eventFormValidation';
import {
  deleteEvent,
  deleteJob,
  saveEvent,
  saveJob,
  sendNewsletter,
  signOut,
  type AdminActionState,
} from './actions';
import styles from './admin.module.css';
import { CategoryPicker, DatePicker, TimePicker } from './CustomPickers';

const initialState: AdminActionState = { ok: false, message: '' };

type SentNewsletter = { id: string; subject: string; recipient_count: number; sent_at: string };

type ContentPreview =
  | { kind: 'event'; title: string; description: string; date: string; startTime: string; endTime: string; location: string; image: string; published: boolean }
  | { kind: 'job'; title: string; description: string; category: string; closingDate: string; commitment: string; location: string; active: boolean };

function torontoDateValue(value?: string | null) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function auditLabel(createdBy: string | null | undefined, creatorEmails: Record<string, string>, updatedAt?: string) {
  const creatorEmail = createdBy ? creatorEmails[createdBy] : null;
  const owner = creatorEmail ? `Created by ${creatorEmail}` : 'Created by unavailable account';
  if (!updatedAt) return owner;
  return `${owner} · Updated ${new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(updatedAt))}`;
}

function DraftExitDialog({ pending, onKeepEditing, onDiscard, onSave }: { pending: boolean; onKeepEditing: () => void; onDiscard: () => void; onSave: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onKeepEditing();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onKeepEditing, pending]);

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="draft-exit-title" aria-describedby="draft-exit-description">
        <p className={styles.kicker}>Unsaved event</p>
        <h2 id="draft-exit-title">Save your work for later?</h2>
        <p id="draft-exit-description">Saving as a draft keeps this event private until an executive publishes it.</p>
        <div className={styles.dialogActions}>
          <button className={styles.textButton} type="button" onClick={onKeepEditing} disabled={pending}>Keep editing</button>
          <button className={styles.previewButton} type="button" onClick={onDiscard} disabled={pending}>Discard</button>
          <button className={styles.primaryButton} type="button" onClick={onSave} disabled={pending}>{pending ? 'Saving...' : 'Save draft'}</button>
        </div>
      </section>
    </div>
  );
}

function EventEditor({ event, onDone, onSuccess, onPreview }: { event: ManagedEvent | null; onDone: () => void; onSuccess: (message: string) => void; onPreview: (preview: ContentPreview) => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveEvent, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const draftButtonRef = useRef<HTMLButtonElement>(null);
  const [clientError, setClientError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const [date, setDate] = useState(event?.date ?? '');
  const [startTime, setStartTime] = useState(event?.start_time ?? '');
  const [endTime, setEndTime] = useState(event?.end_time ?? '');
  const isDuplicate = Boolean(event && !event.id);

  const keepEditing = useCallback(() => setExitPromptOpen(false), []);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setDate('');
      setStartTime('');
      setEndTime('');
      onSuccess(state.message);
      onDone();
      router.refresh();
    }
  }, [state.ok, state.message, onDone, onSuccess, router]);

  function validate(event: FormEvent<HTMLFormElement>) {
    setClientError('');
    const data = new FormData(event.currentTarget);
    const validationError = validateEventForm({
      title: String(data.get('title') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
      date: String(data.get('date') ?? '').trim(),
      startTime: String(data.get('startTime') ?? '').trim(),
      endTime: String(data.get('endTime') ?? '').trim(),
      location: String(data.get('location') ?? '').trim(),
      points: String(data.get('points') ?? '').trim(),
      images: String(data.get('images') ?? '').trim(),
    });
    if (validationError) {
      event.preventDefault();
      setClientError(validationError);
    }
  }

  function preview() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const title = String(data.get('title') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const location = String(data.get('location') ?? '').trim();
    const validationError = validateEventForm({
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      points: String(data.get('points') ?? '').trim(),
      images: String(data.get('images') ?? '').trim(),
    });
    if (validationError) {
      setClientError(validationError);
      return;
    }
    const image = String(data.get('images') ?? '').split(/[\n,]/).map((value) => value.trim()).find(Boolean) ?? '';
    onPreview({
      kind: 'event',
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      image,
      published: event?.is_published ?? false,
    });
  }

  function requestClose() {
    if (dirty) {
      setExitPromptOpen(true);
      return;
    }
    onDone();
  }

  function saveDraftAndClose() {
    setExitPromptOpen(false);
    formRef.current?.requestSubmit(draftButtonRef.current ?? undefined);
  }

  return (
    <form ref={formRef} action={action} className={styles.editor} noValidate onSubmit={validate} onInput={() => { setClientError(''); setDirty(true); }}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.kicker}>{isDuplicate ? 'Duplicating event' : event ? 'Editing event' : 'New event'}</p>
          <h2>{event?.title ?? 'Add to the calendar'}</h2>
        </div>
        <button className={styles.textButton} type="button" onClick={requestClose}>Cancel</button>
      </div>
      <input type="hidden" name="originalId" value={event?.id ?? ''} />
      <div className={styles.formGrid}>
        <label className={styles.wide}>Title<input name="title" defaultValue={event?.title} maxLength={160} aria-required="true" /></label>
        <label className={styles.wide}>Description<textarea name="description" defaultValue={event?.description} maxLength={5000} rows={5} aria-required="true" /></label>
        <label>Date<DatePicker name="date" value={date} onChange={(value) => { setDate(value); setDirty(true); }} /></label>
        <label>Start time<TimePicker name="startTime" value={startTime} onChange={(value) => { setStartTime(value); setDirty(true); }} /></label>
        <label>End time<TimePicker name="endTime" value={endTime} onChange={(value) => { setEndTime(value); setDirty(true); }} /></label>
        <label>Location<input name="location" placeholder="SIRC 2020" defaultValue={event?.location} maxLength={200} aria-required="true" /></label>
        <label>Passport points<input name="points" type="number" min={0} max={1000} step={1} defaultValue={event?.points ?? 10} aria-required="true" /></label>
        <label className={styles.wide}>Image URLs<textarea name="images" placeholder="https://mario.wiki.gallery/images/thumb/6/6e/DKB_Thinking_DK.png/1200px-DKB_Thinking_DK.png" defaultValue={event?.images.join('\n')} rows={3} /><span className={styles.hint}>One HTTPS URL or site path per line, up to six.</span></label>
      </div>
      {clientError || state.message ? <p className={clientError || !state.ok ? styles.error : styles.success} role="alert">{clientError || state.message}</p> : null}
      <div className={styles.editorActions}>
        <button className={styles.previewButton} type="button" onClick={preview}>Preview</button>
        <button ref={draftButtonRef} className={styles.previewButton} type="submit" name="intent" value="draft" disabled={pending}>{pending ? 'Saving...' : 'Save draft'}</button>
        <button className={styles.primaryButton} type="submit" name="intent" value="publish" disabled={pending}>{pending ? 'Publishing...' : event?.id ? 'Save and publish' : 'Publish event'}</button>
      </div>
      {exitPromptOpen ? <DraftExitDialog pending={pending} onKeepEditing={keepEditing} onDiscard={onDone} onSave={saveDraftAndClose} /> : null}
    </form>
  );
}

function JobEditor({ job, onDone, onSuccess, onPreview }: { job: ClubJob | null; onDone: () => void; onSuccess: (message: string) => void; onPreview: (preview: ContentPreview) => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveJob, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState('');
  const [category, setCategory] = useState(job?.category ?? '');
  const [closingDate, setClosingDate] = useState(() => torontoDateValue(job?.closes_at));

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setCategory('');
      setClosingDate('');
      onSuccess(state.message);
      onDone();
      router.refresh();
    }
  }, [state.ok, state.message, onDone, onSuccess, router]);

  function validate(event: FormEvent<HTMLFormElement>) {
    setClientError('');
    const data = new FormData(event.currentTarget);
    const fields: Array<[string, string]> = [
      ['title', 'a job title'],
      ['category', 'a category'],
      ['description', 'a description'],
    ];
    const missing = fields.find(([name]) => !String(data.get(name) ?? '').trim());
    if (missing) {
      event.preventDefault();
      setClientError(`Please enter ${missing[1]}.`);
    }
  }

  function preview() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const title = String(data.get('title') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    if (!title || !description || !category) {
      setClientError('Complete the job details before previewing.');
      return;
    }
    onPreview({
      kind: 'job',
      title,
      description,
      category,
      closingDate,
      commitment: String(data.get('commitment') ?? '').trim(),
      location: String(data.get('jobLocation') ?? '').trim(),
      active: data.get('isActive') === 'on',
    });
  }

  return (
    <form ref={formRef} action={action} className={styles.editor} noValidate onSubmit={validate} onInput={() => setClientError('')}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.kicker}>{job ? 'Editing job' : 'New job'}</p>
          <h2>{job?.title ?? 'Post an opportunity'}</h2>
        </div>
        <button className={styles.textButton} type="button" onClick={onDone}>Cancel</button>
      </div>
      <input type="hidden" name="originalId" value={job?.id ?? ''} />
      <div className={styles.formGrid}>
        <label className={styles.wide}>Title<input name="title" defaultValue={job?.title} maxLength={160} aria-required="true" /></label>
        <label>Category<CategoryPicker value={category} onChange={(value) => { setCategory(value); setClientError(''); }} /></label>
        <label><span className={styles.labelLine}>Closing date <span className={styles.optional}>(optional)</span></span><DatePicker name="closingDate" value={closingDate} onChange={setClosingDate} ariaLabel="Choose job closing date" /></label>
        <label><span className={styles.labelLine}>Time commitment <span className={styles.optional}>(optional)</span></span><input name="commitment" defaultValue={job?.commitment ?? ''} maxLength={120} placeholder="2–4 hours per week" /></label>
        <label><span className={styles.labelLine}>Location <span className={styles.optional}>(optional)</span></span><input name="jobLocation" defaultValue={job?.location ?? ''} maxLength={160} placeholder="Ontario Tech / Hybrid" /></label>
        <label className={styles.wide}>Description<textarea name="description" defaultValue={job?.description} maxLength={5000} rows={7} aria-required="true" /></label>
        <label className={styles.checkLabel}><input name="isActive" type="checkbox" defaultChecked={job?.is_active ?? true} />Visible on the careers page</label>
      </div>
      {clientError || state.message ? <p className={clientError || !state.ok ? styles.error : styles.success} role="alert">{clientError || state.message}</p> : null}
      <div className={styles.editorActions}>
        <button className={styles.previewButton} type="button" onClick={preview}>Preview</button>
        <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? 'Saving...' : job ? 'Update job' : 'Create job'}</button>
      </div>
    </form>
  );
}

function NewsletterEditor({ recipientCount, onSuccess }: { recipientCount: number; onSuccess: (message: string) => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendNewsletter, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    if (state.ok) {
      onSuccess(state.message);
      if (!state.message.startsWith('Test sent')) {
        formRef.current?.reset();
      }
      router.refresh();
    }
  }, [state.ok, state.message, onSuccess, router]);

  function validateFields(form: HTMLFormElement) {
    const data = new FormData(form);
    if (!String(data.get('subject') ?? '').trim() || !String(data.get('body') ?? '').trim()) {
      setClientError('Please enter a subject and body.');
      return false;
    }
    setClientError('');
    return true;
  }

  return (
    <form ref={formRef} className={styles.editor} noValidate onInput={() => setClientError('')}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.kicker}>Club update</p>
          <h2>Send a newsletter</h2>
        </div>
      </div>
      <div className={styles.formGrid}>
        <label className={styles.wide}>Subject<input name="subject" maxLength={200} aria-required="true" /></label>
        <label className={styles.wide}>Body<textarea name="body" rows={8} maxLength={20000} aria-required="true" /></label>
      </div>
      {clientError || state.message ? <p className={clientError || !state.ok ? styles.error : styles.success} role="alert">{clientError || state.message}</p> : null}
      <p className={styles.hint}>Will send to {recipientCount} mailing list subscriber(s) — people who signed up on the homepage.</p>
      <div className={styles.itemActions}>
        <button
          className={styles.textButton}
          type="submit"
          disabled={pending}
          formAction={(formData) => {
            if (!formRef.current || !validateFields(formRef.current)) return;
            formData.set('intent', 'test');
            action(formData);
          }}
        >
          {pending ? 'Sending...' : 'Send test to myself'}
        </button>
        <button
          className={styles.primaryButton}
          type="submit"
          disabled={pending}
          formAction={(formData) => {
            if (!formRef.current || !validateFields(formRef.current)) return;
            formData.set('intent', 'send');
            action(formData);
          }}
        >
          {pending ? 'Sending...' : `Send to all ${recipientCount}`}
        </button>
      </div>
    </form>
  );
}

type DeleteTarget = { type: 'event' | 'job'; id: string; title: string };

function MailingListPanel({ subscribers }: { subscribers: MailingListSubscriber[] }) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? subscribers.filter(
        (person) =>
          person.name.toLowerCase().includes(needle) ||
          person.email.toLowerCase().includes(needle),
      )
    : subscribers;

  return (
    <section className={styles.collection} aria-labelledby="mailing-list-heading">
      <h2 id="mailing-list-heading">Mailing list</h2>
      {subscribers.length ? (
        <>
          <label className={styles.filterField}>
            <span className={styles.srOnly}>Filter mailing list</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by name or email"
            />
          </label>
          {filtered.length ? (
            <div className={styles.scrollList}>
              {filtered.map((person) => (
                <article className={styles.item} key={String(person.id)}>
                  <div>
                    <h3>{person.name}</h3>
                    <p>{person.email}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No subscribers match that filter.</p>
          )}
        </>
      ) : (
        <p className={styles.empty}>Nobody on the mailing list yet.</p>
      )}
    </section>
  );
}

function DeleteDialog({ target, onClose, onComplete }: { target: DeleteTarget; onClose: () => void; onComplete: (state: AdminActionState) => void }) {
  const deleteAction = target.type === 'event' ? deleteEvent : deleteJob;
  const [state, action, pending] = useActionState(deleteAction, initialState);

  useEffect(() => {
    if (state.ok) {
      onComplete(state);
      onClose();
    }
  }, [state, onClose, onComplete]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose, pending]);

  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <p className={styles.kicker}>Permanent action</p>
        <h2 id="delete-dialog-title">Delete {target.type}?</h2>
        <p>This will remove <strong>{target.title}</strong> from the dashboard and public site.</p>
        {state.message ? <p className={styles.error} role="alert">{state.message}</p> : null}
        <form action={action}>
          <input type="hidden" name="id" value={target.id} />
          <div className={styles.dialogActions}>
            <button className={styles.textButton} type="button" onClick={onClose} disabled={pending}>Keep it</button>
            <button className={styles.deleteConfirmButton} type="submit" disabled={pending}>{pending ? 'Deleting...' : `Delete ${target.type}`}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PreviewDialog({ preview, onClose }: { preview: ContentPreview; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`${styles.dialog} ${styles.previewDialog}`} role="dialog" aria-modal="true" aria-labelledby="preview-dialog-title">
        <div className={styles.previewHeader}>
          <div>
            <p className={styles.kicker}>{preview.kind === 'event' ? 'Event preview' : 'Job preview'}</p>
            <h2 id="preview-dialog-title">{preview.title}</h2>
          </div>
          <button className={styles.previewClose} type="button" onClick={onClose} aria-label="Close preview">×</button>
        </div>
        {preview.kind === 'event' ? (
          <>
            {preview.image ? <img className={styles.previewImage} src={preview.image} alt="" /> : <div className={styles.previewImagePlaceholder}>No image added</div>}
            <p className={styles.previewMeta}>{preview.date} · {preview.startTime}–{preview.endTime} · {preview.location}</p>
            <p>{preview.description}</p>
            <span className={preview.published ? styles.statusLive : styles.statusDraft}>{preview.published ? 'Published' : 'Draft'}</span>
          </>
        ) : (
          <>
            <p className={styles.previewMeta}>{[preview.category, preview.commitment, preview.location, preview.closingDate ? `Closes ${preview.closingDate}` : 'Open until filled'].filter(Boolean).join(' · ')}</p>
            <p>{preview.description}</p>
            <span className={preview.active ? styles.statusLive : styles.statusDraft}>{preview.active ? 'Visible' : 'Hidden'}</span>
          </>
        )}
      </section>
    </div>
  );
}

function RsvpDialog({
  event,
  attendees,
  loadError,
  onClose,
}: {
  event: ManagedEvent;
  attendees: EventAttendee[];
  loadError: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const confirmed = attendees.filter((attendee) => attendee.status !== 'pending').length;
  const attended = attendees.filter((attendee) => attendee.status === 'attended').length;
  const pending = attendees.filter((attendee) => attendee.status === 'pending').length;
  const statusOrder = { attended: 0, confirmed: 1, pending: 2 } as const;
  const sortedAttendees = [...attendees].sort((first, second) =>
    statusOrder[first.status] - statusOrder[second.status] || first.name.localeCompare(second.name),
  );

  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose(); }}>
      <section className={`${styles.dialog} ${styles.rsvpDialog}`} role="dialog" aria-modal="true" aria-labelledby="rsvp-dialog-title">
        <div className={styles.previewHeader}>
          <div>
            <p className={styles.kicker}>RSVP status</p>
            <h2 id="rsvp-dialog-title">{event.title}</h2>
          </div>
          <button className={styles.previewClose} type="button" onClick={onClose} aria-label="Close RSVP status">×</button>
        </div>
        {loadError ? <p className={styles.error} role="alert">{loadError}</p> : (
          <>
            <div className={styles.rsvpSummary} aria-label="RSVP summary">
              <div><strong>{confirmed}</strong><span>Confirmed</span></div>
              <div><strong>{attended}</strong><span>Attended</span></div>
              <div><strong>{pending}</strong><span>Awaiting confirmation</span></div>
            </div>
            {sortedAttendees.length ? (
              <div className={styles.rsvpRoster} aria-label={`RSVPs for ${event.title}`}>
                {sortedAttendees.map((attendee) => (
                  <article className={styles.rsvpRow} key={attendee.id}>
                    <div className={styles.rsvpIdentity}>
                      <strong>{attendee.name}</strong>
                      <span>{attendee.email || 'Email unavailable'}</span>
                      <small>{attendee.kind === 'member' ? ['Member', attendee.year_of_study].filter(Boolean).join(' · ') : 'Guest'}</small>
                    </div>
                    <span className={attendee.status === 'attended' ? styles.rsvpAttended : attendee.status === 'pending' ? styles.rsvpPending : styles.rsvpConfirmed}>
                      {attendee.status === 'attended' ? 'Attended' : attendee.status === 'pending' ? 'Awaiting confirmation' : 'RSVP’d'}
                    </span>
                  </article>
                ))}
              </div>
            ) : <p className={styles.empty}>No RSVPs for this event yet.</p>}
          </>
        )}
      </section>
    </div>
  );
}

type EventStatusFilter = 'all' | 'upcoming' | 'past' | 'draft';
type JobStatusFilter = 'all' | 'live' | 'hidden' | 'expired';

function eventStatus(event: ManagedEvent, now: number) {
  if (event.is_published === false) return 'draft' as const;
  const boundary = event.ends_at ?? event.starts_at;
  return boundary && new Date(boundary).getTime() < now ? 'past' as const : 'upcoming' as const;
}

function jobStatus(job: ClubJob, now: number) {
  if (!job.is_active) return 'hidden' as const;
  if (job.closes_at && new Date(job.closes_at).getTime() <= now) return 'expired' as const;
  return 'live' as const;
}

export default function AdminDashboard({
  email,
  events,
  jobs,
  subscribers,
  newsletters,
  newsletterConfigured,
  creatorEmails,
  attendees,
  loadErrors,
}: {
  email: string;
  events: ManagedEvent[];
  jobs: ClubJob[];
  subscribers: MailingListSubscriber[];
  newsletters: SentNewsletter[];
  newsletterConfigured: boolean;
  creatorEmails: Record<string, string>;
  attendees: EventAttendee[];
  loadErrors: { events: string; jobs: string; attendance: string };
}) {
  const [tab, setTab] = useState<'events' | 'jobs' | 'newsletter'>('events');
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [editingJob, setEditingJob] = useState<ClubJob | null>(null);
  const [eventEditorOpen, setEventEditorOpen] = useState(false);
  const [jobEditorOpen, setJobEditorOpen] = useState(false);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [preview, setPreview] = useState<ContentPreview | null>(null);
  const [rsvpEvent, setRsvpEvent] = useState<ManagedEvent | null>(null);
  const [notice, setNotice] = useState<AdminActionState | null>(null);
  const [eventQuery, setEventQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<EventStatusFilter>('all');
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [jobQuery, setJobQuery] = useState('');
  const [jobCategory, setJobCategory] = useState('all');
  const [jobFilter, setJobFilter] = useState<JobStatusFilter>('all');
  const deferredEventQuery = useDeferredValue(eventQuery.trim().toLowerCase());
  const deferredJobQuery = useDeferredValue(jobQuery.trim().toLowerCase());
  const finishEventEdit = useCallback(() => {
    setEditingEvent(null);
    setEventEditorOpen(false);
  }, []);
  const finishJobEdit = useCallback(() => {
    setEditingJob(null);
    setJobEditorOpen(false);
  }, []);
  const showSuccess = useCallback((message: string) => setNotice({ ok: true, message }), []);
  const completeDelete = useCallback((state: AdminActionState) => setNotice(state), []);
  const closePreview = useCallback(() => setPreview(null), []);
  const now = Date.now();
  const categories = Array.from(new Set(jobs.map((job) => job.category))).sort((a, b) => a.localeCompare(b));
  const filteredEvents = events.filter((event) => {
    const matchesSearch = !deferredEventQuery || [event.title, event.location, event.date].some((value) => value.toLowerCase().includes(deferredEventQuery));
    return matchesSearch && (eventFilter === 'all' || eventStatus(event, now) === eventFilter);
  });
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = !deferredJobQuery || [job.title, job.category].some((value) => value.toLowerCase().includes(deferredJobQuery));
    const matchesCategory = jobCategory === 'all' || job.category === jobCategory;
    return matchesSearch && matchesCategory && (jobFilter === 'all' || jobStatus(job, now) === jobFilter);
  });
  const visibleEvents = eventsExpanded ? filteredEvents : filteredEvents.slice(0, 4);
  const hasMoreEvents = filteredEvents.length > 4;

  useEffect(() => setEventsExpanded(false), [deferredEventQuery, eventFilter, events.length]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.kicker}>Executive dashboard</p><p>Signed in as {email}</p></div>
        <form action={signOut}><button className={styles.signOut} type="submit">Sign out</button></form>
      </header>
      <nav className={styles.tabs} aria-label="Dashboard sections">
        <button type="button" className={tab === 'events' ? styles.activeTab : ''} onClick={() => setTab('events')}>Events <span>{events.length}</span></button>
        <button type="button" className={tab === 'jobs' ? styles.activeTab : ''} onClick={() => setTab('jobs')}>Jobs <span>{jobs.length}</span></button>
        <button type="button" className={tab === 'newsletter' ? styles.activeTab : ''} onClick={() => setTab('newsletter')}>Newsletter <span>{subscribers.length}</span></button>
      </nav>
      {notice ? <div className={styles.notification} role={notice.ok ? 'status' : 'alert'}><span className={styles.notificationMark} aria-hidden="true">{notice.ok ? '•' : '!'}</span><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div> : null}
      {tab === 'events' ? <main className={styles.workspace}>
        <section className={styles.collection} aria-labelledby="events-list-heading">
          <div className={styles.collectionHead}>
            <div><p className={styles.kicker}>Calendar inventory</p><h2 id="events-list-heading">All events</h2><span>{filteredEvents.length} shown</span></div>
            <button className={styles.sectionAction} type="button" onClick={() => { setEditingEvent(null); setEventEditorOpen(true); }}>New event</button>
          </div>
          {eventEditorOpen ? <EventEditor key={editingEvent ? `${editingEvent.id}-${editingEvent.title}` : 'new-event'} event={editingEvent} onDone={finishEventEdit} onSuccess={showSuccess} onPreview={setPreview} /> : null}
          {loadErrors.events ? <p className={styles.error} role="alert">{loadErrors.events}</p> : null}
          <div className={styles.filters}>
            <label className={styles.filterField}><span className={styles.srOnly}>Search events</span><input type="search" value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} placeholder="Search title, date, or location" /></label>
            <div className={styles.filterChips} aria-label="Filter events by status">
              {(['all', 'upcoming', 'past', 'draft'] as const).map((filter) => <button type="button" key={filter} className={eventFilter === filter ? styles.filterChipActive : styles.filterChip} onClick={() => setEventFilter(filter)}>{filter}</button>)}
            </div>
          </div>
          {!loadErrors.events && filteredEvents.length ? <>
            <div className={eventsExpanded ? styles.expandedEventScroll : styles.eventPreviewList} tabIndex={eventsExpanded ? 0 : undefined} aria-label="Event results">
            {visibleEvents.map((event) => {
              const status = eventStatus(event, now);
              const rsvpCount = attendees.filter((attendee) => attendee.event_id === event.id && attendee.status !== 'pending').length;
              return <article className={styles.item} key={event.id}>
                {event.images[0] ? <img className={styles.itemImage} src={event.images[0]} alt="" loading="lazy" /> : <div className={styles.itemImagePlaceholder} aria-hidden="true">CS</div>}
                <div className={styles.itemBody}><p className={styles.itemMeta}>{event.date} / {event.time}</p><h3>{event.title}</h3><p>{event.location}</p><p className={styles.audit}>{auditLabel(event.created_by, creatorEmails, event.updated_at)}</p></div>
                <div className={styles.itemControls}><span className={status === 'draft' ? styles.statusDraft : status === 'past' ? styles.statusPast : styles.statusLive}>{status}</span><div className={styles.itemActions}><button type="button" onClick={() => setRsvpEvent(event)} aria-label={`View RSVPs for ${event.title}`}>RSVPs {rsvpCount}</button><button type="button" onClick={() => { setEditingEvent(event); setEventEditorOpen(true); }}>Edit</button><button type="button" onClick={() => { setEditingEvent({ ...event, id: '', title: `${event.title} copy`, created_by: null, created_at: undefined, updated_at: undefined }); setEventEditorOpen(true); }}>Duplicate</button><button className={styles.deleteButton} type="button" onClick={() => setDeleting({ type: 'event', id: event.id, title: event.title })}>Delete</button></div></div>
              </article>;
            })}
            </div>
            {hasMoreEvents ? <div className={styles.loadMoreRow}>
              <button className={styles.loadMoreButton} type="button" onClick={() => setEventsExpanded((expanded) => !expanded)}>{eventsExpanded ? 'Show first four' : 'Load more'}</button>
              <span>{eventsExpanded ? `Scroll to browse all ${filteredEvents.length} events` : `${filteredEvents.length - 4} more events`}</span>
            </div> : null}
          </> : !loadErrors.events ? <p className={styles.empty}>No events match those filters.</p> : null}
        </section>
      </main> : null}
      {tab === 'jobs' ? <main className={styles.workspace}>
        <section className={styles.collection} aria-labelledby="jobs-list-heading">
          <div className={styles.collectionHead}>
            <div><p className={styles.kicker}>Opportunity inventory</p><h2 id="jobs-list-heading">All jobs</h2><span>{filteredJobs.length} shown</span></div>
            <button className={styles.sectionAction} type="button" onClick={() => { setEditingJob(null); setJobEditorOpen(true); }}>New job</button>
          </div>
          {jobEditorOpen ? <JobEditor key={editingJob?.id ?? 'new-job'} job={editingJob} onDone={finishJobEdit} onSuccess={showSuccess} onPreview={setPreview} /> : null}
          {loadErrors.jobs ? <p className={styles.error} role="alert">{loadErrors.jobs}</p> : null}
          <div className={styles.filters}>
            <label className={styles.filterField}><span className={styles.srOnly}>Search jobs</span><input type="search" value={jobQuery} onChange={(event) => setJobQuery(event.target.value)} placeholder="Search title or category" /></label>
            <div className={styles.filterRow}>
              <label><span className={styles.srOnly}>Filter by category</span><select value={jobCategory} onChange={(event) => setJobCategory(event.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <div className={styles.filterChips} aria-label="Filter jobs by status">{(['all', 'live', 'hidden', 'expired'] as const).map((filter) => <button type="button" key={filter} className={jobFilter === filter ? styles.filterChipActive : styles.filterChip} onClick={() => setJobFilter(filter)}>{filter}</button>)}</div>
            </div>
          </div>
          {!loadErrors.jobs && filteredJobs.length ? <div className={styles.fiveRowScroll} tabIndex={0} aria-label="Job results">{filteredJobs.map((job) => {
            const status = jobStatus(job, now);
            return <article className={styles.item} key={job.id}><div className={styles.itemBody}><p className={styles.itemMeta}>{job.category}{job.closes_at ? ` / Closes ${torontoDateValue(job.closes_at)}` : ' / Open until filled'}</p><h3>{job.title}</h3>{job.commitment || job.location ? <p>{[job.commitment, job.location].filter(Boolean).join(' · ')}</p> : null}<p className={styles.audit}>{auditLabel(job.created_by, creatorEmails, job.updated_at)}</p></div><div className={styles.itemControls}><span className={status === 'live' ? styles.statusLive : status === 'expired' ? styles.statusPast : styles.statusDraft}>{status}</span><div className={styles.itemActions}><button type="button" onClick={() => { setEditingJob(job); setJobEditorOpen(true); }}>Edit</button><button className={styles.deleteButton} type="button" onClick={() => setDeleting({ type: 'job', id: job.id, title: job.title })}>Delete</button></div></div></article>;
          })}</div> : !loadErrors.jobs ? <p className={styles.empty}>No jobs match those filters.</p> : null}
        </section>
      </main> : null}
      {tab === 'newsletter' ? newsletterConfigured ? <main className={styles.workspace}>
          <NewsletterEditor recipientCount={subscribers.length} onSuccess={showSuccess} />
          <div className={styles.newsletterSide}>
            <MailingListPanel subscribers={subscribers} />
            <section className={styles.collection} aria-labelledby="newsletter-list-heading">
              <h2 id="newsletter-list-heading">Recently sent</h2>
              {newsletters.length ? newsletters.map((newsletter) => (
                <article className={styles.item} key={newsletter.id}>
                  <div>
                    <p className={styles.itemMeta}>{new Date(newsletter.sent_at).toLocaleDateString()} / {newsletter.recipient_count} recipient(s)</p>
                    <h3>{newsletter.subject}</h3>
                  </div>
                </article>
              )) : <p className={styles.empty}>No newsletters sent yet.</p>}
            </section>
          </div>
        </main> : <main className={styles.workspace}>
          <section className={styles.editor} aria-labelledby="newsletter-setup-heading">
            <p className={styles.kicker}>Server configuration</p>
            <h2 id="newsletter-setup-heading">Newsletter tools unavailable</h2>
            <p className={styles.configurationNotice}>
              Events and jobs remain available. Add <code>SUPABASE_SECRET_KEY</code> or <code>SUPABASE_SERVICE_ROLE_KEY</code> to the server environment and restart the app to enable subscriber and newsletter tools.
            </p>
          </section>
        </main> : null}
      {deleting ? <DeleteDialog target={deleting} onClose={() => setDeleting(null)} onComplete={completeDelete} /> : null}
      {preview ? <PreviewDialog preview={preview} onClose={closePreview} /> : null}
      {rsvpEvent ? <RsvpDialog event={rsvpEvent} attendees={attendees.filter((attendee) => attendee.event_id === rsvpEvent.id)} loadError={loadErrors.attendance} onClose={() => setRsvpEvent(null)} /> : null}
    </div>
  );
}
