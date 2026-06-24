import { useState, useEffect } from 'react';
import api from '../utils/api';
import Card from '../components/UI/Card';

export default function HallOfFame() {
  const [entries, setEntries] = useState([]);
  const [mvps, setMvps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHallOfFame = async () => {
    try {
      const data = await api.get('/hall-of-fame');
      setEntries(data.entries || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMVPs = async () => {
    try {
      const data = await api.get('/players', { limit: 100 });
      const list = data.players || data || [];
      // Sort by mvp_awards desc, then kills desc
      const sorted = [...list]
        .sort((a, b) => {
          if ((b.mvp_awards || 0) !== (a.mvp_awards || 0)) {
            return (b.mvp_awards || 0) - (a.mvp_awards || 0);
          }
          return (b.kills || 0) - (a.kills || 0);
        })
        .slice(0, 3); // Get top 3
      setMvps(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchHallOfFame(), fetchMVPs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();

    // Listen for SSE real-time update event
    const handleUpdate = () => {
      fetchHallOfFame();
    };
    window.addEventListener('hall-of-fame-update', handleUpdate);
    return () => window.removeEventListener('hall-of-fame-update', handleUpdate);
  }, []);

  // Helper to choose a game-based icon
  const getGameIcon = (game) => {
    const cleanGame = game?.toLowerCase() || '';
    if (cleanGame.includes('freefire')) return '🔥';
    if (cleanGame.includes('bgmi')) return '⚔️';
    if (cleanGame.includes('cod')) return '🛡️';
    return '🎮';
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="accent-line" />
        <h1>Hall of Fame</h1>
        <p>Honor role of Bhima Hostel esports champions and legendary players.</p>
      </div>

      {/* Dynamic Inductees */}
      <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
        🏆 Hall of Fame Inductees
      </h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-dark" style={{ textAlign: 'center', padding: 'var(--space-12)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', marginBottom: 'var(--space-12)' }}>
          🏅 No members inducted into the Hall of Fame yet. Admin can induct them from the Admin Panel.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-12)',
        }}>
          {entries.map((c) => (
            <Card key={c.id} className="hover-lift" style={{ border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                right: '-10px',
                bottom: '-10px',
                fontSize: '6rem',
                opacity: 0.05,
                userSelect: 'none',
              }}>
                🏆
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>
                  {c.type === 'team' && c.team_logo ? (
                    <img
                      src={c.team_logo}
                      alt={c.team_name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--neon)' }}
                    />
                  ) : (
                    getGameIcon(c.game)
                  )}
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {c.game} Inductee
                  </span>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text)', margin: '4px 0' }}>
                    {c.type === 'team' ? c.team_name : c.player_name}
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                    {c.type === 'team' ? `Department: ${c.team_dept_code || '—'}` : `IGN: ${c.player_uid || '—'} • Dept: ${c.player_dept_code || '—'}`}
                  </p>
                  <div style={{
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '2px solid var(--neon)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text)',
                    lineHeight: 1.4,
                  }}>
                    {c.reason}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Player MVP Spotlight */}
      <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--neon)', marginBottom: 'var(--space-4)' }}>
        🎖️ Live Player MVP Spotlight
      </h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" />
        </div>
      ) : mvps.length === 0 ? (
        <div className="glass-dark" style={{ textAlign: 'center', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          🏅 No matches have been recorded yet. MVP data will update once matches are entered.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          {mvps.map((p, idx) => (
            <Card key={p.id} className="hover-lift" style={{ border: '1px solid var(--border)', background: idx === 0 ? 'rgba(215,255,0,0.02)' : 'var(--bg-card)', borderColor: idx === 0 ? 'var(--neon)' : 'var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                <span style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 900,
                  color: idx === 0 ? 'var(--gold)' : 'var(--text-secondary)',
                }}>
                  #{idx + 1}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.05)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--text)',
                }}>
                  {p.department_code}
                </span>
              </div>

              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, marginBottom: 'var(--space-1)' }}>
                {p.name}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
                IGN: {p.uid || '—'}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                borderTop: '1px solid var(--border)',
                paddingTop: 'var(--space-3)',
                textAlign: 'center',
              }}>
                <div>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>MVPs</span>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--neon)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {p.mvp_awards || 0}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Kills</span>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {p.kills || 0}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Matches</span>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {p.matches_played || 0}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
