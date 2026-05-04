'use client';

import { useEffect, useRef, useCallback } from 'react';

export type HelpStreamEvent =
  | { kind: 'message'; threadId: number; payload: object }
  | { kind: 'thread_updated'; threadId: number; payload: object }
  | { kind: 'new_thread'; threadId: number; payload: object }
  | { kind: 'grant_revoked' };

interface Options {
  onEvent: (event: HelpStreamEvent) => void;
  /** If provided, fetch missed messages from this id on reconnect */
  lastMessageIdRef?: React.MutableRefObject<number | null>;
  threadId?: number;
}

export function useHelpStream({ onEvent, lastMessageIdRef, threadId }: Options) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const backfill = useCallback(async () => {
    if (!threadId || !lastMessageIdRef?.current) return;
    try {
      const res = await fetch(`/api/help/threads/${threadId}?since=${lastMessageIdRef.current}`);
      if (!res.ok) return;
      const data = await res.json();
      for (const msg of data.messages ?? []) {
        onEventRef.current({ kind: 'message', threadId, payload: msg });
        if (lastMessageIdRef) lastMessageIdRef.current = msg.id;
      }
    } catch {
      // Silently ignore backfill errors
    }
  }, [threadId, lastMessageIdRef]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource('/api/help/stream');
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as HelpStreamEvent;
        onEventRef.current(data);
        // Track last message id for backfill
        if (lastMessageIdRef && data.kind === 'message') {
          const payload = data.payload as any;
          if (payload?.id) lastMessageIdRef.current = payload.id;
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect with backoff
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = setTimeout(async () => {
        await backfill();
        connect();
      }, 3000);
    };
  }, [backfill, lastMessageIdRef]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);
}
