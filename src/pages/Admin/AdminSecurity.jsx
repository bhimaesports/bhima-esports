import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminSecurity() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Change credentials form state
  const [formData, setFormData] = useState({
    new_admin_id: '',
    current_password: '',
    new_password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await api.get('/auth/logs');
      setLogs(data.logs || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/auth/change-credentials', formData);
      alert('Credentials updated successfully. Please use your new credentials next time.');
      setFormData({
        new_admin_id: '',
        current_password: '',
        new_password: '',
      });
      fetchLogs();
    } catch (err) {
      setError(err.message || 'Failed to update credentials.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          🔒 Control Center Security
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Change access credentials and review connection/activity audit logs.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {/* Credentials Editor */}
        <Card style={{ border: '1px solid var(--border)', height: 'fit-content' }}>
          <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
            🔑 Change Credentials
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">New Admin ID</label>
              <input
                type="text"
                name="new_admin_id"
                className="form-input"
                placeholder="Enter new username"
                value={formData.new_admin_id}
                onChange={handleTextChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                name="current_password"
                className="form-input"
                required
                placeholder="Verify current password"
                value={formData.current_password}
                onChange={handleTextChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="new_password"
                className="form-input"
                placeholder="Min 6 characters (optional)"
                value={formData.new_password}
                onChange={handleTextChange}
              />
            </div>

            {error && (
              <div style={{
                padding: 'var(--space-3)',
                background: 'rgba(255,68,68,0.08)',
                border: '1px solid rgba(255,68,68,0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                fontSize: 'var(--text-xs)',
              }}>
                ⚠️ {error}
              </div>
            )}

            <Button type="submit" variant="primary" loading={saving} style={{ width: '100%' }}>
              {saving ? 'Saving...' : 'Update Credentials'}
            </Button>
          </form>
        </Card>

        {/* Audit Logs */}
        <Card style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--text)' }}>
              📋 Security Audit Logs
            </h3>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              🔄 Refresh
            </Button>
          </div>

          {loadingLogs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <div className="loading-spinner" />
            </div>
          ) : logs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-8)' }}>
              No system logs recorded.
            </p>
          ) : (
            <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Details</th>
                    <th>IP Address</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--neon)', fontWeight: 700 }}>
                        {log.action}
                      </td>
                      <td style={{ fontSize: 'var(--text-sm)' }}>{log.details}</td>
                      <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>{log.ip_address || '—'}</td>
                      <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
