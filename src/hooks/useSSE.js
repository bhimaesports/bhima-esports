import { useEffect, useRef, useState } from 'react';

export function useSSE(url, eventHandlers = {}) {
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef(null);

  useEffect(() => {
    const eventSource = new EventSource(url);
    sourceRef.current = eventSource;

    eventSource.onopen = () => setConnected(true);
    eventSource.onerror = () => setConnected(false);

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      eventSource.addEventListener(event, (e) => {
        try {
          const data = JSON.parse(e.data);
          handler(data);
        } catch {
          handler(e.data);
        }
      });
    });

    return () => {
      eventSource.close();
      setConnected(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { connected };
}

export default useSSE;
