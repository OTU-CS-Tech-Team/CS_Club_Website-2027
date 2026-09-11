'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ClubJob } from '@/types/content';
import styles from './careers.module.css';

type OpenRolesProps = {
  jobs: ClubJob[];
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.5 18.5c.8-2.8 2.9-4.3 5.5-4.3s4.7 1.5 5.5 4.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 14.2c1.5-.5 3-.4 4.4.5 1.3.9 2.1 2.3 2.4 3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11v2a2 2 0 0 0 2 2h1l8 4V5L6 9H5a2 2 0 0 0-2 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M19 9.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function categoryIcon(category: string) {
  const key = category.toLowerCase();
  if (key.includes('community') || key.includes('member')) return <CommunityIcon />;
  if (key.includes('tech') || key.includes('engineer')) return <CodeIcon />;
  if (key.includes('market')) return <MegaphoneIcon />;
  if (key.includes('event')) return <CalendarIcon />;
  return <BriefcaseIcon />;
}

export default function OpenRoles({ jobs }: OpenRolesProps) {
  const departments = useMemo(() => {
    const map = new Map<string, ClubJob[]>();
    for (const job of jobs) {
      const category = job.category?.trim() || 'Community';
      const list = map.get(category) ?? [];
      list.push(job);
      map.set(category, list);
    }

    // Prefer Community first when present, then alpha for the rest.
    return [...map.entries()]
      .map(([name, roles]) => ({ name, roles }))
      .sort((a, b) => {
        if (a.name.toLowerCase() === 'community') return -1;
        if (b.name.toLowerCase() === 'community') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [jobs]);

  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const filteredDepartments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return departments
      .filter((dept) => department === 'all' || dept.name === department)
      .map((dept) => ({
        ...dept,
        roles: dept.roles.filter((role) => {
          if (!q) return true;
          return (
            role.title.toLowerCase().includes(q) ||
            role.category.toLowerCase().includes(q) ||
            role.description.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((dept) => dept.roles.length > 0);
  }, [departments, department, query]);

  const totalRoles = filteredDepartments.reduce((sum, dept) => sum + dept.roles.length, 0);
  const expandedCount = filteredDepartments.filter((dept) => open[dept.name]).length;

  function toggle(name: string) {
    setOpen((current) => ({ ...current, [name]: !current[name] }));
  }

  function expandAll() {
    const next: Record<string, boolean> = {};
    for (const dept of filteredDepartments) next[dept.name] = true;
    setOpen(next);
  }

  if (jobs.length === 0) {
    return (
      <section className={styles.section} id="open-roles" aria-labelledby="open-roles-heading">
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Open positions</p>
          <h1 id="open-roles-heading" className={styles.headline}>
            Connecting people through technology
          </h1>
        </div>
        <p className={styles.empty}>Come back later if you want to join the team.</p>
      </section>
    );
  }

  return (
    <section className={styles.section} id="open-roles" aria-labelledby="open-roles-heading">
      <div className={styles.intro}>
        <p className={styles.eyebrow}>Open positions</p>
        <h1 id="open-roles-heading" className={styles.headline}>
          Connecting people through technology
        </h1>
      </div>

      <div className={styles.filters}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search positions</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search positions..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className={styles.select}>
          <span className={styles.srOnly}>Filter by department</span>
          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
          <Chevron open={false} />
        </label>
      </div>

      <div className={styles.meta}>
        <span>
          {totalRoles} {totalRoles === 1 ? 'ROLE' : 'ROLES'} ACROSS{' '}
          {filteredDepartments.length}{' '}
          {filteredDepartments.length === 1 ? 'DEPARTMENT' : 'DEPARTMENTS'}
        </span>
        <button type="button" className={styles.expandAll} onClick={expandAll}>
          EXPAND ALL {expandedCount} OF {filteredDepartments.length} EXPANDED
        </button>
      </div>

      {filteredDepartments.length === 0 ? (
        <p className={styles.empty}>No open roles match that search. Check back soon.</p>
      ) : (
        <div className={styles.list}>
          {filteredDepartments.map((dept) => {
            const isOpen = !!open[dept.name];
            return (
              <div key={dept.name} className={styles.group}>
                <button
                  type="button"
                  className={styles.groupToggle}
                  aria-expanded={isOpen}
                  onClick={() => toggle(dept.name)}
                >
                  <span className={styles.groupIcon}>{categoryIcon(dept.name)}</span>
                  <span className={styles.groupCopy}>
                    <span className={styles.groupName}>{dept.name}</span>
                    <span className={styles.groupCount}>
                      {dept.roles.length} {dept.roles.length === 1 ? 'ROLE' : 'ROLES'}
                    </span>
                  </span>
                  <Chevron open={isOpen} />
                </button>

                {isOpen ? (
                  <div className={styles.roles}>
                    {dept.roles.map((role) => (
                      <Link
                        key={role.id}
                        href={`/careers/${role.id}/apply`}
                        className={styles.role}
                      >
                        <span className={styles.roleCopy}>
                          <span className={styles.roleTitle}>{role.title}</span>
                          <span className={styles.roleDetails}>
                            {[role.commitment, role.location, role.closes_at
                              ? `Closes ${new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'America/Toronto' }).format(new Date(role.closes_at))}`
                              : 'Open until filled'].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        <span className={styles.roleApply}>
                          APPLY <span aria-hidden="true">→</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
