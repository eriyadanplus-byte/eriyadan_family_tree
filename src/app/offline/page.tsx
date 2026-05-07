export default function OfflinePage() {
  return (
    <div style={{ background: '#0D1F0D', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#E8F5E9', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌳</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>You&apos;re Offline</h1>
        <p style={{ color: 'rgba(232,245,233,0.50)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Please check your internet connection and try again.
        </p>
        <a
          href="/tree"
          style={{
            display: 'inline-block',
            padding: '0.6rem 1.5rem',
            background: 'rgba(76,175,114,0.85)',
            color: '#0D1F0D',
            borderRadius: '0.75rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Try Again
        </a>
      </div>
    </div>
  );
}
