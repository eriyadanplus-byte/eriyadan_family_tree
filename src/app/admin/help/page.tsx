'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MessageCircle, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { useHelpStream, type HelpStreamEvent } from '@/hooks/useHelpStream';
import { toast } from 'sonner';

// Plays a short chime using Web Audio API — no file needed
function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    osc.onended = () => ctx.close();
  } catch { /* AudioContext unavailable */ }
}

interface HelpThread {
  id: number;
  trigger_stage: string;
  status: string;
  context_snapshot: any;
  assigned_handler_id: number | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
  unread_count: number;
}

export default function HelpInboxPage() {
  const [threads, setThreads] = useState<HelpThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [muted, setMuted] = useState(false);
  const lastIdRef = useRef<number | null>(null);

  // Load mute preference from app_settings on mount
  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(d => {
        if (d.admin_help_alert_muted === '1') setMuted(true);
      })
      .catch(() => {});
  }, []);

  const toggleMute = async () => {
    const next = !muted;
    setMuted(next);
    fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'admin_help_alert_muted', value: next ? '1' : '0' }),
    }).catch(() => {});
  };

  const load = async (status?: string) => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    const res = await fetch(`/api/help/threads${qs}`);
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(filter || undefined); }, [filter]);

  const handleEvent = useCallback((event: HelpStreamEvent) => {
    if (event.kind === 'new_thread') {
      load(filter || undefined);
      if (!muted) playAlertChime();
      toast('New help inquiry received', {
        description: 'Check the help inbox for details.',
        action: { label: 'View', onClick: () => {} },
      });
    } else if (event.kind === 'message') {
      setThreads(prev => prev.map(t =>
        t.id === event.threadId
          ? { ...t, unread_count: t.unread_count + 1 }
          : t
      ));
    }
  }, [filter, muted]);

  useHelpStream({ onEvent: handleEvent, lastMessageIdRef: lastIdRef });

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5" style={{ color: '#81C784' }} />
          <h1 className="text-xl font-bold text-white">Help Inbox</h1>
          {threads.filter(t => t.unread_count > 0).length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(200,150,46,0.20)', color: '#E6B84A' }}>
              {threads.reduce((s, t) => s + t.unread_count, 0)} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            title={muted ? 'Unmute alert sound' : 'Mute alert sound'}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {muted
              ? <VolumeX className="w-4 h-4" style={{ color: 'rgba(239,83,80,0.70)' }} />
              : <Volume2 className="w-4 h-4" style={{ color: 'rgba(76,175,114,0.70)' }} />}
          </button>
          <button onClick={() => load(filter || undefined)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.45)' }} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'pending_admin', label: 'Pending' },
          { value: 'resolved', label: 'Resolved' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter === opt.value
              ? { background: 'rgba(76,175,114,0.20)', border: '1px solid rgba(76,175,114,0.35)', color: '#81C784' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(232,245,233,0.50)' }
            }>
            {opt.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-sm py-8 text-center" style={{ color: 'rgba(232,245,233,0.40)' }}>Loading…</div>
      )}

      {!loading && threads.length === 0 && (
        <div className="text-sm py-12 text-center rounded-2xl"
          style={{ color: 'rgba(232,245,233,0.40)', border: '1px dashed rgba(255,255,255,0.10)' }}>
          No help threads{filter ? ` with status "${filter}"` : ''}.
        </div>
      )}

      <div className="space-y-2">
        {threads.map(thread => {
          const ctx = thread.context_snapshot as any;
          const displayName = thread.user_name || thread.user_email || ctx?.full_name || 'Anonymous';
          const stageLabel = thread.trigger_stage === 'signup_final_no_match' ? 'Final step' : 'Signup start';
          return (
            <Link key={thread.id} href={`/admin/help/${thread.id}`}
              className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-white/5 group"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.20)' }}>
                  <MessageCircle className="w-4 h-4" style={{ color: '#81C784' }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{displayName}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(232,245,233,0.45)' }}>
                    {stageLabel} · {new Date(thread.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {thread.unread_count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(200,150,46,0.25)', color: '#E6B84A' }}>
                    {thread.unread_count}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                  style={
                    thread.status === 'resolved'
                      ? { background: 'rgba(76,175,114,0.12)', color: '#81C784' }
                      : thread.status === 'pending_admin'
                        ? { background: 'rgba(200,150,46,0.12)', color: '#E6B84A' }
                        : { background: 'rgba(255,255,255,0.06)', color: 'rgba(232,245,233,0.60)' }
                  }>
                  {thread.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
