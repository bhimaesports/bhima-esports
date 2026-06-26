import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import Card from '../components/UI/Card';

export default function PublicTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const [teamsRes, deptRes] = await Promise.all([
          api.get('/public/teams'),
          api.get('/departments')
        ]);
        if (teamsRes.data?.teams) setTeams(teamsRes.data.teams);
        else if (Array.isArray(teamsRes.data)) setTeams(teamsRes.data);
        
        if (deptRes.data) setDepartments(deptRes.data);
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.team_id?.toLowerCase().includes(search.toLowerCase()) ||
                          t.captain_name?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = department ? t.department_id === Number(department) : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '4rem 0' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }} />
          <h2>ESPORTS TEAMS</h2>
          <p>The elite squads battling for glory.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <input
            type="text"
            placeholder="Search teams or captains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '250px',
              padding: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem'
            }}
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{
              padding: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              minWidth: '200px'
            }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : filteredTeams.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>NO TEAMS FOUND</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
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
                    cursor: 'pointer'
                  }}
                  className="hover-glow"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neon)' }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(215,255,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '2px solid var(--neon)' }}>
                          🎮
                        </div>
                      )}
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontSize: '1.5rem', margin: 0, textTransform: 'uppercase' }}>
                          {team.name}
                        </h3>
                        <div style={{ color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                          {team.team_id}
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Department:</span>
                        <span style={{ color: 'var(--text)' }}>{team.department_code || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Captain:</span>
                        <span style={{ color: 'var(--text)' }}>{team.captain_name || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Points:</span>
                        <span style={{ color: 'var(--text)' }}>{team.total_points || 0}</span>
                      </div>
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
