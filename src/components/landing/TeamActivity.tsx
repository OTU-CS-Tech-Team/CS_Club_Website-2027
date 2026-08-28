'use client';

import { useState } from 'react';
import type { NewsItem } from '@/types/landing';
import RecapVideo from './RecapVideo';
import styles from './landing.module.css';

type TeamActivityProps = {
  news: NewsItem[];
  recapVideoId: string;
};

function formatPosted(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${iso}T12:00:00`));
}

export default function TeamActivity({ news, recapVideoId }: TeamActivityProps) {
  const [mailing, setMailing] = useState(false);

  return (
    <section className={styles.section} aria-labelledby="activity-heading">
      <div className={styles.sectionHead}>
        <h2 id="activity-heading" className={styles.sectionTitle}>
          From the team
        </h2>
        <button
          type="button"
          className={`${styles.cta} ${styles.ctaGhost}`}
          onClick={() => setMailing(true)}
        >
          Sign up for our mailing list
        </button>
      </div>
      {mailing ? (
        <p className={styles.mailingNote}>
          Mailing list signup is not wired yet. The button stays so the layout is
          honest.
        </p>
      ) : null}
      <div className={styles.activity}>
        <div className={styles.activityCol}>
          <p className={styles.kicker}>News from execs</p>
          <div className={styles.newsList}>
            {news.map((item) => (
              <article key={item.id} className={styles.newsCard}>
                <h3 className={styles.newsTitle}>{item.title}</h3>
                <p className={styles.newsBody}>{item.body}</p>
                <time className={styles.newsDate} dateTime={item.postedOn}>
                  Posted on {formatPosted(item.postedOn)}
                </time>
              </article>
            ))}
          </div>
        </div>
        <div className={styles.activityCol}>
          <p className={styles.kicker}>2025–2026 recap</p>
          <RecapVideo videoId={recapVideoId} />
        </div>
      </div>
    </section>
  );
}
