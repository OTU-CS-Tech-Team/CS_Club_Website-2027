'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import styles from './navbar.module.css';

type NavLink = {
  href: string;
  label: string;
  description: string;
  arrow?: boolean;
  prefetch?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  matches: (pathname: string) => boolean;
  links: NavLink[];
};

const sections: NavSection[] = [
  {
    id: 'home',
    label: 'home',
    matches: (pathname) => pathname === '/',
    links: [{ href: '/', label: 'Home', description: 'Club homepage and what’s new' }],
  },
  {
    id: 'team',
    label: 'team',
    matches: (pathname) => pathname.startsWith('/team'),
    links: [
      {
        href: '/team',
        label: 'Meet the Team',
        description: 'Club leadership and member profiles',
      },
    ],
  },
  {
    id: 'events',
    label: 'events',
    matches: (pathname) =>
      pathname.startsWith('/events') || pathname.startsWith('/hackhive'),
    links: [
      {
        href: '/events',
        label: 'Upcoming Events',
        description: 'Workshops, socials, and what’s on this semester',
        prefetch: false,
      },
      {
        href: '/hackhive',
        label: 'HackHive Museum',
        description: 'Archive of HackHive projects, year by year',
      },
    ],
  },
  {
    id: 'careers',
    label: 'careers',
    matches: (pathname) => pathname.startsWith('/careers'),
    links: [
      {
        href: '/careers',
        label: 'View Open Roles',
        description: 'Apply to join the CS Club team',
        arrow: true,
      },
    ],
  },
];

const adminSection: NavSection = {
  id: 'admin',
  label: 'admin',
  matches: (pathname) => pathname.startsWith('/admin'),
  links: [
    {
      href: '/admin',
      label: 'Dashboard',
      description: 'Manage events and job postings',
    },
    {
      href: '/admin/checkin',
      label: 'Event Check-in',
      description: 'Scan member passports at the door',
    },
  ],
};

function Chevron() {
  return (
    <svg
      className={styles.chevron}
      width="12"
      height="12"
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

function ArrowIcon() {
  return (
    <svg
      className={styles.linkArrow}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 7h8M8 3.5 11.5 7 8 10.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const navId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const accountSection: NavSection = {
    id: 'passport',
    label: 'passport',
    matches: (path) => path.startsWith('/passport'),
    links: [
      {
        href: '/passport',
        label: 'Member Passport',
        description: 'Your stamps, points, and check-in QR',
      },
    ],
  };

  const visibleSections = [
    ...sections,
    ...(isAdminUser ? [adminSection] : []),
    ...(user ? [accountSection] : []),
  ];

  useEffect(() => {
    let cancelled = false;

    async function syncAuth(nextUser: User | null) {
      if (cancelled) return;
      setUser(nextUser);

      if (!nextUser) {
        setIsAdminUser(false);
        return;
      }

      const { data } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', nextUser.id)
        .maybeSingle();

      if (!cancelled) {
        setIsAdminUser(!!data);
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      void syncAuth(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuth(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenId(null);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openSectionMenu(id: string) {
    cancelClose();
    setOpenId(id);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenId(null), 180);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header
      className={styles.header}
      ref={rootRef}
      onMouseLeave={scheduleClose}
      onMouseEnter={cancelClose}
    >
      <nav className={styles.bar} aria-label="Primary">
        <Link href="/" className={styles.brand} aria-label="CS Club home">
          <img
            src="/cs-club-mark.png"
            alt=""
            width={36}
            height={36}
            className={styles.brandMark}
          />
        </Link>

        <div className={styles.items}>
          {visibleSections.map((section) => {
            const isOpen = openId === section.id;
            const panelId = `${navId}-${section.id}-panel`;

            return (
              <div
                key={section.id}
                className={`${styles.item} ${
                  section.id === 'admin' || section.id === 'passport' ? styles.itemReveal : ''
                }`}
              >
                <button
                  type="button"
                  className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onMouseEnter={() => openSectionMenu(section.id)}
                  onClick={() => {
                    const canHover =
                      typeof window !== 'undefined' &&
                      window.matchMedia('(hover: hover)').matches;
                    if (canHover) {
                      openSectionMenu(section.id);
                      return;
                    }
                    setOpenId((current) => (current === section.id ? null : section.id));
                  }}
                >
                  {section.label}
                  <Chevron />
                </button>
                {isOpen ? (
                  <div
                    className={styles.banner}
                    id={panelId}
                    role="region"
                    aria-label={`${section.label} pages`}
                    onMouseEnter={cancelClose}
                  >
                    <div className={styles.meta}>
                      <span>NAV/{section.label.toUpperCase()}</span>
                    </div>
                    <div className={styles.links}>
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={styles.link}
                          prefetch={link.prefetch}
                          onClick={() => setOpenId(null)}
                        >
                          <span className={styles.linkTitle}>
                            {link.label}
                            {link.arrow ? <ArrowIcon /> : null}
                          </span>
                          <span className={styles.linkCopy}>{link.description}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          {user ? (
            <button type="button" className={styles.actionButton} onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <Link href="/login" className={styles.actionLink}>
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
