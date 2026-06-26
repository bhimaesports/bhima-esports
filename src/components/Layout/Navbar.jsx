import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import MobileNav from './MobileNav';
import { motion } from 'framer-motion';
import FlashNews from './FlashNews';

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/tournaments', label: 'Tournaments' },
  { path: '/schedule', label: 'Schedule' },
  { path: '/teams', label: 'Teams' },
  { path: '/players', label: 'Players' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/hall-of-fame', label: 'Hall of Fame' },
];

export default function Navbar({ toggleTheme }) {
  const location = useLocation();
  const { isAdmin, openAdminLogin } = useAuth();
  const { settings, announcements } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const navigate = useNavigate();

  const playerToken = localStorage.getItem('playerToken');

  const handleLogout = () => {
    localStorage.removeItem('playerToken');
    navigate('/');
  };


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <FlashNews />

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="glass-dark"
        style={{
          position: 'sticky',
          top: '0px', 
          left: 0,
          right: 0,
          zIndex: 'var(--z-sticky)',
          borderBottom: '1px solid #000',
          background: 'var(--neon)', /* Bright Yellow Navbar */
          height: '60px', /* Fixed height to match side blocks */
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Logo Area */}
          <div style={{ display: 'flex', height: '100%', background: '#000', padding: '0 2.5rem', flexShrink: 0 }}>
            {/* PUBG Esports-style Black Box Logo */}
            <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textDecoration: 'none' }}>
              <img
                src="/assets/logo.png"
                alt="Bhima Esports"
                style={{ height: 35, width: 35, objectFit: 'contain' }}
              />
              <span style={{ color: 'var(--neon)', fontSize: '0.65rem', fontFamily: 'var(--font-heading)', fontWeight: 900, marginTop: '4px', letterSpacing: '0.1em' }}>ESPORTS</span>
            </Link>
          </div>

          {/* Center: Desktop Nav Links */}
          <div 
            className="hide-mobile" 
            style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, justifyContent: 'center' }}
            onMouseLeave={() => setHoveredLink(null)}
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(link.path);
              const isHovered = hoveredLink === link.path;
              const showUnderline = hoveredLink ? isHovered : active;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onMouseEnter={() => setHoveredLink(link.path)}
                  style={{
                    position: 'relative',
                    padding: '0.5rem 0',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#000',
                    textShadow: 'none',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {link.label} {['Tournaments', 'Schedule'].includes(link.label) && <span style={{ fontSize: '0.6rem' }}>▼</span>}
                  
                  {showUnderline && (
                    <motion.div
                      layoutId="nav-indicator"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: '#000',
                        borderRadius: '0px'
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="hide-mobile" style={{ display: 'flex', height: '100%', alignItems: 'center', flexShrink: 0 }}>

            {playerToken ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '1rem' }}>
                <Link
                  to="/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#000',
                    textDecoration: 'none'
                  }}
                >
                  <span style={{ background: '#000', color: 'var(--neon)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>👤</span>
                  Dashboard
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    color: '#ff3366',
                    border: 'none',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', paddingRight: '1.5rem' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#000',
                    textDecoration: 'none'
                  }}
                >
                  <span style={{ background: '#000', color: 'var(--neon)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, pointerEvents: 'none' }}>👤</span>
                  Log-in
                </Link>
              </div>
            )}

            {/* Black Block CTA Button */}
            <Link
              to="/tournament-register"
              style={{
                background: '#000',
                color: '#FFF',
                height: '100%',
                padding: '0 2.5rem',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '1rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                letterSpacing: '1px'
              }}
            >
              REGISTER NOW
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="hamburger"
            onClick={() => setMobileOpen(true)}
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: 5,
              padding: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            aria-label="Open menu"
          >
            <span className="hamburger-line" style={{ width: 24, height: 2, background: 'var(--text)', borderRadius: 1, display: 'block', transition: 'all 0.3s ease' }} />
            <span className="hamburger-line" style={{ width: 24, height: 2, background: 'var(--text)', borderRadius: 1, display: 'block', transition: 'all 0.3s ease' }} />
            <span className="hamburger-line" style={{ width: 24, height: 2, background: 'var(--text)', borderRadius: 1, display: 'block', transition: 'all 0.3s ease' }} />
          </button>
        </div>
      </motion.nav>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} links={NAV_LINKS} />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        @media (max-width: 1100px) {
          .hide-mobile { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
