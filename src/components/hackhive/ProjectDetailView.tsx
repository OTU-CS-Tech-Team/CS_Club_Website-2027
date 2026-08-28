import Image from 'next/image';
import Link from 'next/link';
import type { HackHiveProject } from '@/types/hackhive';
import styles from './projectDetail.module.css';

type ProjectDetailViewProps = {
  project: HackHiveProject;
  handwrittenClass?: string;
};

const TECH_ROTATIONS = [-3, 2, -1.5, 3, -2, 1];

export default function ProjectDetailView({
  project,
  handwrittenClass,
}: ProjectDetailViewProps) {
  const hasVideo = Boolean(project.videoSrc);
  const hasDemo = Boolean(project.demoUrl);

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailShell}>
        <Link
          href="/#hackhive-heading"
          className={`${styles.backLink} ${handwrittenClass ?? ''}`}
        >
          ← return to homepage
        </Link>

        <article className={styles.heroPolaroid}>
          <span className={styles.heroPin} aria-hidden />
          <div className={styles.heroMedia}>
            <Image
              src={project.thumbnail}
              alt={project.title}
              width={800}
              height={500}
              sizes="(max-width: 720px) 100vw, 520px"
              priority
            />
            {hasVideo && (
              <div className={styles.videoOverlay}>
                <span className={styles.playButton} aria-hidden>
                  ▶
                </span>
              </div>
            )}
          </div>
          <div className={`${styles.titleTape} ${handwrittenClass ?? ''}`}>
            {project.title}
          </div>
        </article>

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

        <div className={styles.ticketStub}>
          <p>
            <strong>Built by:</strong> {project.team}
          </p>
          <p>
            <strong>Year:</strong> {project.year}
          </p>
        </div>

        {hasDemo && (
          <a
            href={project.demoUrl}
            className={`${styles.demoStamp} ${styles.demoStampActive}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch the demo
          </a>
        )}
      </div>
    </div>
  );
}
