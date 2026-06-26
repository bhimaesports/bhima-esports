import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/UI/Button';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '8rem', lineHeight: 1, margin: 0 }}>404</h1>
        <h2 style={{ fontSize: '2rem', color: 'var(--text)', margin: '1rem 0' }}>PAGE NOT FOUND</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The zone has closed. This page is out of bounds.</p>
        <Link to="/">
          <Button variant="primary">RETURN TO SAFE ZONE</Button>
        </Link>
      </motion.div>
    </div>
  );
}
