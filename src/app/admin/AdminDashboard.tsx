'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ClubJob, ManagedEvent } from '@/types/content';
import {
  deleteEvent,
  deleteJob,
  saveEvent,
  saveJob,
  signOut,
  type AdminActionState,
} from './actions';
import styles from './admin.module.css';

const initialState: AdminActionState = { ok: false, message: '' };

function EventEditor({ event, onDone }: { event: ManagedEvent | null; onDone: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveEvent, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onDone();
      router.refresh();
    }
  }, [state.ok, onDone, router]);

  return (
    <form ref={formRef} action={action} className={styles.editor}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.kicker}>{event ? 'Editing event' : 'New event'}</p>
          <h2>{event?.title ?? 'Add to the calendar'}</h2>
        </div>
        {event ? <button className={styles.textButton} type="button" onClick={onDone}>Cancel</button> : null}
      </div>
      <input type="hidden" name="originalId" value={event?.id ?? ''} />
      <div className={styles.formGrid}>
        <label className={styles.wide}>Title<input name="title" defaultValue={event?.title} maxLength={160} required /></label>
        <label>Description<textarea name="description" defaultValue={event?.description} maxLength={5000} rows={5} required /></label>
        <label>Date<input name="date" type="date" defaultValue={event?.date} required /></label>
        <label>Start time<input name="startTime" type="time" defaultValue={event?.start_time} required /></label>
        <label>End time<input name="endTime" type="time" defaultValue={event?.end_time} required /></label>
        <label>Location<input name="location" placeholder="SIRC 2020" defaultValue={event?.location} maxLength={200} required /></label>
        <label>Passport points<input name="points" type="number" min={0} max={1000} step={1} defaultValue={event?.points ?? 10} required /></label>
        <label>Image URLs<textarea name="images" placeholder="/events/workshop.svg" defaultValue={event?.images.join('\n')} rows={3} /><span className={styles.hint}>One HTTPS URL or site path per line, up to six.</span></label>
      </div>
      {state.message ? <p className={state.ok ? styles.success : styles.error}>{state.message}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? 'Saving...' : event ? 'Update event' : 'Create event'}</button>
    </form>
  );
}

function JobEditor({ job, onDone }: { job: ClubJob | null; onDone: () => void }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveJob, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onDone();
      router.refresh();
    }
  }, [state.ok, onDone, router]);

  return (
    <form ref={formRef} action={action} className={styles.editor}>
      <div className={styles.editorHead}>
        <div>
          <p className={styles.kicker}>{job ? 'Editing job' : 'New job'}</p>
          <h2>{job?.title ?? 'Post an opportunity'}</h2>
        </div>
        {job ? <button className={styles.textButton} type="button" onClick={onDone}>Cancel</button> : null}
      </div>
      <input type="hidden" name="originalId" value={job?.id ?? ''} />
      <div className={styles.formGrid}>
        <label className={styles.wide}>Title<input name="title" defaultValue={job?.title} maxLength={160} required /></label>
        <label>Category<input name="category" placeholder="Community" defaultValue={job?.category} maxLength={80} required /></label>
        <label>Description<textarea name="description" defaultValue={job?.description} maxLength={5000} rows={7} required /></label>
        <label className={styles.checkLabel}><input name="isActive" type="checkbox" defaultChecked={job?.is_active ?? true} />Visible on the careers page</label>
      </div>
      {state.message ? <p className={state.ok ? styles.success : styles.error}>{state.message}</p> : null}
      <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? 'Saving...' : job ? 'Update job' : 'Create job'}</button>
    </form>
  );
}

export default function AdminDashboard({
  email,
  events,
  jobs,
}: {
  email: string;
  events: ManagedEvent[];
  jobs: ClubJob[];
}) {
  const [tab, setTab] = useState<'events' | 'jobs'>('events');
  const [editingEvent, setEditingEvent] = useState<ManagedEvent | null>(null);
  const [editingJob, setEditingJob] = useState<ClubJob | null>(null);
  const finishEventEdit = useCallback(() => setEditingEvent(null), []);
  const finishJobEdit = useCallback(() => setEditingJob(null), []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.kicker}>Executive dashboard</p><h1>Keep the club current.</h1><p>Signed in as {email}</p></div>
        <form action={signOut}><button className={styles.signOut} type="submit">Sign out</button></form>
      </header>
      <nav className={styles.tabs} aria-label="Dashboard sections">
        <button type="button" className={tab === 'events' ? styles.activeTab : ''} onClick={() => setTab('events')}>Events <span>{events.length}</span></button>
        <button type="button" className={tab === 'jobs' ? styles.activeTab : ''} onClick={() => setTab('jobs')}>Jobs <span>{jobs.length}</span></button>
      </nav>
      {tab === 'events' ? <main className={styles.workspace}>
        <EventEditor key={editingEvent?.id ?? 'new-event'} event={editingEvent} onDone={finishEventEdit} />
        <section className={styles.collection} aria-labelledby="events-list-heading"><h2 id="events-list-heading">All events</h2>
          {events.length ? events.map((event) => <article className={styles.item} key={event.id}><div><p className={styles.itemMeta}>{event.date} / {event.time}</p><h3>{event.title}</h3><p>{event.location}</p></div><div className={styles.itemActions}><button type="button" onClick={() => setEditingEvent(event)}>Edit</button><form action={deleteEvent.bind(null, event.id)} onSubmit={(submission) => { if (!window.confirm(`Delete ${event.title}?`)) submission.preventDefault(); }}><button className={styles.deleteButton} type="submit">Delete</button></form></div></article>) : <p className={styles.empty}>No events yet.</p>}
        </section>
      </main> : <main className={styles.workspace}>
        <JobEditor key={editingJob?.id ?? 'new-job'} job={editingJob} onDone={finishJobEdit} />
        <section className={styles.collection} aria-labelledby="jobs-list-heading"><h2 id="jobs-list-heading">All jobs</h2>
          {jobs.length ? jobs.map((job) => <article className={styles.item} key={job.id}><div><p className={styles.itemMeta}>{job.category} / {job.is_active ? 'Live' : 'Hidden'}</p><h3>{job.title}</h3></div><div className={styles.itemActions}><button type="button" onClick={() => setEditingJob(job)}>Edit</button><form action={deleteJob.bind(null, job.id)} onSubmit={(submission) => { if (!window.confirm(`Delete ${job.title}?`)) submission.preventDefault(); }}><button className={styles.deleteButton} type="submit">Delete</button></form></div></article>) : <p className={styles.empty}>No jobs yet.</p>}
        </section>
      </main>}
    </div>
  );
}
