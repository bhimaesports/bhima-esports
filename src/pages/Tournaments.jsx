import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate, formatTime, getStatusBadgeClass } from '../utils/helpers';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await api.get('/tournaments', {
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setTournaments(data.tournaments || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [statusFilter, searchTerm]);

  return (
    <div className="page-wrapper container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="accent-line" />
        <h1>Tournaments</h1>
        <p>Participate in tournaments, challenge rivals and climb the ranks.</p>
      </div>

      {/* Filters and Search */}
      <div className="glass-dark" style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        marginBottom: 'var(--space-8)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['', 'upcoming', 'live', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.05em',
                background: statusFilter === status ? 'var(--neon)' : 'transparent',
                color: statusFilter === status ? 'var(--bg-primary)' : 'var(--text)',
                border: '1px solid',
                borderColor: statusFilter === status ? 'var(--neon)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {status || 'All'}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="🔍 Search tournaments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="glass-dark" style={{
          textAlign: 'center',
          padding: 'var(--space-16) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}>
          🎮 No tournaments found matching your criteria.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          {tournaments.map((t) => (
            <Card key={t.id} className="hover-lift flex-col-between" style={{ minHeight: '400px' }}>
              <div>
                {/* Poster */}
                <div style={{
                  position: 'relative',
                  height: '180px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  margin: 'calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4)',
                  overflow: 'hidden',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <img
                    src={t.poster_url || '/assets/logo.png'}
                    alt={t.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: t.poster_url ? 'cover' : 'contain',
                      opacity: t.poster_url ? 0.8 : 0.2,
                    }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <Badge variant={t.status === 'live' ? 'live' : t.status === 'upcoming' ? 'upcoming' : 'neon'}>
                      {t.status}
                    </Badge>
                  </div>
                </div>

                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>
                  {t.name}
                </h3>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', margin: 'var(--space-4) 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>📅 Date</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{formatDate(t.date)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>⏰ Time</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{t.time || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>👥 Slots</span>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                      {t.registered_count || 0} / {t.team_slots || 0} Filled
                    </span>
                  </div>
                  {t.registration_deadline && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>⏳ Deadline</span>
                      <span style={{ color: 'var(--error)', fontWeight: 500 }}>{formatDate(t.registration_deadline)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTournament(t)}
                  style={{ flex: 1 }}
                >
                  Rules & Info
                </Button>
                {t.status === 'open' && (t.registered_count || 0) < (t.team_slots || 0) ? (
                  <Link to="/register" style={{ flex: 1 }}>
                    <Button variant="primary" style={{ width: '100%' }}>Register</Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled style={{ flex: 1 }}>
                    {t.status === 'open' ? 'Full' : 'Closed'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rules Modal */}
      {selectedTournament && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 'var(--z-modal)',
          padding: 'var(--space-4)',
        }}>
          <div className="glass-dark" style={{
            width: '100%',
            maxWidth: '550px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: 'var(--space-6)',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon)' }}>
                ⚔️ {selectedTournament.name} Details
              </h2>
              <button
                onClick={() => setSelectedTournament(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: 'var(--text-lg)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', color: 'var(--text-secondary)' }}>
              <div>
                <h4 style={{ color: 'var(--text)', marginBottom: 'var(--space-1)' }}>🏆 Prize Details</h4>
                <p style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedTournament.prize_details || 'Will be announced soon!'}
                </p>
              </div>

              <div>
                <h4 style={{ color: 'var(--text)', marginBottom: 'var(--space-1)' }}>📜 Tournament Rules</h4>
                <p style={{ fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {selectedTournament.rules || 'Standard rules apply. Play fair and respect competitors.'}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <Button variant="primary" onClick={() => setSelectedTournament(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
