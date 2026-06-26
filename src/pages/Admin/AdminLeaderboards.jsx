import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';

export default function AdminLeaderboards() {
  const [activeTab, setActiveTab] = useState('teams');
  const [loading, setLoading] = useState(true);

  const [teamsLb, setTeamsLb] = useState([]);
  const [deptsLb, setDeptsLb] = useState([]);
  const [playersLb, setPlayersLb] = useState([]);
  
  const [teamsList, setTeamsList] = useState([]);
  const [deptsList, setDeptsList] = useState([]);

  // Modals state
  const [editTeamEntry, setEditTeamEntry] = useState(null);
  const [teamForm, setTeamForm] = useState({ matches: 0, wins: 0, total_kills: 0, total_points: 0, is_qualified: false });
  
  const [editDeptEntry, setEditDeptEntry] = useState(null);
  const [deptForm, setDeptForm] = useState({ wins: 0, teams_participated: 0, total_points: 0 });

  const [editPlayerEntry, setEditPlayerEntry] = useState(null);
  const [playerForm, setPlayerForm] = useState({ kills: 0, wins: 0, matches_played: 0, mvp_awards: 0, headshot_percentage: 0, booyahs: 0, total_points: 0, total_damage: 0 });

  const [addTeamId, setAddTeamId] = useState('');
  const [addDeptId, setAddDeptId] = useState('');

  // Player LB Add State
  const [addPlayerId, setAddPlayerId] = useState('');
  const [allPlayersList, setAllPlayersList] = useState([]);
  
  // Player Filters
  const [playerFilters, setPlayerFilters] = useState({
    tournament_id: '',
    department_id: '',
    season: '',
    search: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tLb, dLb, pLb, tList, dList, allPList] = await Promise.all([
        api.get('/leaderboards/teams'),
        api.get('/leaderboards/departments'),
        api.get('/leaderboards/players', playerFilters),
        api.get('/teams?limit=1000'),
        api.get('/departments'),
        api.get('/players')
      ]);
      setTeamsLb(tLb.leaderboard || []);
      setDeptsLb(dLb.leaderboard || []);
      setPlayersLb(pLb.leaderboard || []);
      setTeamsList(tList.teams || []);
      setDeptsList(dList || []);
      setAllPlayersList(allPList.players || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [playerFilters]);

  // Teams
  const handleEditTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leaderboards/teams/${editTeamEntry.id}`, teamForm);
      setEditTeamEntry(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update entry.');
    }
  };
  const handleAddTeam = async () => {
    if(!addTeamId) return;
    try {
      await api.post('/leaderboards/teams', { team_id: addTeamId });
      setAddTeamId('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add team.');
    }
  };
  const handleRemoveTeam = async (id) => {
    if(!window.confirm('Remove this team from the leaderboard?')) return;
    try {
      await api.delete(`/leaderboards/teams/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to remove team.');
    }
  };

  // Depts
  const handleEditDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leaderboards/departments/${editDeptEntry.id}`, deptForm);
      setEditDeptEntry(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update entry.');
    }
  };
  const handleAddDept = async () => {
    if(!addDeptId) return;
    try {
      await api.post('/leaderboards/departments', { department_id: addDeptId });
      setAddDeptId('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add department.');
    }
  };
  const handleRemoveDept = async (id) => {
    if(!window.confirm('Remove this department from the leaderboard?')) return;
    try {
      await api.delete(`/leaderboards/departments/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to remove department.');
    }
  };

  // Players
  const handleEditPlayerSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leaderboards/players/${editPlayerEntry.id}`, playerForm);
      setEditPlayerEntry(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update entry.');
    }
  };

  const handleAddPlayer = async () => {
    if (!addPlayerId) return;
    try {
      await api.post('/leaderboards/players', { 
        player_id: addPlayerId,
        tournament_id: playerFilters.tournament_id,
        department_id: playerFilters.department_id,
        season: playerFilters.season
      });
      setAddPlayerId('');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to add player.');
    }
  };

  const handleRemovePlayer = async (id) => {
    if(!window.confirm('Remove this player from the leaderboard?')) return;
    try {
      await api.delete(`/leaderboards/players/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to remove player.');
    }
  };

  const handleResetPlayerLeaderboard = async () => {
    if(!window.confirm('Are you sure you want to RESET the entire Player Leaderboard? This action cannot be undone.')) return;
    try {
      await api.post('/leaderboards/players/reset');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to reset leaderboard.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          📈 Leaderboard Controls
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Inspect scores and manually adjust leaderboard stats for teams, departments, and players.</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 'var(--space-2)' }}>
        {[
          { id: 'teams', label: 'Teams Standings' },
          { id: 'departments', label: 'Departments Standings' },
          { id: 'players', label: 'Player Leaderboard' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--neon)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--neon)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: 'var(--text-sm)',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {activeTab === 'teams' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="glass-dark" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <select className="form-input" value={addTeamId} onChange={e => setAddTeamId(e.target.value)} style={{ maxWidth: '300px' }}>
                  <option value="">Select Team to Add...</option>
                  {teamsList.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.team_id})</option>
                  ))}
                </select>
                <Button variant="primary" onClick={handleAddTeam}>Add Team to Leaderboard</Button>
              </div>

              <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Team Name</th>
                      <th>Department</th>
                      <th style={{ textAlign: 'center' }}>Matches</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'center' }}>Kills</th>
                      <th style={{ textAlign: 'center' }}>Points</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamsLb.map((entry, index) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>{index + 1}</td>
                        <td style={{ fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {entry.team_logo ? (
                              <img src={entry.team_logo} alt={entry.team_name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)', border: '1px solid var(--border)' }}>🛡️</div>
                            )}
                            <div>
                              <div>{entry.team_name}</div>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{entry.team_code}</span>
                            </div>
                          </div>
                        </td>
                        <td>{entry.department_code}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.matches || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.total_kills || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon)', fontWeight: 700 }}>{entry.total_points || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditTeamEntry(entry);
                              setTeamForm({ matches: entry.matches, wins: entry.wins, total_kills: entry.total_kills, total_points: entry.total_points, is_qualified: !!entry.is_qualified });
                            }}>Edit Stats</Button>
                            <Button variant="outline" size="sm" onClick={() => handleRemoveTeam(entry.id)} style={{ color: 'var(--error)' }}>Remove</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="glass-dark" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <select className="form-input" value={addDeptId} onChange={e => setAddDeptId(e.target.value)} style={{ maxWidth: '300px' }}>
                  <option value="">Select Department to Add...</option>
                  {deptsList.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
                <Button variant="primary" onClick={handleAddDept}>Add Dept to Leaderboard</Button>
              </div>
              <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                      <th>Department Name</th>
                      <th style={{ textAlign: 'center' }}>Teams Participated</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'center' }}>Total Points</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptsLb.map((entry, index) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>{index + 1}</td>
                        <td style={{ fontWeight: 700 }}>{entry.department_name} ({entry.department_code})</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.teams_participated || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon)', fontWeight: 700 }}>{entry.total_points || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditDeptEntry(entry);
                              setDeptForm({ wins: entry.wins, teams_participated: entry.teams_participated, total_points: entry.total_points });
                            }}>Edit Stats</Button>
                            <Button variant="outline" size="sm" onClick={() => handleRemoveDept(entry.id)} style={{ color: 'var(--error)' }}>Remove</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'players' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Filters */}
              <div className="glass-dark" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label>Tournament ID</label>
                  <input type="text" className="form-input" value={playerFilters.tournament_id} onChange={(e) => setPlayerFilters(prev => ({...prev, tournament_id: e.target.value}))} placeholder="All Tournaments" />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select className="form-input" value={playerFilters.department_id} onChange={(e) => setPlayerFilters(prev => ({...prev, department_id: e.target.value}))}>
                    <option value="">All Departments</option>
                    {deptsList.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Season</label>
                  <input type="text" className="form-input" value={playerFilters.season} onChange={(e) => setPlayerFilters(prev => ({...prev, season: e.target.value}))} placeholder="e.g. 2026 Winter" />
                </div>
                <div className="form-group">
                  <label>Search Player</label>
                  <input type="text" className="form-input" value={playerFilters.search} onChange={(e) => setPlayerFilters(prev => ({...prev, search: e.target.value}))} placeholder="Name..." />
                </div>
              </div>

              {/* Add & Reset */}
              <div className="glass-dark" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flex: 1, maxWidth: '500px' }}>
                  <select className="form-input" value={addPlayerId} onChange={e => setAddPlayerId(e.target.value)}>
                    <option value="">Select Player to Add...</option>
                    {allPlayersList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.ign})</option>
                    ))}
                  </select>
                  <Button variant="primary" onClick={handleAddPlayer}>Add to Leaderboard</Button>
                </div>
                <Button variant="outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={handleResetPlayerLeaderboard}>
                  Reset Entire Leaderboard
                </Button>
              </div>

              <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                      <th>Player Info</th>
                      <th>Team & Dept</th>
                      <th>Tournament / Season</th>
                      <th style={{ textAlign: 'center' }}>Kills</th>
                      <th style={{ textAlign: 'center' }}>Wins</th>
                      <th style={{ textAlign: 'center' }}>Matches</th>
                      <th style={{ textAlign: 'center' }}>Points</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playersLb.map((entry, index) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>{index + 1}</td>
                        <td style={{ fontWeight: 700 }}>
                          <div>{entry.name}</div>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{entry.role || 'Player'}</span>
                        </td>
                        <td>
                          <div>{entry.team_name || 'Free Agent'}</div>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{entry.department_code || '-'}</span>
                        </td>
                        <td>
                          <div>{entry.tournament_name || 'Overall'}</div>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{entry.season || 'All-Time'}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.total_kills || entry.kills || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.matches || entry.matches_played || 0}</td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon)', fontWeight: 700 }}>{entry.total_points || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditPlayerEntry(entry);
                              setPlayerForm({
                                total_kills: entry.total_kills || entry.kills || 0, 
                                wins: entry.wins || 0, 
                                matches: entry.matches || entry.matches_played || 0,
                                total_points: entry.total_points || 0
                              });
                            }}>Edit</Button>
                            <Button variant="outline" size="sm" onClick={() => handleRemovePlayer(entry.id)} style={{ color: 'var(--error)' }}>Remove</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {editTeamEntry && (
        <ModalWrapper title={`⚙️ Edit ${editTeamEntry.team_name}`} onClose={() => setEditTeamEntry(null)}>
          <form onSubmit={handleEditTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {['matches', 'wins', 'total_kills', 'total_points'].map(field => (
              <div className="form-group" key={field}>
                <label className="form-label" style={{ textTransform: 'capitalize' }}>{field.replace('_', ' ')}</label>
                <input type="number" className="form-input" value={teamForm[field]} onChange={(e) => setTeamForm(prev => ({ ...prev, [field]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input type="checkbox" id="is_qualified" checked={teamForm.is_qualified} onChange={(e) => setTeamForm(prev => ({ ...prev, is_qualified: e.target.checked }))} />
              <label htmlFor="is_qualified" className="form-label" style={{ marginBottom: 0 }}>Is Qualified</label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="outline" onClick={() => setEditTeamEntry(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Apply</Button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {editDeptEntry && (
        <ModalWrapper title={`⚙️ Edit ${editDeptEntry.department_name}`} onClose={() => setEditDeptEntry(null)}>
          <form onSubmit={handleEditDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {['wins', 'teams_participated', 'total_points'].map(field => (
              <div className="form-group" key={field}>
                <label className="form-label" style={{ textTransform: 'capitalize' }}>{field.replace('_', ' ')}</label>
                <input type="number" className="form-input" value={deptForm[field]} onChange={(e) => setDeptForm(prev => ({ ...prev, [field]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="outline" onClick={() => setEditDeptEntry(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Apply</Button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {editPlayerEntry && (
        <ModalWrapper title={`⚙️ Edit ${editPlayerEntry.name}`} onClose={() => setEditPlayerEntry(null)}>
          <form onSubmit={handleEditPlayerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
            {['total_kills', 'wins', 'matches', 'total_points'].map(field => (
              <div className="form-group" key={field}>
                <label className="form-label" style={{ textTransform: 'capitalize' }}>{field.replace('_', ' ')}</label>
                <input type="number" step="1" className="form-input" value={playerForm[field]} onChange={(e) => setPlayerForm(prev => ({ ...prev, [field]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="outline" onClick={() => setEditPlayerEntry(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Apply</Button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
}

function ModalWrapper({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)' }}>
      <div className="glass-dark" style={{ width: '100%', maxWidth: '450px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
