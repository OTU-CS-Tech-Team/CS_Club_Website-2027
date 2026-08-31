import styles from './corkboard.module.css';

type StickyNoteProps = {
  handwrittenClass?: string;
};

export default function StickyNote({ handwrittenClass }: StickyNoteProps) {
  return (
    <aside className={`${styles.stickyNote} ${handwrittenClass ?? ''}`}>
      click any photo to open the project
    </aside>
  );
}
