"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./navbar.module.css";

type NavLink = {
  href: string;
  label: string;
  description: string;
  arrow?: boolean;
};

type AuthStatus = "unknown" | "signedOut" | "signedIn";

type NavSection = {
  id: string;
  label: string;
  links: NavLink[];
};

const sections: NavSection[] = [
  {
    id: "home",
    label: "Home",
    links: [
      { href: "/", label: "Home", description: "Club homepage and what’s new" },
    ],
  },
  {
    id: "team",
    label: "Team",
    links: [
      {
        href: "/team",
        label: "Meet the Team",
        description: "Club leadership and member profiles",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    links: [
      {
        href: "/events",
        label: "Upcoming Events",
        description: "Workshops, socials, and what’s on this semester",
      },
      {
        href: "/gdg",
        label: "GDG Project Sprints",
        description: "CS Club x GDG — build a real project in 5-6 weeks",
      },
    ],
  },
  {
    id: "hackhive",
    label: "HackHive",
    links: [
      {
        href: "/hackhive",
        label: "HackHive Info",
        description: "The story, impact, and project archive",
      },
      {
        href: "/hackhive/archive",
        label: "HackHive Museum",
        description: "Museum archive of HackHive projects, year by year",
      },
    ],
  },
  {
    id: "careers",
    label: "Careers",
    links: [
      {
        href: "/careers",
        label: "View Open Roles",
        description: "Apply to join the CS Club team",
        arrow: true,
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    links: [
      {
        href: "/contact",
        label: "Contact Us",
        description: "Socials, email, and how to reach the execs",
      },
    ],
  },
];

const adminSection: NavSection = {
  id: "admin",
  label: "Admin",
  links: [
    {
      href: "/admin",
      label: "Dashboard",
      description: "Manage events and job postings",
    },
    {
      href: "/admin/checkin",
      label: "Event Check-in",
      description: "Scan member passports at the door",
    },
  ],
};

const accountSection: NavSection = {
  id: "passport",
  label: "Passport",
  links: [
    {
      href: "/passport",
      label: "Member Passport",
      description: "Your stamps, points, and check-in QR",
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
  const navId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number | null>(null);
  const adminCheckedFor = useRef<string | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("unknown");
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [scrolledAway, setScrolledAway] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSignedIn = authStatus === "signedIn";
  const visibleSections = [
    ...sections,
    ...(isAdminUser ? [adminSection] : []),
    ...(isSignedIn ? [accountSection] : []),
  ];

  const navRevealed = !scrolledAway || peekOpen || menuOpen;
  const mobileMenuId = `${navId}-mobile-menu`;

  const syncSession = useCallback((userId: string | null) => {
    if (!userId) {
      adminCheckedFor.current = null;
      setAuthStatus("signedOut");
      setIsAdminUser(false);
      return;
    }

    setAuthStatus("signedIn");
    if (adminCheckedFor.current === userId) return;
    adminCheckedFor.current = userId;

    void createClient()
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (adminCheckedFor.current === userId) {
          const isAdmin = !!data;
          setIsAdminUser(isAdmin);
          if (isAdmin) {
            router.prefetch('/admin');
            router.prefetch('/admin/checkin');
          }
        }
      });
  }, [router]);

  useEffect(() => {
    const { data: listener } = createClient().auth.onAuthStateChange(
      (event, session) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
        syncSession(session?.user.id ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [syncSession]);

  // Server-side sign-ins (admin login, OAuth callback) set cookies without
  // firing a browser auth event, so re-read the stored session on navigation.
  useEffect(() => {
    let cancelled = false;
    void createClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) syncSession(session?.user.id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, syncSession]);

  useEffect(() => {
    setOpenId(null);
    setPeekOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const threshold = 48;
    const directionThreshold = 2;
    // Reveal only after a deliberate upward scroll, so small touch flicks
    // don't keep sliding the bar in over the page.
    const revealAfter = 40;
    let upTravel = 0;
    let raf = 0;
    let lastY = window.scrollY;

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;

      if (y <= threshold) {
        setScrolledAway(false);
        setPeekOpen(false);
        return;
      }

      setScrolledAway(true);

      // Reverse from down → up: reveal the bar. Keep scrolling down: hide it.
      // Near-zero delta (paused) leaves the current peek state alone.
      if (delta < -directionThreshold) {
        upTravel -= delta;
        if (upTravel >= revealAfter) setPeekOpen(true);
      } else if (delta > directionThreshold) {
        upTravel = 0;
        setPeekOpen(false);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenId(null);
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenId(null);
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
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

  function handleNavLeave() {
    scheduleClose();
    if (scrolledAway) setPeekOpen(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    syncSession(null);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {scrolledAway ? (
        <div
          className={styles.peekZone}
          aria-hidden="true"
          onMouseEnter={() => setPeekOpen(true)}
        />
      ) : null}
      <header
        className={`${styles.header} ${pathname === "/" ? styles.headerHome : ""} ${
          navRevealed ? styles.headerVisible : styles.headerHidden
        }`}
        ref={rootRef}
        onMouseLeave={handleNavLeave}
        onMouseEnter={() => {
          cancelClose();
          if (scrolledAway) setPeekOpen(true);
        }}
      >
        <nav className={styles.bar} aria-label="Primary">
          <Link href="/" className={styles.brand} aria-label="CS Club home">
            <img
              src="/cs_club_logo.png"
              alt=""
              width={46}
              height={36}
              className={styles.brandMark}
            />
          </Link>

          <div className={styles.items}>
            {visibleSections.map((section) => {
              const isOpen = openId === section.id;
              const panelId = `${navId}-${section.id}-panel`;

              return (
                <div key={section.id} className={styles.item}>
                  <button
                    type="button"
                    className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onMouseEnter={() => openSectionMenu(section.id)}
                    onClick={() => {
                      const canHover =
                        typeof window !== "undefined" &&
                        window.matchMedia("(hover: hover)").matches;
                      if (canHover) {
                        openSectionMenu(section.id);
                        return;
                      }
                      setOpenId((current) =>
                        current === section.id ? null : section.id,
                      );
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
                        <span>{section.label}</span>
                      </div>
                      <div className={styles.links}>
                        {section.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={styles.link}
                            onClick={() => setOpenId(null)}
                          >
                            <span className={styles.linkTitle}>
                              {link.label}
                              {link.arrow ? <ArrowIcon /> : null}
                            </span>
                            <span className={styles.linkCopy}>
                              {link.description}
                            </span>
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
            {authStatus === "unknown" ? (
              <span
                className={`${styles.actionLink} ${styles.actionPending}`}
                aria-hidden="true"
              >
                Log in
              </span>
            ) : isSignedIn ? (
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" className={styles.actionLink}>
                Log in
              </Link>
            )}
            <button
              type="button"
              className={styles.menuToggle}
              aria-expanded={menuOpen}
              aria-controls={mobileMenuId}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d={
                    menuOpen
                      ? "M5 5l10 10M15 5 5 15"
                      : "M3 6h14M3 10h14M3 14h14"
                  }
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </nav>

        {menuOpen ? (
          <div className={styles.mobileMenu} id={mobileMenuId}>
            {visibleSections.map((section) => (
              <div key={section.id} className={styles.mobileGroup}>
                <p className={styles.meta}>{section.label}</p>
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={styles.mobileLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </header>
    </>
  );
}
