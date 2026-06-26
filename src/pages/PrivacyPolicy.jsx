import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="page-wrapper" style={{ padding: '6rem 1rem 4rem' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '2.5rem', marginBottom: '2rem' }}>Privacy Policy</h1>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <p style={{ marginBottom: '1rem' }}>Last updated: {new Date().toLocaleDateString()}</p>
          <h3 style={{ color: 'var(--text)', margin: '2rem 0 1rem' }}>1. Information We Collect</h3>
          <p>We collect information you provide directly to us when you register for an account, participate in tournaments, or communicate with us. This includes your name, IGN, department, and email address.</p>
          
          <h3 style={{ color: 'var(--text)', margin: '2rem 0 1rem' }}>2. How We Use Your Information</h3>
          <p>We use the information we collect to operate, maintain, and provide the features and functionality of the Bhima Esports platform, including leaderboards and tournament brackets.</p>
          
          <h3 style={{ color: 'var(--text)', margin: '2rem 0 1rem' }}>3. Data Security</h3>
          <p>We implement robust security measures to ensure that your personal information and game statistics are protected against unauthorized access.</p>
        </div>
      </div>
    </div>
  );
}
