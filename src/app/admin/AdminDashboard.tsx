'use client';

import { useActionState, useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { ClubJob, ManagedEvent } from '@/types/content';
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
import { DatePicker, TimePicker } from './CustomPickers';

const initialState: AdminActionState = { ok: false, message: '' };

type SentNewsletter = { id: string; subject: string; recipient_count: number; sent_at: string };

function EventEditor({ event, onDone, onSuccess }: { event: ManagedEvent | null; onDone: () => void; onSuccess: (message: string) => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveEvent, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState('');
  const [date, setDate] = useState(event?.date ?? '');
  const [startTime, setStartTime] = useState(event?.start_time ?? '');
  const [endTime, setEndTime] = useState(event?.end_time ?? '');

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
    const fields: Array<[string, string]> = [
      ['title', 'an event title'],
      ['description', 'a description'],
      ['date', 'a date'],
      ['startTime', 'a start time'],
      ['endTime', 'an end time'],
      ['location', 'a location'],
      ['points', 'passport points'],
    ];
    const missing = fields.find(([name]) => !String(data.get(name) ?? '').trim());
    if (missing) {
      event.preventDefault();
      setClientError(`Please enter ${missing[1]}.`);
    }
  }

  return (
    <form ref={formRef} action={action} className={styles.editor} noValidate onSubmit={validate} onInput={() => setClientError('')}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.kicker}>{event ? 'Editing event' : 'New event'}</p>
          <h2>{event?.title ?? 'Add to the calendar'}</h2>
        </div>
        {event ? <button className={styles.textButton} type="button" onClick={onDone}>Cancel</button> : null}
      </div>
      <input type="hidden" name="originalId" value={event?.id ?? ''} />
      <div className={styles.formGrid}>
        <label className={styles.wide}>Title<input name="title" defaultValue={event?.title} maxLength={160} aria-required="true" /></label>
        <label>Description<textarea name="description" defaultValue={event?.description} maxLength={5000} rows={5} aria-required="true" /></label>
        <label>Date<DatePicker name="date" value={date} onChange={setDate} /></label>
        <label>Start time<TimePicker name="startTime" value={startTime} onChange={setStartTime} /></label>
        <label>End time<TimePicker name="endTime" value={endTime} onChange={setEndTime} /></label>
        <label>Location<input name="location" placeholder="SIRC 2020" defaultValue={event?.location} maxLength={200} aria-required="true" /></label>
        <label>Passport points<input name="points" type="number" min={0} max={1000} step={1} defaultValue={event?.points ?? 10} aria-required="true" /></label>
        <label>Image URLs<textarea name="images" placeholder="https://mario.wiki.gallery/images/dk.png" defaultValue={event?.images.join('\n')} rows={3} /><span className={styles.hint}>One HTTPS URL or site path per line, up to six.</span></label>
      </div>
      {clientError || state.message ? <p className={clientError || !state.ok ? styles.error : styles.success} role="alert">{clientError || state.message}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? 'Saving...' : event ? 'Update event' : 'Create event'}</button>
    </form>
  );
}

function JobEditor({ job, onDone, onSuccess }: { job: ClubJob | null; onDone: () => void; onSuccess: (message: string) => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveJob, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState('');

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
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

  return (
    <form ref={formRef} action={action} className={styles.editor} noValidate onSubmit={validate} onInput={() => setClientError('')}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.kicker}>{job ? 'Editing job' : 'New job'}</p>
          <h2>{job?.title ?? 'Post an opportunity'}</h2>
        </div>
        {job ? <button className={styles.textButton} type="button" onClick={onDone}>Cancel</button> : null}
      </div>
      <input type="hidden" name="originalId" value={job?.id ?? ''} />
      <div className={styles.formGrid}>
        <label className={styles.wide}>Title<input name="title" defaultValue={job?.title} maxLength={160} aria-required="true" /></label>
        <label>Category<input name="category" placeholder="Community" defaultValue={job?.category} maxLength={80} aria-required="true" /></label>
        <label>Description<textarea name="description" defaultValue={job?.description} maxLength={5000} rows={7} aria-required="true" /></label>
        <label className={styles.checkLabel}><input name="isActive" type="checkbox" defaultChecked={job?.is_active ?? true} />Visible on the careers page</label>
      </div>
      {clientError || state.message ? <p className={clientError || !state.ok ? styles.error : styles.success} role="alert">{clientError || state.message}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? 'Saving...' : job ? 'Update job' : 'Create job'}</button>
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
      // a test send is just checking how it looks — keep the draft so it
      // can be tweaked and sent for real; a real send clears it
      if (!state.message.startsWith('Test sent')) {
        formRef.current?.reset();
      }
      router.refresh();
    }
  }, [state.ok, state.message, onSuccess, router]);

  function validate(event: FormEvent<HTMLFormElement>) {
    setClientError('');
    const data = new FormData(event.currentTarget);
    if (!String(data.get('subject') ?? '').trim() || !String(data.get('body') ?? '').trim()) {
      event.preventDefault();
      setClientError('Please enter a subject and body.');
    }
  }

  return (
    <form ref={formRef} action={action} className={styles.editor} noValidate onSubmit={validate} onInput={() => setClientError('')}>
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
      <p className={styles.hint}>Will send to {recipientCount} general member(s) — people who applied via the careers page, not just anyone with a website login.</p>
      <div className={styles.itemActions}>
        <button className={styles.textButton} type="submit" name="intent" value="test" disabled={pending}>{pending ? 'Sending...' : 'Send test to myself'}</button>
        <button className={styles.primaryButton} type="submit" name="intent" value="send" disabled={pending}>{pending ? 'Sending...' : `Send to all ${recipientCount}`}</button>
      </div>
    </form>
  );
}

