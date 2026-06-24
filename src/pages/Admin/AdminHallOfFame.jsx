import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminHallOfFame() {
  const [entries, setEntries] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    game: 'FreeFire',
    reason: '',
    type: 'team',
    team_id: '',
    player_id: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hoFRes, teamsRes, playersRes] = await Promise.all([
        api.get('/hall-of-fame'),
        api.get('/teams'),
        api.get('/players', { limit: 1000 }),
      ]);
      setEntries(hoFRes.entries || hoFRes || []);
      setTeams(teamsRes.teams || teamsRes || []);
      setPlayers(playersRes.players || playersRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({
      game: 'FreeFire',
      reason: '',
      type: 'team',
      team_id: teams[0]?.id?.toString() || '',
      player_id: players[0]?.id?.toString() || '',
    });
    setModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditId(entry.id);
    setFormData({
      game: entry.game || 'FreeFire',
      reason: entry.reason || '',
      type: entry.type || 'team',
      team_id: entry.team_id?.toString() || (teams[0]?.id?.toString() || ''),
      player_id: entry.player_id?.toString() || (players[0]?.id?.toString() || ''),
    });
    setModalOpen(true);
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      game: formData.game,
      reason: formData.reason,
      type: formData.type,
      team_id: formData.type === 'team' ? Number(formData.team_id) : null,
      player_id: formData.type === 'player' ? Number(formData.player_id) : null,
    };

    try {
      if (editId) {
        await api.put(`/hall-of-fame/${editId}`, payload);
      } else {
        await api.post('/hall-of-fame', payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Hall of Fame entry?')) return;
    try {
      await api.delete(`/hall-of-fame/${id}`);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            🏛️ Hall of Fame Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage hostel esports legendary inductees (teams and individual players).</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Induct Member
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : entries.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No Hall of Fame inductees registered yet.
        </Card>
      ) : (
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Inductee</th>
                <th>Type</th>
                <th>Game</th>
                <th>Achievement / Reason</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td>
                    {entry.type === 'team' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {entry.team_logo ? (
                          <img
                            src={entry.team_logo}
                            alt={entry.team_name}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)' }}>
                            🛡️
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700 }}>{entry.team_name}</div>
                          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                            Dept: {entry.team_dept_code || '—'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 700 }}>👤 {entry.player_name}</div>
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                          IGN: {entry.player_uid || '—'} • Dept: {entry.player_dept_code || '—'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ textTransform: 'uppercase', fontSize: 'var(--text-xs)', fontWeight: 700, color: entry.type === 'team' ? 'var(--neon)' : 'var(--info)' }}>
                    {entry.type}
                  </td>
                  <td style={{ fontWeight: 600 }}>{entry.game}</td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    {entry.reason}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(entry)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleDelete(entry.id)}>
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

      {/* Form Modal */}
      {modalOpen && (
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
              {editId ? '🏛️ Edit Hall of Fame Entry' : '🏛️ Induct into Hall of Fame'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Game</label>
                <select
                  className="form-input"
                  name="game"
                  value={formData.game}
                  onChange={handleTextChange}
                  required
                >
                  <option value="FreeFire">Free Fire</option>
                  <option value="Bgmi">BGMI</option>
                  <option value="Cod">Call of Duty</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="type"
                      value="team"
                      checked={formData.type === 'team'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'team' }))}
                    />
                    Team
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="type"
                      value="player"
                      checked={formData.type === 'player'}
                      onChange={() => setFormData(prev => ({ ...prev, type: 'player' }))}
                    />
                    Player
                  </label>
                </div>
              </div>

              {formData.type === 'team' ? (
                <div className="form-group">
                  <label className="form-label">Select Team</label>
                  <select
                    className="form-input"
                    name="team_id"
                    value={formData.team_id}
                    onChange={handleTextChange}
                    required
                  >
                    <option value="" disabled>-- Choose Team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.department_code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Select Player</label>
                  <select
                    className="form-input"
                    name="player_id"
                    value={formData.player_id}
                    onChange={handleTextChange}
                    required
                  >
                    <option value="" disabled>-- Choose Player --</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (IGN: {p.uid || '—'} • Dept: {p.department_code || '—'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Achievement / Reason</label>
                <textarea
                  className="form-input"
                  name="reason"
                  rows="3"
                  value={formData.reason}
                  onChange={handleTextChange}
                  placeholder="e.g. Free Fire Season 1 Champions, Most Valuable Player..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editId ? 'Save Changes' : 'Induct Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
