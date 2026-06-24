import { classNames, getStatusBadgeClass } from '../../utils/helpers';

export default function Badge({ children, variant, status, className = '' }) {
  const badgeClass = status ? getStatusBadgeClass(status) : variant ? `badge-${variant}` : 'badge-neon';

  return (
    <span className={classNames('badge', badgeClass, className)}>
      {status === 'live' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#FF6666', marginRight: 4 }} />}
      {children || status?.toUpperCase() || variant?.toUpperCase()}
    </span>
  );
}
