import React from 'react';

export default function Terms() {
  return (
    <div className="page-wrapper" style={{ padding: '6rem 1rem 4rem' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--neon)', fontSize: '2.5rem', marginBottom: '2rem' }}>Terms of Service</h1>
        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <h3 style={{ color: 'var(--text)', margin: '2rem 0 1rem' }}>1. Acceptance of Terms</h3>
          <p>By accessing and using the Bhima Esports platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
          
          <h3 style={{ color: 'var(--text)', margin: '2rem 0 1rem' }}>2. Competitive Integrity</h3>
          <p>All players must adhere to fair play standards. Cheating, hacking, exploiting, or any form of unsportsmanlike conduct will result in immediate and permanent bans.</p>
          
          <h3 style={{ color: 'var(--text)', margin: '2rem 0 1rem' }}>3. Account Responsibilities</h3>
          <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
        </div>
      </div>
    </div>
  );
}