type DeleteTarget = { type: 'event' | 'job'; id: string; title: string };

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

export default function AdminDashboard({
  email,
  events,
  jobs,
  recipientCount,
  newsletters,
}: {
  email: string;
  events: ManagedEvent[];
  jobs: ClubJob[];
  recipientCount: number;
  newsletters: SentNewsletter[];
}) {
  const [tab, setTab] = useState<'events' | 'jobs' | 'newsletter'>('events');
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [editingJob, setEditingJob] = useState<ClubJob | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [notice, setNotice] = useState<AdminActionState | null>(null);
  const finishEventEdit = useCallback(() => setEditingEvent(null), []);
  const finishJobEdit = useCallback(() => setEditingJob(null), []);
  const showSuccess = useCallback((message: string) => setNotice({ ok: true, message }), []);
  const completeDelete = useCallback((state: AdminActionState) => setNotice(state), []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.kicker}>Executive dashboard</p><p>Signed in as {email}</p></div>
        <form action={signOut}><button className={styles.signOut} type="submit">Sign out</button></form>
      </header>
      <nav className={styles.tabs} aria-label="Dashboard sections">
        <button type="button" className={tab === 'events' ? styles.activeTab : ''} onClick={() => setTab('events')}>Events <span>{events.length}</span></button>
        <button type="button" className={tab === 'jobs' ? styles.activeTab : ''} onClick={() => setTab('jobs')}>Jobs <span>{jobs.length}</span></button>
        <button type="button" className={tab === 'newsletter' ? styles.activeTab : ''} onClick={() => setTab('newsletter')}>Newsletter <span>{newsletters.length}</span></button>
      </nav>
      {notice ? <div className={styles.notification} role={notice.ok ? 'status' : 'alert'}><span className={styles.notificationMark} aria-hidden="true">{notice.ok ? '•' : '!'}</span><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div> : null}
      {tab === 'events' ? <main className={styles.workspace}>
        <EventEditor key={editingEvent?.id ?? 'new-event'} event={editingEvent} onDone={finishEventEdit} onSuccess={showSuccess} />
        <section className={styles.collection} aria-labelledby="events-list-heading"><h2 id="events-list-heading">All events</h2>
          {events.length ? events.map((event) => <article className={styles.item} key={event.id}><div><p className={styles.itemMeta}>{event.date} / {event.time}</p><h3>{event.title}</h3><p>{event.location}</p></div><div className={styles.itemActions}><button type="button" onClick={() => setEditingEvent(event)}>Edit</button><button className={styles.deleteButton} type="button" onClick={() => setDeleting({ type: 'event', id: event.id, title: event.title })}>Delete</button></div></article>) : <p className={styles.empty}>No events yet.</p>}
        </section>
      </main> : null}
      {tab === 'jobs' ? <main className={styles.workspace}>
        <JobEditor key={editingJob?.id ?? 'new-job'} job={editingJob} onDone={finishJobEdit} onSuccess={showSuccess} />
        <section className={styles.collection} aria-labelledby="jobs-list-heading"><h2 id="jobs-list-heading">All jobs</h2>
          {jobs.length ? jobs.map((job) => <article className={styles.item} key={job.id}><div><p className={styles.itemMeta}>{job.category} / {job.is_active ? 'Live' : 'Hidden'}</p><h3>{job.title}</h3></div><div className={styles.itemActions}><button type="button" onClick={() => setEditingJob(job)}>Edit</button><button className={styles.deleteButton} type="button" onClick={() => setDeleting({ type: 'job', id: job.id, title: job.title })}>Delete</button></div></article>) : <p className={styles.empty}>No jobs yet.</p>}
        </section>
      </main> : null}
      {tab === 'newsletter' ? <main className={styles.workspace}>
        <NewsletterEditor recipientCount={recipientCount} onSuccess={showSuccess} />
        <section className={styles.collection} aria-labelledby="newsletter-list-heading"><h2 id="newsletter-list-heading">Recently sent</h2>
          {newsletters.length ? newsletters.map((newsletter) => <article className={styles.item} key={newsletter.id}><div><p className={styles.itemMeta}>{new Date(newsletter.sent_at).toLocaleDateString()} / {newsletter.recipient_count} recipient(s)</p><h3>{newsletter.subject}</h3></div></article>) : <p className={styles.empty}>No newsletters sent yet.</p>}
        </section>
      </main> : null}
      {deleting ? <DeleteDialog target={deleting} onClose={() => setDeleting(null)} onComplete={completeDelete} /> : null}
    </div>
  );
}
