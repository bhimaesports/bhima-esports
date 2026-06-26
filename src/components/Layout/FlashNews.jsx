import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useApp } from '../../context/AppContext';

export default function FlashNews() {
  const [news, setNews] = useState([]);
  const { sseEvents, settings } = useApp();

  const fetchNews = async () => {
    try {
      const data = await api.get('/homepage/flash-news');
      setNews(data.flashNews || []);
    } catch (err) {
      console.error('Failed to fetch flash news', err);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    if (sseEvents?.type === 'flash_news') {
      fetchNews();
    }
  }, [sseEvents]);

  if (!news || news.length === 0) return null;

  // Calculate base length of all text to determine animation length
  const baseLength = news.reduce((acc, item) => acc + (item.title.length + (item.description?.length || 0)), 0);
  
  // Multiply the news array multiple times to guarantee it spans ultra-wide screens
  const multipliedNews = [];
  for (let i = 0; i < 20; i++) {
    multipliedNews.push(...news.map(n => ({ ...n, uniqueKey: `${n.id}_${i}` })));
  }

  // Adjust speed multiplier based on setting
  const speedSetting = settings?.flash_news_speed || 'normal';
  let speedMultiplier = 0.1;
  if (speedSetting === 'slow') speedMultiplier = 0.15;
  if (speedSetting === 'fast') speedMultiplier = 0.05;

  const animationDuration = Math.max(20, baseLength * 20 * speedMultiplier) + 's';

  const NewsBlock = () => (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {multipliedNews.map((item) => {
        let badgeColor = 'transparent';
        if (item.priority === 'high') badgeColor = 'var(--error)';
        if (item.priority === 'low') badgeColor = 'var(--bg-secondary)';

        return (
          <span key={item.uniqueKey} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 2rem' }}>
            {item.priority === 'high' && (
              <span style={{ 
                background: badgeColor, 
                color: '#FFF', 
                padding: '0.1rem 0.5rem', 
                borderRadius: '3px', 
                marginRight: '0.75rem',
                fontSize: '0.7rem'
              }}>
                ALERT
              </span>
            )}
            <span style={{ marginRight: '0.5rem', fontSize: '1rem' }}>{item.priority === 'high' ? '🔥' : '📢'}</span>
            <span style={{ color: item.priority === 'high' ? 'var(--error)' : 'inherit', fontWeight: item.priority === 'high' ? 900 : 700 }}>
              {item.title}
            </span>
            {item.description && (
              <span style={{ marginLeft: '0.5rem', opacity: 0.8, textTransform: 'none', fontWeight: 400 }}>
                - {item.description}
              </span>
            )}
            <span style={{ marginLeft: '2rem', opacity: 0.3 }}>•</span>
          </span>
        );
      })}
    </div>
  );

  return (
    <div style={{
      width: '100%',
      height: '45px',
      background: 'var(--neon)',
      color: '#000',
      display: 'flex',
      alignItems: 'center',
      fontFamily: "'Orbitron', sans-serif",
      fontWeight: 900,
      textTransform: 'uppercase',
      fontSize: '0.9rem',
      letterSpacing: '0.05em',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      zIndex: 1000,
      position: 'relative',
      borderBottom: '1px solid rgba(0,0,0,0.1)'
    }}>
      <div 
        style={{
          display: 'flex',
          width: 'max-content',
          animation: `flashMarquee ${animationDuration} linear infinite`,
          willChange: 'transform'
        }}
      >
        <NewsBlock />
        <NewsBlock />
      </div>
      
      <style>{`
        @keyframes flashMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
