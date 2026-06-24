import { classNames } from '../../utils/helpers';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  danger: 'btn-danger',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon,
  ...props
}) {
  return (
    <button
      className={classNames('btn', VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="loading-spinner loading-spinner-sm" />
      ) : icon ? (
        <span className="btn-icon-left">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
