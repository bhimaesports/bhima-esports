import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const QUICK_LINKS = [
  { path: '/tournaments', label: 'Tournaments' },
  { path: '/register', label: 'Register' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/certificates', label: 'Certificates' },
];

export default function Footer() {
  const { settings } = useApp();
  
  let instagramUrl = '';
  try {
    if (settings?.homepage_config) {
      const config = JSON.parse(settings.homepage_config);
      instagramUrl = config.social?.instagram || '';
    }
  } catch(e) {}

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      padding: '3rem 0 1.5rem',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <img src="/assets/logo.png" alt="Bhima Esports" style={{ height: 36, width: 36, objectFit: 'contain' }} />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'var(--text-base)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                <span style={{ color: 'var(--neon)' }}>BHIMA</span> ESPORTS
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 280, lineHeight: 1.7 }}>
              The premier inter-department esports tournament platform. Compete, dominate, and claim glory.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
            }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.target.style.color = 'var(--neon)'; }}
                  onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
              marginBottom: '1rem',
            }}>
              Tournament Info
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              <span>📍 UCEOU, Bhima Hostel</span>
              <span>🎮 FreeFire • Bgmi • Cod</span>
              <span>🏆 8 Departments</span>
            </div>
          </div>
        </div>

        {/* Social Links Bar */}
        {instagramUrl && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <a 
              href={instagramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text)',
                background: 'rgba(215,255,0,0.05)',
                border: '1px solid rgba(215,255,0,0.1)',
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(215,255,0,0.1)';
                e.currentTarget.style.color = 'var(--neon)';
                e.currentTarget.style.borderColor = 'rgba(215,255,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(215,255,0,0.05)';
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.borderColor = 'rgba(215,255,0,0.1)';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              Follow us on Instagram
            </a>
          </div>
        )}

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.04em',
          }}>
            © {new Date().getFullYear()} BHIMA ESPORTS. All rights reserved.
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.04em',
          }}>
            Built with ⚡ for competitive gaming
          </span>
        </div>
      </div>
    </footer>
  );
}
