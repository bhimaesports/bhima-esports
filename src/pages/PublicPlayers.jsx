import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import Card from '../components/UI/Card';
import { useApp } from '../context/AppContext';

export default function PublicPlayers() {
  const { settings } = useApp();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [team, setTeam] = useState('');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const [playersRes, teamsRes] = await Promise.all([
          api.get('/public/players'),
          api.get('/public/teams')
        ]);
        if (playersRes.data?.players) setPlayers(playersRes.data.players);
        else if (Array.isArray(playersRes.data)) setPlayers(playersRes.data);
        
        if (teamsRes.data?.teams) setTeams(teamsRes.data.teams);
        else if (Array.isArray(teamsRes.data)) setTeams(teamsRes.data);
      } catch (err) {
        console.error('Error fetching players:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.uid?.toLowerCase().includes(search.toLowerCase()) ||
                          p.role?.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = team ? p.team_id === Number(team) : true;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', padding: '4rem 0' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }} />
          <h2>{settings?.cms_page_players_title || 'ROSTER LIST'}</h2>
          <p>{settings?.cms_page_players_sub || 'The warriors of Bhima Esports.'}</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <input
            type="text"
            placeholder="Search players by name, UID, or role..."
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
            value={team}
            onChange={(e) => setTeam(e.target.value)}
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
            <option value="">All Teams</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.department_code})</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : filteredPlayers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>NO PLAYERS FOUND</h3>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {filteredPlayers.map((player, idx) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: (idx % 10) * 0.05 }}
              >
                <Link to={`/players/${player.id}`} style={{ textDecoration: 'none' }}>
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
                      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid var(--border)' }}>
                        👤
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)', fontSize: '1.5rem', margin: 0, textTransform: 'uppercase' }}>
                          {player.name}
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                          <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                            {player.team_name || 'Free Agent'}
                          </span>
                          <span style={{ 
                            background: player.role?.toLowerCase() === 'captain' ? 'rgba(215,255,0,0.1)' : 'rgba(255,255,255,0.05)', 
                            color: player.role?.toLowerCase() === 'captain' ? 'var(--neon)' : 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-heading)',
                            textTransform: 'uppercase',
                            border: player.role?.toLowerCase() === 'captain' ? '1px solid rgba(215,255,0,0.3)' : '1px solid rgba(255,255,255,0.1)'
                          }}>
                            {player.role || 'Player'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, fontFamily: 'var(--font-mono)' }}>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Kills</div>
                        <div style={{ fontSize: '1.25rem', color: 'var(--neon)', fontWeight: 'bold' }}>{player.kills || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Points</div>
                        <div style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 'bold' }}>{player.total_points || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Matches</div>
                        <div style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 'bold' }}>{player.matches_played || 0}</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>K/D Ratio</div>
                        <div style={{ fontSize: '1.25rem', color: '#3b82f6', fontWeight: 'bold' }}>{player.kd_ratio || '0.00'}</div>
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
