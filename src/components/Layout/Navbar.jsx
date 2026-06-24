import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MobileNav from './MobileNav';

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/tournaments', label: 'Tournaments' },
  { path: '/register', label: 'Register' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/be-points', label: 'BE Points' },
  { path: '/hall-of-fame', label: 'Hall of Fame' },
  { path: '/certificates', label: 'Certificates' },
];

export default function Navbar() {
  const location = useLocation();
  const { isAdmin, openAdminLogin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Secret admin access - 10 clicks in 5s on logo
  const clickTimestamps = useRef([]);
  // Secret admin access - typing BHIMA in 3s
  const keyBuffer = useRef([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard listener for BHIMA secret
  useEffect(() => {
    const handleKeyDown = (e) => {
      const now = Date.now();
      keyBuffer.current.push({ key: e.key.toUpperCase(), time: now });
      // Keep only last 3 seconds
      keyBuffer.current = keyBuffer.current.filter((k) => now - k.time < 3000);
      const typed = keyBuffer.current.map((k) => k.key).join('');
      if (typed.includes('BHIMA')) {
        keyBuffer.current = [];
        if (!isAdmin) openAdminLogin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin, openAdminLogin]);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    // Keep only last 5 seconds
    clickTimestamps.current = clickTimestamps.current.filter((t) => now - t < 5000);
    if (clickTimestamps.current.length >= 10) {
      clickTimestamps.current = [];
      if (!isAdmin) openAdminLogin();
    }
  }, [isAdmin, openAdminLogin]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        className={`glass-dark`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--navbar-height)',
          zIndex: 'var(--z-sticky)',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          transition: 'border-color 0.3s ease, background 0.3s ease',
        }}
      >
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            <img
              src="/assets/logo.png"
              alt="Bhima Esports"
              style={{ height: 40, width: 40, objectFit: 'contain' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'var(--text-lg)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <span style={{ color: 'var(--neon)' }}>BHIMA</span>{' '}
              <span style={{ color: 'var(--text)' }}>ESPORTS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    position: 'relative',
                    padding: '0.5rem 0.875rem',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: active ? 700 : 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: active ? 'var(--neon)' : 'var(--text)',
                    transition: 'color 0.25s ease, font-weight 0.25s ease',
                    textShadow: active ? '0 0 8px rgba(215,255,0,0.3)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.target.style.color = 'var(--neon)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.target.style.color = 'var(--text)';
                  }}
                >
                  {link.label}
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '0.875rem',
                        right: '0.875rem',
                        height: 2,
                        background: 'var(--neon)',
                        borderRadius: 'var(--radius-full)',
                        animation: 'underlineSlide 0.3s ease forwards',
                        transformOrigin: 'left',
                        boxShadow: '0 0 6px rgba(215,255,0,0.4)',
                      }}
                    />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.375rem 0.875rem',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--bg-primary)',
                  background: 'var(--neon)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className={`hamburger`}
            onClick={() => setMobileOpen(true)}
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: 5,
              padding: 8,
            }}
            aria-label="Open menu"
          >
            <span className="hamburger-line" style={{ width: 22, height: 2, background: 'var(--text)', borderRadius: 1, display: 'block' }} />
            <span className="hamburger-line" style={{ width: 22, height: 2, background: 'var(--text)', borderRadius: 1, display: 'block' }} />
            <span className="hamburger-line" style={{ width: 22, height: 2, background: 'var(--text)', borderRadius: 1, display: 'block' }} />
          </button>
        </div>
      </nav>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} links={NAV_LINKS} />

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
