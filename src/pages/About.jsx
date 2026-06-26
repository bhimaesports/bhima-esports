import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function About() {
  const { settings } = useApp();
  return (
    <div className="page-wrapper" style={{ padding: '6rem 1rem 4rem' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '3rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
            {settings?.cms_page_about_title || 'About Bhima Esports'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            {settings?.cms_page_about_sub || 'We are the ultimate collegiate and professional esports management platform, dedicated to elevating the competitive gaming experience to a Tier-1 standard.'}
          </p>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: 8, border: '1px solid var(--border)' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Our Mission</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              To provide players and teams with a world-class competitive environment where talent is recognized, statistics are meticulously tracked, and champions are forged. We organize high-stakes tournaments, foster a growing community of elite gamers, and maintain a rigorous standard of competitive integrity.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
