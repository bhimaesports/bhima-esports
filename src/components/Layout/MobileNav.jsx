import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav({ isOpen, onClose, links }) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
            backdropFilter: 'blur(4px)',
            zIndex: 299,
            animation: 'fadeIn 0.3s ease',
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
          width: '320px',
          maxWidth: '85vw',
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(16px)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
          zIndex: 300,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.8)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '1.2rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            <span style={{ color: 'var(--neon)' }}>BHIMA</span> ESPORTS
          </span>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              fontSize: '1.5rem', 
              color: '#FFF', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px'
            }}
          >✕</button>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto' }}>
          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1.2rem 1.5rem',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: active ? 'var(--neon)' : '#FFF',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  background: active ? 'rgba(215,255,0,0.05)' : 'transparent',
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    background: 'var(--neon)',
                    boxShadow: '0 0 10px rgba(215,255,0,0.5)'
                  }} />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Auth Actions */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {localStorage.getItem('playerToken') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Link
                to="/dashboard"
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0.8rem', background: '#000', color: 'var(--neon)',
                  fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', fontWeight: 900,
                  textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px',
                  border: '1px solid var(--neon)'
                }}
              >
                DASHBOARD
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('playerToken');
                  window.location.href = '/';
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0.8rem', background: 'transparent', color: '#ff3366',
                  fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', fontWeight: 900,
                  textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px',
                  border: '1px solid #ff3366', cursor: 'pointer'
                }}
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link
                to="/login"
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0.8rem', background: '#000', color: '#FFF',
                  fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', fontWeight: 900,
                  textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px',
                  border: '1px solid var(--neon)', transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--neon)'; e.currentTarget.style.color = '#000'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#FFF'; }}
              >
                LOGIN
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0.8rem', background: 'var(--neon)', color: '#000',
                  fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', fontWeight: 900,
                  textTransform: 'uppercase', textDecoration: 'none', borderRadius: '4px',
                  border: '1px solid var(--neon)', transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(0.9)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                REGISTER
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
