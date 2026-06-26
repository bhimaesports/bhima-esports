import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

export default function Schedule() {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('JUN');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const months = [
    { label: 'JAN', num: '1' },
    { label: 'FEB', num: '2' },
    { label: 'MAR', num: '3' },
    { label: 'APR', num: '4' },
    { label: 'MAY', num: '5' },
    { label: 'JUN', num: '6' },
    { label: 'JUL', num: '7' },
    { label: 'AUG', num: '8' },
    { label: 'SEP', num: '9' },
    { label: 'OCT', num: '10' },
    { label: 'NOV', num: '11' },
    { label: 'DEC', num: '12' },
  ];

  const fetchSchedule = useCallback(async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        api.get('/matches'),
        api.get('/tournaments'),
      ]);

      if (mRes.data?.matches) setMatches(mRes.data.matches);
      else if (Array.isArray(mRes.data)) setMatches(mRes.data);

      if (tRes.data?.tournaments) setTournaments(tRes.data.tournaments);
      else if (Array.isArray(tRes.data)) setTournaments(tRes.data);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    
    // Listen for realtime updates from AppContext SSE
    window.addEventListener('entity_update', fetchSchedule);
    return () => window.removeEventListener('entity_update', fetchSchedule);
  }, [fetchSchedule]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" style={{ borderColor: '#000', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Get month index for filtering
  const selectedMonthIndex = months.findIndex(m => m.label === selectedMonth);

  // Group and filter tournaments by date
  const groupedTournaments = tournaments.reduce((acc, t) => {
    if (!t.date) return acc; // Skip tournaments without a set date
    const dateObj = new Date(t.date);
    if (dateObj.getMonth() !== selectedMonthIndex) return acc;
    
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(t);
    return acc;
  }, {});

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: '#F4F5F7', paddingTop: 'var(--navbar-height)' }}>
      
      {/* Huge Neon Header */}
      <div style={{ background: 'var(--neon)', padding: '5rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: '5rem', 
          fontWeight: 900, 
          margin: 0, 
          letterSpacing: '0.02em', 
          color: '#000',
          textTransform: 'uppercase'
        }}>
          SCHEDULE
        </h1>
      </div>

      {/* Date Scroller Header (White Background) */}
      <div style={{ background: '#FFF', padding: '2rem 0', borderBottom: '1px solid #E5E5E5' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '1000px' }}>

          {/* Year selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <button style={{ background: '#000', color: '#FFF', width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900 }}>{'<'}</button>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000' }}>
              {currentTime.getFullYear()} <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>📅</span>
            </h2>
            <button style={{ background: '#D1D1D1', color: '#FFF', width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900 }}>{'>'}</button>
          </div>

          <div style={{ display: 'inline-block', border: '1px solid #E5E5E5', color: '#000', padding: '0.3rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '2rem' }}>
            LATEST
          </div>

          {/* Horizontal Line */}
          <div style={{ height: '1px', background: '#E5E5E5', width: '100%', marginBottom: '1.5rem' }} />

          {/* Horizontal Months list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', padding: '0 2rem' }}>
            {months.map(m => {
              const isActive = selectedMonth === m.label;
              return (
                <div 
                  key={m.label}
                  onClick={() => setSelectedMonth(m.label)}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    cursor: 'pointer',
                    color: isActive ? '#000' : '#A0A0A0',
                    borderBottom: isActive ? '3px solid #000' : '3px solid transparent',
                    paddingBottom: '0.5rem',
                    transition: 'all 0.2s',
                    width: '40px'
                  }}
                >
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{m.num}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', marginTop: '2px' }}>{m.label}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Tournament List Area */}
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '1200px' }}>
        
        {Object.keys(groupedTournaments).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#A0A0A0', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase' }}>
            NO TOURNAMENTS SCHEDULED FOR {selectedMonth}
          </div>
        ) : (
          Object.entries(groupedTournaments).map(([dateLabel, dayTournaments]) => {
            const parts = dateLabel.split(', ');
            const weekday = parts[0];
            const dateStr = parts[1] ? parts[1].toUpperCase() : '';

            return (
              <div key={dateLabel} style={{ marginBottom: '3rem' }}>
                
                {/* Date Header Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', marginLeft: '0.5rem' }}>
                  <div style={{ width: '14px', height: '14px', background: 'var(--neon)', transform: 'skewX(-20deg)' }} />
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000' }}>
                    {weekday} <span style={{ color: '#D1D1D1', fontWeight: 400 }}>|</span> {dateStr}
                  </h3>
                </div>

                {/* Tournament Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayTournaments.map((tournament) => {
                    return (
                      <div 
                        key={tournament.id}
                        style={{ 
                          background: '#FFF', 
                          display: 'flex', 
                          alignItems: 'stretch', 
                          justifyContent: 'space-between',
                          border: '1px solid #E5E5E5',
                        }}
                      >
                        {/* Left Side: Time and Info */}
                        <div style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
                          {/* Time Column */}
                          <div style={{ 
                            fontFamily: 'var(--font-heading)', 
                            fontSize: '1.1rem', 
                            fontWeight: 900, 
                            color: '#000',
                            padding: '1.5rem 2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '100px',
                            borderRight: '1px solid #E5E5E5'
                          }}>
                            {tournament.time || 'TBD'}
                          </div>
                          
                          {/* Tournament Info Column */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem 2rem' }}>
                            <div style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {tournament.banner_url || tournament.poster_url ? (
                                <img src={tournament.banner_url || tournament.poster_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                              ) : (
                                <span style={{ fontSize: '1.8rem' }}>🛡️</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 900, margin: 0, color: '#000', textTransform: 'uppercase' }}>
                                {tournament.name}
                              </h4>
                              {(() => {
                                // Check if tournament is live based on time
                                const tourneyDate = new Date(`${tournament.date}T${tournament.time || '00:00'}:00`);
                                const timeDiff = currentTime.getTime() - tourneyDate.getTime();
                                const isLiveOrStarted = timeDiff >= 0 && tournament.status !== 'completed' && tournament.status !== 'cancelled';
                                
                                if (tournament.status === 'live' || isLiveOrStarted) {
                                  return (
                                    <span style={{ color: 'var(--error)', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                      <span style={{ width: '6px', height: '6px', background: 'var(--error)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                                      LIVE NOW
                                    </span>
                                  );
                                } else if (tournament.status === 'completed') {
                                  return (
                                    <span style={{ color: '#A0A0A0', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                      COMPLETED
                                    </span>
                                  );
                                } else if (tournament.status === 'cancelled') {
                                  return (
                                    <span style={{ color: 'var(--error)', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                      CANCELLED
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0 2rem' }}>
                          <button style={{ 
                            background: '#000', 
                            color: 'var(--neon)', 
                            padding: '0.5rem 1.2rem', 
                            border: 'none', 
                            fontFamily: 'var(--font-heading)', 
                            fontSize: '0.75rem', 
                            fontWeight: 900, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            cursor: 'pointer' 
                          }}>
                            <span style={{ fontSize: '1rem', lineHeight: 1 }}>▷</span> VOD
                          </button>
                          <button style={{ 
                            background: '#000', 
                            color: 'var(--neon)', 
                            padding: '0.5rem 1.2rem', 
                            border: 'none', 
                            fontFamily: 'var(--font-heading)', 
                            fontSize: '0.75rem', 
                            fontWeight: 900, 
                            cursor: 'pointer' 
                          }}>
                            RESULT
                          </button>
                          <button style={{ 
                            background: '#000', 
                            color: 'var(--neon)', 
                            padding: '0.5rem 1.2rem', 
                            border: 'none', 
                            fontFamily: 'var(--font-heading)', 
                            fontSize: '0.75rem', 
                            fontWeight: 900, 
                            cursor: 'pointer' 
                          }}>
                            PARTICIPATING TEAM
                          </button>
                        </div>
                        
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
