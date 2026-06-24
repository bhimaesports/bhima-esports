import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminBEPoints() {
  const [pointSchema, setPointSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [killPoint, setKillPoint] = useState('1');
  const [placements, setPlacements] = useState([]);

  useEffect(() => {
    api.get('/points')
      .then((data) => {
        const schema = data.point_distribution || data || null;
        if (schema) {
          setPointSchema(schema);
          setTitle(schema.title || 'Free Fire Standard Points');
          setKillPoint((schema.data?.kill_point_value || 1).toString());
          setPlacements(schema.data?.placements || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePlacementChange = (idx, value) => {
    setPlacements(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], points: parseInt(value) || 0 };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        data: {
          kill_point_value: parseInt(killPoint) || 1,
          placements: placements.map(p => ({
            rank: p.rank,
            points: p.points,
          }))
        }
      };
      await api.put('/points', payload);
      alert('Points schema updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update schema.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '600px' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          ⭐ Point Distribution Editor
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Edit the rules for placements and kill points calculations across the site.</p>
      </div>

      <Card style={{ border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Schema Title</label>
            <input
              type="text"
              className="form-input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Points per Kill</label>
            <input
              type="number"
              className="form-input"
              required
              min="0"
              value={killPoint}
              onChange={(e) => setKillPoint(e.target.value)}
            />
          </div>

          <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--neon)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            Placement Ranks Points
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {placements.map((p, idx) => (
              <div key={p.rank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: 'var(--space-1)' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                  {p.rank === 1 ? '🥇 Rank 1 (Winner)' : p.rank === 2 ? '🥈 Rank 2' : p.rank === 3 ? '🥉 Rank 3' : `Rank ${p.rank}`}
                </span>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  required
                  value={p.points}
                  onChange={(e) => handlePlacementChange(idx, e.target.value)}
                  style={{ width: '100px', textAlign: 'right' }}
                />
              </div>
            ))}
          </div>

          <Button type="submit" variant="primary" loading={saving} style={{ width: '100%', marginTop: 'var(--space-4)' }}>
            {saving ? 'Saving Scheme...' : 'Update Points Distribution'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
