import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="page-wrapper" style={{ padding: '6rem 1rem 4rem' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '3rem', textTransform: 'uppercase' }}>Contact Us</h1>
            <p style={{ color: 'var(--text-muted)' }}>Get in touch with the Bhima Esports administration team.</p>
          </div>

          <Card glow={true}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h3 style={{ color: 'var(--neon)', marginBottom: '1rem' }}>Message Sent!</h3>
                <p style={{ color: 'var(--text-muted)' }}>We will get back to you shortly.</p>
                <Button onClick={() => setSubmitted(false)} style={{ marginTop: '2rem' }}>Send Another</Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Name</label>
                  <input type="text" className="input-field" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                  <input type="email" className="input-field" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Message</label>
                  <textarea className="input-field" rows="5" required></textarea>
                </div>
                <Button type="submit" variant="primary">SEND MESSAGE</Button>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
