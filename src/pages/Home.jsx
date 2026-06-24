import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { DEPARTMENTS, formatDate } from '../utils/helpers';
import Particles from '../components/UI/Particles';
import CountdownTimer from '../components/UI/CountdownTimer';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import { useApp } from '../context/AppContext';
export default function Home() {
  const defaultHomepageConfig = {
    hero: {
      tagline: 'Inter-Department Esports Championship',
      title1: 'DOMINATE THE',
      title2: 'BATTLEFIELD',
      subtitle: '8 departments. 1 champion. Compete in FreeFire, Bgmi & Cod for glory, BE Points, and eternal bragging rights.',
      video_url: 'https://res.cloudinary.com/dns0nlupj/video/upload/can_you_make_this_logo_as_an_g_bi3zdj.mp4#t=0,3'
    },
    stats: [
      { id: '1', source: 'teams.total', label: 'Teams', visible: true },
      { id: '2', source: 'players.total', label: 'Players', visible: true },
      { id: '3', source: 'tournaments.total', label: 'Tournaments', visible: true },
      { id: '4', source: 'departments', label: 'Departments', visible: true }
    ],
    visibility: {
      announcements: true,
      departments: true,
      cta: true
    }
  };

  const { announcements, stats, settings } = useApp();
  const [nextTournament, setNextTournament] = useState(null);
  const videoRef = useRef(null);

  const config = settings?.homepage_config ? JSON.parse(settings.homepage_config) : defaultHomepageConfig;

  useEffect(() => {
    api.get('/tournaments', { status: 'upcoming', limit: 1 })
      .then((d) => {
        const t = d?.tournaments?.[0] || d?.[0];
        if (t) setNextTournament(t);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frameId;
    const checkLoop = () => {
      // Loop video back to start if it crosses 3 seconds
      if (video.currentTime >= 3) {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
      frameId = requestAnimationFrame(checkLoop);
    };

    frameId = requestAnimationFrame(checkLoop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [config.hero.video_url]); // Re-run if video changes

  const activeAnnouncements = (announcements || []).filter((a) => a.active !== false).slice(0, 3);

  const getStatValue = (source) => {
    if (source === 'departments') return stats?.departmentStats?.length || 0;
    const parts = source.split('.');
    let val = stats?.stats;
    for (let p of parts) {
      if (val === undefined || val === null) return 0;
      val = val[p];
    }
    return val || 0;
  };

  return (
    <div className="page-wrapper">
      {/* ── Hero Section ──────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#050505',
      }}>
        {/* Background Video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
          }}
          poster="/assets/hero-fallback.jpg"
          key={config.hero.video_url}
        >
          <source src={config.hero.video_url} type="video/mp4" />
        </video>

        {/* Cinematic dark overlay + bottom gradient blend */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(5, 5, 5, 0.5) 0%, rgba(5, 5, 5, 0.65) 60%, rgba(15, 15, 35, 1) 100%)',
          zIndex: 2,
        }} />

        <Particles count={25} style={{ zIndex: 3 }} />

        {/* Centered Content Container */}
        <div className="container" style={{
          position: 'relative',
          zIndex: 4,
          textAlign: 'center',
          paddingTop: 'calc(var(--navbar-height) + var(--space-4))',
          paddingBottom: 'var(--space-12)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Glowing Animated Hero Logo */}
          <div style={{
            marginBottom: 'var(--space-6)',
            animation: 'logoPulse 3s infinite ease-in-out, slideUp 0.8s ease both',
          }}>
            <img
              src="/assets/logo.png"
              alt="Bhima Esports Logo"
              style={{
                height: 'clamp(90px, 16vw, 140px)',
                width: 'clamp(90px, 16vw, 140px)',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 15px rgba(215,255,0,0.45))',
              }}
            />
          </div>

          {/* Tagline */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '0.375rem 1rem',
            background: 'rgba(215,255,0,0.06)',
            border: '1px solid rgba(215,255,0,0.15)',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-6)',
            animation: 'slideUp 0.6s ease both 0.2s',
          }}>
            <span style={{ fontSize: '0.75rem' }}>⚡</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--neon)',
            }}>
              {config.hero.tagline}
            </span>
          </div>

          {/* Main Title */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.5rem, 7.5vw, 5rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            textTransform: 'uppercase',
            marginBottom: 'var(--space-6)',
            animation: 'heroTextReveal 0.8s ease both 0.4s',
          }}>
            <span style={{ color: 'var(--text)' }}>{config.hero.title1}</span>
            <br />
            <span className="gradient-text">{config.hero.title2}</span>
          </h1>

          {/* Accent line */}
          <div style={{
            width: 80, height: 3,
            background: 'var(--neon)',
            margin: '0 auto var(--space-6)',
            borderRadius: 'var(--radius-full)',
            animation: 'heroLineExpand 0.6s ease both 0.6s',
            transformOrigin: 'center',
          }} />

          {/* Subtitle */}
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            maxWidth: 560,
            margin: '0 auto var(--space-8)',
            lineHeight: 1.7,
            animation: 'heroTextReveal 0.8s ease both 0.6s',
          }}>
            {config.hero.subtitle}
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-4)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-8)',
            animation: 'heroTextReveal 0.8s ease both 0.8s',
          }}>
            <Link to="/register">
              <Button variant="primary" size="lg">Register Now</Button>
            </Link>
            <Link to="/tournaments">
              <Button variant="outline" size="lg">View Tournaments</Button>
            </Link>
          </div>

          {/* Countdown */}
          {nextTournament && (
            <div style={{ animation: 'heroTextReveal 0.8s ease both 1s' }}>
              <CountdownTimer
                targetDate={nextTournament.start_date || nextTournament.startDate || new Date(Date.now() + 7 * 86400000).toISOString()}
                label={nextTournament.name || 'Next Tournament'}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────────── */}
      <section style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(215,255,0,0.02)',
        padding: 'var(--space-8) 0',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'var(--space-6)',
            textAlign: 'center',
          }}>
            {config.stats.filter(s => s.visible).map((s, i) => (
              <div key={s.id} className={`animate-in stagger-${i + 1}`}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 800,
                  color: 'var(--neon)',
                  lineHeight: 1,
                  marginBottom: 'var(--space-1)',
                }}>
                  {getStatValue(s.source)}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-secondary)',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Announcements ─────────────────────────────────────── */}
      {activeAnnouncements.length > 0 && (
        <section className="page-section">
          <div className="container">
            <div className="section-header">
              <div className="accent-line" />
              <h2>Latest Announcements</h2>
              <p>Stay updated with the latest news and updates</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-4)',
            }}>
              {activeAnnouncements.map((ann, i) => (
                <div key={ann.id || i} className={`card card-glow animate-in stagger-${i + 1}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    <Badge variant={ann.type === 'urgent' ? 'banned' : ann.type === 'event' ? 'upcoming' : 'neon'}>
                      {ann.type || 'INFO'}
                    </Badge>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {formatDate(ann.created_at || ann.createdAt)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    {ann.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {ann.content || ann.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Departments Grid ──────────────────────────────────── */}
      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <div className="accent-line" />
            <h2>Competing Departments</h2>
            <p>8 departments battle for supremacy</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {DEPARTMENTS.map((dept, i) => (
              <div
                key={dept}
                className={`card card-glow hover-lift animate-in stagger-${i + 1}`}
                style={{
                  textAlign: 'center',
                  padding: 'var(--space-6) var(--space-4)',
                }}
              >
                <div style={{
                  fontSize: 'var(--text-2xl)',
                  marginBottom: 'var(--space-2)',
                }}>
                  {['🤖', '🧬', '💻', '🏗️', '📡', '⚡', '⚙️', '⛏️'][i]}
                </div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: 'var(--text-base)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text)',
                }}>
                  {dept}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────── */}
      <section style={{
        padding: 'var(--space-16) 0',
        background: 'linear-gradient(180deg, transparent, rgba(215,255,0,0.03), transparent)',
        position: 'relative',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-3xl)',
            fontWeight: 800,
            textTransform: 'uppercase',
            marginBottom: 'var(--space-4)',
          }}>
            Ready to <span style={{ color: 'var(--neon)' }}>Compete</span>?
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-lg)',
            maxWidth: 480,
            margin: '0 auto var(--space-8)',
          }}>
            Form your squad, register your team, and prove your department is the best.
          </p>
          <Link to="/register">
            <Button variant="primary" size="lg">Register Now →</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
