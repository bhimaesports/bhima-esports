import { useEffect, useRef } from 'react';

export default function Particles({ count = 30 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 3 + 1;
      const x = Math.random() * 100;
      const duration = Math.random() * 15 + 10;
      const delay = Math.random() * 10;
      const opacity = Math.random() * 0.4 + 0.1;

      Object.assign(particle.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}%`,
        bottom: '-10px',
        borderRadius: '50%',
        background: Math.random() > 0.7 ? 'var(--neon)' : 'rgba(255,255,255,0.6)',
        opacity: opacity,
        animation: `particleFloat ${duration}s linear ${delay}s infinite`,
        pointerEvents: 'none',
      });

      container.appendChild(particle);
    }

    return () => {
      container.innerHTML = '';
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
