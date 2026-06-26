import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useApp } from '../context/AppContext';

export default function PublicTeams() {
  const { settings } = useApp();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/public/teams');
        if (res.data?.teams) setTeams(res.data.teams);
        else if (Array.isArray(res.data)) setTeams(res.data);
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.team_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.captain_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '4rem 0' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }} />
          <h2>{settings?.cms_page_teams_title || 'ESPORTS TEAMS'}</h2>
          <p>{settings?.cms_page_teams_sub || 'The elite squads battling for glory.'}</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <input
            type="text"
            placeholder="Search teams or captains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '600px',
              padding: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              borderRadius: '8px'
            }}
          />
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : filteredTeams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>NO TEAMS FOUND</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {filteredTeams.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (idx % 10) * 0.05 }}
              >
                <Link to={`/teams/${team.id}`} style={{ textDecoration: 'none' }}>
                  <Card style={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.3s, border-color 0.3s',
                    cursor: 'pointer',
                    padding: 0,
                    overflow: 'hidden'
                  }}
                  className="hover-glow"
                  >
                    {/* Banner */}
                    <div style={{ 
                      height: '100px', 
                      background: 'linear-gradient(135deg, rgba(215,255,0,0.1) 0%, #111 100%)', 
                      position: 'relative',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {/* Logo */}
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '-30px', 
                        left: '20px', 
                        width: '70px', 
                        height: '70px', 
                        borderRadius: '50%', 
                        border: '3px solid #0A0A0A', 
                        background: '#111', 
                        overflow: 'hidden', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                      }}>
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2rem' }}>🛡️</span>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: '40px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontSize: '1.5rem', margin: 0, textTransform: 'uppercase' }}>
                          {team.name}
                        </h3>
                        <div style={{ color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '1px', marginTop: '0.25rem' }}>
                          CAPTAIN: {team.captain_name || 'N/A'}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: '#050505', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Players</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1.1rem', color: '#FFF' }}>{team.player_count || 0}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Matches</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1.1rem', color: '#FFF' }}>{team.matches_played || 0}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Wins</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1.1rem', color: '#FFF' }}>{team.wins || 0}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Points</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--neon)' }}>{team.total_points || 0}</div>
                        </div>
                      </div>

                      <Button variant="outline" style={{ width: '100%', marginTop: 'auto' }}>View Team</Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
