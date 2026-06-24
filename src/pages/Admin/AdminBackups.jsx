import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminBackups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals/Overlays
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/backups');
      setBackups(data.backups || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch database backups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const response = await api.post('/backups');
      setSuccess(response.message || 'Backup created successfully!');
      fetchBackups();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create database backup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await api.delete(`/backups/${filename}`);
      setSuccess(`Backup ${filename} deleted successfully.`);
      setDeleteTarget(null);
      fetchBackups();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete backup file.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (confirmText !== 'RESTORE') {
      alert('Please type "RESTORE" to confirm the action.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const response = await api.post('/backups/restore', { filename: restoreTarget.filename });
      setSuccess(response.message || 'Database successfully restored!');
      setRestoreTarget(null);
      setConfirmText('');
      fetchBackups();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to restore database from backup.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            💾 Backups & Recovery
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage database snapshots, perform restores, or download backups.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={handleCreateBackup} 
          disabled={actionLoading || loading}
        >
          {actionLoading ? 'Creating...' : '⚡ Create Backup Now'}
        </Button>
      </div>

      {/* Notifications */}
      {success && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(215,255,0,0.1)',
          border: '1px solid var(--neon)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--neon)',
          fontWeight: 600,
          fontSize: 'var(--text-sm)'
        }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(255,59,48,0.1)',
          border: '1px solid var(--error)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--error)',
          fontWeight: 600,
          fontSize: 'var(--text-sm)'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Info Alert Box */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderLeft: '4px solid var(--neon)',
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-md)'
      }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
          🛡️ Dynamic Snapshot Rules
        </h4>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          The backend automatically runs background checks on startup to generate <strong>daily</strong> and <strong>weekly</strong> backups.
          All restore actions trigger an automatic <code>pre-restore-safety</code> backup before replacement, ensuring zero accidental data loss.
        </p>
      </div>

      {/* Backups List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : backups.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No backup files found. Press "Create Backup Now" to capture the current state.
        </Card>
      ) : (
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Backup File</th>
                <th>Type</th>
                <th>File Size</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.filename} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text)' }}>
                    {b.filename}
                  </td>
                  <td>
                    <span style={{
                      textTransform: 'uppercase',
                      fontSize: 'var(--text-2xs)',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: b.type === 'manual' ? 'rgba(0,180,216,0.15)' : b.type === 'daily' ? 'rgba(215,255,0,0.15)' : 'rgba(255,165,0,0.15)',
                      color: b.type === 'manual' ? '#00b4d8' : b.type === 'daily' ? 'var(--neon)' : '#ffa500',
                      border: `1px solid ${b.type === 'manual' ? '#00b4d8' : b.type === 'daily' ? 'var(--neon)' : '#ffa500'}`
                    }}>
                      {b.type}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
                    {formatBytes(b.size)}
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    {formatDate(b.created_at)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setRestoreTarget(b);
                          setConfirmText('');
                        }}
                        disabled={actionLoading}
                        style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
                      >
                        Restore
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(b)}
                        disabled={actionLoading}
                        style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
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
            <h3 style={{ color: 'var(--error)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
              ⚠️ Delete Backup File
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to permanently delete the backup file:
              <strong style={{ color: 'var(--text)', display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', marginTop: '8px' }}>
                {deleteTarget.filename}
              </strong>
              This action is permanent and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button 
                variant="danger" 
                onClick={() => handleDeleteBackup(deleteTarget.filename)}
                disabled={actionLoading}
              >
                Delete File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreTarget && (
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
            border: '1.5px solid var(--warning)',
            padding: 'var(--space-6)',
          }}>
            <h3 style={{ color: 'var(--warning)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
              ⚠️ RESTORE DATABASE
            </h3>
            <div style={{
              background: 'rgba(255, 165, 0, 0.05)',
              borderLeft: '4px solid var(--warning)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '15px',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.5,
              color: 'var(--warning)'
            }}>
              <strong>WARNING: Destructive Operation!</strong> This action will overwrite the current live database table states (teams, scores, announcements, settings, certificates) with the values from this backup file.
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
              Restoring from:
              <strong style={{ color: 'var(--text)', display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', margin: '4px 0 12px 0' }}>
                {restoreTarget.filename}
              </strong>
            </p>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5, marginBottom: '12px' }}>
              A safety snapshot named <code>db-backup-pre-restore-safety-*.sqlite</code> will be generated prior to this restore.
            </p>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ color: 'var(--text)', fontWeight: 600 }}>
                Type <span style={{ color: 'var(--warning)' }}>RESTORE</span> to confirm:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Type RESTORE in caps"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{ borderColor: confirmText === 'RESTORE' ? 'var(--neon)' : 'var(--border)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" onClick={() => { setRestoreTarget(null); setConfirmText(''); }}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={handleRestoreBackup}
                disabled={actionLoading || confirmText !== 'RESTORE'}
                style={{
                  background: confirmText === 'RESTORE' ? 'var(--warning)' : 'rgba(255, 165, 0, 0.2)',
                  borderColor: confirmText === 'RESTORE' ? 'var(--warning)' : 'transparent',
                  color: confirmText === 'RESTORE' ? '#000' : 'rgba(255,255,255,0.4)',
                }}
              >
                Execute Restore
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
