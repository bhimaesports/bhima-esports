import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const data = await api.get('/certificates', { search: searchTerm.trim() });
      setCerts(data.certificates || data || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="accent-line" />
        <h1>Certificates</h1>
        <p>Search and download your Bhima Esports tournament certificates.</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto var(--space-10)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by Player Name, Roll Number, or Team Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
            required
          />
          <Button type="submit" variant="primary" loading={loading}>
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" />
        </div>
      ) : searched && certs.length === 0 ? (
        <div className="glass-dark" style={{ textAlign: 'center', padding: 'var(--space-12)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          🔍 No certificates found for "{searchTerm}". Make sure your spelling is correct or check with tournament coordinators.
        </div>
      ) : certs.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
        }}>
          {certs.map((c) => (
            <Card key={c.id} className="hover-lift flex-col-between" style={{ minHeight: '230px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <Badge variant={c.type === 'winner' ? 'upcoming' : c.type === 'mvp' ? 'live' : 'neon'}>
                    {c.type === 'winner' ? '🏆 Winner' : c.type === 'mvp' ? '🎖️ MVP' : '🎮 Participant'}
                  </Badge>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(c.issued_date)}
                  </span>
                </div>

                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, margin: 'var(--space-1) 0' }}>
                  {c.player_name}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                  Roll No: {c.roll_number || 'N/A'} • Team: {c.team_name || 'N/A'}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Tournament: <strong style={{ color: 'var(--text)' }}>{c.tournament_name}</strong>
                </p>
              </div>

              <div style={{ marginTop: 'var(--space-4)' }}>
                <a
                  href={`/api/certificates/${c.cert_id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <Button variant="outline" style={{ width: '100%' }}>
                    📄 View & Print
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Enter your details above to search for participation and achievement certificates.
          </p>
        </div>
      )}
    </div>
  );
}
