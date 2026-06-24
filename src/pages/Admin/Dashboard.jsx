import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import Card from '../../components/UI/Card';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const { stats = {}, recentRegistrations = [], recentLogs = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, textTransform: 'uppercase', color: 'var(--neon)' }}>
          ⚡ Dashboard Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to the Bhima Esports Control Panel.</p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {[
          { label: 'Total Teams', value: stats.teams?.total || 0, icon: '👥', color: 'var(--neon)' },
          { label: 'Total Players', value: stats.players?.total || 0, icon: '🎮', color: 'var(--text)' },
          { label: 'Total Tournaments', value: stats.tournaments?.total || 0, icon: '🏆', color: 'var(--info)' },
          { label: 'Total Registrations', value: stats.registrations?.total || 0, icon: '📋', color: 'var(--warning)' },
          { label: 'Total Matches', value: stats.matches?.total || 0, icon: '⚔️', color: 'var(--error)' },
          { label: 'Certificates Issued', value: stats.certificates || 0, icon: '📜', color: 'var(--neon)' },
        ].map((s, idx) => (
          <Card key={idx} style={{ border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{s.label}</span>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900, color: s.color, marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {s.value}
              </div>
            </div>
            <div style={{ fontSize: '2.5rem', opacity: 0.8 }}>{s.icon}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
        {/* Recent Registrations */}
        <Card style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--neon)' }}>
            📋 Recent Registrations
          </h3>
          {recentRegistrations.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>No registrations found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {recentRegistrations.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-2)' }}>
                  <div>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{r.team_name}</strong>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      Tournament: {r.tournament_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: r.status === 'approved' ? 'rgba(0,255,0,0.05)' : r.status === 'pending' ? 'rgba(255,165,0,0.05)' : 'rgba(255,0,0,0.05)',
                      color: r.status === 'approved' ? 'var(--success)' : r.status === 'pending' ? 'var(--warning)' : 'var(--error)',
                      fontSize: 'var(--text-2xs)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}>
                      {r.status}
                    </span>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatDate(r.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity Feed */}
        <Card style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <h3 style={{ textTransform: 'uppercase', fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--neon)' }}>
            ⚡ Recent Activity
          </h3>
          {recentLogs.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>No recent activity.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {recentLogs.map((log) => {
                let icon = '📌';
                if (log.action.includes('TEAM')) icon = '🛡️';
                if (log.action.includes('PLAYER')) icon = '👤';
                if (log.action.includes('TOURNAMENT')) icon = '🏆';
                if (log.action.includes('CERTIFICATE')) icon = '📜';

                return (
                  <div key={log.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-3)' }}>
                    <div style={{ fontSize: '24px', background: 'var(--bg-lighter)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
                          {log.action.replace(/_/g, ' ')}
                        </strong>
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {log.details}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
