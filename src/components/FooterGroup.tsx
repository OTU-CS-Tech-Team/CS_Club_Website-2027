'use client';

import { useId, useState, type ReactNode } from 'react';
import styles from './footer.module.css';

/**
 * One footer link group. On larger screens it's a plain column (heading + links,
 * always shown). On phones the heading becomes a tap-to-open toggle so the
 * footer doesn't fill the whole screen. CSS picks which one shows, so there's
 * no flash of the wrong state before hydration.
 */
export default function FooterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div className={styles.column}>
      <h2 className={styles.heading}>{title}</h2>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        {title}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <ul id={listId} className={`${styles.list} ${open ? '' : styles.listClosed}`}>
        {children}
      </ul>
    </div>
  );
}
