import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    color: '#D7FF00', // Default to neon
    description: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await api.get('/departments');
      setDepartments(data.departments || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to delete department.');
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setForm({
      name: '',
      code: '',
      color: '#D7FF00',
      description: '',
    });
    setLogoFile(null);
    setBannerFile(null);
    setModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditId(d.id);
    setForm({
      name: d.name || '',
      code: d.code || '',
      color: d.color || '#D7FF00',
      description: d.description || '',
    });
    setLogoFile(null);
    setBannerFile(null);
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      formData.append(key, val);
    });
    if (logoFile) {
      formData.append('logo', logoFile);
    }
    if (bannerFile) {
      formData.append('banner', bannerFile);
    }

    try {
      if (editId) {
        await api.put(`/departments/${editId}`, formData);
      } else {
        await api.post('/departments', formData);
      }
      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            🏢 Departments
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage departments, codes, and branding assets.</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          + Add Department
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : departments.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No departments found.
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
          {departments.map((d) => (
            <Card key={d.id} className="card-glow" style={{ borderTop: `4px solid ${d.color || 'var(--neon)'}`, overflow: 'hidden', padding: 0 }}>
              {/* Banner Area */}
              <div style={{
                height: '100px',
                backgroundImage: d.banner_url ? `url(${d.banner_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border)',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))'
                }}></div>
                <div style={{ position: 'absolute', bottom: '-20px', left: '16px' }}>
                  <img
                    src={d.logo_url || '/assets/logo.png'}
                    alt={d.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      background: 'var(--bg-card)',
                      border: `2px solid ${d.color || 'var(--border)'}`,
                    }}
                  />
                </div>
              </div>
              
              <div style={{ padding: 'var(--space-4)', paddingTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0 }}>
                      {d.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: d.color || 'var(--neon)', fontWeight: 700 }}>
                        {d.code}
                      </span>
                    </div>
                  </div>
                </div>

                {d.description && (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-3)', lineHeight: 1.5 }}>
                    {d.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-4)' }}>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(d)} style={{ flex: 1 }}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                    onClick={() => handleDelete(d.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
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
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
              {editId ? '🏢 Edit Department' : '🏢 Add Department'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  required
                  placeholder="e.g. Computer Science"
                  value={form.name}
                  onChange={handleFormChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Code (Short)</label>
                  <input
                    type="text"
                    name="code"
                    className="form-input"
                    required
                    placeholder="e.g. CSE"
                    value={form.code}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Theme Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      name="color"
                      className="form-input"
                      value={form.color}
                      onChange={handleFormChange}
                      style={{ padding: '2px', height: '42px', width: '50px' }}
                    />
                    <input
                      type="text"
                      name="color"
                      className="form-input"
                      value={form.color}
                      onChange={handleFormChange}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-group">
                  <label className="form-label">Upload Logo</label>
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
                  <label className="form-label">Upload Banner</label>
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
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  className="form-input"
                  placeholder="Short description..."
                  rows="3"
                  value={form.description}
                  onChange={handleFormChange}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">
                  {editId ? 'Save Changes' : 'Add Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
