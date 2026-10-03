import skeletonStyles from '../admin-skeleton.module.css';

export default function CheckinLoading() {
  return (
    <div className="page">
      <h1>Event Check-in</h1>
      <p>Pick today&apos;s event, then scan each member&apos;s passport QR as they arrive.</p>
      <div style={{ maxWidth: '32rem', margin: '2rem 0' }}>
        <div
          className={skeletonStyles.shimmer}
          style={{ width: '100%', height: '2.75rem', borderRadius: '8px', marginBottom: '1.5rem' }}
        />
        <div
          className={skeletonStyles.shimmer}
          style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', marginBottom: '1rem' }}
        />
        <div
          className={skeletonStyles.shimmer}
          style={{ width: '12rem', height: '1rem', margin: '0 auto' }}
        />
      </div>
    </div>
  );
}
