export default function StatCard({ icon, value, label, change, className = '' }) {
  const isPositive = change && !String(change).startsWith('-');

  return (
    <div className={`stat-card ${className}`}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change != null && (
        <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲' : '▼'} {String(change).replace('-', '')}
        </div>
      )}
    </div>
  );
}
