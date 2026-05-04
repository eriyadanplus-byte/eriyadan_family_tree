'use client';

import { useState, useEffect, useRef } from 'react';

export function usePresence() {
  const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Initial fetch of online members
    fetch('/api/presence')
      .then(res => res.ok ? res.json() : [])
      .then((ids: string[]) => setOnlineMembers(new Set(ids)))
      .catch(() => {});

    // Heartbeat every 30 seconds
    const heartbeat = setInterval(() => {
      fetch('/api/presence', { method: 'POST' }).catch(() => {});
    }, 30000);

    // Listen for presence updates via SSE (reuse help stream)
    const es = new EventSource('/api/help/stream');
    es.addEventListener('presence_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        setOnlineMembers(prev => {
          const next = new Set(prev);
          if (data.status === 'online') next.add(String(data.memberId));
          else next.delete(String(data.memberId));
          return next;
        });
      } catch {}
    });
    esRef.current = es;

    return () => {
      clearInterval(heartbeat);
      es.close();
    };
  }, []);

  return onlineMembers;
}
