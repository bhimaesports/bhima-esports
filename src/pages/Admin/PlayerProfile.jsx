import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import api from '../../utils/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

export default function PlayerProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'achievements'

  useEffect(() => {
    api.get(`/players/${id}/analytics`)
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!data || !data.player) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Player not found.</h2>
        <Link to="/admin/players" style={{ color: 'var(--neon)' }}>Back to Players</Link>
      </div>
    );
  }

  const { player, matchHistory, certificates = [] } = data;

  const kdRatio = player.matches_played > 0 ? (player.kills / player.matches_played).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }} className="animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        <div style={{ 
          width: '150px', 
          height: '150px', 
          background: 'linear-gradient(135deg, var(--bg-card), #111)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--neon)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '60px',
          boxShadow: '0 0 20px rgba(204, 255, 0, 0.1)'
        }}>
          👤
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text)' }}>
              {player.name}
            </h1>
            {player.status === 'active' ? (
              <span style={{ background: 'rgba(0, 255, 0, 0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase' }}>Active</span>
            ) : (
              <span style={{ background: 'rgba(255, 0, 0, 0.1)', color: 'var(--error)', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', fontWeight: 800, textTransform: 'uppercase' }}>{player.status}</span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
            <span>UID: <strong style={{ color: 'var(--text)' }}>{player.uid || 'N/A'}</strong></span>
            <span>•</span>
            <span>Roll: <strong style={{ color: 'var(--text)' }}>{player.roll_number || 'N/A'}</strong></span>
            <span>•</span>
            <span>Joined: <strong style={{ color: 'var(--text)' }}>{new Date(player.created_at).toLocaleDateString()}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div className="glass-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team</div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: 'var(--neon)' }}>
                {player.team_name ? (
                  <Link to={`/admin/teams/${player.team_id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-underline">{player.team_name}</Link>
                ) : 'Free Agent'}
              </div>
            </div>
            <div className="glass-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 800 }}>{player.department_name} ({player.department_code})</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-gray-800 pb-2 mt-4">
        <button
          className={`px-4 py-2 font-display uppercase tracking-wider font-bold ${activeTab === 'overview' ? 'text-neon-lime border-b-2 border-neon-lime' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => setActiveTab('overview')}
        >
          Stats & Analytics
        </button>
        <button
          className={`px-4 py-2 font-display uppercase tracking-wider font-bold ${activeTab === 'achievements' ? 'text-neon-lime border-b-2 border-neon-lime' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-fade-in space-y-6">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { label: 'Matches Played', value: player.matches_played || 0, color: 'var(--text)' },
              { label: 'Total Kills', value: player.kills || 0, color: 'var(--error)' },
              { label: 'Total Damage', value: player.total_damage || 0, color: 'var(--warning)' },
              { label: 'K/D Ratio', value: kdRatio, color: 'var(--neon)' },
              { label: 'Headshot %', value: `${player.headshot_percentage || 0}%`, color: 'var(--text)' },
              { label: 'Avg Survival', value: `${player.average_survival_time || 0}m`, color: 'var(--info)' },
              { label: 'Booyahs / Wins', value: player.booyahs || player.wins || 0, color: 'var(--success)' },
              { label: 'Total Points', value: player.total_points || 0, color: 'var(--neon)' },
            ].map((s, i) => (
              <Card key={i} style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
            <Card style={{ border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>⚔️ Kills Per Match Trend</h3>
              {matchHistory.length === 0 ? (
                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No detailed match history.</div>
              ) : (
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={matchHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--error)' }} />
                      <Line type="monotone" dataKey="kills" stroke="var(--error)" strokeWidth={3} dot={{ r: 4, fill: 'var(--error)' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card style={{ border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>📈 Points Progression</h3>
              {matchHistory.length === 0 ? (
                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No detailed match history.</div>
              ) : (
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={matchHistory}>
                      <defs>
                        <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--neon)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--neon)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--neon)' }} />
                      <Area type="monotone" dataKey="cumulative" stroke="var(--neon)" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card style={{ border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>💥 Match Damage Distribution</h3>
              {matchHistory.length === 0 ? (
                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No detailed match history.</div>
              ) : (
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={matchHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} itemStyle={{ color: 'var(--warning)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                      <Bar dataKey="damage" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="animate-fade-in space-y-6">
          <div className="flex justify-between items-center bg-gray-900/50 p-6 rounded-lg border border-gray-800">
            <div>
              <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-white">Career Achievements</h2>
              <p className="text-gray-400">Certificates and awards earned by this player</p>
            </div>
            <Link to="/admin/certificates">
              <Button variant="outline">Manage Awards</Button>
            </Link>
          </div>

          {certificates.length === 0 ? (
            <div className="text-center py-20 bg-black/50 rounded-lg border border-gray-800">
              <div className="text-6xl mb-4 opacity-50">🏆</div>
              <h3 className="text-xl font-bold text-gray-500">No Achievements Yet</h3>
              <p className="text-gray-600 mt-2">This player has not received any certificates or awards.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {certificates.map(cert => (
                <div key={cert.id} className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg overflow-hidden group hover:border-neon-lime transition-colors">
                  <div className="p-6 flex flex-col items-center text-center relative">
                    <div className="absolute top-4 right-4 text-xs font-mono text-gray-600">{new Date(cert.issued_date).getFullYear()}</div>
                    
                    <div className="w-24 h-24 flex items-center justify-center text-6xl mb-4 filter drop-shadow-[0_0_15px_rgba(215,255,0,0.3)]">
                      {cert.achievement_badge || '🏅'}
                    </div>
                    
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider mb-1">
                      {cert.title || cert.award_type || 'Award'}
                    </h3>
                    <div className="text-neon-lime text-sm mb-4">{cert.tournament_name || 'Tournament'}</div>
                    
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed line-clamp-3">
                      {cert.description_text || `Awarded for outstanding performance representing ${cert.team_name || 'their team'}.`}
                    </p>

                    <Button 
                      variant="outline" 
                      className="w-full mt-auto"
                      onClick={() => window.open(`http://localhost:5000/api/certificates/${cert.cert_id}/download`, '_blank')}
                    >
                      View Certificate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
