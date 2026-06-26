import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    is_pinned: false,
    is_active: true,
    scheduled_for: '',
  });
  const [imageFile, setImageFile] = useState(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.get('/announcements');
      setAnnouncements(data.announcements || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setFormData({
      title: '',
      content: '',
      type: 'info',
      is_pinned: false,
      is_active: true,
      scheduled_for: '',
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (a) => {
    setEditId(a.id);
    setFormData({
      title: a.title || '',
      content: a.content || '',
      type: a.type || 'info',
      is_pinned: a.is_pinned === 1 || a.is_pinned === true,
      is_active: a.is_active === 1 || a.is_active === true,
      scheduled_for: a.scheduled_for || '',
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('content', formData.content);
    fd.append('type', formData.type);
    fd.append('is_pinned', formData.is_pinned ? 1 : 0);
    fd.append('is_active', formData.is_active ? 1 : 0);
    if (formData.scheduled_for) fd.append('scheduled_for', formData.scheduled_for);
    if (imageFile) fd.append('image', imageFile);

    try {
      if (editId) {
        await api.put(`/announcements/${editId}`, fd);
      } else {
        await api.post('/announcements', fd);
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            📢 Announcements Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Publish alerts, event notices, or pinned news cards on the homepage.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + New Announcement
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : announcements.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No announcements published yet.
        </Card>
      ) : (
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Title / Type</th>
                <th>Content Preview</th>
                <th>Pinned</th>
                <th>Active</th>
                <th>Published</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{a.title}</div>
                    <span style={{
                      fontSize: 'var(--text-2xs)',
                      textTransform: 'uppercase',
                      color: a.type === 'urgent' ? 'var(--error)' : a.type === 'warning' ? 'var(--warning)' : 'var(--neon)',
                    }}>
                      {a.type}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.content}
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
                    {a.is_pinned === 1 || a.is_pinned === true ? '📌 Yes' : 'No'}
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', color: (a.is_active === 1 || a.is_active === true) ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {(a.is_active === 1 || a.is_active === true) ? 'Active' : 'Draft'}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(a.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(a)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleDelete(a.id)}>
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
              {editId ? '📢 Edit Announcement' : '📢 Create Announcement'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  required
                  placeholder="e.g. Free Fire Tournament Postponed"
                  value={formData.title}
                  onChange={handleTextChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alert Level / Type</label>
                <select name="type" className="form-input" value={formData.type} onChange={handleTextChange}>
                  <option value="info">Info (Neon Green)</option>
                  <option value="warning">Warning (Orange)</option>
                  <option value="success">Success (Emerald)</option>
                  <option value="urgent">Urgent (Crimson Alert)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Content Message</label>
                <textarea
                  name="content"
                  className="form-input"
                  required
                  placeholder="Type the announcement details here..."
                  rows="4"
                  value={formData.content}
                  onChange={handleTextChange}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Banner / Poster Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={handleFileChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Schedule For (Optional)</label>
                <input
                  type="datetime-local"
                  name="scheduled_for"
                  className="form-input"
                  value={formData.scheduled_for}
                  onChange={handleTextChange}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input
                    type="checkbox"
                    name="is_pinned"
                    checked={formData.is_pinned}
                    onChange={handleCheckboxChange}
                  />
                  Pin on top of Homepage
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                  />
                  Published (Visible to public)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-4)' }}>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  {editId ? 'Save Changes' : 'Publish Alert'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
