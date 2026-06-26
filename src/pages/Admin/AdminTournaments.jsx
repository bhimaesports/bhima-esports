import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    registration_deadline: '',
    team_slots: '16',
    status: 'draft',
    rules: '',
    prize_details: '',
    prize_pool: '',
    maps: '',
    match_format: '',
    mode: 'br',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await api.get('/tournaments');
      setTournaments(data.tournaments || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({
      name: '',
      date: '',
      time: '',
      registration_deadline: '',
      team_slots: '16',
      status: 'draft',
      rules: '',
      prize_details: '',
      prize_pool: '',
      maps: '',
      match_format: '',
      mode: 'br',
    });
    setSelectedFile(null);
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditId(t.id);
    setFormData({
      name: t.name || '',
      date: t.date || '',
      time: t.time || '',
      registration_deadline: t.registration_deadline || '',
      team_slots: (t.team_slots || 16).toString(),
      status: t.status || 'draft',
      rules: t.rules || '',
      prize_details: t.prize_details || '',
      prize_pool: t.prize_pool || '',
      maps: t.maps || '',
      match_format: t.match_format || '',
      mode: t.mode || 'br',
    });
    setSelectedFile(null);
    setModalOpen(true);
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      data.append(key, val);
    });
    if (selectedFile) {
      data.append('poster', selectedFile);
    }

    try {
      if (editId) {
        await api.put(`/tournaments/${editId}`, data);
      } else {
        await api.post('/tournaments', data);
      }
      setModalOpen(false);
      fetchTournaments();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/tournaments/${id}/status`, { status });
      fetchTournaments();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Deleting a tournament deletes all its match results, registrations and data permanently. Continue?')) return;
    try {
      await api.delete(`/tournaments/${id}`);
      fetchTournaments();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            🏆 Tournament Center
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Organize, edit, delete, and configure signup lifecycle for events.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Create Tournament
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : tournaments.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No tournaments created yet.
        </Card>
      ) : (
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Tournament Details</th>
                <th>Schedule</th>
                <th>Slots Filled</th>
                <th>Registration Deadline</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <img
                        src={t.poster_url || '/assets/logo.png'}
                        alt={t.name}
                        style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
                      />
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>
                    <div>📅 {formatDate(t.date)}</div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>⏰ {t.time || '—'}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                    {t.registered_count || 0} / {t.team_slots || 16}
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--error)', fontWeight: 500 }}>
                    {formatDate(t.registration_deadline)}
                  </td>
                  <td>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="form-input"
                      style={{
                        padding: '2px 8px',
                        fontSize: 'var(--text-xs)',
                        width: '110px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        color: t.status === 'open' ? 'var(--info)' : t.status === 'live' ? 'var(--success)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(t)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleDelete(t.id)}>
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
            maxWidth: '550px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
              {editId ? '🏆 Edit Tournament' : '🏆 Create Tournament'}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Tournament Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  required
                  placeholder="e.g. Free Fire Weekly Rumble"
                  value={formData.name}
                  onChange={handleTextChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-input"
                    value={formData.date}
                    onChange={handleTextChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    name="time"
                    className="form-input"
                    value={formData.time}
                    onChange={handleTextChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Registration Deadline</label>
                  <input
                    type="date"
                    name="registration_deadline"
                    className="form-input"
                    value={formData.registration_deadline}
                    onChange={handleTextChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Team Slots</label>
                  <input
                    type="number"
                    name="team_slots"
                    className="form-input"
                    min="2"
                    value={formData.team_slots}
                    onChange={handleTextChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Game Mode</label>
                  <select
                    name="mode"
                    className="form-input"
                    value={formData.mode}
                    onChange={handleTextChange}
                  >
                    <option value="br">Battle Royale (Standard)</option>
                    <option value="cs">Clash Squad (4v4 / 1v1)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-input" value={formData.status} onChange={handleTextChange}>
                  <option value="draft">Draft</option>
                  <option value="open">Open (Registrations Enabled)</option>
                  <option value="live">Live (Event In Progress)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Poster Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-input"
                  style={{ padding: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Prize Pool</label>
                  <input
                    type="text"
                    name="prize_pool"
                    className="form-input"
                    placeholder="e.g. ₹10,000"
                    value={formData.prize_pool}
                    onChange={handleTextChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Maps</label>
                  <input
                    type="text"
                    name="maps"
                    className="form-input"
                    placeholder="e.g. Bermuda, Purgatory"
                    value={formData.maps}
                    onChange={handleTextChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Match Format</label>
                  <input
                    type="text"
                    name="match_format"
                    className="form-input"
                    placeholder="e.g. BO3"
                    value={formData.match_format}
                    onChange={handleTextChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Prize Details</label>
                <textarea
                  name="prize_details"
                  className="form-input"
                  placeholder="Enter prize pool info..."
                  rows="3"
                  value={formData.prize_details}
                  onChange={handleTextChange}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rules</label>
                <textarea
                  name="rules"
                  className="form-input"
                  placeholder="Enter tournament rules..."
                  rows="3"
                  value={formData.rules}
                  onChange={handleTextChange}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  {editId ? 'Save Changes' : 'Create Tournament'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
