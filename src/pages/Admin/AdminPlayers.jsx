import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

const DEPARTMENTS = [
  { id: 1, name: 'AIML', code: 'AIML' },
  { id: 2, name: 'BME', code: 'BME' },
  { id: 3, name: 'CSE', code: 'CSE' },
  { id: 4, name: 'CIVIL', code: 'CIVIL' },
  { id: 5, name: 'ECE', code: 'ECE' },
  { id: 6, name: 'EEE', code: 'EEE' },
  { id: 7, name: 'MECH', code: 'MECH' },
  { id: 8, name: 'MIN', code: 'MIN' },
];

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Add / Edit Modal State
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState(null);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    department_id: '',
    team_id: '',
    uid: '',
    year: '1',
    roll_number: '',
  });

  // Transfer Modal
  const [transferPlayer, setTransferPlayer] = useState(null);
  const [targetTeamId, setTargetTeamId] = useState('');

  // Edit Stats Modal
  const [editPlayerStats, setEditPlayerStats] = useState(null);
  const [statsData, setStatsData] = useState({
    kills: 0,
    wins: 0,
    matches_played: 0,
    mvp_awards: 0,
  });

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/players', {
        search: search || undefined,
        department_id: deptFilter || undefined,
      });
      setPlayers(data.players || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await api.get('/teams', { limit: 100 });
      setTeams(data.teams || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [search, deptFilter]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const openCreateModal = () => {
    setEditPlayerId(null);
    setPlayerForm({
      name: '',
      department_id: '',
      team_id: '',
      uid: '',
      year: '1',
      roll_number: '',
    });
    setPlayerModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditPlayerId(p.id);
    setPlayerForm({
      name: p.name || '',
      department_id: (p.department_id || '').toString(),
      team_id: (p.team_id || '').toString(),
      uid: p.uid || '',
      year: (p.year || 1).toString(),
      roll_number: p.roll_number || '',
    });
    setPlayerModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPlayerForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: playerForm.name,
      department_id: parseInt(playerForm.department_id),
      team_id: playerForm.team_id ? parseInt(playerForm.team_id) : null,
      uid: playerForm.uid || null,
      year: parseInt(playerForm.year),
      roll_number: playerForm.roll_number || null,
    };

    try {
      if (editPlayerId) {
        await api.put(`/players/${editPlayerId}`, payload);
      } else {
        await api.post('/players', payload);
      }
      setPlayerModalOpen(false);
      fetchPlayers();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleEditStatsClick = (p) => {
    setEditPlayerStats(p);
    setStatsData({
      kills: p.kills || 0,
      wins: p.wins || 0,
      matches_played: p.matches_played || 0,
      mvp_awards: p.mvp_awards || 0,
    });
  };

  const handleEditStatsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/players/${editPlayerStats.id}`, {
        ...editPlayerStats,
        kills: parseInt(statsData.kills),
        wins: parseInt(statsData.wins),
        matches_played: parseInt(statsData.matches_played),
        mvp_awards: parseInt(statsData.mvp_awards),
      });
      setEditPlayerStats(null);
      fetchPlayers();
    } catch (err) {
      alert(err.message || 'Failed to update stats.');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/players/${transferPlayer.id}/transfer`, {
        team_id: targetTeamId ? parseInt(targetTeamId) : null,
      });
      setTransferPlayer(null);
      setTargetTeamId('');
      fetchPlayers();
    } catch (err) {
      alert(err.message || 'Transfer failed.');
    }
  };

  const handleDeletePlayer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      await api.delete(`/players/${id}`);
      fetchPlayers();
    } catch (err) {
      alert(err.message || 'Failed to delete player.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            🎮 Player Profiles
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track player performance, manual score editing, and department squad transfers.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Add Player
        </Button>
      </div>

      {/* Controls */}
      <div className="glass-dark" style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <select
            className="form-input"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search players (Name, Roll, IGN)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : players.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No players found.
        </Card>
      ) : (
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Player Details</th>
                <th>Team</th>
                <th>Dept</th>
                <th style={{ textAlign: 'center' }}>Matches</th>
                <th style={{ textAlign: 'center' }}>Wins</th>
                <th style={{ textAlign: 'center' }}>Kills</th>
                <th style={{ textAlign: 'center' }}>MVPs</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      UID: {p.uid || '—'} • Roll: {p.roll_number || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>
                    {p.team_name ? (
                      <div>
                        {p.team_name}
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{p.team_code}</div>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>Free Agent</span>}
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{p.department_code}</span>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.matches_played || 0}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.wins || 0}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--neon)', fontWeight: 700 }}>{p.kills || 0}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--gold)', fontWeight: 700 }}>{p.mvp_awards || 0}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditStatsClick(p)}>
                        Stats
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setTransferPlayer(p);
                        setTargetTeamId(p.team_id ? p.team_id.toString() : '');
                      }}>
                        Transfer
                      </Button>
                      <Button variant="outline" size="sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleDeletePlayer(p.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Player Modal */}
      {playerModalOpen && (
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
            maxWidth: '500px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
          }}>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
              {editPlayerId ? '🎮 Edit Player Profile' : '🎮 Add Player Profile'}
            </h2>

            <form onSubmit={handlePlayerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Player Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  required
                  placeholder="Enter full name"
                  value={playerForm.name}
                  onChange={handleFormChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    name="department_id"
                    className="form-input"
                    required
                    value={playerForm.department_id}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Dept...</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    name="year"
                    className="form-input"
                    value={playerForm.year}
                    onChange={handleFormChange}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    name="roll_number"
                    className="form-input"
                    placeholder="Roll No"
                    value={playerForm.roll_number}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">In-Game Character UID</label>
                  <input
                    type="text"
                    name="uid"
                    className="form-input"
                    placeholder="UID"
                    value={playerForm.uid}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Squad / Team</label>
                <select
                  name="team_id"
                  className="form-input"
                  value={playerForm.team_id}
                  onChange={handleFormChange}
                >
                  <option value="">No Team (Free Agent)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.department_code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setPlayerModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  {editPlayerId ? 'Save Changes' : 'Create Player'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stats Modal */}
      {editPlayerStats && (
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
              ⚔️ Edit {editPlayerStats.name} Stats
            </h2>

            <form onSubmit={handleEditStatsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Matches Played</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={statsData.matches_played}
                  onChange={(e) => setStatsData(prev => ({ ...prev, matches_played: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kills</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={statsData.kills}
                  onChange={(e) => setStatsData(prev => ({ ...prev, kills: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Wins</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={statsData.wins}
                  onChange={(e) => setStatsData(prev => ({ ...prev, wins: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">MVP Awards</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={statsData.mvp_awards}
                  onChange={(e) => setStatsData(prev => ({ ...prev, mvp_awards: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setEditPlayerStats(null)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferPlayer && (
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
              📡 Transfer Player
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
              Transfer <strong>{transferPlayer.name}</strong> to a different department squad. Target department of target team must match the team.
            </p>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Select Team</label>
                <select
                  className="form-input"
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                >
                  <option value="">No Team (Free Agent)</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.department_code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setTransferPlayer(null)}>Cancel</Button>
                <Button type="submit" variant="primary">Confirm Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
