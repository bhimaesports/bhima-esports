import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const QUICK_LINKS = [
  { path: '/tournaments', label: 'Tournaments' },
  { path: '/register', label: 'Register' },
  { path: '/leaderboard', label: 'Leaderboard' }
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
      <style>{`
        .footer-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 3rem;
          margin-bottom: 3rem;
        }
        .footer-brand {
          flex: 1;
          max-width: 500px;
        }
        .footer-brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .footer-links {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          text-align: right;
        }
        .footer-bottom {
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .footer-grid {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 2.5rem;
          }
          .footer-brand {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .footer-brand-logo {
            justify-content: center;
          }
          .footer-links {
            align-items: center;
            text-align: center;
          }
          .footer-bottom {
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-brand-logo">
              <img src="/assets/logo.png" alt="Bhima Esports" style={{ height: 42, width: 42, objectFit: 'contain' }} />
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                <span style={{ color: 'var(--neon)' }}>BHIMA</span> ESPORTS
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 320, lineHeight: 1.7, margin: 0 }}>
              The premier inter-department esports tournament platform. Compete, dominate, and claim glory.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-secondary)',
              marginBottom: '1.25rem',
            }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--text)',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.target.style.color = 'var(--neon)'; e.target.style.paddingLeft = '5px'; }}
                  onMouseLeave={(e) => { e.target.style.color = 'var(--text)'; e.target.style.paddingLeft = '0px'; }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Social Links Bar */}
        {instagramUrl && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem',
            paddingBottom: '2rem',
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
                padding: '0.6rem 1.5rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(215,255,0,0.15)';
                e.currentTarget.style.color = 'var(--neon)';
                e.currentTarget.style.borderColor = 'rgba(215,255,0,0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(215,255,0,0.05)';
                e.currentTarget.style.color = 'var(--text)';
                e.currentTarget.style.borderColor = 'rgba(215,255,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
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
        <div className="footer-bottom">
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.04em',
          }}>
            © {new Date().getFullYear()} BHIMA ESPORTS. All rights reserved.
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
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
