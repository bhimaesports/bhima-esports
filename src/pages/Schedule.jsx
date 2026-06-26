import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function Schedule() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await api.get('/tournaments');
      setTournaments(res.tournaments || res.data?.tournaments || res.data || res || []);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    window.addEventListener('entity_update', fetchSchedule);
    return () => window.removeEventListener('entity_update', fetchSchedule);
  }, [fetchSchedule]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate a range of years from 2024 to 2030
  const yearsList = Array.from({length: 7}, (_, i) => 2024 + i);

  const getTournamentsForDay = (day) => {
    return tournaments.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return tDate.getDate() === day && tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
  };

  const getTournamentStatus = (t) => {
    if (t.status === 'completed') return 'COMPLETED';
    if (t.status === 'cancelled') return 'CANCELLED';
    
    // Parse the date properly for browsers
    const tDate = new Date(`${t.date}T${t.time || '00:00'}:00`);
    
    if (t.status === 'live') return 'LIVE';
    if (tDate.toDateString() === now.toDateString()) {
      return now.getTime() >= tDate.getTime() ? 'LIVE' : 'UPCOMING';
    }
    
    return now.getTime() > tDate.getTime() ? 'COMPLETED' : 'UPCOMING';
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" style={{ borderColor: 'var(--neon)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // Build calendar cells
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`} className="calendar-cell empty" />);
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayTournaments = getTournamentsForDay(day);
    const isToday = day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear();

    return (
      <div key={`day-${day}`} className={`calendar-cell ${isToday ? 'today' : ''}`}>
        <div className="date-number">{day}</div>
        <div className="events-container">
          {dayTournaments.map(t => {
            const status = getTournamentStatus(t);
            return (
              <Link to={`/tournaments`} key={t.id} className={`event-card status-${status.toLowerCase()}`}>
                <div className="event-header">
                  {status === 'LIVE' ? <span className="live-dot" /> : <span />}
                  <span className="event-time">{t.time || 'TBA'}</span>
                  <span className="event-game">{getGameIcon(t.game)}</span>
                </div>
                <div className="event-title">{t.name}</div>
                <div className="event-status">{status}</div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  });

  function getGameIcon(game) {
    const clean = game?.toLowerCase() || '';
    if (clean.includes('freefire')) return '🔥';
    if (clean.includes('bgmi')) return '⚔️';
    if (clean.includes('cod')) return '🛡️';
    return '🎮';
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="page-wrapper container" 
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)', minHeight: '100vh' }}
    >
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <motion.div className="accent-line" initial={{ width: 0 }} animate={{ width: '40px' }} />
        <h1 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', color: 'var(--text)' }}>Full Schedule</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Esports tournament calendar. Check match dates and live statuses.
        </p>
      </div>

      <div className="calendar-wrapper">
        {/* Navigation */}
        <div className="calendar-nav">
          <button onClick={handlePrevMonth}>◀</button>
          <div className="calendar-selectors">
            <select 
              value={currentMonth} 
              onChange={(e) => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1))}
              className="calendar-select"
            >
              {monthsList.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            
            <select 
              value={currentYear} 
              onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))}
              className="calendar-select"
            >
              {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={handleNextMonth}>▶</button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {blanks}
          {days}
        </div>
      </div>

      <style>{`
        .calendar-wrapper {
          background: #0A0A0A;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }
        .calendar-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #111;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--border);
        }
        .calendar-nav h2 {
          margin: 0;
          font-family: var(--font-heading);
          color: var(--neon);
          text-transform: uppercase;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
        }
        .calendar-selectors {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .calendar-select {
          background: #000;
          color: #FFF;
          border: 1px solid var(--border);
          padding: 0.5rem 1.5rem;
          border-radius: 4px;
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
          background-repeat: no-repeat;
          background-position-x: 95%;
          background-position-y: center;
          padding-right: 2.5rem;
        }
        .calendar-select:hover, .calendar-select:focus {
          border-color: var(--neon);
          color: var(--neon);
          box-shadow: 0 0 10px rgba(215, 255, 0, 0.1);
          background-image: url("data:image/svg+xml;utf8,<svg fill='%23D7FF00' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
        }
        .calendar-nav button {
          background: transparent;
          border: 1px solid var(--border);
          color: #FFF;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-weight: bold;
          font-family: var(--font-heading);
          transition: all 0.2s;
        }
        .calendar-nav button:hover {
          background: var(--neon);
          color: #000;
          border-color: var(--neon);
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          background: var(--border);
          gap: 1px;
        }
        .calendar-day-header {
          background: #0A0A0A;
          padding: 1rem;
          text-align: center;
          font-family: var(--font-heading);
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 0.9rem;
        }
        .calendar-cell {
          background: #0A0A0A;
          min-height: 140px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .calendar-cell.empty {
          background: #050505;
        }
        .calendar-cell.today {
          background: rgba(215, 255, 0, 0.03);
        }
        .calendar-cell.today .date-number {
          background: var(--neon);
          color: #000;
        }
        .date-number {
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: 800;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          color: #888;
        }
        .events-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .event-card {
          text-decoration: none;
          background: #151515;
          border: 1px solid #222;
          border-left: 3px solid #555;
          padding: 0.5rem;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.2s;
        }
        .event-card:hover {
          transform: translateY(-2px);
          background: #1A1A1A;
          border-color: #333;
        }
        .event-card.status-upcoming {
          border-left-color: #3B82F6;
        }
        .event-card.status-live {
          border-left-color: var(--error);
          background: rgba(255, 51, 102, 0.05);
        }
        .event-card.status-completed {
          border-left-color: #A0A0A0;
          opacity: 0.6;
        }
        .event-card.status-completed:hover {
          opacity: 1;
        }
        .event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.7rem;
          font-family: var(--font-mono);
          color: #AAA;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          background: var(--error);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        .event-title {
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 800;
          color: #FFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .event-status {
          font-size: 0.65rem;
          font-family: var(--font-heading);
          font-weight: 800;
          text-transform: uppercase;
        }
        .status-upcoming .event-status { color: #3B82F6; }
        .status-live .event-status { color: var(--error); }
        .status-completed .event-status { color: #A0A0A0; }
        
        @keyframes pulse {
          0% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 51, 102, 0.7); }
          70% { opacity: 0.5; box-shadow: 0 0 0 6px rgba(255, 51, 102, 0); }
          100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 51, 102, 0); }
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
          .calendar-selectors {
            flex-direction: column;
            gap: 0.5rem;
          }
          .calendar-select {
            font-size: 0.9rem;
            padding: 0.4rem 1rem;
            padding-right: 2rem;
          }
          .calendar-grid {
            display: flex;
            flex-direction: column;
            gap: 0;
            background: #0A0A0A;
          }
          .calendar-day-header {
            display: none;
          }
          .calendar-cell.empty {
            display: none;
          }
          .calendar-cell {
            min-height: auto;
            border-bottom: 1px solid var(--border);
            padding: 1rem;
            flex-direction: row;
            align-items: flex-start;
          }
          .events-container {
            flex: 1;
            margin-left: 1rem;
          }
        }
      `}</style>
    </motion.div>
  );
}
