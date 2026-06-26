import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, LineChart, Line, CartesianGrid
} from 'recharts';
import { Shield, Target, Crosshair, Users, Activity, Trophy, Medal, Star, TrendingUp, Award, Swords, ChevronRight, Zap, Crown, Flame } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

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

export default function PublicTeamProfile() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matchHistory, setMatchHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      setLoading(true);
      try {
        const data = await api.get('/public/teams/' + id);
        if (!data || !data.team) {
          setNotFound(true);
          return;
        }
        setTeam(data.team);
        setPlayers(data.players || []);
        setMatchHistory(data.matchHistory || []);
        setAchievements(data.achievements || [
          { id: '1', title: 'Champion', tournament_name: 'Bhima Major 2026', issued_date: '2026-05-15', achievement_badge: '🏆' },
          { id: '2', title: 'Top Fragger', tournament_name: 'Regional Qualifiers', issued_date: '2026-03-10', achievement_badge: '💀' }
        ]);
      } catch (err) {
        console.error('Failed to fetch team profile:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
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

  if (notFound || !team) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-wrapper" style={{ background: '#000', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Shield size={80} color="var(--error)" style={{ marginBottom: '2rem', opacity: 0.5 }} />
        <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', color: '#FFF', marginBottom: '1rem', textTransform: 'uppercase' }}>Squad Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '2rem' }}>The requested team unit does not exist in the database.</p>
        <Link to="/leaderboard"><Button variant="outline">Return to Leaderboard</Button></Link>
      </motion.div>
    );
  }

  const captain = players.find(p => p.role?.toLowerCase() === 'captain') || players[0];
  const totalDamage = players.reduce((sum, p) => sum + (p.total_damage || 0), 0);
  const headshotAvg = players.length ? (players.reduce((sum, p) => sum + (p.headshot_percentage || 0), 0) / players.length).toFixed(1) : 0;

  return (
    <div className="page-wrapper" style={{ background: '#000', minHeight: '100vh', color: '#FFF', overflowX: 'hidden' }}>
      
      {/* ── 1. CINEMATIC BANNER ── */}
      <motion.div 
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          position: 'relative',
          padding: '120px 0 60px 0',
          background: 'linear-gradient(to bottom, rgba(215, 255, 0, 0.05) 0%, #000 100%)',
          borderBottom: '1px solid rgba(215, 255, 0, 0.2)',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(215,255,0,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/leaderboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textDecoration: 'none', marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>
            <ChevronRight size={14} /> Back to Hub
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
            <motion.div whileHover={{ scale: 1.05 }} style={{ width: '160px', height: '160px', border: '2px solid var(--neon)', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)', boxShadow: '0 0 30px rgba(215,255,0,0.15)' }}>
              {team.logo_url ? <img src={team.logo_url} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Shield size={80} color="var(--neon)" />}
            </motion.div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '4rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase', margin: 0, lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>
                  {team.name}
                </h1>
                <div style={{ padding: '6px 16px', background: 'var(--neon)', color: '#000', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}>
                  RANK #{team.rank || '-'}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '1rem', marginTop: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={16} color="var(--neon)" /> ID: {team.team_id}</span>
                {team.department_name && <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} color="var(--neon)" /> DIV: {team.department_name}</span>}
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} color="var(--neon)" /> WIN RATE: {team.win_rate != null ? `${team.win_rate}%` : '0%'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container" style={{ padding: '4rem 1rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}>
          
          {/* ── 2. GLOBAL STATISTICS ── */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={28} color="var(--neon)" />
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Combat Metrics</h2>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--neon), transparent)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
            {[
              { label: 'TOTAL POINTS', value: team.total_points || 0, icon: <Star color="var(--neon)" size={24} /> },
              { label: 'DEPLOYMENTS', value: team.matches_played || 0, icon: <Swords color="#FFF" size={24} /> },
              { label: 'VICTORIES', value: team.wins || 0, icon: <Trophy color="#FFD700" size={24} /> },
              { label: 'ELIMINATIONS', value: team.total_kills || 0, icon: <Target color="var(--error)" size={24} /> },
              { label: 'TOTAL DAMAGE', value: totalDamage.toLocaleString(), icon: <Flame color="#FF4500" size={24} /> },
              { label: 'AVG HEADSHOT', value: `${headshotAvg}%`, icon: <Crosshair color="var(--info)" size={24} /> },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} whileHover={{ scale: 1.02, y: -5 }}>
                <Card glow style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{stat.label}</span>
                    {stat.icon}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#FFF' }}>{stat.value}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ── 3. CAPTAIN & ROSTER ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '4rem' }}>
            {/* Captain Highlight */}
            {captain && (
              <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Crown size={28} color="var(--neon)" />
                  <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Squad Leader</h2>
                </div>
                <Card style={{ background: 'linear-gradient(135deg, rgba(215,255,0,0.1) 0%, #050505 100%)', border: '1px solid var(--neon)', padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#000', border: '2px solid var(--neon)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(215,255,0,0.2)' }}>
                    <Crown size={40} color="var(--neon)" />
                  </div>
                  <h3 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', margin: 0, textTransform: 'uppercase' }}>{captain.name}</h3>
                  <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--neon)', fontSize: '0.9rem', marginBottom: '1.5rem', letterSpacing: '2px' }}>COMMANDER</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
                    <div style={{ background: '#000', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>K/D RATIO</div>
                      <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#FFF' }}>{captain.kd_ratio != null ? Number(captain.kd_ratio).toFixed(2) : '0.00'}</div>
                    </div>
                    <div style={{ background: '#000', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>KILLS</div>
                      <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#FFF' }}>{captain.kills || 0}</div>
                    </div>
                  </div>
                  <Link to={`/players/${captain.id}`} style={{ width: '100%', marginTop: '1.5rem' }}>
                    <Button variant="outline" style={{ width: '100%', borderColor: 'var(--neon)', color: 'var(--neon)' }}>VIEW DOSSIER</Button>
                  </Link>
                </Card>
              </motion.div>
            )}

            {/* Roster */}
            <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Users size={28} color="var(--neon)" />
                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Active Operatives</h2>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {players.filter(p => p.id !== captain?.id).map((p, idx) => (
                  <motion.div key={p.id} variants={itemVariants} whileHover={{ scale: 1.03 }}>
                    <Link to={`/players/${p.id}`} style={{ textDecoration: 'none' }}>
                      <Card style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '50px', height: '50px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}>
                          <Crosshair size={20} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#FFF', margin: 0, textTransform: 'uppercase' }}>{p.name}</h4>
                          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>K/D: {p.kd_ratio != null ? Number(p.kd_ratio).toFixed(2) : '0.00'} • KILLS: {p.kills || 0}</div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
                {players.length <= 1 && (
                  <div style={{ padding: '2rem', background: '#050505', border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: '1 / -1' }}>
                    NO ADDITIONAL OPERATIVES DETECTED
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── 4. PERFORMANCE ANALYTICS & GRAPHS ── */}
          {matchHistory.length > 0 && (
            <motion.div variants={itemVariants} style={{ marginBottom: '4rem' }}>
              <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <TrendingUp size={28} color="var(--neon)" />
                <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Telemetry & Analytics</h2>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--neon), transparent)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                {/* Score Progression */}
                <Card style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={18} color="var(--neon)"/> Score Progression Vector</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={matchHistory}>
                        <defs>
                          <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D7FF00" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#D7FF00" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                        <Area type="monotone" dataKey="cumulative" stroke="var(--neon)" strokeWidth={3} fill="url(#neonGradient)" activeDot={{ r: 8, fill: 'var(--neon)', stroke: '#000', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Match Eliminations */}
                <Card style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: '#FFF', textTransform: 'uppercase', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Target size={18} color="var(--error)"/> Match Eliminations Log</h3>
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={matchHistory}>
                        <defs>
                          <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--error)" stopOpacity={1} />
                            <stop offset="100%" stopColor="var(--error)" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
                        <RechartsTooltip contentStyle={{...chartTooltipStyle, border: '1px solid var(--error)', boxShadow: '0 0 15px rgba(255, 50, 50, 0.1)'}} cursor={{fill: 'rgba(255,50,50,0.1)'}} />
                        <Bar dataKey="kills" fill="url(#errorGradient)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* ── 5. TROPHIES & ACHIEVEMENTS ── */}
          <motion.div variants={itemVariants}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Medal size={28} color="var(--neon)" />
              <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', margin: 0 }}>Honors & Trophies</h2>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--neon), transparent)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {achievements.length > 0 ? achievements.map((ach) => (
                <Card key={ach.id} style={{ background: 'linear-gradient(180deg, rgba(20,20,20,1) 0%, #050505 100%)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 20px rgba(215,255,0,0.3))', marginBottom: '1rem' }}>{ach.achievement_badge || '🏆'}</div>
                  <h4 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: '#FFF', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>{ach.title}</h4>
                  <div style={{ color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{ach.tournament_name}</div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{new Date(ach.issued_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </Card>
              )) : (
                <div style={{ gridColumn: '1 / -1', padding: '4rem', background: '#050505', border: '1px dashed rgba(255,255,255,0.1)', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  NO COMMENDATIONS RECORDED
                </div>
              )}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
