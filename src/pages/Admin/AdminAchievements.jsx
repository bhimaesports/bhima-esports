import React, { useState, useEffect } from 'react';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import api from '../../utils/api';
import { generateAchievement } from '../../utils/achievementGenerator';
import { saveAs } from 'file-saver';

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    player_id: '',
    title: '',
    award_type: 'MVP',
    tournament_name: ''
  });

  const fetchAchievements = async () => {
    try {
      const res = await api.get('/achievements');
      if (res.achievements) setAchievements(res.achievements);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await api.get('/players');
      if (res.players) setPlayers(res.players);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchAchievements(), fetchPlayers()]).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/achievements', formData);
      setShowModal(false);
      fetchAchievements();
      setFormData({ player_id: '', title: '', award_type: 'MVP', tournament_name: '' });
    } catch (err) {
      alert('Error creating achievement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this achievement?')) return;
    try {
      await api.delete(`/achievements/${id}`);
      fetchAchievements();
    } catch (err) {
      alert('Error deleting achievement');
    }
  };

  const handleDownload = async (achievement) => {
    try {
      const blob = await generateAchievement(achievement);
      saveAs(blob, `Achievement_${achievement.player_name}_${achievement.award_type}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate PDF');
    }
  };

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '2rem' }}>AWARDS & ACHIEVEMENTS</h1>
        <Button onClick={() => setShowModal(true)}>+ ISSUE ACHIEVEMENT</Button>
      </div>

      <Card>
        {loading ? <p>Loading...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Player</th>
                  <th style={{ padding: '1rem' }}>Title</th>
                  <th style={{ padding: '1rem' }}>Type</th>
                  <th style={{ padding: '1rem' }}>Tournament</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((ach) => (
                  <tr key={ach.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>{ach.player_name}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{ach.title}</td>
                    <td style={{ padding: '1rem', color: 'var(--neon)' }}>{ach.award_type}</td>
                    <td style={{ padding: '1rem' }}>{ach.tournament_name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{new Date(ach.issued_date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <Button variant="secondary" onClick={() => handleDownload(ach)}>Download PDF</Button>
                      <Button variant="secondary" onClick={() => handleDelete(ach.id)} style={{ color: '#ff3366', borderColor: '#ff3366' }}>Delete</Button>
                    </td>
                  </tr>
                ))}
                {achievements.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No achievements issued yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <Card style={{ width: '100%', maxWidth: 500 }}>
            <h2 style={{ color: 'var(--neon)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>ISSUE NEW ACHIEVEMENT</h2>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Player</label>
                <select className="input-field" value={formData.player_id} onChange={(e) => setFormData({...formData, player_id: e.target.value})} required>
                  <option value="">-- Choose Player --</option>
                  {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Award Type</label>
                <select className="input-field" value={formData.award_type} onChange={(e) => setFormData({...formData, award_type: e.target.value})} required>
                  <option value="MVP">Tournament MVP</option>
                  <option value="CHAMPION">Champion</option>
                  <option value="TOP_FRAGGER">Top Fragger</option>
                  <option value="BEST_SUPPORT">Best Support</option>
                  <option value="HALL_OF_FAME">Hall of Fame Inductee</option>
                  <option value="SPECIAL_AWARD">Special Recognition</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Specific Title</label>
                <input type="text" className="input-field" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Most Valuable Player 2026" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tournament (Optional)</label>
                <input type="text" className="input-field" value={formData.tournament_name} onChange={(e) => setFormData({...formData, tournament_name: e.target.value})} placeholder="e.g. Free Fire India Championship" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>CANCEL</Button>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>GENERATE AWARD</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
