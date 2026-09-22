export default function DepartmentIcon({ category }: { category: string }) {
  const key = category.toLowerCase();
  if (key.includes('community') || key.includes('member')) return <CommunityIcon />;
  if (key.includes('engineer') || key.includes('tech')) return <CodeIcon />;
  if (key.includes('market')) return <MegaphoneIcon />;
  if (key.includes('design')) return <DesignIcon />;
  if (key.includes('event')) return <CalendarIcon />;
  if (key.includes('partner')) return <PartnershipsIcon />;
  if (key.includes('operation')) return <OperationsIcon />;
  return <BriefcaseIcon />;
}

function CommunityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 18.5c.8-2.8 2.9-4.3 5.5-4.3s4.7 1.5 5.5 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 14.2c1.5-.5 3-.4 4.4.5 1.3.9 2.1 2.3 2.4 3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11v2a2 2 0 0 0 2 2h1l8 4V5L6 9H5a2 2 0 0 0-2 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
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

function DesignIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.5 5.5 18.5 9.5 9 19H5v-4L14.5 5.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m12.5 7.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PartnershipsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.2 13.2 5.4 10.4a2.6 2.6 0 0 1 3.7-3.7l1.6 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m15.8 10.8 2.8 2.8a2.6 2.6 0 0 1-3.7 3.7l-1.6-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.2 14.8 5.6-5.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function OperationsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7h11M9 12h11M9 17h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m4.2 7.2 1.2 1.2 2-2.2M4.2 12.2l1.2 1.2 2-2.2M4.2 17.2l1.2 1.2 2-2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 13h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
