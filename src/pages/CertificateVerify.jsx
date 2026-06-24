import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';

export default function CertificateVerify() {
  const { certId } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get(`/certificates/${certId}/verify`)
      .then((data) => {
        setCert(data.certificate || data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Certificate not found or invalid.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [certId]);

  return (
    <div className="page-wrapper container" style={{
      paddingTop: 'var(--space-16)',
      paddingBottom: 'var(--space-20)',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <img
          src="/assets/logo.png"
          alt="Bhima Esports Logo"
          style={{ height: '70px', filter: 'drop-shadow(0 0 10px rgba(215,255,0,0.3))', marginBottom: 'var(--space-3)' }}
        />
        <h1 style={{ fontSize: 'var(--text-xl)', textTransform: 'uppercase', fontWeight: 900 }}>
          Certificate Verification
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          Official verification portal of Bhima Esports Hostel Championship.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <div className="loading-spinner" />
        </div>
      ) : error ? (
        <Card style={{
          maxWidth: '500px',
          width: '100%',
          border: '1px solid var(--error)',
          background: 'rgba(255, 59, 48, 0.02)',
          textAlign: 'center',
          padding: 'var(--space-8)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>❌</div>
          <h2 style={{ color: 'var(--error)', textTransform: 'uppercase', fontSize: 'var(--text-md)', fontWeight: 800 }}>
            Verification Failed
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-3) 0', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
            The certificate ID <strong>{certId}</strong> does not match any registered credentials in the Bhima Esports database.
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            This might be a forged certificate or incorrect ID.
          </p>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Link to="/certificates" style={{ textDecoration: 'none' }}>
              <Badge variant="neon">Look up Certificates</Badge>
            </Link>
          </div>
        </Card>
      ) : (
        <Card style={{
          maxWidth: '600px',
          width: '100%',
          border: cert.status === 'revoked'
            ? '1.5px solid var(--error)'
            : cert.status === 'reissued'
              ? '1.5px solid var(--warning)'
              : '1.5px solid var(--neon)',
          background: 'linear-gradient(135deg, rgba(15,15,35,0.7) 0%, rgba(20,20,50,0.4) 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: 'var(--space-8)'
        }}>
          {/* Authenticity Watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-20deg)',
            fontFamily: 'var(--font-heading)',
            fontSize: '5rem',
            fontWeight: 900,
            color: cert.status === 'revoked'
              ? 'rgba(255, 59, 48, 0.03)'
              : 'rgba(215, 255, 0, 0.03)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            {cert.status === 'revoked' ? 'REVOKED' : 'VERIFIED'}
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Status Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Certificate ID
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  {cert.cert_id}
                </div>
              </div>
              <Badge variant={cert.status === 'active' ? 'live' : cert.status === 'reissued' ? 'upcoming' : 'banned'}>
                {cert.status === 'active'
                  ? '✅ Active & Verified'
                  : cert.status === 'reissued'
                    ? '⚠️ Reissued'
                    : '❌ Revoked'}
              </Badge>
            </div>

            {/* Recipient Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Awarded To
                </span>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--neon)' }}>
                  {cert.player_name}
                </h3>
                {cert.roll_number && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Roll Number: {cert.roll_number}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Team
                  </span>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                    {cert.team_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Department
                  </span>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                    {cert.department || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Tournament
                </span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  {cert.tournament_name || 'N/A'}
                </div>
                {cert.position && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--neon)', fontWeight: 600 }}>
                    Position: {cert.position}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Award Type
                  </span>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>
                    {cert.award_type || cert.type}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Issue Date
                  </span>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text)' }}>
                    {formatDate(cert.issued_date)}
                  </div>
                </div>
              </div>
            </div>

            {/* If Revoked */}
            {cert.status === 'revoked' && (
              <div style={{
                background: 'rgba(255, 59, 48, 0.05)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                color: 'var(--error)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
                marginBottom: 'var(--space-6)'
              }}>
                <strong>Reason for Revocation:</strong> {cert.revocation_reason || 'Administrative decision.'}
              </div>
            )}

            {/* If Reissued */}
            {cert.status === 'reissued' && cert.reissued_from && (
              <div style={{
                background: 'rgba(255, 165, 0, 0.05)',
                border: '1px solid var(--warning)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                color: 'var(--warning)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
                marginBottom: 'var(--space-6)'
              }}>
                <strong>Notice:</strong> This certificate has been reissued. The current valid certificate can be accessed by clicking the button below.
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', marginTop: 'var(--space-2)' }}>
              {cert.status !== 'revoked' && (
                <a
                  href={`/api/certificates/${cert.cert_id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <button className="btn btn-outline" style={{ width: '100%', padding: '10px' }}>
                    📄 View Certificate
                  </button>
                </a>
              )}
              <Link to="/certificates" style={{ textDecoration: 'none', flex: cert.status === 'revoked' ? 1 : 1 }}>
                <button className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                  Search Another
                </button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
