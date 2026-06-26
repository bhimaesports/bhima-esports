import { classNames } from '../../utils/helpers';
import { motion } from 'framer-motion';

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
  style = {},
  ...props
}) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, filter: 'brightness(1.1)' } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={classNames('btn', VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      style={{
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
        fontFamily: 'var(--font-heading)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 700,
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span className="loading-spinner loading-spinner-sm" />
      ) : icon ? (
        <span className="btn-icon-left">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}
