import Link from 'next/link';
import styles from '@/components/events/events.module.css';

export const metadata = {
  title: 'OTU Project Sprints — CS Club',
  description:
    'CS Club x GDG Project Sprints — teams of 3-5 students build a complete software project over a multi-week cycle.',
};

// Registration lives in a Google Form that isn't published yet. Drop the URL in
// here and the button stops being a placeholder.
const REGISTRATION_URL = '';

const facts = [
  { label: 'Team size', value: '3–5 students' },
  { label: 'Cycle length', value: '5–6 weeks' },
  { label: 'Cycles per year', value: 'Fall + Winter' },
  { label: 'Format', value: 'Software only, not a competition' },
];

const reasons = [
  {
    title: 'Something real for your resume',
    body: 'You finish with a working project you can explain in an interview — not a tutorial clone or a single API call.',
  },
  {
    title: 'Build your idea, not a prompt',
    body: 'No fixed theme and no sponsor criteria to bend your idea toward. A video game, an AI model, whatever you actually want to make.',
  },
  {
    title: 'Made for first-time builders',
    body: 'Workshops cover the common blockers and every team gets a project guide, so you do not need to already know the stack to join.',
  },
  {
    title: 'Certificates you can post',
    body: 'Participation certificates are scored against the project rubric — Attended, Bronze, or Gold — for LinkedIn and resumes.',
  },
  {
    title: 'A room, and people in it',
    body: 'We book a room on campus each week during the build period so teams can work side by side and ask each other questions. Optional, but the libraries are always full.',
  },
  {
    title: 'Actual engineering practice',
    body: 'Scoping, task breakdown, Git workflow, databases, testing, documentation, and deployment — the parts coursework tends to skip.',
  },
];

const requirements = [
  'A clear user or problem the project addresses',
  'At least one complete, working end-to-end user flow',
  'Persistent data that is meaningfully integrated',
  'Logic beyond static content or forwarding a prompt to an API',
  'Git/GitHub with evidence of team contribution',
  'A README covering purpose, setup, tech, features, and limitations',
  'Reasonable handling of invalid input and errors',
  'A deployed link where practical, or a clear demo method',
];

const fallTimeline = [
  { when: 'Sept 15', name: 'Registration opens', note: 'Register on your own, as a partial team, or as a full team.' },
  { when: 'Sept 30', name: 'Registration closes', note: 'May be extended slightly.' },
  { when: 'Oct 1–3', name: 'Team matching', note: 'Only for students who register without a full team.' },
  { when: 'Oct 5', name: 'Kickoff', note: 'Rules, requirements, rubric, and the GDG “How to Build a Project” workshop.' },
  { when: 'Oct 12', name: 'Proposal & scope checkpoint', note: 'Submit a short scope before serious building starts.' },
  { when: 'Oct 19–23', name: 'Workshop 1', note: '“Deployments and DevOps: From Laptop to Production”.' },
  { when: 'Oct 23–26', name: 'Progress check', note: 'Short status update with your guide, online.' },
  { when: 'Oct 26–30', name: 'Workshop 2', note: '“Open Source: Building Your Portfolio in Public”.' },
  { when: 'Oct 31–Nov 1', name: 'Progress check', note: 'Second status update with your guide.' },
  { when: 'Nov 8', name: 'Submission deadline', note: 'Repo, README, demo or deployed link, and a short write-up.' },
  { when: 'Nov 11–12', name: 'Showcase', note: 'Live or recorded demos, then certificates.' },
];

const winterWorkshops = [
  {
    when: 'Kickoff',
    name: '“AI/ML for Your Next Project”',
    note: 'Gemini and the API credits GDG provides, with a GDG/Google speaker.',
  },
  {
    when: 'Workshop 1',
    name: '“Frontend That Doesn’t Look Like a Default Theme”',
    note: 'A UI/UX session with a design-forward speaker.',
  },
  {
    when: 'Workshop 2',
    name: '“Security & Privacy: Building Trust Into Your App”',
    note: 'Speaker from an auth/privacy company.',
  },
];

const tiers = [
  { label: 'Attended', value: '10–49 points' },
  { label: 'Bronze', value: '50–79 points' },
  { label: 'Gold', value: '80–100 points' },
];

