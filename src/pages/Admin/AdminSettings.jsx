import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    website_name: 'BHIMA ESPORTS',
    game_title: 'Free Fire',
    college_name: 'Bhima Institute of Technology',
    contact_email: 'bhimaesports@gmail.com',
    instagram_url: '',
    discord_url: '',
    maintenance_mode: 'false',
    registration_enabled: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then((data) => {
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', { settings });
      alert('Settings updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '600px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          ⚙️ Website Configurations
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage general information, active games, and registration forms state.</p>
      </div>

      <Card style={{ border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Platform Name</label>
            <input
              type="text"
              name="website_name"
              className="form-input"
              value={settings.website_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hostel/College Name</label>
            <input
              type="text"
              name="college_name"
              className="form-input"
              value={settings.college_name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Primary Game Title</label>
              <input
                type="text"
                name="game_title"
                className="form-input"
                value={settings.game_title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                name="contact_email"
                className="form-input"
                value={settings.contact_email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Instagram Handle URL</label>
              <input
                type="url"
                name="instagram_url"
                className="form-input"
                placeholder="https://instagram.com/..."
                value={settings.instagram_url}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Discord Server Invite</label>
              <input
                type="url"
                name="discord_url"
                className="form-input"
                placeholder="https://discord.gg/..."
                value={settings.discord_url}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <div className="form-group">
              <label className="form-label">Registration Form State</label>
              <select
                name="registration_enabled"
                className="form-input"
                value={settings.registration_enabled}
                onChange={handleChange}
              >
                <option value="true">Enabled (Accept Registrations)</option>
                <option value="false">Disabled (Close Signup)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Maintenance Mode</label>
              <select
                name="maintenance_mode"
                className="form-input"
                value={settings.maintenance_mode}
                onChange={handleChange}
              >
                <option value="false">Off (Site Live)</option>
                <option value="true">On (Show Maintenance Landing)</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" loading={saving} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
            {saving ? 'Updating Settings...' : 'Save Configurations'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
