import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import Badge from '../components/UI/Badge';

export default function TournamentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        // Fetch all and filter, since there is no /tournaments/:id public endpoint
        const data = await api.get('/tournaments');
        const list = data.tournaments || data || [];
        const found = list.find(t => t.id === parseInt(id));
        setTournament(found);
      } catch (err) {
        console.error('Error fetching tournament details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTournament();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>TOURNAMENT NOT FOUND</h2>
        <Link to="/tournaments" style={{ color: 'var(--neon)', marginTop: '1rem', textDecoration: 'underline' }}>Back to Tournaments</Link>
      </div>
    );
  }

  // Dynamic Button Logic
  const now = new Date();
  const startDate = new Date(tournament.start_date);
  const deadlineDate = tournament.registration_deadline ? new Date(tournament.registration_deadline) : startDate;
  
  let btnState = 'register'; // register, closed, live, completed
  if (tournament.status === 'completed') {
    btnState = 'completed';
  } else if (tournament.status === 'live' || (now >= startDate && tournament.status !== 'completed')) {
    btnState = 'live';
  } else if (now > deadlineDate) {
    btnState = 'closed';
  }

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh' }}>
      
      {/* Hero Banner */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '400px', 
        background: '#111',
        backgroundImage: tournament.banner_url ? `url(${tournament.banner_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-end'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.2) 100%)' }} />
        
        <div className="container" style={{ position: 'relative', zIndex: 2, paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Badge variant={
              tournament.status === 'upcoming' ? 'neon' : 
              tournament.status === 'live' ? 'danger' : 'muted'
            }>
              {tournament.status.toUpperCase()}
            </Badge>
            {tournament.game && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {tournament.game}
              </span>
            )}
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: 'clamp(2rem, 5vw, 4rem)', 
            textTransform: 'uppercase', 
            margin: '0 0 1rem 0',
            lineHeight: 1.1,
            color: 'var(--text)' 
          }}>
            {tournament.name}
          </h1>
          <p style={{ 
            fontFamily: 'var(--font-body)', 
            fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', 
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: 0
          }}>
            {tournament.description || 'Join the ultimate battle and prove your department is the best.'}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '4rem 0', display: 'grid', gridTemplateColumns: '1fr', gap: '4rem' }}>
        
        {/* Main Content & Registration CTA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Details Grid */}
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)',
            padding: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem'
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Prize Pool</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--neon)', fontWeight: 800 }}>
                {tournament.prize_pool ? `₹${tournament.prize_pool}` : 'TBA'}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Start Date</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text)', fontWeight: 700 }}>
                {formatDate(tournament.start_date)}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Registration Deadline</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: btnState === 'closed' ? '#ff3366' : 'var(--text)', fontWeight: 700 }}>
                {tournament.registration_deadline ? formatDate(tournament.registration_deadline) : 'Prior to Start'}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Entry Fee</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text)', fontWeight: 700 }}>
                {tournament.entry_fee ? `₹${tournament.entry_fee}` : 'Free Entry'}
              </div>
            </div>
          </div>

          {/* Registration CTA Action Block */}
          <div style={{ 
            background: '#050505', 
            border: '1px solid var(--neon)',
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
              {btnState === 'register' ? 'Ready to Compete?' : 
               btnState === 'closed' ? 'Registrations Closed' : 
               btnState === 'live' ? 'Tournament is Live' : 'Tournament Completed'}
            </h3>
            
            {btnState === 'register' && (
              <button 
                className="btn"
                style={{ 
                  background: 'var(--neon)', 
                  color: '#000', 
                  fontSize: '1.1rem', 
                  padding: '1rem 3rem',
                  width: '100%',
                  fontWeight: 900
                }}
                onClick={() => navigate(`/tournament-register?tournament_id=${tournament.id}`)}
              >
                REGISTER NOW
              </button>
            )}
            
            {btnState === 'closed' && (
              <button 
                className="btn"
                disabled
                style={{ 
                  background: 'transparent', 
                  color: 'var(--text-muted)', 
                  border: '1px solid var(--text-muted)',
                  fontSize: '1.1rem', 
                  padding: '1rem 3rem',
                  width: '100%',
                  cursor: 'not-allowed',
                  fontWeight: 900
                }}
              >
                REGISTRATION CLOSED
              </button>
            )}

            {btnState === 'live' && (
              <button 
                className="btn"
                style={{ 
                  background: '#ff3366', 
                  color: '#fff', 
                  fontSize: '1.1rem', 
                  padding: '1rem 3rem',
                  width: '100%',
                  animation: 'pulse 2s infinite',
                  fontWeight: 900
                }}
              >
                WATCH LIVE
              </button>
            )}

            {btnState === 'completed' && (
              <button 
                className="btn"
                style={{ 
                  background: 'var(--bg-card)', 
                  color: 'var(--text)', 
                  fontSize: '1.1rem', 
                  padding: '1rem 3rem',
                  width: '100%',
                  fontWeight: 900
                }}
              >
                VIEW RESULTS
              </button>
            )}
            
            <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {btnState === 'register' ? 'Make sure you have your team ready before registering.' : 
               btnState === 'live' ? 'Matches are currently underway.' : ''}
            </p>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
