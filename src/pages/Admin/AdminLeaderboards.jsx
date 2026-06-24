import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminLeaderboards() {
  const [activeTab, setActiveTab] = useState('teams');
  const [teamsLb, setTeamsLb] = useState([]);
  const [deptsLb, setDeptsLb] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Team Entry Modal
  const [editTeamEntry, setEditTeamEntry] = useState(null);
  const [teamForm, setTeamForm] = useState({
    matches: 0,
    wins: 0,
    total_kills: 0,
    total_points: 0,
  });

  // Edit Dept Entry Modal
  const [editDeptEntry, setEditDeptEntry] = useState(null);
  const [deptForm, setDeptForm] = useState({
    wins: 0,
    teams_participated: 0,
    total_points: 0,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'teams') {
        const data = await api.get('/leaderboards/teams');
        setTeamsLb(data.leaderboard || data || []);
      } else {
        const data = await api.get('/leaderboards/departments');
        setDeptsLb(data.leaderboard || data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleEditTeamClick = (entry) => {
    setEditTeamEntry(entry);
    setTeamForm({
      matches: entry.matches || 0,
      wins: entry.wins || 0,
      total_kills: entry.total_kills || 0,
      total_points: entry.total_points || 0,
    });
  };

  const handleEditTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leaderboards/teams/${editTeamEntry.id}`, {
        matches: parseInt(teamForm.matches),
        wins: parseInt(teamForm.wins),
        total_kills: parseInt(teamForm.total_kills),
        total_points: parseInt(teamForm.total_points),
      });
      setEditTeamEntry(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update entry.');
    }
  };

  const handleEditDeptClick = (entry) => {
    setEditDeptEntry(entry);
    setDeptForm({
      wins: entry.wins || 0,
      teams_participated: entry.teams_participated || 0,
      total_points: entry.total_points || 0,
    });
  };

  const handleEditDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leaderboards/departments/${editDeptEntry.id}`, {
        wins: parseInt(deptForm.wins),
        teams_participated: parseInt(deptForm.teams_participated),
        total_points: parseInt(deptForm.total_points),
      });
      setEditDeptEntry(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update entry.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          📈 Leaderboard Controls
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Inspect scores and manually adjust leaderboard stats for teams and departments.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 'var(--space-2)' }}>
        {[
          { id: 'teams', label: 'Teams Standings' },
          { id: 'departments', label: 'Departments Standings' },
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
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            {activeTab === 'teams' ? (
              <>
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
                      <td>{entry.department_code}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.matches || 0}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.wins || 0}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{entry.total_kills || 0}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon)', fontWeight: 700 }}>{entry.total_points || 0}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Button variant="outline" size="sm" onClick={() => handleEditTeamClick(entry)}>
                          Override
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                    <th>Department</th>
                    <th style={{ textAlign: 'center' }}>Teams</th>
                    <th style={{ textAlign: 'center' }}>Wins</th>
                    <th style={{ textAlign: 'center' }}>Points</th>
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
                        <Button variant="outline" size="sm" onClick={() => handleEditDeptClick(entry)}>
                          Override
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      )}

      {/* Edit Team Entry Modal */}
      {editTeamEntry && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal)',
          padding: 'var(--space-4)',
        }}>
          <div className="glass-dark" style={{
            width: '100%',
            maxWidth: '450px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
          }}>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
              ⚙️ Override {editTeamEntry.team_name} Stats
            </h2>

            <form onSubmit={handleEditTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Matches</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={teamForm.matches}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, matches: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wins</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={teamForm.wins}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, wins: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Kills</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={teamForm.total_kills}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, total_kills: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Points</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={teamForm.total_points}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, total_points: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setEditTeamEntry(null)}>Cancel</Button>
                <Button type="submit" variant="primary">Apply Override</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Dept Entry Modal */}
      {editDeptEntry && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal)',
          padding: 'var(--space-4)',
        }}>
          <div className="glass-dark" style={{
            width: '100%',
            maxWidth: '450px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
          }}>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
              ⚙️ Override {editDeptEntry.department_name} Stats
            </h2>

            <form onSubmit={handleEditDeptSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Teams Participated</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={deptForm.teams_participated}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, teams_participated: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Wins</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={deptForm.wins}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, wins: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Points</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={deptForm.total_points}
                  onChange={(e) => setDeptForm(prev => ({ ...prev, total_points: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setEditDeptEntry(null)}>Cancel</Button>
                <Button type="submit" variant="primary">Apply Override</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
