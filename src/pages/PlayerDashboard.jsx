import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import StatCard from '../components/UI/StatCard';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function PlayerDashboard() {
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('playerToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch Profile
        const profileData = await api.get('/player-auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(profileData);

        // Fetch Certificates if name is available
        if (profileData?.name) {
          try {
            const certData = await api.get('/public/certificates', { search: profileData.name });
            setCertificates(certData.certificates || certData || []);
          } catch (certErr) {
            console.error("Failed to fetch certificates", certErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('playerToken');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--neon)', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>LOADING...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ff3366', fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>ERROR LOADING PROFILE</div>
      </div>
    );
  }

  const TABS = [
    { id: 'profile', label: 'My Profile' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'certificates', label: 'Certificates' }
  ];

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '6rem 0 4rem' }}>
      <div className="container">
        {/* Header Section */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontSize: '2.5rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
              PLAYER <span style={{ color: 'var(--neon)' }}>DASHBOARD</span>
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Welcome back, {profile.name}</p>
          </div>
          <Button variant="outline" onClick={() => { localStorage.removeItem('playerToken'); navigate('/'); }}>
            LOGOUT
          </Button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: activeTab === tab.id ? 'var(--neon)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-heading)',
                fontSize: '1.1rem',
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                borderBottom: activeTab === tab.id ? '2px solid var(--neon)' : '2px solid transparent',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <Card glow={true}>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>PROFILE DETAILS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text)' }}>{profile.name}</span>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Player ID</span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text)' }}>{profile.player_login_id}</span>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text)' }}>{profile.department_name || profile.department_id || 'N/A'}</span>
                  </div>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Team Name</span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text)' }}>{profile.team_name || 'No Team Assigned'}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                    <span style={{ fontSize: '1.1rem', color: profile.is_approved ? 'var(--neon)' : '#ffb020' }}>
                      {profile.is_approved ? 'APPROVED' : 'PENDING APPROVAL'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', marginBottom: '1.5rem', fontSize: '1.2rem' }}>ACCOUNT SECURITY</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Keep your account secure. If you need to change your password, please contact the administrator.
                </p>
                <Button variant="outline" disabled>CHANGE PASSWORD</Button>
              </Card>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="MATCHES PLAYED" value={player?.matches_played || "0"} />
                <StatCard title="TOTAL KILLS" value={player?.total_kills || "0"} />
                <StatCard title="K/D RATIO" value={player?.kd_ratio || "0.0"} />
                <StatCard title="WIN RATE" value={player?.win_rate || "0%"} />
              </div>
              <Card>
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <p>Detailed statistics will appear here after your first official match.</p>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div>
              {certificates.length === 0 ? (
                <Card>
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <p>No certificates found for your profile yet.</p>
                  </div>
                </Card>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {certificates.map(cert => (
                    <Card key={cert.certificate_id} glow={true}>
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                          <h4 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{cert.tournament_name || 'Tournament'}</h4>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{cert.achievement || 'Participation'}</p>
                        </div>
                        <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Certificate ID:</strong> {cert.certificate_id}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Issued:</strong> {new Date(cert.issue_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="primary" 
                          style={{ width: '100%' }}
                          onClick={() => window.open(`/api/public/certificates/${cert.certificate_id}/download`, '_blank')}
                        >
                          DOWNLOAD PDF
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
