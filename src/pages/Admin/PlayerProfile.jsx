import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import api from '../../utils/api';
import Card from '../../components/UI/Card';

export default function PlayerProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const { player, matchHistory } = data;

  // Derive some basic averages
  const kdRatio = player.matches_played > 0 ? (player.kills / player.matches_played).toFixed(2) : '0.00';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
            <div className="glass-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Year</div>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 800 }}>{player.year || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Career Stats Grid ──────────────────────────────────────────── */}
      <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--text)', marginTop: 'var(--space-4)' }}>Career Statistics</h2>
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

      {/* ── Analytics Graphs ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
        
        {/* Graph 1: Kills Progression */}
        <Card style={{ border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            ⚔️ Kills Per Match Trend
          </h3>
          {matchHistory.length === 0 ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No detailed match history available.
            </div>
          ) : (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={matchHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--error)' }}
                  />
                  <Line type="monotone" dataKey="kills" stroke="var(--error)" strokeWidth={3} dot={{ r: 4, fill: 'var(--error)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Graph 2: Points Growth */}
        <Card style={{ border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            📈 Points Progression
          </h3>
          {matchHistory.length === 0 ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No detailed match history available.
            </div>
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
                  <RechartsTooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--neon)' }}
                  />
                  <Area type="monotone" dataKey="cumulative" stroke="var(--neon)" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Graph 3: Match Damage Distribution */}
        <Card style={{ border: '1px solid var(--border)', gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            💥 Match Damage Distribution
          </h3>
          {matchHistory.length === 0 ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No detailed match history available.
            </div>
          ) : (
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={matchHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    itemStyle={{ color: 'var(--warning)' }}
                  />
                  <Bar dataKey="damage" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
