import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import Card from '../components/UI/Card';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const fetchResults = async (q) => {
    if (!q || q.trim().length === 0) {
      setTeams([]);
      setPlayers([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      const data = await api.get('/public/search', { q: q.trim() });
      setTeams(data.teams || []);
      setPlayers(data.players || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      setTeams([]);
      setPlayers([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery);
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    } else {
      setSearchParams({});
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const filteredTeams = activeTab === 'all' || activeTab === 'teams' ? teams : [];
  const filteredPlayers = activeTab === 'all' || activeTab === 'players' ? players : [];
  const totalResults = filteredTeams.length + filteredPlayers.length;

  const tabs = [
    { id: 'all', label: 'ALL', count: teams.length + players.length },
    { id: 'teams', label: 'TEAMS', count: teams.length },
    { id: 'players', label: 'PLAYERS', count: players.length },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={{ backgroundColor: '#050505', minHeight: '100vh', color: 'var(--text)', padding: 'var(--space-8) 0' }}
    >
      <div className="container">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}
        >
          <h1 style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: 'clamp(2rem, 5vw, 4rem)', 
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text)',
            margin: 0,
            textShadow: '0 0 20px rgba(215, 255, 0, 0.2)'
          }}>
            DATABASE <span style={{ color: 'var(--neon)' }}>SEARCH</span>
          </h1>
          <p style={{ 
            fontFamily: 'var(--font-body)', 
            color: 'var(--text-secondary)', 
            fontSize: 'var(--text-xl)',
            marginTop: 'var(--space-2)' 
          }}>
            LOCATE TEAMS, PLAYERS, AND DEPARTMENTS
          </p>
        </motion.div>

        {/* Search Input - Massive Tactical Field */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ maxWidth: '900px', margin: '0 auto var(--space-8)', position: 'relative' }}
        >
          <div style={{
            position: 'relative',
            background: 'var(--bg-card)',
            clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
            borderBottom: '4px solid var(--neon)',
            padding: '2px',
          }}>
            <span style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '2rem',
              color: 'var(--neon)',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              ⌖
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="ENTER SEARCH QUERY..."
              autoFocus
              style={{
                width: '100%',
                padding: '24px 24px 24px 72px',
                background: '#0a0a0a',
                border: 'none',
                color: 'var(--text)',
                fontSize: '2rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                  setTeams([]);
                  setPlayers([]);
                  setHasSearched(false);
                  inputRef.current?.focus();
                }}
                style={{
                  position: 'absolute',
                  right: '24px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>

        {/* Search State Indicator */}
        <AnimatePresence mode="wait">
          {!loading && !hasSearched && (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}
            >
              <div style={{ fontSize: '4rem', opacity: 0.2, marginBottom: 'var(--space-4)' }}>[ AWAITING INPUT ]</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)', fontSize: 'var(--text-2xl)' }}>
                SYSTEM READY FOR QUERY
              </h3>
            </motion.div>
          )}

          {loading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}
            >
              <div style={{ 
                display: 'inline-block',
                width: '50px', 
                height: '50px', 
                border: '3px solid rgba(215, 255, 0, 0.2)',
                borderTopColor: 'var(--neon)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <div style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--neon)' }}>SEARCHING DATABASE...</div>
            </motion.div>
          )}

          {!loading && hasSearched && totalResults === 0 && (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}
            >
              <div style={{ fontSize: '4rem', opacity: 0.2, marginBottom: 'var(--space-4)', color: '#ff3333' }}>[ NULL ]</div>
              <h3 style={{ fontFamily: 'var(--font-heading)', color: '#ff3333', fontSize: 'var(--text-2xl)' }}>
                NO MATCHING RECORDS FOUND
              </h3>
            </motion.div>
          )}

          {!loading && hasSearched && totalResults > 0 && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-8)',
                borderBottom: '1px solid var(--border)'
              }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: 'var(--space-3) var(--space-6)',
                      background: activeTab === tab.id ? 'rgba(215, 255, 0, 0.1)' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? '3px solid var(--neon)' : '3px solid transparent',
                      color: activeTab === tab.id ? 'var(--neon)' : 'var(--text-secondary)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: 'var(--text-lg)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      clipPath: activeTab === tab.id ? 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' : 'none'
                    }}
                  >
                    {tab.label} [{tab.count}]
                  </button>
                ))}
              </div>

              {/* Teams Results */}
              {filteredTeams.length > 0 && (
                <div style={{ marginBottom: 'var(--space-12)' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                    MATCHING TEAMS
                  </h2>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                      gap: 'var(--space-6)'
                    }}
                  >
                    {filteredTeams.map((team) => (
                      <motion.div key={team.id} variants={itemVariants} whileHover={{ scale: 1.02 }}>
                        <Link to={`/teams/${team.id}`} style={{ textDecoration: 'none' }}>
                          <Card className="hover-accent-card" style={{
                            background: '#0a0a0a',
                            border: '1px solid var(--border)',
                            clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
                            padding: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-4)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {/* Accent line on hover */}
                            <div className="hover-accent" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--neon)', opacity: 0, transition: 'opacity 0.2s' }} />

                            <div style={{
                              width: '60px',
                              height: '60px',
                              background: 'var(--bg-primary)',
                              border: '2px solid var(--neon)',
                              clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                              )}
                            </div>
                            
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', margin: '0 0 var(--space-1) 0', color: 'var(--text)' }}>
                                {team.name}
                              </h3>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
                                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px' }}>{team.department_code || team.department_name}</span>
                                {team.captain_name && <span>CAP: {team.captain_name}</span>}
                              </div>
                            </div>
                            
                            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                              <div style={{ color: 'var(--neon)', fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>{team.total_points || 0} PT</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>RANK #{team.rank || '-'}</div>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Players Results */}
              {filteredPlayers.length > 0 && (
                <div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                    MATCHING PERSONNEL
                  </h2>
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                      gap: 'var(--space-6)'
                    }}
                  >
                    {filteredPlayers.map((player) => (
                      <motion.div key={player.id} variants={itemVariants} whileHover={{ scale: 1.02 }}>
                        <Link to={`/players/${player.id}`} style={{ textDecoration: 'none' }}>
                          <Card className="hover-accent-card" style={{
                            background: '#0a0a0a',
                            border: '1px solid var(--border)',
                            clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))',
                            padding: 'var(--space-4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-4)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {/* Accent line on hover */}
                            <div className="hover-accent" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px', background: 'var(--neon)', opacity: 0, transition: 'opacity 0.2s' }} />

                            <div style={{
                              width: '50px',
                              height: '50px',
                              background: 'rgba(215, 255, 0, 0.1)',
                              border: '1px solid var(--neon)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-heading)',
                              fontSize: '1.5rem',
                              color: 'var(--neon)',
                              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
                            }}>
                              {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                            </div>

                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', margin: '0 0 var(--space-1) 0', color: 'var(--text)' }}>
                                {player.name}
                              </h3>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                {player.team_name && <span style={{ color: 'var(--text)' }}>{player.team_name}</span>}
                                <span style={{ opacity: 0.5 }}>|</span>
                                <span>{player.department_code || player.department_name}</span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                <div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>KILLS</div>
                                  <div style={{ color: 'var(--text)', fontWeight: 'bold' }}>{player.kills || 0}</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>PTS</div>
                                  <div style={{ color: 'var(--neon)', fontWeight: 'bold' }}>{player.total_points || 0}</div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .hover-accent-card:hover .hover-accent {
          opacity: 1 !important;
        }
      `}</style>
    </motion.div>
  );
}
