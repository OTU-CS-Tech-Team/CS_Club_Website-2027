import styles from './admin.module.css';
import skeletonStyles from './admin-skeleton.module.css';

export default function AdminLoading() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Executive dashboard</p>
          <p className={skeletonStyles.shimmer} style={{ width: '12rem', height: '1rem' }} />
        </div>
        <div className={skeletonStyles.shimmer} style={{ width: '4rem', height: '1.5rem', borderRadius: '4px' }} />
      </header>
      <nav className={styles.tabs} aria-label="Dashboard sections">
        <button type="button" className={styles.activeTab}>Events <span className={skeletonStyles.shimmer} style={{ display: 'inline-block', width: '1rem', marginLeft: '0.35rem' }} /></button>
        <button type="button">Metrics <span className={skeletonStyles.shimmer} style={{ display: 'inline-block', width: '1rem', marginLeft: '0.35rem' }} /></button>
        <button type="button">Jobs <span className={skeletonStyles.shimmer} style={{ display: 'inline-block', width: '1rem', marginLeft: '0.35rem' }} /></button>
        <button type="button">Newsletter <span className={skeletonStyles.shimmer} style={{ display: 'inline-block', width: '1rem', marginLeft: '0.35rem' }} /></button>
      </nav>
      <main className={styles.workspace}>
        <section className={styles.collection}>
          <div className={styles.collectionHead}>
            <div>
              <p className={styles.kicker}>Calendar inventory</p>
              <h2>All events</h2>
              <span className={skeletonStyles.shimmer} style={{ width: '4rem' }} />
            </div>
            <div className={skeletonStyles.shimmer} style={{ width: '6rem', height: '2.5rem', borderRadius: '999px' }} />
          </div>
          <div className={styles.filters}>
            <div className={skeletonStyles.shimmer} style={{ height: '2.75rem', borderRadius: '10px' }} />
            <div className={styles.filterChips}>
              {['all', 'upcoming', 'past', 'draft'].map((filter) => (
                <span key={filter} className={`${styles.filterChip} ${skeletonStyles.shimmer}`} style={{ width: '3.5rem' }} />
              ))}
            </div>
          </div>
          <div className={styles.eventPreviewList}>
            {[1, 2, 3, 4].map((i) => (
              <article className={styles.item} key={i}>
                <div className={`${styles.itemImagePlaceholder} ${skeletonStyles.shimmer}`} />
                <div className={styles.itemBody}>
                  <p className={`${styles.itemMeta} ${skeletonStyles.shimmer}`} style={{ width: '8rem', height: '0.7rem' }} />
                  <div className={skeletonStyles.shimmer} style={{ width: '14rem', height: '1rem', margin: '0.5rem 0' }} />
                  <div className={skeletonStyles.shimmer} style={{ width: '6rem', height: '0.8rem' }} />
                </div>
                <div className={styles.itemControls}>
                  <div className={skeletonStyles.shimmer} style={{ width: '4rem', height: '1.5rem', borderRadius: '999px' }} />
                  <div className={styles.itemActions}>
                    <span className={skeletonStyles.shimmer} style={{ width: '3rem', height: '1rem' }} />
                    <span className={skeletonStyles.shimmer} style={{ width: '2rem', height: '1rem' }} />
                    <span className={skeletonStyles.shimmer} style={{ width: '4rem', height: '1rem' }} />
                    <span className={skeletonStyles.shimmer} style={{ width: '3rem', height: '1rem' }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
