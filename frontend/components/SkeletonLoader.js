export default function SkeletonLoader({ type = 'default' }) {
  if (type === 'card') {
    return (
      <div className="skeleton-card">
        <div className="skeleton" style={{ width: '50%', height: '24px', marginBottom: '12px' }}></div>
        <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: '8px' }}></div>
        <div className="skeleton" style={{ width: '80%', height: '16px', marginBottom: '8px' }}></div>
        <div className="skeleton" style={{ width: '60%', height: '16px' }}></div>
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className="skeleton-card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '70%', height: '16px', marginBottom: '8px' }}></div>
          <div className="skeleton" style={{ width: '90%', height: '14px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ width: '100%', height: '120px', marginBottom: '16px' }}></div>
      <div className="skeleton" style={{ width: '100%', height: '200px', marginBottom: '16px' }}></div>
      <div className="skeleton" style={{ width: '80%', height: '24px' }}></div>
    </div>
  );
}
