import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { generateAchievement } from '../utils/achievementGenerator';
import { saveAs } from 'file-saver';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';

export default function Achievements() {
  const { player } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        if (player) {
          const res = await api.get(`/achievements/player/${player.id}`);
          if (res.achievements) setAchievements(res.achievements);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, [player]);

  const handleDownload = async (achievement) => {
    try {
      const blob = await generateAchievement({ ...achievement, player_name: player.name });
      saveAs(blob, `Achievement_${player.name}_${achievement.award_type}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to generate PDF');
    }
  };

  if (!player) {
    return (
      <div className="page-wrapper" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>Please login to view your achievements.</h2>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: '6rem 1rem 4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ 
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-4xl)',
            color: 'var(--neon)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            MY ACHIEVEMENTS
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Official Gaming Awards and Recognitions</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : achievements.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No achievements issued yet. Keep grinding!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card style={{ 
                  textAlign: 'center', 
                  borderTop: '4px solid var(--neon)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  height: '100%'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                  <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
                    {ach.title}
                  </h3>
                  <div style={{ color: 'var(--neon)', fontWeight: 'bold' }}>{ach.award_type}</div>
                  {ach.tournament_name && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {ach.tournament_name}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                    ID: {ach.achievement_code || 'PENDING'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 'auto' }}>
                    Issued: {new Date(ach.issued_date).toLocaleDateString()}
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => handleDownload(ach)}
                    style={{ marginTop: '1rem', width: '100%' }}
                  >
                    Download Award
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
