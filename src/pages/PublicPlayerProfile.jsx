import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Shield, Target, Crosshair, Zap, Activity, Award, Calendar, ChevronRight, Hash, Star, Swords, Flame, Medal } from 'lucide-react';
import api from '../utils/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const chartTooltipStyle = {
  backgroundColor: 'rgba(5, 5, 5, 0.95)',
  border: '1px solid var(--neon)',
  color: '#FFF',
  fontSize: '12px',
  fontFamily: 'var(--font-mono)',
  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)',
  boxShadow: '0 0 15px rgba(215, 255, 0, 0.1)',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export default function PublicPlayerProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/players/' + id)
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Zap size={48} color="var(--neon)" />
        </motion.div>
      </div>
    );
  }

  if (!data || !data.player) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-wrapper" style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Crosshair size={80} color="var(--error)" style={{ marginBottom: '2rem', opacity: 0.5 }} />
        <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', color: '#FFF', marginBottom: '1rem', textTransform: 'uppercase' }}>Operative Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '2rem' }}>The requested dossier does not exist or has been redacted.</p>
        <Link to="/leaderboard"><Button variant="outline">Return to Leaderboard</Button></Link>
      </motion.div>
    );
  }

  const { player, matchHistory = [], achievements = [] } = data;

  const mockAchievements = achievements.length ? achievements : [
    { id: '1', title: 'Marksmanship Award', tournament_name: 'Season 1 Qualifiers', issued_date: '2026-02-15', achievement_badge: '🎯' },
    { id: '2', title: 'MVP', tournament_name: 'Regional Finals', issued_date: '2026-04-20', achievement_badge: '⭐' }
  ];

  return (
    <div className="page-wrapper" style={{ background: '#000', minHeight: '100vh', color: '#FFF', overflowX: 'hidden' }}>
      
      {/* ── 1. CINEMATIC BANNER / DOSSIER ── */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          position: 'relative',
          padding: '120px 0 60px 0',
          background: 'linear-gradient(to bottom, rgba(20, 20, 20, 0.9) 0%, #000 100%)',
          borderBottom: '1px solid rgba(215, 255, 0, 0.2)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', backgroundImage: 'linear-gradient(var(--neon) 1px, transparent 1px), linear-gradient(90deg, var(--neon) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textDecoration: 'none', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>
            <ChevronRight size={14} /> Back to Hub
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '3rem', flexWrap: 'wrap' }}>
            {/* Holographic Avatar */}
            <motion.div whileHover={{ scale: 1.05 }} style={{ width: '180px', height: '180px', background: 'rgba(0,0,0,0.8)', border: '2px dashed var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)', boxShadow: 'inset 0 0 40px rgba(215,255,0,0.15), 0 0 20px rgba(215,255,0,0.1)' }}>
              {player.photo_url ? <img src={player.photo_url} alt={player.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Crosshair size={80} color="var(--neon)" />}
            </motion.div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '4.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase', margin: 0, lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.2)', letterSpacing: '2px' }}>
                  {player.name}
                </h1>
                <div style={{ padding: '6px 16px', background: player.role === 'captain' ? 'rgba(215, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: player.role === 'captain' ? 'var(--neon)' : '#FFF', border: player.role === 'captain' ? '1px solid var(--neon)' : '1px solid rgba(255,255,255,0.2)', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '0.9rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                  {player.role === 'captain' ? 'CAPTAIN' : 'OPERATIVE'}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Hash size={16} color="var(--neon)" /> UID: <span style={{ color: '#FFF' }}>{player.uid || 'CLASSIFIED'}</span></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} color="var(--neon)" /> ENLISTED: <span style={{ color: '#FFF' }}>{new Date(player.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}</span></span>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: '3px solid var(--neon)', padding: '1rem 1.5rem', minWidth: '200px' }}>
                  <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>ASSIGNED SQUAD</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--neon)', textTransform: 'uppercase' }}>
                    {player.team_name ? <Link to={`/teams/${player.team_id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{player.team_name}</Link> : 'LONE WOLF'}
                  </div>
                </div>
                {player.department_name && (
                  <div style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: '3px solid var(--info)', padding: '1rem 1.5rem', minWidth: '200px' }}>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-heading)', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>DIVISION</div>
                    <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase' }}>
                      {player.department_name} {player.department_code ? `[${player.department_code}]` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
          
          {/* ── 2. COMBAT METRICS (STATS) ── */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={28} color="var(--neon)" />
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Combat Matrix</h2>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--neon), transparent)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
            {[
              { label: 'DEPLOYMENTS', value: player.matches_played || 0, color: '#FFF' },
              { label: 'ELIMINATIONS', value: player.kills || 0, color: 'var(--error)' },
              { label: 'K/D RATIO', value: player.kd_ratio != null ? Number(player.kd_ratio).toFixed(2) : '0.00', color: 'var(--neon)' },
              { label: 'HEADSHOT %', value: `${player.headshot_percentage || 0}%`, color: 'var(--info)' },
              { label: 'VICTORIES', value: player.wins || 0, color: 'var(--success)' },
              { label: 'TOTAL SCORE', value: player.total_points || 0, color: 'var(--neon)' },
              { label: 'MVP AWARDS', value: player.mvp_awards || 0, color: '#FFD700' },
              { label: 'DMG OUTPUT', value: player.total_damage || 0, color: '#FF4500' },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} whileHover={{ scale: 1.05, y: -5 }}>
                <Card style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderBottom: `3px solid ${stat.color}`, display: 'flex', flexDirection: 'column', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '2px solid rgba(255,255,255,0.1)', borderRight: '2px solid rgba(255,255,255,0.1)' }} />
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '0.5rem' }}>{stat.label}</span>
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: stat.color, textShadow: `0 0 15px ${stat.color}40` }}>{stat.value}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ── 3. PERFORMANCE GRAPHS ── */}
          {matchHistory.length > 0 && (
            <motion.div variants={itemVariants} style={{ marginBottom: '4rem' }}>
              <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Activity size={28} color="var(--neon)" />
                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Telemetry</h2>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--neon), transparent)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                
                {/* Lethality Trend */}
                <Card style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Flame size={18} color="var(--error)"/> Lethality Trend Log</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={matchHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <RechartsTooltip contentStyle={{...chartTooltipStyle, border: '1px solid var(--error)'}} itemStyle={{ color: 'var(--error)' }} />
                        <Line type="monotone" dataKey="kills" stroke="var(--error)" strokeWidth={3} dot={{ r: 4, fill: '#000', stroke: 'var(--error)', strokeWidth: 2 }} activeDot={{ r: 8, fill: 'var(--error)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Score Accumulation */}
                <Card style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={18} color="var(--neon)"/> Score Accumulation Vector</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={matchHistory}>
                        <defs>
                          <linearGradient id="neonArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--neon)" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="var(--neon)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <RechartsTooltip contentStyle={chartTooltipStyle} itemStyle={{ color: 'var(--neon)' }} />
                        <Area type="monotone" dataKey="cumulative" stroke="var(--neon)" strokeWidth={3} fill="url(#neonArea)" activeDot={{ r: 8, fill: 'var(--neon)', stroke: '#000', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Damage Output */}
                <Card style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem', gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Crosshair size={18} color="var(--warning)"/> Damage Output Matrix</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={matchHistory}>
                        <defs>
                          <linearGradient id="warningBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--warning)" stopOpacity={1} />
                            <stop offset="100%" stopColor="var(--warning)" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <RechartsTooltip contentStyle={{...chartTooltipStyle, border: '1px solid var(--warning)'}} itemStyle={{ color: 'var(--warning)' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Bar dataKey="damage" fill="url(#warningBar)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

              </div>
            </motion.div>
          )}

          {/* ── 4. HONORS & COMMENDATIONS ── */}
          <motion.div variants={itemVariants}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Medal size={28} color="var(--neon)" />
              <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Commendations & Awards</h2>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--neon), transparent)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {mockAchievements.map((ach) => (
                <Card key={ach.id} style={{ background: 'linear-gradient(180deg, rgba(20,20,20,1) 0%, #050505 100%)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {new Date(ach.issued_date).getFullYear()}
                  </div>
                  <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(215,255,0,0.3))', marginBottom: '1rem' }}>{ach.achievement_badge || '🏅'}</div>
                  <h4 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#FFF', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>{ach.title}</h4>
                  <div style={{ color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.5rem', letterSpacing: '1px' }}>{ach.tournament_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{new Date(ach.issued_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </Card>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
