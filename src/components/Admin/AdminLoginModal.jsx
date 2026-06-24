import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

export default function AdminLoginModal() {
  const { adminLoginModalOpen, closeAdminLogin, login, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
    if (!loginError) {
      setUsername('');
      setPassword('');
    }
  };

  return (
    <Modal
      isOpen={adminLoginModalOpen}
      onClose={closeAdminLogin}
      title="⚡ Admin Access"
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
          Authorized personnel only. All access is logged.
        </p>

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
        </div>

        {loginError && (
          <div style={{
            padding: 'var(--space-3)',
            background: 'rgba(255,68,68,0.08)',
            border: '1px solid rgba(255,68,68,0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)',
            fontSize: 'var(--text-sm)',
          }}>
            {loginError}
          </div>
        )}

        <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
          {loading ? 'Authenticating...' : 'Login'}
        </Button>
      </form>
    </Modal>
  );
}
