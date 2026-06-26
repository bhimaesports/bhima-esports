import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import Card from '../components/UI/Card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function HallOfFame() {
  const [entries, setEntries] = useState([]);
  const [mvps, setMvps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHallOfFame = async () => {
    try {
      const data = await api.get('/hall-of-fame');
      setEntries(data.entries || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMVPs = async () => {
    try {
      const data = await api.get('/players', { limit: 100 });
      const list = data.players || data || [];
      const sorted = [...list]
        .sort((a, b) => {
          if ((b.mvp_awards || 0) !== (a.mvp_awards || 0)) {
            return (b.mvp_awards || 0) - (a.mvp_awards || 0);
          }
          return (b.kills || 0) - (a.kills || 0);
        })
        .slice(0, 3);
      setMvps(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchHallOfFame(), fetchMVPs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
    const handleUpdate = () => fetchHallOfFame();
    window.addEventListener('hall-of-fame-update', handleUpdate);
    return () => window.removeEventListener('hall-of-fame-update', handleUpdate);
  }, []);

  const getGameIcon = (game) => {
    const cleanGame = game?.toLowerCase() || '';
    if (cleanGame.includes('freefire')) return '🔥';
    if (cleanGame.includes('bgmi')) return '⚔️';
    if (cleanGame.includes('cod')) return '🛡️';
    return '🎮';
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="page-wrapper container" 
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}
    >
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <motion.div 
          className="accent-line" 
          initial={{ width: 0 }}
          animate={{ width: '40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <h1 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', color: 'var(--text)' }}>Hall of Fame</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Immortalized legends of Bhima Esports.
        </p>
      </div>

      <motion.h3 variants={itemVariants} style={{ 
        textTransform: 'uppercase', 
        fontSize: 'var(--text-xl)', 
        fontWeight: 800, 
        color: 'var(--text)', 
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ color: 'var(--neon)' }}>🏆</span> Official Inductees
      </motion.h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : entries.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-dark" style={{ 
          textAlign: 'center', 
          padding: 'var(--space-12)', 
          clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
          border: '1px solid rgba(255,255,255,0.05)', 
          color: 'var(--text-secondary)' 
        }}>
          🏅 The Hall is currently empty. Awaiting the rise of new legends.
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-16)',
        }}>
          {entries.map((c) => (
            <motion.div key={c.id} variants={itemVariants}>
              <Card style={{ 
                border: '1px solid rgba(215,255,0,0.1)', 
                background: 'linear-gradient(135deg, rgba(5,5,5,0.9) 0%, rgba(20,20,0,0.8) 100%)',
                position: 'relative', 
                overflow: 'hidden' 
              }}>
                <div style={{
                  position: 'absolute',
                  right: '-15px',
                  bottom: '-25px',
                  fontSize: '8rem',
                  opacity: 0.03,
                  userSelect: 'none',
                }}>🏆</div>
                
                <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '2.5rem' }}>
                    {c.type === 'team' && c.team_logo ? (
                      <img
                        src={c.team_logo}
                        alt={c.team_name}
                        style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--neon)', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '56px', height: '56px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(215,255,0,0.1)',
                        border: '1px solid var(--neon)',
                        clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
                      }}>
                        {getGameIcon(c.game)}
                      </div>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {c.game} LEGEND
                    </span>
                    <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text)', margin: '4px 0', fontFamily: 'var(--font-heading)' }}>
                      {c.type === 'team' ? c.team_name : c.player_name}
                    </h3>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}>
                      {c.type === 'team' ? `DEPT: ${c.team_dept_code || '—'}` : `IGN: ${c.player_uid || '—'} | DEPT: ${c.player_dept_code || '—'}`}
                    </p>
                  </div>
                </div>
                
                <div style={{
                  marginTop: 'var(--space-4)',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.5)',
                  clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
                  borderLeft: '2px solid var(--neon)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text)',
                  lineHeight: 1.5,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {c.reason}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.h3 variants={itemVariants} style={{ 
        textTransform: 'uppercase', 
        fontSize: 'var(--text-xl)', 
        fontWeight: 800, 
        color: 'var(--text)', 
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ color: 'var(--info)' }}>🎖️</span> MVP Spotlight
      </motion.h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" />
        </div>
      ) : mvps.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-dark" style={{ 
          textAlign: 'center', 
          padding: 'var(--space-8)', 
          clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
          border: '1px solid rgba(255,255,255,0.05)', 
          color: 'var(--text-secondary)' 
        }}>
          🎖️ No match data available to determine MVPs.
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          {mvps.map((p, idx) => (
            <motion.div key={p.id} variants={itemVariants}>
              <Card style={{ 
                border: '1px solid var(--border)', 
                background: idx === 0 ? 'linear-gradient(180deg, rgba(215,255,0,0.05) 0%, rgba(5,5,5,1) 100%)' : 'var(--bg-card)', 
                borderColor: idx === 0 ? 'rgba(215,255,0,0.3)' : 'var(--border)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <span style={{
                    fontSize: 'var(--text-3xl)',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    color: idx === 0 ? 'var(--neon)' : 'var(--text-secondary)',
                    textShadow: idx === 0 ? '0 0 10px rgba(215,255,0,0.5)' : 'none'
                  }}>
                    #{idx + 1}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    color: 'var(--text)',
                    clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {p.department_code}
                  </span>
                </div>

                <h3 style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: 'var(--space-1)', textTransform: 'uppercase' }}>
                  {p.name}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-5)' }}>
                  IGN: {p.uid || '—'}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  paddingTop: 'var(--space-4)',
                  textAlign: 'center',
                }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-3xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MVPs</span>
                    <div style={{ fontSize: 'var(--text-lg)', color: 'var(--neon)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      {p.mvp_awards || 0}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-3xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kills</span>
                    <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {p.kills || 0}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--text-3xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matches</span>
                    <div style={{ fontSize: 'var(--text-lg)', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {p.matches_played || 0}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
