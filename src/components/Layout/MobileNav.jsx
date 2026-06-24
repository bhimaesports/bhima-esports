import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav({ isOpen, onClose, links }) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 299,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Slide-out panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '80vw',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          zIndex: 300,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 'var(--text-base)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            <span style={{ color: 'var(--neon)' }}>BHIMA</span> ESPORTS
          </span>
          <button onClick={onClose} style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', padding: 4 }}>✕</button>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.5rem',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? 700 : 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: active ? 'var(--neon)' : 'var(--text)',
                  borderLeft: active ? '2px solid var(--neon)' : '2px solid transparent',
                  background: active ? 'rgba(215,255,0,0.04)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: '1rem 1.5rem',
                padding: '0.625rem 1rem',
                background: 'var(--neon)',
                color: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textAlign: 'center',
                justifyContent: 'center',
              }}
            >
              ⚡ Admin Panel
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}
