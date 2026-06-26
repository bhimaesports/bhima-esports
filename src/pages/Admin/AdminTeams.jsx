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

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Roster Modal
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Ban Modal
  const [banTeamId, setBanTeamId] = useState(null);
  const [banStatus, setBanStatus] = useState('banned');
  const [banReason, setBanReason] = useState('');

  // Add / Edit Modal
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    department_id: '',
    year: '1',
    captain_name: '',
    captain_roll: '',
    captain_phone: '',
    leader_uid: '',
    leader_ign: '',
    motto: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await api.get('/teams', {
        search: search || undefined,
        department_id: deptFilter || undefined,
      });
      setTeams(data.teams || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [search, deptFilter]);

  const viewRoster = async (team) => {
    setSelectedTeam(team);
    setRosterLoading(true);
    try {
      const data = await api.get('/players', { team_id: team.id });
      setRoster(data.players || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('WARNING: Deleting a team will delete all its players and registrations. Proceed?')) return;
    try {
      await api.delete(`/teams/${id}`);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to delete team.');
    }
  };

  const handleBanSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/teams/${banTeamId}/status`, {
        status: banStatus,
        ban_reason: banReason,
      });
      setBanTeamId(null);
      setBanReason('');
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`/teams/${id}/status`, { status: 'active' });
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Failed to restore team.');
    }
  };

  const openCreateModal = () => {
    setEditTeamId(null);
    setTeamForm({
      name: '',
      department_id: '',
      year: '1',
      captain_name: '',
      captain_roll: '',
      captain_phone: '',
      leader_uid: '',
      leader_ign: '',
      motto: '',
    });
    setLogoFile(null);
    setBannerFile(null);
    setTeamModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditTeamId(t.id);
    setTeamForm({
      name: t.name || '',
      department_id: (t.department_id || '').toString(),
      year: (t.year || 1).toString(),
      captain_name: t.captain_name || '',
      captain_roll: t.captain_roll || '',
      captain_phone: t.captain_phone || '',
      leader_uid: t.leader_uid || '',
      leader_ign: t.leader_ign || '',
      motto: t.motto || '',
    });
    setLogoFile(null);
    setBannerFile(null);
    setTeamModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTeamForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(teamForm).forEach(([key, val]) => {
      data.append(key, val);
    });
    if (logoFile) {
      data.append('logo', logoFile);
    }
    if (bannerFile) {
      data.append('banner', bannerFile);
    }

    try {
      if (editTeamId) {
        await api.put(`/teams/${editTeamId}`, data);
      } else {
        await api.post('/teams', data);
      }
      setTeamModalOpen(false);
      fetchTeams();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            👥 Team Management
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage hostel squads, inspect player rosters, and ban/suspend teams.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Add Team
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
          placeholder="🔍 Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : teams.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No teams found.
        </Card>
      ) : (
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Team ID</th>
                <th>Team Info</th>
                <th>Department</th>
                <th>Captain</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                    {t.team_id}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <img
                        src={t.logo_url || '/assets/logo.png'}
                        alt={t.name}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }}
                      />
                      {t.name}
                    </div>
                  </td>
                  <td>{t.department_name} ({t.department_code})</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>
                    <div>{t.captain_name || '—'}</div>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                      Roll: {t.captain_roll || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: t.status === 'active' ? 'rgba(0,255,0,0.05)' : 'rgba(255,0,0,0.05)',
                      color: t.status === 'active' ? 'var(--success)' : 'var(--error)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}>
                      {t.status}
                    </span>
                    {t.status !== 'active' && t.ban_reason && (
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--error)', marginTop: '2px' }}>
                        Reason: {t.ban_reason}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" onClick={() => viewRoster(t)}>
                        Roster
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => openEditModal(t)}>
                        Edit
                      </Button>

                      {t.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
                          onClick={() => {
                            setBanTeamId(t.id);
                            setBanStatus('suspended');
                          }}
                        >
                          Suspend/Ban
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleRestore(t.id)}>
                          Restore
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                        onClick={() => handleDeleteTeam(t.id)}
                      >
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

      {/* Add / Edit Team Modal */}
      {teamModalOpen && (
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
              {editTeamId ? '👥 Edit Team Details' : '👥 Add Team Squad'}
            </h2>

            <form onSubmit={handleTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  required
                  placeholder="e.g. Mechanical Warriors"
                  value={teamForm.name}
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
                    value={teamForm.department_id}
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
                    value={teamForm.year}
                    onChange={handleFormChange}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', textTransform: 'uppercase', marginTop: 'var(--space-2)' }}>Captain Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Captain Name</label>
                  <input
                    type="text"
                    name="captain_name"
                    className="form-input"
                    placeholder="Full name"
                    value={teamForm.captain_name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input
                    type="text"
                    name="captain_roll"
                    className="form-input"
                    placeholder="e.g. Roll No"
                    value={teamForm.captain_roll}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Captain WhatsApp Phone</label>
                <input
                  type="text"
                  name="captain_phone"
                  className="form-input"
                  placeholder="Mobile number"
                  value={teamForm.captain_phone}
                  onChange={handleFormChange}
                />
              </div>

              <h4 style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', textTransform: 'uppercase', marginTop: 'var(--space-2)' }}>Game IDs</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">In-Game Character UID</label>
                  <input
                    type="text"
                    name="leader_uid"
                    className="form-input"
                    placeholder="UID"
                    value={teamForm.leader_uid}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">In-Game Nickname (IGN)</label>
                  <input
                    type="text"
                    name="leader_ign"
                    className="form-input"
                    placeholder="IGN"
                    value={teamForm.leader_ign}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Upload Team Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                    className="form-input"
                    style={{ padding: '6px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Team Banner</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBannerFile(e.target.files[0]);
                      }
                    }}
                    className="form-input"
                    style={{ padding: '6px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Squad Motto / Description</label>
                <textarea
                  name="motto"
                  className="form-input"
                  placeholder="Team description..."
                  rows="2"
                  value={teamForm.motto}
                  onChange={handleFormChange}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setTeamModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  {editTeamId ? 'Save Changes' : 'Add Team'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster Modal */}
      {selectedTeam && (
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
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)' }}>
                👥 {selectedTeam.name} Roster
              </h2>
              <button onClick={() => setSelectedTeam(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 'var(--text-lg)', cursor: 'pointer' }}>✕</button>
            </div>

            {rosterLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
                <div className="loading-spinner" />
              </div>
            ) : roster.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No players found in this team.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {roster.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)' }}>
                    <div>
                      <strong style={{ fontSize: 'var(--text-sm)' }}>
                        {p.name} {idx === 0 && '👑'}
                      </strong>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        Roll No: {p.roll_number || '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                        UID: {p.uid || '—'}
                      </div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                        Kills: {p.kills || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
              <Button variant="primary" onClick={() => setSelectedTeam(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban / Suspend Form Modal */}
      {banTeamId && (
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
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--error)', marginBottom: 'var(--space-4)' }}>
              ⚠️ Ban / Suspend Team
            </h2>

            <form onSubmit={handleBanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Action</label>
                <select className="form-input" value={banStatus} onChange={(e) => setBanStatus(e.target.value)}>
                  <option value="suspended">Suspend Team</option>
                  <option value="banned">Ban Team Permanent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea
                  className="form-input"
                  required
                  placeholder="Specify violation details..."
                  rows="3"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setBanTeamId(null)}>Cancel</Button>
                <Button type="submit" variant="primary" style={{ background: 'var(--error)', border: 'none', color: '#fff' }}>
                  Confirm Action
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
