import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function PlayerRegister() {
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    roll_number: '',
    player_login_id: '',
    password: ''
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await api.get('/public/departments');
        setDepartments(data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
        // Fallback departments if endpoint fails
        setDepartments([
          { id: '1', name: 'Computer Science' },
          { id: '2', name: 'Information Technology' },
          { id: '3', name: 'Mechanical' },
          { id: '4', name: 'Civil' }
        ]);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/player-auth/register', formData);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container" style={{ maxWidth: 500 }}>
          <Card glow={true} style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--neon)', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', marginBottom: '1rem' }}>Registration Submitted</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Your player account has been created and is awaiting administrator approval. You will be able to log in once approved.
            </p>
            <Button onClick={() => navigate('/login')} variant="primary">
              GO TO LOGIN
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card glow={true}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '2rem', marginBottom: '0.5rem' }}>PLAYER REGISTRATION</h1>
              <p style={{ color: 'var(--text-muted)' }}>Create your official Bhima Esports profile</p>
            </div>

            {error && (
              <div style={{ background: 'rgba(255, 51, 102, 0.1)', border: '1px solid #ff3366', color: '#ff3366', padding: '1rem', borderRadius: 4, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="input-field"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. John Doe"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Department</label>
                  <select
                    name="department_id"
                    className="input-field"
                    value={formData.department_id}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', background: 'var(--bg-primary)' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Roll Number</label>
                  <input
                    type="text"
                    name="roll_number"
                    className="input-field"
                    value={formData.roll_number}
                    onChange={handleChange}
                    required
                    placeholder="e.g. CS2024001"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Desired Login ID</label>
                <input
                  type="text"
                  name="player_login_id"
                  className="input-field"
                  value={formData.player_login_id}
                  onChange={handleChange}
                  required
                  placeholder="e.g. JOHN_CS"
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>This will be used for logging in and displaying on leaderboards.</span>
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
                  placeholder="Create a strong password"
                />
              </div>

              <Button type="submit" variant="primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? 'REGISTERING...' : 'REGISTER AS PLAYER'}
              </Button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--neon)' }}>Login here</Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
