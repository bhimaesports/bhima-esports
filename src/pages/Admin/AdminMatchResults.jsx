import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminMatchResults() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [pointDist, setPointDist] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterGame, setFilterGame] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterTournament, setFilterTournament] = useState('');

  // Modals
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [entryMatch, setEntryMatch] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [registeredTeams, setRegisteredTeams] = useState([]);

  // Match Form State
  const [matchForm, setMatchForm] = useState({
    tournament_id: '', match_name: '', match_number: '', game: '', 
    date: '', time: '', status: 'upcoming', winning_team_id: '', 
    runner_up_team_id: '', mvp_player_id: '', notes: '', highlights_url: '', 
    published: 1, poster: null
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, ptRes, tmRes, pRes] = await Promise.all([
        api.get('/tournaments'),
        api.get('/points'),
        api.get('/teams'),
        api.get('/players', { limit: 1000 })
      ]);
      
      setTournaments(tRes.tournaments || tRes.data?.tournaments || tRes.data || tRes || []);
      setPointDist(ptRes.point_distribution?.data || ptRes.data || null);
      setTeams(tmRes.teams || tmRes.data || []);
      setPlayers(pRes.players || pRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterGame) params.game = filterGame;
      if (filterStatus) params.status = filterStatus;
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      if (filterTournament) params.tournament_id = filterTournament;

      const res = await api.get('/matches', params);
      setMatches(res.matches || res.data?.matches || res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [search, filterGame, filterStatus, filterMonth, filterYear, filterTournament]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMatches();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchMatches]);

  const handleMatchFormChange = (e) => {
    const { name, value } = e.target;
    setMatchForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMatchFileChange = (e) => {
    setMatchForm(prev => ({ ...prev, poster: e.target.files[0] }));
  };

  const openMatchModal = (match = null) => {
    if (match) {
      setEditingMatch(match);
      setMatchForm({
        tournament_id: match.tournament_id || '',
        match_name: match.match_name || '',
        match_number: match.match_number || '',
        game: match.game || '',
        date: match.date || '',
        time: match.time || '',
        status: match.status || 'upcoming',
        winning_team_id: match.winning_team_id || '',
        runner_up_team_id: match.runner_up_team_id || '',
        mvp_player_id: match.mvp_player_id || '',
        notes: match.notes || '',
        highlights_url: match.highlights_url || '',
        published: match.published !== undefined ? match.published : 1,
        poster: null
      });
    } else {
      setEditingMatch(null);
      setMatchForm({
        tournament_id: filterTournament || '', match_name: '', match_number: '', game: '', 
        date: '', time: '', status: 'upcoming', winning_team_id: '', 
        runner_up_team_id: '', mvp_player_id: '', notes: '', highlights_url: '', 
        published: 1, poster: null
      });
    }
    setIsMatchModalOpen(true);
  };

  const submitMatch = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(matchForm).forEach(key => {
        if (matchForm[key] !== null && matchForm[key] !== '') {
          formData.append(key, matchForm[key]);
        }
      });

      if (editingMatch) {
        await api.put(`/matches/${editingMatch.id}`, formData);
      } else {
        await api.post('/matches', formData);
      }
      setIsMatchModalOpen(false);
      fetchMatches();
    } catch (err) {
      alert(err.message || 'Failed to save match.');
    }
  };

  const handleDeleteMatch = async (id) => {
    if (!window.confirm('Delete this match permanently?')) return;
    try {
      await api.delete(`/matches/${id}`);
      fetchMatches();
    } catch (err) {
      alert(err.message || 'Failed to delete.');
    }
  };

  const duplicateMatch = async (match) => {
    try {
      const formData = new FormData();
      formData.append('tournament_id', match.tournament_id);
      formData.append('match_name', match.match_name ? `${match.match_name} (Copy)` : '');
      formData.append('match_number', (match.match_number || 0) + 1);
      formData.append('game', match.game || '');
      formData.append('date', match.date || '');
      formData.append('time', match.time || '');
      formData.append('status', 'upcoming');
      formData.append('published', 0);
      
      await api.post('/matches', formData);
      fetchMatches();
    } catch (err) {
      alert('Failed to duplicate match.');
    }
  };

  // --- RESULTS LOGIC ---

  const openResultsModal = async (match) => {
    setEntryMatch(match);
    setIsResultsModalOpen(true);
    setTeamsLoading(true);
    try {
      const data = await api.get('/registrations', { tournament_id: match.tournament_id, status: 'approved' });
      const regs = data.registrations || data || [];
      setRegisteredTeams(regs);

      const existing = match.results || [];
      const isCS = tournaments.find(t => t.id === match.tournament_id)?.mode === 'cs';

      const prefilled = regs.map(reg => {
        const r = existing.find(ex => ex.team_id === reg.team_id);
        return {
          team_id: reg.team_id,
          team_name: reg.team_name,
          rank: r ? r.rank : (isCS ? 1 : 12),
          kills: r ? r.kills : 0,
          participated: !!r || !isCS
        };
      });
      setResultsData(prefilled);
    } catch (err) {
      console.error(err);
    } finally {
      setTeamsLoading(false);
    }
  };

  const handleResultChange = (idx, field, value) => {
    setResultsData(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const calculatePreview = (rank, kills) => {
    if (!pointDist) return { p: 0, k: 0, t: 0 };
    const pPoints = pointDist.placements[rank] || 0;
    const kPoints = kills * (pointDist.kill_point_value || 1);
    return { p: pPoints, k: kPoints, t: pPoints + kPoints };
  };

  const submitResults = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        results: resultsData
          .filter(r => r.participated)
          .map(r => ({ team_id: r.team_id, rank: parseInt(r.rank), kills: parseInt(r.kills) }))
      };
      if (payload.results.length === 0) return alert('Select at least one participating team.');
      await api.post(`/matches/${entryMatch.id}/results`, payload);
      setIsResultsModalOpen(false);
      fetchMatches();
    } catch (err) {
      alert(err.message || 'Failed to submit results.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
            ⚔️ Match & Score Entry
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage tournament matches, publish results, and auto-update leaderboards.</p>
        </div>
        <Button variant="primary" onClick={() => openMatchModal()}>+ Create Match</Button>
      </div>

      {/* Filters Bar */}
      <Card style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', border: '1px solid var(--border)' }}>
        <input 
          type="text" 
          placeholder="Search matches..." 
          className="admin-input" 
          style={{ flex: 1, minWidth: '200px' }}
          value={search} onChange={e => setSearch(e.target.value)} 
        />
        <select className="admin-input" value={filterTournament} onChange={e => setFilterTournament(e.target.value)}>
          <option value="">All Tournaments</option>
          {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="admin-input" value={filterGame} onChange={e => setFilterGame(e.target.value)}>
          <option value="">All Games</option>
          <option value="freefire">Free Fire</option>
          <option value="bgmi">BGMI</option>
          <option value="cod">COD Mobile</option>
        </select>
        <select className="admin-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="admin-input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">Month</option>
          {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
        </select>
        <select className="admin-input" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">Year</option>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </Card>

      {/* Matches Table */}
      <Card style={{ border: '1px solid var(--border)', overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', minWidth: '800px' }}>
          <thead>
            <tr>
              <th>Match</th>
              <th>Details</th>
              <th>Status</th>
              <th>Winner / MVP</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {m.poster_url ? <img src={m.poster_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏆'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>
                        {m.match_name || `Match ${m.match_number}`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {m.tournament_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div><strong>Date:</strong> {m.date || 'TBA'} {m.time}</div>
                    <div><strong>Game:</strong> {m.game || 'N/A'}</div>
                  </div>
                </td>
                <td>
                  <span style={{ 
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                    background: m.status === 'live' ? 'rgba(255,51,102,0.1)' : m.status === 'completed' ? 'rgba(160,160,160,0.1)' : 'rgba(59,130,246,0.1)',
                    color: m.status === 'live' ? 'var(--error)' : m.status === 'completed' ? '#A0A0A0' : '#3B82F6'
                  }}>
                    {m.status}
                  </span>
                  {!m.published && <span style={{ marginLeft: '4px', fontSize: '0.7rem', color: 'orange' }}>(Draft)</span>}
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div><strong>Win:</strong> {m.winning_team_name || '-'}</div>
                    <div><strong>MVP:</strong> {m.mvp_in_game_name || m.mvp_player_name || '-'}</div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={() => openResultsModal(m)}>Results</Button>
                    <Button variant="outline" onClick={() => openMatchModal(m)}>Edit</Button>
                    <button style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }} onClick={() => duplicateMatch(m)}>📋</button>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }} onClick={() => handleDeleteMatch(m.id)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {matches.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No matches found.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Match Form Modal */}
      <AnimatePresence>
        {isMatchModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          >
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} style={{ background: '#111', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2>{editingMatch ? 'Edit Match' : 'Create Match'}</h2>
                <button onClick={() => setIsMatchModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>
              <form onSubmit={submitMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label>Tournament *</label>
                    <select name="tournament_id" value={matchForm.tournament_id} onChange={handleMatchFormChange} className="admin-input" required>
                      <option value="">Select Tournament</option>
                      {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Game</label>
                    <select name="game" value={matchForm.game} onChange={handleMatchFormChange} className="admin-input">
                      <option value="">Select Game</option>
                      <option value="freefire">Free Fire</option>
                      <option value="bgmi">BGMI</option>
                      <option value="cod">COD Mobile</option>
                    </select>
                  </div>
                  <div>
                    <label>Match Name (e.g. Finals)</label>
                    <input type="text" name="match_name" value={matchForm.match_name} onChange={handleMatchFormChange} className="admin-input" />
                  </div>
                  <div>
                    <label>Match Number *</label>
                    <input type="number" name="match_number" value={matchForm.match_number} onChange={handleMatchFormChange} className="admin-input" required />
                  </div>
                  <div>
                    <label>Date</label>
                    <input type="date" name="date" value={matchForm.date} onChange={handleMatchFormChange} className="admin-input" />
                  </div>
                  <div>
                    <label>Time</label>
                    <input type="time" name="time" value={matchForm.time} onChange={handleMatchFormChange} className="admin-input" />
                  </div>
                  <div>
                    <label>Status</label>
                    <select name="status" value={matchForm.status} onChange={handleMatchFormChange} className="admin-input">
                      <option value="upcoming">Upcoming</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label>Published</label>
                    <select name="published" value={matchForm.published} onChange={handleMatchFormChange} className="admin-input">
                      <option value={1}>Yes (Public)</option>
                      <option value={0}>No (Draft)</option>
                    </select>
                  </div>
                  <div>
                    <label>Winning Team</label>
                    <select name="winning_team_id" value={matchForm.winning_team_id} onChange={handleMatchFormChange} className="admin-input">
                      <option value="">None</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Runner-up Team</label>
                    <select name="runner_up_team_id" value={matchForm.runner_up_team_id} onChange={handleMatchFormChange} className="admin-input">
                      <option value="">None</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>MVP Player</label>
                    <select name="mvp_player_id" value={matchForm.mvp_player_id} onChange={handleMatchFormChange} className="admin-input">
                      <option value="">None</option>
                      {players.map(p => <option key={p.id} value={p.id}>{p.in_game_name || p.real_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Highlights URL</label>
                    <input type="url" name="highlights_url" value={matchForm.highlights_url} onChange={handleMatchFormChange} className="admin-input" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Notes</label>
                    <textarea name="notes" value={matchForm.notes} onChange={handleMatchFormChange} className="admin-input" rows={3}></textarea>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Poster Image</label>
                    <input type="file" onChange={handleMatchFileChange} className="admin-input" accept="image/*" />
                  </div>
                </div>
                <Button type="submit" variant="primary">Save Match</Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Entry Modal */}
      <AnimatePresence>
        {isResultsModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} style={{ background: '#111', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ color: 'var(--neon)', margin: 0 }}>Results: {entryMatch?.match_name || `Match ${entryMatch?.match_number}`}</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>Auto-calculates total points based on active Point Distribution logic.</p>
                </div>
                <button onClick={() => setIsResultsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
              </div>

              {teamsLoading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Teams...</div> : (
                <form onSubmit={submitResults}>
                  <table className="admin-table" style={{ width: '100%', marginBottom: '2rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Ptcp.</th>
                        <th>Team</th>
                        <th style={{ width: '100px' }}>Rank</th>
                        <th style={{ width: '100px' }}>Kills</th>
                        <th style={{ width: '100px', textAlign: 'right', color: '#888' }}>Plac. Pts</th>
                        <th style={{ width: '100px', textAlign: 'right', color: '#888' }}>Kill Pts</th>
                        <th style={{ width: '120px', textAlign: 'right', color: 'var(--neon)' }}>Total Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultsData.map((row, idx) => {
                        const preview = calculatePreview(parseInt(row.rank), parseInt(row.kills));
                        return (
                          <tr key={row.team_id} style={{ opacity: row.participated ? 1 : 0.5 }}>
                            <td style={{ textAlign: 'center' }}>
                              <input type="checkbox" checked={row.participated} onChange={e => handleResultChange(idx, 'participated', e.target.checked)} />
                            </td>
                            <td style={{ fontWeight: 800 }}>{row.team_name}</td>
                            <td>
                              <input type="number" min="1" className="admin-input" style={{ padding: '0.25rem', width: '80px' }} value={row.rank} onChange={e => handleResultChange(idx, 'rank', e.target.value)} disabled={!row.participated} />
                            </td>
                            <td>
                              <input type="number" min="0" className="admin-input" style={{ padding: '0.25rem', width: '80px' }} value={row.kills} onChange={e => handleResultChange(idx, 'kills', e.target.value)} disabled={!row.participated} />
                            </td>
                            <td style={{ textAlign: 'right', color: '#888' }}>{row.participated ? preview.p : '-'}</td>
                            <td style={{ textAlign: 'right', color: '#888' }}>{row.participated ? preview.k : '-'}</td>
                            <td style={{ textAlign: 'right', color: 'var(--neon)', fontWeight: 900 }}>{row.participated ? preview.t : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <Button type="submit" variant="primary" style={{ width: '100%' }}>Submit Results & Update Leaderboards</Button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
