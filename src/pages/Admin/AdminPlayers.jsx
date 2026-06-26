import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'pending'

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
    photo: null,
    jersey: null,
    banner: null,
    total_damage: 0,
    headshot_percentage: 0,
    average_survival_time: 0,
    total_points: 0,
    booyahs: 0,
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

  // Change Credentials Modal
  const [credsPlayer, setCredsPlayer] = useState(null);
  const [credsForm, setCredsForm] = useState({ player_login_id: '', password: '' });

  // Status Modal
  const [statusPlayer, setStatusPlayer] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'active' });

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/players', {
        search: search || undefined,
        department_id: deptFilter || undefined,
        approval_status: activeTab === 'pending' ? 'pending' : 'approved',
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
  }, [search, deptFilter, activeTab]);

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
      photo: null,
      jersey: null,
      banner: null,
      total_damage: 0,
      headshot_percentage: 0,
      average_survival_time: 0,
      total_points: 0,
      booyahs: 0,
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
      photo: null,
      jersey: null,
      banner: null,
      total_damage: p.total_damage || 0,
      headshot_percentage: p.headshot_percentage || 0,
      average_survival_time: p.average_survival_time || 0,
      total_points: p.total_points || 0,
      booyahs: p.booyahs || 0,
    });
    setPlayerModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setPlayerForm(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setPlayerForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(playerForm).forEach(key => {
      if (playerForm[key] !== null && playerForm[key] !== undefined && playerForm[key] !== '') {
        formData.append(key, playerForm[key]);
      }
    });

    try {
      if (editPlayerId) {
        await api.put(`/players/${editPlayerId}`, formData);
      } else {
        await api.post('/players', formData);
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
        new_team_id: targetTeamId ? parseInt(targetTeamId) : null,
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

  const handleApproval = async (id, status) => {
    try {
      await api.patch(`/players/${id}/approval`, { approval_status: status });
      fetchPlayers();
    } catch (err) {
      alert(err.message || 'Failed to update approval status.');
    }
  };

  const handleCredsSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/players/${credsPlayer.id}/credentials`, credsForm);
      setCredsPlayer(null);
      fetchPlayers();
    } catch (err) {
      alert(err.message || 'Failed to update credentials.');
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/players/${statusPlayer.id}/status`, statusForm);
      setStatusPlayer(null);
      fetchPlayers();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
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

      <div style={{ display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)' }}>
        <button 
          onClick={() => setActiveTab('active')}
          style={{ background: 'none', border: 'none', color: activeTab === 'active' ? 'var(--neon)' : 'var(--text-secondary)', fontWeight: activeTab === 'active' ? 700 : 400, cursor: 'pointer', borderBottom: activeTab === 'active' ? '2px solid var(--neon)' : 'none', paddingBottom: '4px' }}
        >
          Active Players
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ background: 'none', border: 'none', color: activeTab === 'pending' ? 'var(--neon)' : 'var(--text-secondary)', fontWeight: activeTab === 'pending' ? 700 : 400, cursor: 'pointer', borderBottom: activeTab === 'pending' ? '2px solid var(--neon)' : 'none', paddingBottom: '4px' }}
        >
          Pending Registrations
        </button>
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
                    <div style={{ fontWeight: 700 }}>
                      <Link 
                        to={`/admin/players/${p.id}`} 
                        style={{ color: 'var(--neon)', textDecoration: 'none' }}
                        className="hover-underline"
                      >
                        {p.name}
                      </Link>
                    </div>
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
                    {activeTab === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button variant="outline" size="sm" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleApproval(p.id, 'approved')}>
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleApproval(p.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
                          Assign Team
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setCredsPlayer(p);
                          setCredsForm({ player_login_id: p.player_login_id || '', password: '' });
                        }}>
                          Credentials
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setStatusPlayer(p);
                          setStatusForm({ status: p.status || 'active' });
                        }}>
                          Ban/Suspend
                        </Button>
                        <Button variant="outline" size="sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleDeletePlayer(p.id)}>
                          Delete
                        </Button>
                      </div>
                    )}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Photo</label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="form-input"
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jersey</label>
                  <input
                    type="file"
                    name="jersey"
                    accept="image/*"
                    className="form-input"
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Banner</label>
                  <input
                    type="file"
                    name="banner"
                    accept="image/*"
                    className="form-input"
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Total Damage</label>
                  <input
                    type="number"
                    name="total_damage"
                    className="form-input"
                    min="0"
                    value={playerForm.total_damage}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Headshot Percentage</label>
                  <input
                    type="number"
                    name="headshot_percentage"
                    className="form-input"
                    min="0"
                    max="100"
                    step="0.1"
                    value={playerForm.headshot_percentage}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Avg Survival Time</label>
                  <input
                    type="number"
                    name="average_survival_time"
                    className="form-input"
                    min="0"
                    step="0.1"
                    value={playerForm.average_survival_time}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Points</label>
                  <input
                    type="number"
                    name="total_points"
                    className="form-input"
                    min="0"
                    value={playerForm.total_points}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Booyahs</label>
                  <input
                    type="number"
                    name="booyahs"
                    className="form-input"
                    min="0"
                    value={playerForm.booyahs}
                    onChange={handleFormChange}
                  />
                </div>
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

      {/* Change Credentials Modal */}
      {credsPlayer && (
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
              🔑 Change Credentials
            </h2>
            <form onSubmit={handleCredsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Player Login ID</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={credsForm.player_login_id}
                  onChange={(e) => setCredsForm(prev => ({ ...prev, player_login_id: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Leave blank to keep unchanged"
                  value={credsForm.password}
                  onChange={(e) => setCredsForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setCredsPlayer(null)}>Cancel</Button>
                <Button type="submit" variant="primary">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusPlayer && (
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
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--warning)', marginBottom: 'var(--space-4)' }}>
              ⚠️ Ban / Suspend Player
            </h2>
            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Player Status</label>
                <select
                  className="form-input"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setStatusPlayer(null)}>Cancel</Button>
                <Button type="submit" variant="primary">Save Status</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
