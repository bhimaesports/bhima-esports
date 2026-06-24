export default function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <img
        src="/assets/logo.png"
        alt="Loading..."
        style={{
          width: 72,
          height: 72,
          objectFit: 'contain',
          animation: 'logoPulse 1.5s ease-in-out infinite',
          marginBottom: '1.5rem',
        }}
      />
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 800,
        fontSize: 'var(--text-lg)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '1.5rem',
      }}>
        <span style={{ color: 'var(--neon)' }}>BHIMA</span>{' '}
        <span style={{ color: 'var(--text)' }}>ESPORTS</span>
      </div>
      <div style={{
        width: 120,
        height: 2,
        background: 'var(--border)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '40%',
          height: '100%',
          background: 'var(--neon)',
          borderRadius: 'var(--radius-full)',
          animation: 'loadingBar 1.2s ease-in-out infinite',
        }} />
      </div>
      <style>{`
        @keyframes loadingBar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
