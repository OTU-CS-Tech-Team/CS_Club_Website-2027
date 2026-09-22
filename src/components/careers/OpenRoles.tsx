'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { presetCategoryIndex } from '@/data/jobCategories';
import type { ClubJob } from '@/types/content';
import DepartmentIcon from './DepartmentIcon';
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

export default function OpenRoles({ jobs }: OpenRolesProps) {
  const departments = useMemo(() => {
    const map = new Map<string, ClubJob[]>();
    for (const job of jobs) {
      const category = job.category?.trim() || 'Community';
      const list = map.get(category) ?? [];
      list.push(job);
      map.set(category, list);
    }

    return [...map.entries()]
      .map(([name, roles]) => ({ name, roles }))
      .sort((a, b) => {
        const aIndex = presetCategoryIndex(a.name);
        const bIndex = presetCategoryIndex(b.name);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
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
                  <span className={styles.groupIcon}><DepartmentIcon category={dept.name} /></span>
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
                        href={`/careers/${role.id}`}
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
