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

  if (news.length === 0) return null;

  return (
    <div style={{
      width: '100%',
      background: '#000',
      color: 'var(--neon)',
      padding: '0.25rem 0',
      fontFamily: "'Rajdhani', sans-serif",
      fontWeight: 700,
      textTransform: 'uppercase',
      fontSize: '0.85rem',
      letterSpacing: '0.05em',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      borderBottom: '1px solid #222',
      zIndex: 1000,
      position: 'relative'
    }}>
      <div style={{
        display: 'inline-block',
        animation: 'flashMarquee 20s linear infinite',
      }}>
        {news.map((item) => (
          <span key={item.id} style={{ margin: '0 2rem' }}>
            <span style={{ color: '#fff', marginRight: '0.5rem' }}>//</span>
            {item.text}
          </span>
        ))}
        {/* Duplicate for seamless marquee if needed, or just let it scroll */}
        {news.map((item) => (
          <span key={item.id + '_dup'} style={{ margin: '0 2rem' }}>
            <span style={{ color: '#fff', marginRight: '0.5rem' }}>//</span>
            {item.text}
          </span>
        ))}
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
