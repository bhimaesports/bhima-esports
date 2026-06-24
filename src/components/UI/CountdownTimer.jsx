import { useState, useEffect, useCallback } from 'react';
import { getCountdown } from '../../utils/helpers';

export default function CountdownTimer({ targetDate, label = 'Next Tournament' }) {
  const [time, setTime] = useState(() => getCountdown(targetDate));

  const tick = useCallback(() => {
    setTime(getCountdown(targetDate));
  }, [targetDate]);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  if (time.expired) {
    return (
      <div className="countdown" style={styles.wrapper}>
        <span style={styles.label}>{label}</span>
        <div style={styles.live}>
          <span className="badge-live badge">● LIVE NOW</span>
        </div>
      </div>
    );
  }

  const units = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hrs' },
    { value: time.minutes, label: 'Min' },
    { value: time.seconds, label: 'Sec' },
  ];

  return (
    <div style={styles.wrapper}>
      {label && <span style={styles.label}>{label}</span>}
      <div style={styles.grid}>
        {units.map((u, i) => (
          <div key={u.label} style={styles.unit}>
            <span style={styles.value}>{String(u.value).padStart(2, '0')}</span>
            <span style={styles.unitLabel}>{u.label}</span>
            {i < units.length - 1 && <span style={styles.sep}>:</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  label: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
  },
  grid: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
  },
  unit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    minWidth: '60px',
  },
  value: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-4xl)',
    fontWeight: '800',
    color: 'var(--text)',
    lineHeight: '1',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.5rem 0.75rem',
    minWidth: '56px',
    textAlign: 'center',
  },
  unitLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.625rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginTop: '0.375rem',
  },
  sep: {
    position: 'absolute',
    right: '-8px',
    top: '8px',
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-2xl)',
    fontWeight: '700',
    color: 'var(--neon)',
  },
  live: {
    padding: '1rem',
  },
};
