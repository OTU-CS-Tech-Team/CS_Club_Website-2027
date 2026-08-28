import Link from 'next/link';
import type { HackHiveProject } from '@/types/hackhive';
import ProjectYoutube from './ProjectYoutube';
import styles from './projectDetail.module.css';

type ProjectDetailViewProps = {
  project: HackHiveProject;
  handwrittenClass?: string;
};

const TECH_ROTATIONS = [-3, 2, -1.5, 3, -2, 1, 2.5];

function MarkerTrophy() {
  return (
    <svg
      viewBox="0 0 72 88"
      className={styles.trophySvg}
      aria-hidden
    >
      <path
        d="M18 22h36v16c0 10-8 18-18 18S18 48 18 38V22Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 26c-8 2-12 9-8 16 3 5 8 6 12 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M54 26c8 2 12 9 8 16-3 5-8 6-12 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M36 56v10M26 78h20M30 66h12v12H30z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 18h28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.brandIcon}>
      <path
        fill="currentColor"
        d="M12 .5A11.5 11.5 0 0 0 .5 12.3c0 5.2 3.4 9.6 8.1 11.2.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.3 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.4-1.3-5.4-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.4 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
      />
    </svg>
  );
}

function DevpostIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={styles.brandIcon}>
      <path
        fill="currentColor"
        d="M6.2 3h5.4c4.4 0 8 3.4 8 8.5S16 20 11.6 20H6.2V3Zm5.3 13.4c2.8 0 4.7-2.1 4.7-4.9s-1.9-4.9-4.7-4.9H9.6v9.8h1.9Z"
      />
    </svg>
  );
}

export default function ProjectDetailView({
  project,
  handwrittenClass,
}: ProjectDetailViewProps) {
  return (
    <div className={styles.detailPage}>
      <div className={styles.detailShell}>
        <Link
          href="/#hackhive-heading"
          className={`${styles.backLink} ${handwrittenClass ?? ''}`}
        >
          ← return to homepage
        </Link>

        <div className={styles.heroRow}>
          <div className={styles.polaroidStack}>
            <article className={styles.heroPolaroid}>
              <span className={styles.heroPin} aria-hidden />
              <div className={styles.heroMedia}>
                {project.youtubeId ? (
                  <ProjectYoutube videoId={project.youtubeId} title={project.title} />
                ) : null}
              </div>
            </article>
            <div className={`${styles.titleTape} ${handwrittenClass ?? ''}`}>
              {project.title}
            </div>
          </div>

          {project.award ? (
            <div className={styles.trophyBlock}>
              <div className="origin-bottom animate-trophy-tilt motion-reduce:animate-none">
                <MarkerTrophy />
              </div>
              <p className={`${styles.trophyCaption} ${handwrittenClass ?? ''}`}>
                {project.award}
              </p>
            </div>
          ) : null}
        </div>

        <div className={styles.projectLinks}>
          {project.devpostUrl ? (
            <a
              href={project.devpostUrl}
              className={styles.projectLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DevpostIcon />
              Devpost
            </a>
          ) : null}
          {project.githubUrl ? (
            <a
              href={project.githubUrl}
              className={styles.projectLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
              GitHub
            </a>
          ) : null}
        </div>

        <div className={styles.techStack}>
          {project.techStack.map((tech, i) => (
            <span
              key={tech}
              className={styles.techLabel}
              style={{
                transform: `rotate(${TECH_ROTATIONS[i % TECH_ROTATIONS.length]}deg)`,
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        <div className={styles.notebook}>
          <p className={styles.notebookText}>{project.description}</p>
        </div>

        <div className={styles.metaRow}>
          <div className={styles.ticketStub}>
            <p>
              <strong>Built by</strong>
            </p>
            <p>{project.team}</p>
          </div>
          <div className={styles.ticketStub}>
            <p>
              <strong>HackHive 2025</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
