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
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          height: 'clamp(60px, 7vh, 75px)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          {/* Left: Logo Area */}
          <div style={{ display: 'flex', height: '100%', padding: '0 1.5rem', justifySelf: 'start', alignItems: 'center' }}>
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
            style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifySelf: 'center' }}
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
                    color: '#FFF',
                    textShadow: 'none',
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {link.label}
                  
                  {showUnderline && (
                    <motion.div
                      layoutId="nav-indicator"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'var(--neon)',
                        borderRadius: '2px',
                        boxShadow: '0 0 10px rgba(215,255,0,0.5)'
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="hide-mobile" style={{ display: 'flex', height: '100%', alignItems: 'center', justifySelf: 'end' }}>

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
                    color: '#FFF',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingRight: '1rem' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.6rem 1.5rem',
                    background: '#000',
                    color: '#FFF',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    border: '1px solid var(--neon)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--neon)'; e.currentTarget.style.color = '#000'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#FFF'; }}
                >
                  LOGIN
                </Link>
                
                <Link
                  to="/register"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.6rem 1.5rem',
                    background: 'var(--neon)',
                    color: '#000',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    border: '1px solid var(--neon)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.filter = 'brightness(0.9)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
                >
                  REGISTER
                </Link>
              </div>
            )}
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
            <span className="hamburger-line" style={{ width: 24, height: 2, background: '#000', borderRadius: 1, display: 'block', transition: 'all 0.3s ease' }} />
            <span className="hamburger-line" style={{ width: 24, height: 2, background: '#000', borderRadius: 1, display: 'block', transition: 'all 0.3s ease' }} />
            <span className="hamburger-line" style={{ width: 24, height: 2, background: '#000', borderRadius: 1, display: 'block', transition: 'all 0.3s ease' }} />
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
