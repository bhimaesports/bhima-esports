import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function PlayerLogin() {
  const [formData, setFormData] = useState({ player_login_id: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/player-auth/login', formData);
      localStorage.setItem('playerToken', data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: 500 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card glow={true}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '2rem', marginBottom: '0.5rem' }}>PLAYER LOGIN</h1>
              <p style={{ color: 'var(--text-muted)' }}>Access your player portal</p>
            </div>

            {error && (
              <div style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid #ff3366', color: '#ff3366', padding: '1rem', borderRadius: 4, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Player ID (Login ID)</label>
                <input
                  type="text"
                  name="player_login_id"
                  className="input-field"
                  value={formData.player_login_id}
                  onChange={handleChange}
                  required
                  placeholder="e.g. BE_PLAYER_001"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Password</label>
                <input
                  type="password"
                  name="password"
                  className="input-field"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </Button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--neon)' }}>Register here</Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
