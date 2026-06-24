import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../../utils/api';
import Card from '../../components/UI/Card';

export default function TeamDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teams/${id}/analytics`)
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

  if (!data || !data.team) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h2>Team not found.</h2>
        <Link to="/admin/teams" style={{ color: 'var(--neon)' }}>Back to Teams</Link>
      </div>
    );
  }

  const { team, players, matchHistory } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {team.logo_url ? (
          <img 
            src={team.logo_url} 
            alt={team.name} 
            style={{ width: '120px', height: '120px', objectFit: 'contain', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}
          />
        ) : (
          <div style={{ width: '120px', height: '120px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
            🛡️
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text)' }}>
              {team.name}
            </h1>
            <span style={{ background: 'var(--neon)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', fontWeight: 800 }}>
              {team.department_code}
            </span>
            <span style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
              {team.team_id}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', maxWidth: '600px' }}>
            {team.motto || 'No motto set.'}
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div className="glass-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--warning)' }}>#{team.current_rank || '-'}</div>
            </div>
            <div className="glass-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Points</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--neon)' }}>{team.total_points || 0}</div>
            </div>
            <div className="glass-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Matches</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{team.matches || 0}</div>
            </div>
            <div className="glass-dark" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Wins</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--info)' }}>{team.wins || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Analytics Graphs ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Graph 1: Points Growth */}
        <Card style={{ border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            📈 Points Growth Timeline
          </h3>
          {matchHistory.length === 0 ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No match data available.
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

        {/* Graph 2: Kills per Match */}
        <Card style={{ border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            ⚔️ Kills Per Match
          </h3>
          {matchHistory.length === 0 ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No match data available.
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
      </div>

      {/* ── Active Roster ──────────────────────────────────────────────── */}
      <Card style={{ border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, marginBottom: '16px', color: 'var(--text)', textTransform: 'uppercase' }}>
          👥 Active Roster
        </h3>
        
        {players.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No players in this team.</p>
        ) : (
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Role</th>
                  <th>UID</th>
                  <th style={{ textAlign: 'center' }}>Matches</th>
                  <th style={{ textAlign: 'center' }}>Kills</th>
                  <th style={{ textAlign: 'center' }}>MVPs</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/admin/players/${p.id}`} style={{ color: 'var(--neon)', textDecoration: 'none', fontWeight: 700 }} className="hover-underline">
                        {p.name}
                      </Link>
                    </td>
                    <td>
                      {p.name === team.captain_name ? (
                        <span style={{ color: 'var(--warning)', fontWeight: 800, fontSize: 'var(--text-xs)' }}>CAPTAIN</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>PLAYER</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {p.uid || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{p.matches_played || 0}</td>
                    <td style={{ textAlign: 'center', color: 'var(--error)', fontWeight: 700 }}>{p.kills || 0}</td>
                    <td style={{ textAlign: 'center' }}>{p.mvp_awards || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
