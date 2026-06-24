import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatNumber } from '../utils/helpers';
import Card from '../components/UI/Card';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('teams');
  const [teamsLb, setTeamsLb] = useState([]);
  const [deptsLb, setDeptsLb] = useState([]);
  const [championshipLb, setChampionshipLb] = useState([]);
  const [clashSquadLb, setClashSquadLb] = useState([]);
  const [loading, setLoading] = useState(true);

  // Season History States
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [historyStandings, setHistoryStandings] = useState([]);
  const [historyChampionship, setHistoryChampionship] = useState(null);

  const fetchSeasons = async () => {
    try {
      const data = await api.get('/leaderboards/history');
      const list = data.seasons || [];
      setSeasons(list);
      if (list.length > 0 && !selectedSeason) {
        setSelectedSeason(list[0]);
      }
    } catch (err) {
      console.error('Fetch seasons error:', err);
    }
  };

  const fetchHistoryStandings = async (seasonName) => {
    if (!seasonName) return;
    try {
      setLoading(true);
      const data = await api.get(`/leaderboards/history/${encodeURIComponent(seasonName)}`);
      setHistoryStandings(data.standings || []);
      setHistoryChampionship(data.championship || null);
    } catch (err) {
      console.error('Fetch history standings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'teams') {
        const data = await api.get('/leaderboards/teams');
        setTeamsLb(data.leaderboard || data || []);
      } else if (activeTab === 'departments') {
        const data = await api.get('/leaderboards/departments');
        setDeptsLb(data.leaderboard || data || []);
      } else if (activeTab === 'championship') {
        const data = await api.get('/leaderboards/championship');
        setChampionshipLb(data.standings || data || []);
      } else if (activeTab === 'clash-squad') {
        const data = await api.get('/leaderboards/clash-squad');
        setClashSquadLb(data.standings || data || []);
      } else if (activeTab === 'history') {
        await fetchSeasons();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for SSE real-time update event
    const handleUpdate = () => {
      fetchData();
    };
    window.addEventListener('leaderboard-update', handleUpdate);
    return () => window.removeEventListener('leaderboard-update', handleUpdate);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'history' && selectedSeason) {
      fetchHistoryStandings(selectedSeason);
    }
  }, [selectedSeason, activeTab]);

  const renderRankChange = (change) => {
    if (change > 0) return <span style={{ color: 'var(--success)' }}>▲ {change}</span>;
    if (change < 0) return <span style={{ color: 'var(--error)' }}>▼ {Math.abs(change)}</span>;
    return <span style={{ color: 'var(--text-muted)' }}>▬</span>;
  };

  const renderPointsChange = (change) => {
    if (change > 0) return <span style={{ color: 'var(--success)', fontSize: 'var(--text-xs)' }}>+{change}</span>;
    if (change < 0) return <span style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>{change}</span>;
    return null;
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="accent-line" />
        <h1>Leaderboard</h1>
        <p>Real-time team standings and department rankings of Bhima Hostel.</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 'var(--space-8)',
        gap: 'var(--space-2)',
      }}>
        {[
          { id: 'teams', label: 'Team Leaderboard' },
          { id: 'departments', label: 'Department Leaderboard' },
          { id: 'championship', label: 'Championship Standings' },
          { id: 'clash-squad', label: 'Clash Squad Leaderboard' },
          { id: 'history', label: 'Season History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--neon)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--neon)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: 'var(--text-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <div>
          {/* TOP 3 HIGHLIGHT CARDS (For Teams & Departments) */}
          {activeTab === 'teams' && teamsLb.length >= 3 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-10)',
              alignItems: 'end',
            }}>
              {/* 2nd Place */}
              <Card style={{ border: '1px solid var(--border)', textAlign: 'center', order: window.innerWidth > 768 ? 1 : 2 }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🥈</div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>2nd Place</h4>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text)', margin: 'var(--space-1) 0' }}>
                  {teamsLb[1].team_name}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                  {teamsLb[1].total_points} PTS
                </span>
              </Card>

              {/* 1st Place */}
              <Card style={{ border: '2px solid var(--neon)', textAlign: 'center', order: window.innerWidth > 768 ? 2 : 1, padding: 'var(--space-8) var(--space-6)', background: 'rgba(215,255,0,0.02)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)', animation: 'pulse 1.5s infinite' }}>👑</div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--neon)', fontWeight: 700 }}>1st Place</h4>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 900, color: 'var(--text)', margin: 'var(--space-1) 0' }}>
                  {teamsLb[0].team_name}
                </h3>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  {teamsLb[0].total_points} PTS
                </span>
              </Card>

              {/* 3rd Place */}
              <Card style={{ border: '1px solid var(--border)', textAlign: 'center', order: 3 }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🥉</div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>3rd Place</h4>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text)', margin: 'var(--space-1) 0' }}>
                  {teamsLb[2].team_name}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                  {teamsLb[2].total_points} PTS
                </span>
              </Card>
            </div>
          )}

          {/* Clash Squad Top 3 */}
          {activeTab === 'clash-squad' && clashSquadLb.length >= 3 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-6)',
              marginBottom: 'var(--space-10)',
              alignItems: 'end',
            }}>
              {/* 2nd Place */}
              <Card style={{ border: '1px solid var(--border)', textAlign: 'center', order: window.innerWidth > 768 ? 1 : 2 }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🥈</div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>2nd Place</h4>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text)', margin: 'var(--space-1) 0' }}>
                  {clashSquadLb[1].team_name}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                  {clashSquadLb[1].wins} WINS
                </span>
              </Card>

              {/* 1st Place */}
              <Card style={{ border: '2px solid var(--neon)', textAlign: 'center', order: window.innerWidth > 768 ? 2 : 1, padding: 'var(--space-8) var(--space-6)', background: 'rgba(215,255,0,0.02)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)', animation: 'pulse 1.5s infinite' }}>👑</div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--neon)', fontWeight: 700 }}>1st Place</h4>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 900, color: 'var(--text)', margin: 'var(--space-1) 0' }}>
                  {clashSquadLb[0].team_name}
                </h3>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  {clashSquadLb[0].wins} WINS
                </span>
              </Card>

              {/* 3rd Place */}
              <Card style={{ border: '1px solid var(--border)', textAlign: 'center', order: 3 }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🥉</div>
                <h4 style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>3rd Place</h4>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text)', margin: 'var(--space-1) 0' }}>
                  {clashSquadLb[2].team_name}
                </h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                  {clashSquadLb[2].wins} WINS
                </span>
              </Card>
            </div>
          )}

          {/* TABLE DISPLAY */}
          {activeTab === 'history' && (
            <div className="glass-dark animate-in" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              marginBottom: 'var(--space-6)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Archived Season
                </span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {seasons.length === 0 ? (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                      No seasons archived yet.
                    </span>
                  ) : (
                    <select
                      className="form-input"
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      style={{ width: '250px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontWeight: 700 }}
                    >
                      {seasons.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {historyChampionship && (
                <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
                  <div style={{ borderLeft: '2px solid var(--neon)', paddingLeft: 'var(--space-3)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🏆 Champion</div>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
                      {historyChampionship.champion_team_name} ({historyChampionship.champion_dept_code})
                    </strong>
                  </div>
                  <div style={{ borderLeft: '2px solid var(--text-secondary)', paddingLeft: 'var(--space-3)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🥈 Runner-Up</div>
                    <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {historyChampionship.runner_up_name}
                    </strong>
                  </div>
                  <div style={{ borderLeft: '2px solid #FF6B35', paddingLeft: 'var(--space-3)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>🎖️ Season MVP</div>
                    <strong style={{ fontSize: 'var(--text-sm)', color: '#FF6B35' }}>
                      {historyChampionship.mvp_player_name} ({historyChampionship.mvp_player_kills} Kills)
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <table className="table" style={{ margin: 0 }}>
              {activeTab === 'teams' && (
                <>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Change</th>
                      <th>Team</th>
                      <th>Dept</th>
                      <th style={{ textAlign: 'center' }}>Matches</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'center' }}>Kills</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamsLb.map((entry, index) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {index + 1 <= 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                          {renderRankChange(entry.rank_change)}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {entry.team_logo ? (
                              <img
                                src={entry.team_logo}
                                alt={entry.team_name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                              />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', border: '1px solid var(--border)' }}>
                                🛡️
                              </div>
                            )}
                            <div>
                              <div>{entry.team_name}</div>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                {entry.team_code}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255,255,255,0.05)',
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                          }}>
                            {entry.department_code}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.matches_played || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.kills || 0}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ marginRight: '8px' }}>{entry.total_points}</span>
                          {renderPointsChange(entry.points_change)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'departments' && (
                <>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Change</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'center' }}>Teams</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptsLb.map((entry, index) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {index + 1 <= 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                          {renderRankChange(entry.rank_change)}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {entry.department_name} ({entry.department_code})
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.teams_participated || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                          <span style={{ marginRight: '8px' }}>{entry.total_points}</span>
                          {renderPointsChange(entry.points_change)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'championship' && (
                <>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Team</th>
                      <th>Dept</th>
                      <th style={{ textAlign: 'center' }}>Matches</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'center' }}>Kills</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {championshipLb.map((entry) => (
                      <tr key={entry.team_id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          {entry.championship_rank <= 3 ? ['🥇', '🥈', '🥉'][entry.championship_rank - 1] : entry.championship_rank}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {entry.team_logo ? (
                              <img
                                src={entry.team_logo}
                                alt={entry.team_name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                              />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', border: '1px solid var(--border)' }}>
                                🛡️
                              </div>
                            )}
                            <div>
                              <div>{entry.team_name}</div>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                {entry.team_code}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255,255,255,0.05)',
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 700,
                          }}>
                            {entry.department_code}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.matches_played || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.total_kills || 0}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                          {entry.total_points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
              {activeTab === 'clash-squad' && (
                <>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Team</th>
                      <th>Dept</th>
                      <th style={{ textAlign: 'center' }}>Matches</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'center' }}>Kills</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clashSquadLb.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                          🎮 No Clash Squad matches have been recorded yet.
                        </td>
                      </tr>
                    ) : (
                      clashSquadLb.map((entry, index) => (
                        <tr key={entry.team_id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>
                            {index + 1 <= 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {entry.team_logo ? (
                                <img
                                  src={entry.team_logo}
                                  alt={entry.team_name}
                                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                                />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', border: '1px solid var(--border)' }}>
                                  🛡️
                                </div>
                              )}
                              <div>
                                <div>{entry.team_name}</div>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                  {entry.team_code}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.05)',
                              fontFamily: 'var(--font-heading)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 700,
                            }}>
                              {entry.department_code}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.matches_played || 0}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.total_kills || 0}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                            {entry.total_points || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
              {activeTab === 'history' && (
                <>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Team</th>
                      <th>Dept</th>
                      <th style={{ textAlign: 'center' }}>Matches</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'center' }}>Kills</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyStandings.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                          No standings found for this season.
                        </td>
                      </tr>
                    ) : (
                      historyStandings.map((entry) => (
                        <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>
                            {entry.final_rank <= 3 ? ['🥇', '🥈', '🥉'][entry.final_rank - 1] : entry.final_rank}
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            <div>{entry.team_name}</div>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                              {entry.team_code}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255,255,255,0.05)',
                              fontFamily: 'var(--font-heading)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: 700,
                            }}>
                              {entry.department_code}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.matches_played || 0}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.total_kills || 0}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                            {entry.total_points || 0}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
