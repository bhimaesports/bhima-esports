import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { announcements, settings } = useApp();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Settings Parsing
  const { heroSlides, videos, roadToGlory, widgets } = React.useMemo(() => {
    const defaults = {
      heroSlides: [],
      videos: [],
      roadToGlory: [],
      widgets: { showSchedule: true, showStandings: true, quickInfo: [] }
    };
    if (settings?.homepage_config) {
      try {
        const parsed = JSON.parse(settings.homepage_config);
        return {
          heroSlides: parsed.heroSlides?.length ? parsed.heroSlides : defaults.heroSlides,
          videos: parsed.videos || defaults.videos,
          roadToGlory: parsed.roadToGlory || defaults.roadToGlory,
          widgets: { ...defaults.widgets, ...(parsed.widgets || {}) }
        };
      } catch (e) {
        console.error('Error parsing config:', e);
      }
    }
    return defaults;
  }, [settings]);

  // Secret Admin Access Listener
  useEffect(() => {
    let keyBuffer = '';
    const secretCode = 'ruttu015556';
    
    const handleKeyDown = (e) => {
      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > secretCode.length) {
        keyBuffer = keyBuffer.slice(-secretCode.length);
      }
      if (keyBuffer === secretCode) {
        navigate('/admin/login');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, tourRes] = await Promise.all([
          api.get('/public/leaderboards').catch(() => null),
          api.get('/public/tournaments').catch(() => null)
        ]);
        if (lbRes) setLeaderboard(lbRes);
        if (tourRes && tourRes.tournaments) setTournaments(tourRes.tournaments);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    const handleEntityUpdate = (e) => {
      if (['tournament', 'match', 'team', 'player'].includes(e.detail?.entityType)) {
        fetchData();
      }
    };
    window.addEventListener('entity_update', handleEntityUpdate);
    return () => window.removeEventListener('entity_update', handleEntityUpdate);
  }, []);

  // Hero Slider Timer
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const activeAnnouncements = (announcements || []).filter(a => a.active !== false).slice(0, 6);
  const liveTournaments = tournaments.filter(t => t.status === 'ongoing').slice(0, 3);
  const topTeams = leaderboard && leaderboard.topTeams ? leaderboard.topTeams.slice(0, 5) : [];

  return (
    <div className="page-wrapper" style={{ background: '#111', color: '#FFF', minHeight: '100vh', overflowX: 'hidden', paddingBottom: '4rem', paddingTop: 0 }}>
      
      {/* 1. Hero Banner */}
      <section style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#080808'
      }}>
        
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
        >
          <source src={heroSlides[currentSlide]?.bgImage || "/assets/hero-bg.mp4"} type="video/mp4" />
        </video>

        {/* Dark Overlay for Readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(rgba(5,5,5,0.7), rgba(5,5,5,0.95))',
          zIndex: 1
        }}></div>

        {/* Diagonal Line Overlay (Restored & Enhanced) */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(45deg, rgba(215,255,0,0.15) 0, rgba(215,255,0,0.15) 1px, transparent 1px, transparent 12px)`,
          zIndex: 2, pointerEvents: 'none',
        }}></div>



        {/* Tactical White/Grey Dots Grid Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          zIndex: 2, pointerEvents: 'none'
        }}></div>

        {/* Left Yellow Chevrons */}
        <div style={{
          position: 'absolute', top: 0, bottom: '80px', left: 0, width: 'clamp(60px, 15vw, 300px)',
          background: 'repeating-linear-gradient(135deg, var(--neon), var(--neon) 20px, transparent 20px, transparent 40px)',
          clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)',
          opacity: 1, zIndex: 3
        }}></div>

        <div className="container-lg" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 1rem', flex: 1, justifyContent: 'center' }}>
          
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Title (Like PUBG ESPORTS 2026) */}
            <h2 style={{ 
              fontFamily: "'Orbitron', sans-serif", 
              fontSize: 'clamp(1.5rem, 4vw, 4rem)', 
              fontWeight: 900, 
              color: 'var(--neon)', 
              textTransform: 'uppercase', 
              margin: '0 0 -0.5rem 0',
              letterSpacing: '2px',
              textShadow: 'none'
            }}>
              BHIMA ESPORTS
            </h2>

            {/* Main Massive Subtitle (Like ROAD TO PGC) */}
            <h1 style={{ 
              fontFamily: "'Rajdhani', sans-serif", 
              fontSize: 'clamp(2.5rem, 10vw, 12rem)', 
              fontWeight: 900, 
              color: '#FFFFFF', 
              textTransform: 'uppercase', 
              margin: '0',
              lineHeight: '1',
              letterSpacing: '-0.02em',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              DOMINATE
            </h1>
            <h1 style={{ 
              fontFamily: "'Rajdhani', sans-serif", 
              fontSize: 'clamp(2.5rem, 10vw, 12rem)', 
              fontWeight: 900, 
              color: '#FFFFFF', 
              textTransform: 'uppercase', 
              margin: '-0.5rem 0 2rem 0',
              lineHeight: '1',
              letterSpacing: '-0.02em',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              THE BATTLEFIELD
            </h1>
          </motion.div>

        </div>
      </section>

      {/* 4-Box Yellow Info Ticker Bar (Moved OUTSIDE Hero) */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: 'var(--neon)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1px', /* Thin border lines between boxes */
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        {[
          { title: 'BHIMA Esports Season 1', sub: 'Registrations are now open!' },
          { title: 'Tournament Hub', sub: 'Explore ongoing battles' },
          { title: 'Leaderboards Live', sub: 'Check current player standings' },
          { title: 'Join the Community', sub: 'New challengers arriving' }
        ].map((box, i) => (
          <div key={i} style={{ 
            background: 'var(--neon)', 
            padding: '0.5rem 1.2rem', 
            height: 'clamp(60px, 10vw, 90px)',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            borderRight: '1px solid rgba(0,0,0,0.1)' 
          }}>
             <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, color: '#000', fontSize: 'clamp(0.85rem, 1.2vw, 1rem)', marginBottom: '0.15rem', lineHeight: 1.1 }}>{box.title}</span>
             <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 'clamp(0.75rem, 1vw, 0.9rem)', color: '#333', fontWeight: 700 }}>{box.sub}</span>
          </div>
        ))}
      </div>

      <div className="container-lg" style={{ padding: '4rem 1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '4rem' }}>
        
        {/* LATEST NEWS & ANNOUNCEMENTS */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
              LATEST <span style={{ color: 'var(--neon)' }}>NEWS</span>
            </h2>
          </div>

          {activeAnnouncements.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
              {activeAnnouncements.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ background: '#1A1A1A', border: '1px solid #333', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {/* Faux Image Area */}
                  <div style={{ height: '180px', background: 'linear-gradient(45deg, #111, #222)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ fontSize: '3rem', opacity: 0.1 }}>📰</span>
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'var(--neon)', color: '#000', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>UPDATE</div>
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontFamily: "'Montserrat', sans-serif", fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.3 }}>{a.title}</h3>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '4rem', textAlign: 'center', background: '#1A1A1A', border: '1px dashed #333', color: '#666', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.2rem', textTransform: 'uppercase' }}>NO RECENT NEWS</div>
          )}
        </section>

        {/* VIDEOS SECTION */}
        {videos && videos.length > 0 && (
          <section>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
                FEATURED <span style={{ color: 'var(--neon)' }}>VIDEOS</span>
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '2rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'thin', scrollbarColor: 'var(--neon) #222' }}>
              {videos.map(v => (
                <div key={v.id} style={{ flex: '0 0 350px' }}>
                  <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', marginBottom: '1rem', border: '1px solid #333' }}>
                    <iframe width="100%" height="100%" src={v.url} title={v.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                  </div>
                  <h4 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontSize: '1rem', fontWeight: 700 }}>{v.title}</h4>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* WIDGETS GRID: SCHEDULE & STANDINGS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '3rem' }}>
          
          {/* SCHEDULE WIDGET */}
          {widgets.showSchedule !== false && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>MATCHES</h2>
                <Link to="/schedule" style={{ color: 'var(--neon)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Full Schedule ›</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {liveTournaments.length > 0 ? liveTournaments.map(t => (
                  <div key={t.id} style={{ background: '#1A1A1A', borderLeft: '4px solid var(--neon)', padding: '1.25rem', cursor: 'pointer' }} onClick={() => navigate(`/tournaments/${t.id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: '#888', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>{new Date(t.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric'})}</span>
                      <span style={{ color: 'var(--neon)', fontSize: '0.75rem', fontWeight: 800, padding: '0.15rem 0.5rem', background: 'rgba(215,255,0,0.1)' }}>LIVE</span>
                    </div>
                    <h4 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontSize: '1.1rem', fontWeight: 800 }}>{t.name}</h4>
                  </div>
                )) : (
                  <div style={{ background: '#1A1A1A', padding: '2rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>NO ONGOING TOURNAMENTS</div>
                )}
              </div>
            </section>
          )}

          {/* STANDINGS WIDGET */}
          {widgets.showStandings !== false && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase' }}>STANDINGS</h2>
                <Link to="/leaderboard" style={{ color: 'var(--neon)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Full Ranking ›</Link>
              </div>
              <div style={{ background: '#1A1A1A' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 60px', padding: '1rem', borderBottom: '1px solid #333', color: '#888', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <div>RNK</div>
                  <div>TEAM</div>
                  <div style={{ textAlign: 'center' }}>KILLS</div>
                  <div style={{ textAlign: 'right' }}>PTS</div>
                </div>
                {topTeams.length > 0 ? topTeams.map((team, idx) => (
                  <div key={team.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 60px 60px', padding: '1rem', borderBottom: '1px solid #222', alignItems: 'center', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#222'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => navigate(`/teams/${team.id}`)}>
                    <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: '1.1rem', color: idx < 3 ? 'var(--neon)' : '#888' }}>{idx + 1}</div>
                    <div style={{ fontWeight: 700 }}>{team.team_name}</div>
                    <div style={{ textAlign: 'center', color: '#aaa', fontFamily: 'var(--font-mono)' }}>{team.total_kills}</div>
                    <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--neon)' }}>{team.total_points}</div>
                  </div>
                )) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>NO RANKINGS AVAILABLE</div>
                )}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
