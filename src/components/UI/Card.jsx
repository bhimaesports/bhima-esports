import { classNames } from '../../utils/helpers';
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  glass = false,
  glow = false,
  noPadding = false,
  onClick,
  style,
  delay = 0,
}) {
  const isClickable = !!onClick;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={isClickable ? { scale: 1.02, y: -4, boxShadow: '0 0 20px rgba(215,255,0,0.15)' } : {}}
      className={classNames(
        glass ? 'glass' : 'card',
        glow && 'card-glow',
        noPadding && 'no-pad',
        className
      )}
      onClick={onClick}
      style={{
        clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)',
        position: 'relative',
        ...style,
        ...(noPadding ? { padding: 0 } : {}),
        ...(isClickable ? { cursor: 'pointer' } : {}),
      }}
    >
      {/* Sci-fi top-left notch accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 15,
        height: 2,
        background: 'var(--neon)',
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 2,
        height: 15,
        background: 'var(--neon)',
      }} />
      
      {children}
    </motion.div>
  );
}
