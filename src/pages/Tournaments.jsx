import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import Badge from '../components/UI/Badge';
import Button from '../components/UI/Button';

// Variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(null);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const data = await api.get('/tournaments', {
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      setTournaments(data.tournaments || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [statusFilter, searchTerm]);

  return (
    <motion.div 
      className="page-wrapper container" 
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
        <motion.div 
          className="accent-line" 
          initial={{ width: 0 }}
          animate={{ width: '40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <h1 style={{ fontFamily: 'var(--font-heading)', textTransform: 'uppercase', color: 'var(--text)' }}>Tournaments</h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
          Participate in tournaments, challenge rivals and climb the ranks.
        </p>
      </div>

      {/* Filters and Search */}
      <motion.div 
        className="glass-dark" 
        style={{
          padding: 'var(--space-4)',
          borderRadius: 0,
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)',
          background: '#050505',
          border: '1px solid var(--border)',
          marginBottom: 'var(--space-8)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['', 'upcoming', 'live', 'completed'].map((status) => (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: 0,
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                fontWeight: 600,
                letterSpacing: '0.1em',
                background: statusFilter === status ? 'var(--neon)' : 'rgba(255, 255, 255, 0.03)',
                color: statusFilter === status ? '#050505' : 'var(--text)',
                border: '1px solid',
                borderColor: statusFilter === status ? 'var(--neon)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease',
              }}
            >
              {status || 'All'}
            </motion.button>
          ))}
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="[ SEARCH TOURNAMENTS ]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            maxWidth: '300px', 
            borderRadius: 0, 
            fontFamily: 'var(--font-body)',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            padding: '0.75rem 1rem'
          }}
        />
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="loading-spinner" style={{ borderColor: 'var(--neon)', borderTopColor: 'transparent' }} />
        </div>
      ) : tournaments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-dark" 
          style={{
            textAlign: 'center',
            padding: 'var(--space-16) var(--space-4)',
            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)',
            background: '#050505',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-heading)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
        >
          // NO TOURNAMENTS DETECTED //
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          {tournaments.map((t) => (
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5 }}
              key={t.id} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: '#050505',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '450px'
              }}
            >
              {/* Background gradient hint */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '100%',
                background: 'linear-gradient(180deg, rgba(215, 255, 0, 0.02) 0%, rgba(0, 0, 0, 0) 100%)',
                pointerEvents: 'none'
              }} />

              <div style={{ padding: 'var(--space-5)', position: 'relative', zIndex: 1, flex: 1 }}>
                {/* Poster / Hero Image */}
                <div style={{
                  position: 'relative',
                  height: '200px',
                  background: '#000',
                  margin: 'calc(-1 * var(--space-5)) calc(-1 * var(--space-5)) var(--space-4)',
                  overflow: 'hidden',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 10px))'
                }}>
                  <img
                    src={t.poster_url || '/assets/logo.png'}
                    alt={t.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: t.poster_url ? 0.7 : 0.1,
                      filter: 'grayscale(50%) contrast(120%)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, #050505 0%, transparent 100%)'
                  }} />
                  <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                    <Badge variant={t.status === 'live' ? 'live' : t.status === 'upcoming' ? 'upcoming' : 'neon'}>
                      {t.status}
                    </Badge>
                  </div>
                </div>

                <h3 style={{ 
                  fontSize: 'var(--text-xl)', 
                  fontWeight: 900, 
                  marginBottom: 'var(--space-3)', 
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text)',
                  letterSpacing: '0.05em'
                }}>
                  {t.name}
                </h3>

                {/* Details */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 'var(--space-3)', 
                  margin: 'var(--space-4) 0', 
                  fontSize: 'var(--text-sm)', 
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Date</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{formatDate(t.date)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Time</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{t.time || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Slots</span>
                    <span style={{ color: 'var(--neon)', fontWeight: 600 }}>
                      {t.registered_count || 0} / {t.team_slots || 0}
                    </span>
                  </div>
                  {t.registration_deadline && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Deadline</span>
                      <span style={{ color: 'var(--error)', fontWeight: 600 }}>{formatDate(t.registration_deadline)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-4)', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                <Link to={`/tournaments/${t.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                  <Button variant="primary" style={{ 
                    width: '100%',
                    borderRadius: 0,
                    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    fontWeight: 800
                  }}>
                    VIEW DETAILS
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}


    </motion.div>
  );
}