export default function GdgPage() {
  return (
    <div className={styles.landing}>
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <h1 className={styles.headline}>OTU Project Sprints</h1>
          <p className={styles.leadCopy}>A CS Club × GDG initiative — Fall 2026 cycle.</p>
        </header>

        <section className={styles.section} aria-labelledby="sprint-what-heading">
          <Link href="/events" className={styles.backLink}>
            Back to events
          </Link>
          <div className={styles.sectionHead}>
            <h2 id="sprint-what-heading" className={styles.sectionTitle}>
              What are OTU Project Sprints?
            </h2>
          </div>
          <p className={styles.leadCopy}>
            Projects are easy to overthink and easy to abandon. A sprint removes the hurdles between
            you and the thing you want to build: a team of 3–5, a set timeline, workshops, a project
            guide to ask when you are stuck, and a showcase at the end. You pick your own idea —
            there is no theme to conform to and nothing to win, so build what you actually care
            about.
          </p>
          <dl className={styles.factGrid}>
            {facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="sprint-why-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-why-heading" className={styles.sectionTitle}>
              Why join the sprint?
            </h2>
          </div>
          <div className={styles.infoGrid}>
            {reasons.map((reason) => (
              <article key={reason.title} className={styles.sprintItem}>
                <h3>{reason.title}</h3>
                <p>{reason.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sprint-teams-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-teams-heading" className={styles.sectionTitle}>
              Teams
            </h2>
          </div>
          <div className={styles.infoGrid}>
            <article className={styles.sprintItem}>
              <h3>Come with your own team</h3>
              <p>
                Already have people? Register together and you stay together. Teams run 3–5 students,
                so if there are only two of you, register as a partial team and we will top you up.
              </p>
            </article>
            <article className={styles.sprintItem}>
              <h3>Or let us match you</h3>
              <p>
                Register on your own and organizers place you on a team during the matching window.
                We match on experience level using the info you give at registration, so nobody ends
                up carrying the team or being carried by it.
              </p>
            </article>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="sprint-guides-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-guides-heading" className={styles.sectionTitle}>
              Guides &amp; support
            </h2>
          </div>
          <p className={styles.leadCopy}>
            Where staffing allows, each team is assigned a CS Club/GDG technical representative as a
            project guide and point of contact. A guide is not a mentor who builds it for you.
          </p>
          <ul className={styles.checkList}>
            <li>Knows your project at a high level and what is currently blocking it</li>
            <li>Points you to documentation, tutorials, and the right resources</li>
            <li>Helps narrow scope when an idea is too big for the timeline</li>
            <li>Flags recurring problems to the leads so a workshop can cover them for everyone</li>
            <li>Does not write substantial parts of your submission</li>
          </ul>
          <p className={styles.noteCopy}>
            Day-to-day communication runs through Discord. Technical questions escalate from your
            guide to a VP.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="sprint-requirements-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-requirements-heading" className={styles.sectionTitle}>
              What your project needs
            </h2>
          </div>
          <ul className={styles.checkList}>
            {requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
          <p className={styles.noteCopy}>
            AI-assisted coding is allowed with no disclosure required, as long as your team
            understands what it built. Software only — no hardware projects. A UI wrapped around
            someone else’s API is allowed, it just will not score well on originality or technical
            depth.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="sprint-timeline-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-timeline-heading" className={styles.sectionTitle}>
              Fall 2026 timeline
            </h2>
          </div>
          <details className={styles.disclosure}>
            <summary className={styles.sprintItem}>
              <span>
                <span className={styles.sprintWhen}>Sept 15 &ndash; Nov 12</span>
                <h3>All {fallTimeline.length} milestones</h3>
              </span>
            </summary>
            <ol className={styles.sprintList}>
              {fallTimeline.map((milestone) => (
                <li key={`${milestone.when}-${milestone.name}`} className={styles.sprintItem}>
                  <span className={styles.sprintWhen}>{milestone.when}</span>
                  <h3>{milestone.name}</h3>
                  <p>{milestone.note}</p>
                </li>
              ))}
            </ol>
          </details>
          <p className={styles.noteCopy}>
            Dates are set but may shift slightly — check back before each milestone.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="sprint-winter-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-winter-heading" className={styles.sectionTitle}>
              Winter cycle
            </h2>
          </div>
          <p className={styles.leadCopy}>
            A second cycle runs in February with the same structure. Exact dates are still being
            finalized, but the workshop line-up is set:
          </p>
          <ol className={styles.sprintList}>
            {winterWorkshops.map((workshop) => (
              <li key={workshop.name} className={styles.sprintItem}>
                <span className={styles.sprintWhen}>{workshop.when}</span>
                <h3>{workshop.name}</h3>
                <p>{workshop.note}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.section} aria-labelledby="sprint-certificates-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-certificates-heading" className={styles.sectionTitle}>
              Certificates
            </h2>
          </div>
          <p className={styles.leadCopy}>
            There is no competitive judging. Submissions are scored against a 100-point rubric and
            every team that submits earns a certificate tier, weighted partly on effort relative to
            where your team started.
          </p>
          <dl className={styles.factGrid}>
            {tiers.map((tier) => (
              <div key={tier.label} className={styles.fact}>
                <dt>{tier.label}</dt>
                <dd>{tier.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="sprint-register-heading">
          <div className={styles.sectionHead}>
            <h2 id="sprint-register-heading" className={styles.sectionTitle}>
              Register
            </h2>
          </div>
          {REGISTRATION_URL ? (
            <a className={styles.cta} href={REGISTRATION_URL} target="_blank" rel="noreferrer">
              Open the registration form
            </a>
          ) : (
            <p className={styles.emptyCopy}>
              The registration form is coming soon — it will be posted here and announced on the
              events page.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
