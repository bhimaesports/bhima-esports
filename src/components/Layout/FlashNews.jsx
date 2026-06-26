import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useApp } from '../../context/AppContext';

export default function FlashNews() {
  const [news, setNews] = useState([]);
  const { sseEvents } = useApp();

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

  // Calculate dynamic duration based on text length to keep speed consistent
  const baseLength = news.reduce((acc, item) => acc + item.text.length, 0);
  
  // Multiply the news array 20 times to guarantee it spans ultra-wide screens even if there's only 1 short item
  const multipliedNews = [];
  for (let i = 0; i < 20; i++) {
    multipliedNews.push(...news.map(n => ({ ...n, uniqueKey: `${n.id}_${i}` })));
  }

  // Calculate duration so it scrolls at a consistent speed regardless of how much text is generated
  const animationDuration = Math.max(20, baseLength * 20 * 0.1) + 's';

  const NewsBlock = () => (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {multipliedNews.map((item) => (
        <span key={item.uniqueKey} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 2rem' }}>
          <span style={{ marginRight: '0.75rem', fontSize: '1rem' }}>📢</span>
          {item.text}
          <span style={{ marginLeft: '2rem', opacity: 0.3 }}>•</span>
        </span>
      ))}
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
        {/* Render the massive block twice. TranslateX(-50%) moves it exactly the width of ONE block, ensuring a perfect, gapless loop. */}
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
