import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [announcements, setAnnouncements] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);

  const [stats, setStats] = useState(null);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [annData, settData, statsData] = await Promise.allSettled([
        api.get('/announcements'),
        api.get('/settings'),
        api.get('/stats'),
      ]);
      if (annData.status === 'fulfilled') setAnnouncements(annData.value?.announcements || annData.value || []);
      if (settData.status === 'fulfilled') setSettings(settData.value?.settings || settData.value || {});
      if (statsData.status === 'fulfilled') setStats(statsData.value || {});
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // SSE real-time updates
  useEffect(() => {
    let eventSource;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => setSseConnected(true);

      eventSource.addEventListener('announcement', (e) => {
        try {
          const data = JSON.parse(e.data);
          setAnnouncements((prev) => [data, ...prev]);
        } catch {}
      });

      eventSource.addEventListener('settings', (e) => {
        try {
          const data = JSON.parse(e.data);
          setSettings((prev) => ({ ...prev, ...data }));
        } catch {}
      });

      const triggerLeaderboardRefetch = () => {
        window.dispatchEvent(new CustomEvent('leaderboard-update'));
      };
      eventSource.addEventListener('leaderboard-update', triggerLeaderboardRefetch);
      eventSource.addEventListener('leaderboard_updated', triggerLeaderboardRefetch);

      const triggerHallOfFameRefetch = () => {
        window.dispatchEvent(new CustomEvent('hall-of-fame-update'));
      };
      eventSource.addEventListener('hall-of-fame-update', triggerHallOfFameRefetch);

      eventSource.addEventListener('entity_update', () => {
        // Refetch stats silently when any entity changes
        api.get('/stats').then(data => {
          if (data) setStats(data);
        }).catch(() => {});
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch {
      // SSE not available
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const refreshAnnouncements = useCallback(async () => {
    try {
      const data = await api.get('/announcements');
      setAnnouncements(data?.announcements || data || []);
    } catch {}
  }, []);

  return (
    <AppContext.Provider
      value={{
        announcements,
        setAnnouncements,
        settings,
        setSettings,
        stats,
        setStats,
        loading,
        sseConnected,
        refreshAnnouncements,
        refetchAll: fetchInitialData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
