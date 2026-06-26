import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Card from '../components/UI/Card';
import { useApp } from '../context/AppContext';

export default function Leaderboard() {
  const { settings } = useApp();
  const [activeTab, setActiveTab] = useState('teams');
  const [teamsLb, setTeamsLb] = useState([]);
  const [championshipLb, setChampionshipLb] = useState([]);
  const [clashSquadLb, setClashSquadLb] = useState([]);
  const [playersLb, setPlayersLb] = useState([]);
  const [loading, setLoading] = useState(true);

  // Match Results States
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'teams') {
        const data = await api.get('/leaderboards/teams');
        setTeamsLb(data.leaderboard || data || []);
      } else if (activeTab === 'championship') {
        const data = await api.get('/leaderboards/championship');
        setChampionshipLb(data.standings || data || []);
      } else if (activeTab === 'clash-squad') {
        const data = await api.get('/leaderboards/clash-squad');
        setClashSquadLb(data.standings || data || []);
      } else if (activeTab === 'players') {
        const data = await api.get('/public/players');
        setPlayersLb(data.players || data || []);
      } else if (activeTab === 'matches') {
        const data = await api.get('/matches');
        const matchData = data.matches || data || [];
        setMatches(matchData.filter(m => m.published === 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      fetchData();
    };
    window.addEventListener('leaderboard-update', handleUpdate);
    return () => window.removeEventListener('leaderboard-update', handleUpdate);
  }, [activeTab]);

  const activeMatch = matches.find(m => m.id.toString() === selectedMatchId);

  const renderRankChange = (change) => {
    if (change > 0) return <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.75rem' }}>▲ {change}</span>;
    if (change < 0) return <span style={{ color: 'var(--error)', fontWeight: 700, fontSize: '0.75rem' }}>▼ {Math.abs(change)}</span>;
    return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>▬</span>;
  };

  const renderPointsChange = (change) => {
    if (change > 0) return <span style={{ color: 'var(--success)', fontSize: '0.8rem', marginLeft: '6px' }}>+{change}</span>;
    if (change < 0) return <span style={{ color: 'var(--error)', fontSize: '0.8rem', marginLeft: '6px' }}>{change}</span>;
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.95 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 120 } }
  };

  const renderTop3Highlights = (data, isClashSquad = false) => {
    if (data.length < 3) return null;

    const clipPath = 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)';
    
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-10)',
        alignItems: 'end',
      }}>
        {/* 2nd Place */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{
            background: '#0A0A0A', border: '1px solid var(--border)', textAlign: 'center',
            padding: '1.5rem', clipPath, order: window.innerWidth > 768 ? 1 : 2
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {data[1].team_logo ? <img src={data[1].team_logo} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} /> : '🥈'}
          </div>
          <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>2nd Place</h4>
          <h3 style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text)', margin: '0.25rem 0' }}>
            {data[1].name || data[1].team_name || data[1].department_name}
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
            {isClashSquad ? `${data[1].wins} WINS` : `${data[1].total_points} PTS`}
          </span>
        </motion.div>

        {/* 1st Place */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(215,255,0,0.05)', border: '2px solid var(--neon)', textAlign: 'center',
            padding: '2rem 1.5rem', clipPath, position: 'relative', order: window.innerWidth > 768 ? 2 : 1,
            boxShadow: '0 0 20px rgba(215,255,0,0.1)'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'pulse 2s infinite' }}>
            {data[0].team_logo ? <img src={data[0].team_logo} alt="" style={{ width: '60px', height: '60px', objectFit: 'contain' }} /> : '👑'}
          </div>
          <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>1st Place</h4>
          <h3 style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff', margin: '0.25rem 0' }}>
            {data[0].name || data[0].team_name || data[0].department_name}
          </h3>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
            {isClashSquad ? `${data[0].wins} WINS` : `${data[0].total_points} PTS`}
          </span>
        </motion.div>

        {/* 3rd Place */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{
            background: '#0A0A0A', border: '1px solid var(--border)', textAlign: 'center',
            padding: '1.5rem', clipPath, order: 3
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
            {data[2].team_logo ? <img src={data[2].team_logo} alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} /> : '🥉'}
          </div>
          <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>3rd Place</h4>
          <h3 style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text)', margin: '0.25rem 0' }}>
            {data[2].name || data[2].team_name || data[2].department_name}
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
            {isClashSquad ? `${data[2].wins} WINS` : `${data[2].total_points} PTS`}
          </span>
        </motion.div>
      </div>
    );
  };

  const renderDataRow = (entry, index) => {
    const isTop3 = index < 3;
    const rank = index + 1;
    const isPlayer = activeTab === 'players';

    const title = isPlayer ? entry.name : entry.team_name;
    const subtitle = isPlayer 
      ? `${entry.team_name || 'Free Agent'} | K/D: ${entry.kd_ratio}` 
      : `${entry.department_code || ''} | ${entry.team_code || ''}`;
    
    const matchesLabel = isPlayer ? 'Matches' : 'Matches';
    const matchesValue = isPlayer ? entry.matches_played : (entry.matches_played || 0);
    const winsValue = entry.wins || 0;
    const killsValue = entry.kills || entry.total_kills || 0;
    const pointsValue = entry.total_points || 0;

    return (
      <motion.div
        variants={rowVariants}
        whileHover={{ scale: 1.02, borderColor: 'var(--neon)', boxShadow: '0 0 20px rgba(215,255,0,0.15)' }}
        key={entry.id || entry.team_id || index}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
          background: '#0A0A0A',
          border: isTop3 ? '1px solid rgba(215,255,0,0.3)' : '1px solid var(--border)',
          borderRadius: '4px',
          clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {isTop3 && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--neon)', boxShadow: '0 0 10px var(--neon)' }} />
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: '1 1 auto' }}>
          {/* Rank: Huge, Orbitron */}
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '3rem',
            fontWeight: 900,
            lineHeight: 1,
            color: isTop3 ? 'var(--neon)' : 'var(--border-light)',
            minWidth: '60px',
            textAlign: 'center',
            textShadow: isTop3 ? '0 0 10px rgba(215,255,0,0.3)' : 'none'
          }}>
            #{rank}
          </div>

          {/* Team/Player Logo and Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
             {entry.team_logo ? (
                <img src={entry.team_logo} alt={title} style={{ width: '56px', height: '56px', objectFit: 'cover', border: '1px solid var(--border)', transform: 'skewX(-10deg)', backgroundColor: 'var(--bg-primary)' }} />
             ) : (
                <div style={{ width: '56px', height: '56px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', transform: 'skewX(-10deg)', fontSize: '1.5rem' }}>{isPlayer ? '👤' : '🛡️'}</div>
             )}
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                 <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.3rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>
                   {title}
                 </span>
                 {entry.is_qualified && activeTab === 'teams' && (
                    <span style={{ 
                      background: 'rgba(215, 255, 0, 0.1)', 
                      color: 'var(--neon)', 
                      border: '1px solid var(--neon)', 
                      padding: '2px 6px', 
                      fontSize: '0.65rem', 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 800, 
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      boxShadow: '0 0 10px rgba(215, 255, 0, 0.2)'
                    }}>
                      Qualified
                    </span>
                 )}
                 {activeTab === 'teams' && (
                   <span style={{ fontFamily: 'var(--font-body)' }}>{renderRankChange(entry.rank_change)}</span>
                 )}
               </div>
               <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px' }}>
                 {subtitle}
               </span>
             </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
           {/* Matches */}
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{matchesLabel}</span>
             <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 700, color: '#FFF' }}>
                {matchesValue}
             </span>
           </div>

           {/* Wins */}
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Wins</span>
             <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 700, color: winsValue > 0 ? 'var(--neon)' : '#FFF' }}>
                {winsValue}
             </span>
           </div>

           {/* Kills */}
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kills</span>
             <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 700, color: '#FFF' }}>
                {killsValue}
             </span>
           </div>

           {/* Points: Huge, Neon */}
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '100px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
             <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>Points</span>
             <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--neon)', textShadow: '0 0 15px rgba(215,255,0,0.4)', lineHeight: 1 }}>
                   {pointsValue}
                </span>
                {activeTab === 'teams' && renderPointsChange(entry.points_change)}
             </div>
           </div>
        </div>
      </motion.div>
    );
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'teams': return teamsLb;
      case 'players': return playersLb;
      case 'championship': return championshipLb;
      case 'clash-squad': return clashSquadLb;
      default: return [];
    }
  };

  return (
    <motion.div 
      className="page-wrapper container" 
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <motion.div 
          className="accent-line" 
          initial={{ width: 0 }}
          animate={{ width: '40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <h1 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', color: 'var(--text)' }}>
          {settings?.cms_page_leaderboard_title || 'Leaderboard'}
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          {settings?.cms_page_leaderboard_sub || 'Real-time standings and player rankings.'}
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '3rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '1rem'
      }}>
        {[
          { id: 'teams', label: 'Teams' },
          { id: 'players', label: 'Players' },
          { id: 'championship', label: 'Championship' },
          { id: 'clash-squad', label: 'Clash Squad' },
          { id: 'matches', label: 'Match Results' },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === tab.id ? 'var(--neon)' : 'rgba(255,255,255,0.02)',
              color: activeTab === tab.id ? '#050505' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--neon)' : 'var(--border)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" style={{ borderColor: 'var(--neon)', borderRightColor: 'transparent' }} />
        </div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          
          {activeTab === 'teams' && renderTop3Highlights(teamsLb)}
          {activeTab === 'championship' && renderTop3Highlights(championshipLb)}
          {activeTab === 'clash-squad' && renderTop3Highlights(clashSquadLb, true)}

          {activeTab === 'players' && renderTop3Highlights(playersLb)}

          {activeTab === 'matches' && (
            <motion.div variants={rowVariants} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {matches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>NO MATCHES PUBLISHED YET</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {matches.map(m => (
                    <motion.div key={m.id} whileHover={{ y: -5 }} style={{ background: '#0A0A0A', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: '180px', background: '#111' }}>
                        {m.poster_url ? (
                          <img src={m.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '3rem' }}>🏆</div>
                        )}
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', border: '1px solid var(--neon)', color: 'var(--neon)', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: '4px' }}>
                          {m.status}
                        </div>
                      </div>
                      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                          <div style={{ color: 'var(--neon)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{m.game || 'TOURNAMENT MATCH'}</div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>{m.match_name || `MATCH ${m.match_number}`}</h3>
                          <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>{m.date ? formatDate(m.date) : 'TBA'} {m.time ? `• ${m.time}` : ''}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', fontWeight: 800 }}>Winner</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>{m.winning_team_name || '-'}</div>
                          </div>
                          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', fontWeight: 800 }}>MVP</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--neon)' }}>{m.mvp_in_game_name || m.mvp_player_name || '-'}</div>
                          </div>
                        </div>
                        <Button variant="outline" style={{ width: '100%', marginTop: 'auto' }} onClick={() => setSelectedMatchId(m.id.toString())}>View Full Results</Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Matches Modal */}
          <AnimatePresence>
            {activeTab === 'matches' && activeMatch && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} style={{ background: '#0A0A0A', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0A0A0A', zIndex: 10 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', fontFamily: 'var(--font-heading)', color: 'var(--neon)' }}>{activeMatch.match_name || `MATCH ${activeMatch.match_number}`}</h2>
                      <div style={{ fontSize: '0.85rem', color: '#888' }}>{activeMatch.tournament_name}</div>
                    </div>
                    <button onClick={() => setSelectedMatchId('')} style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', color: '#888', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: '50px', textAlign: 'center' }}>Rank</div>
                      <div style={{ flex: 1, paddingLeft: '1rem' }}>Team</div>
                      <div style={{ width: '60px', textAlign: 'center' }}>Kills</div>
                      <div style={{ width: '60px', textAlign: 'center' }}>Total</div>
                    </div>
                    {activeMatch.results && activeMatch.results.length > 0 ? (
                      activeMatch.results.map((res, index) => (
                        <div key={res.team_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: index === 0 ? 'rgba(215,255,0,0.05)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: '50px', textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: index === 0 ? 'var(--neon)' : '#FFF' }}>#{res.rank}</div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1rem' }}>
                            <div style={{ width: '30px', height: '30px', background: '#111', border: index === 0 ? '1px solid var(--neon)' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {res.team_logo ? <img src={res.team_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🛡️'}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', color: index === 0 ? 'var(--neon)' : '#FFF' }}>{res.team_name}</div>
                          </div>
                          <div style={{ width: '60px', textAlign: 'center', fontWeight: 600, color: '#888' }}>{res.kills}</div>
                          <div style={{ width: '60px', textAlign: 'center', fontWeight: 900, fontSize: '1.1rem', color: index === 0 ? 'var(--neon)' : '#FFF' }}>{res.total_points}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '3rem', textAlign: 'center', color: '#888', fontWeight: 600 }}>NO RESULTS RECORDED YET</div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab !== 'matches' && (
          <div style={{ width: '100%', paddingBottom: '2rem' }}>
            <AnimatePresence mode="popLayout">
              {getActiveData().length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', letterSpacing: '2px' }}
                >
                  NO DATA AVAILABLE
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {getActiveData().map((entry, index) => renderDataRow(entry, index))}
                </div>
              )}
            </AnimatePresence>
          </div>
          )}

        </motion.div>
      )}
    </motion.div>
  );
}
