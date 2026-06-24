import { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/UI/Card';

export default function BEPoints() {
  const [pointSchema, setPointSchema] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/points')
      .then((data) => {
        setPointSchema(data.point_distribution || data || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="accent-line" />
        <h1>BE Point System</h1>
        <p>Bhima Esports point allocation rules for matches and championships.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" />
        </div>
      ) : !pointSchema ? (
        <div className="glass-dark" style={{ textAlign: 'center', padding: 'var(--space-12)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          ⚠️ No points distribution scheme is currently configured.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
          <div>
            <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
              🏆 Placement Points
            </h3>
            <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '100px' }}>Rank</th>
                    <th style={{ textAlign: 'right', paddingRight: 'var(--space-6)' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {(pointSchema.data?.placements || []).map((p) => (
                    <tr key={p.rank} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {p.rank === 1 ? '🥇 1st' : p.rank === 2 ? '🥈 2nd' : p.rank === 3 ? '🥉 3rd' : `${p.rank}th`}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: p.points > 0 ? 'var(--text)' : 'var(--text-secondary)', paddingRight: 'var(--space-6)', fontFamily: 'var(--font-mono)' }}>
                        {p.points} PTS
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div>
              <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
                ⚔️ Kill Points
              </h3>
              <Card style={{ border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Points awarded per confirmed kill</span>
                  <span style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--neon)', fontFamily: 'var(--font-mono)' }}>
                    {pointSchema.data?.kill_point_value || 1} PTS
                  </span>
                </div>
              </Card>
            </div>

            <div>
              <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text)', marginBottom: 'var(--space-4)' }}>
                💡 Scoring System Rules
              </h3>
              <Card style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                <p>1. Total Points for a match = Placement Points + (Kills × Kill Points).</p>
                <p>2. In the event of a tie in total points, the team with more Wins (Booyah/Chicken Dinner) is placed higher.</p>
                <p>3. If wins are also tied, the team with the higher total Kill Points across the season takes precedence.</p>
                <p>4. All scores entered by match admins are final and instantly reflect on the live leaderboards.</p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
