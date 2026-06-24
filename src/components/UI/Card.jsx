import { classNames } from '../../utils/helpers';

export default function Card({
  children,
  className = '',
  glass = false,
  glow = false,
  noPadding = false,
  onClick,
  style,
}) {
  return (
    <div
      className={classNames(
        glass ? 'glass' : 'card',
        glow && 'card-glow',
        noPadding && 'no-pad',
        className
      )}
      onClick={onClick}
      style={{
        ...style,
        ...(noPadding ? { padding: 0 } : {}),
        ...(onClick ? { cursor: 'pointer' } : {}),
      }}
    >
      {children}
    </div>
  );
}
