import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';

export default function AdminRegistrations() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await api.get('/registrations', {
        status: statusFilter || undefined,
      });
      setRegs(data.registrations || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change registration status to ${status}?`)) return;
    try {
      await api.patch(`/registrations/${id}/status`, { status });
      fetchRegistrations();
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          📋 Registration Requests
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review, approve or reject hostel team registration requests.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              fontWeight: 600,
              background: statusFilter === s ? 'var(--neon)' : 'transparent',
              color: statusFilter === s ? 'var(--bg-primary)' : 'var(--text)',
              border: '1px solid',
              borderColor: statusFilter === s ? 'var(--neon)' : 'var(--border)',
              cursor: 'pointer',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : regs.length === 0 ? (
        <Card style={{ border: '1px solid var(--border)', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-secondary)' }}>
          No registration requests found.
        </Card>
      ) : (
        <div className="table-responsive glass-dark" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Registration No.</th>
                <th>Team Info</th>
                <th>Tournament</th>
                <th>Captain</th>
                <th>Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--neon)' }}>
                    {r.registration_number}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{r.team_name}</div>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                      Code: {r.team_code} • Dept: {r.department_code}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>{r.tournament_name}</td>
                  <td style={{ fontSize: 'var(--text-sm)' }}>
                    <div>{r.captain_name || '—'}</div>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)' }}>
                      📞 {r.captain_phone || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(r.created_at)}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: r.status === 'approved' ? 'rgba(0,255,0,0.05)' : r.status === 'pending' ? 'rgba(255,165,0,0.05)' : 'rgba(255,0,0,0.05)',
                      color: r.status === 'approved' ? 'var(--success)' : r.status === 'pending' ? 'var(--warning)' : 'var(--error)',
                      fontSize: 'var(--text-xs)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button variant="primary" size="sm" onClick={() => handleStatusChange(r.id, 'approved')}>
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleStatusChange(r.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Finalized</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
