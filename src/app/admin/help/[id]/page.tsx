'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle2, Loader2, UserCheck } from 'lucide-react';
import { useHelpStream, type HelpStreamEvent } from '@/hooks/useHelpStream';

interface Message {
  id: number;
  sender_kind: string;
  sender_name?: string;
  sender_email?: string;
  body: string;
  created_at: string;
}

interface ThreadDetail {
  id: number;
  status: string;
  trigger_stage: string;
  context_snapshot: any;
  assigned_handler_id: number | null;
  user_email?: string;
  user_name?: string;
  created_at: string;
}

export default function HelpThreadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editors, setEditors] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/help/threads/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.thread);
    setMessages(data.messages ?? []);
    if (data.messages?.length) {
      lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Load editors for assignment dropdown
  useEffect(() => {
    fetch('/api/admin/users?role=editor')
      .then(r => r.ok ? r.json() : { users: [] })
      .then(data => setEditors(Array.isArray(data) ? data : (data.users ?? [])));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEvent = useCallback((event: HelpStreamEvent) => {
    if (event.kind === 'message' && event.threadId === parseInt(id)) {
      const msg = event.payload as Message;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        if (msg.id) lastMessageIdRef.current = msg.id;
        return [...prev, msg];
      });
    }
    if (event.kind === 'thread_updated' && event.threadId === parseInt(id)) {
      setThread(prev => prev ? { ...prev, ...(event.payload as any) } : prev);
    }
  }, [id]);

  useHelpStream({ onEvent: handleEvent, lastMessageIdRef, threadId: parseInt(id) });

  const send = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    const res = await fetch(`/api/help/threads/${id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: trimmed }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      if (msg.id) lastMessageIdRef.current = msg.id;
      setBody('');
    }
    setSending(false);
  };

  const resolve = async () => {
    setResolving(true);
    const res = await fetch(`/api/help/threads/${id}/resolve`, { method: 'POST' });
    if (res.ok) setThread(prev => prev ? { ...prev, status: 'resolved' } : prev);
    setResolving(false);
  };

  const assign = async (editorId: number | null) => {
    await fetch(`/api/help/threads/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editor_user_id: editorId }),
    });
    setThread(prev => prev ? { ...prev, assigned_handler_id: editorId } : prev);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#81C784' }} />
    </div>
  );
  if (!thread) return <div className="p-6 text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>Thread not found.</div>;

  const rawCtx = thread.context_snapshot;
  const ctx = typeof rawCtx === 'string'
    ? (() => { try { return JSON.parse(rawCtx); } catch { return null; } })()
    : rawCtx;
  const displayName = thread.user_name || thread.user_email || ctx?.full_name || 'Anonymous';
  const isResolved = thread.status === 'resolved';

  return (
    <div className="p-6 max-w-2xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/admin/help')} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.55)' }} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm truncate">{displayName}</p>
          <p className="text-xs" style={{ color: 'rgba(232,245,233,0.45)' }}>
            {thread.trigger_stage === 'signup_final_no_match' ? 'Ancestor not found' : 'Signup help request'}
            {' · '}{new Date(thread.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex-shrink-0"
          style={isResolved
            ? { background: 'rgba(76,175,114,0.12)', color: '#81C784' }
            : { background: 'rgba(200,150,46,0.12)', color: '#E6B84A' }}>
          {thread.status.replace('_', ' ')}
        </span>
      </div>

      {/* Context snapshot */}
      {ctx && (
        <div className="mb-4 p-4 rounded-2xl text-xs space-y-1"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-bold text-white mb-2" style={{ fontSize: 11 }}>User Context</p>
          {Object.entries(ctx).map(([k, v]) => v ? (
            <p key={k} style={{ color: 'rgba(232,245,233,0.60)' }}>
              <span className="font-medium" style={{ color: 'rgba(232,245,233,0.80)' }}>
                {k.replace(/_/g, ' ')}:{' '}
              </span>
              {String(v)}
            </p>
          ) : null)}
        </div>
      )}

      {/* Assign editor */}
      {!isResolved && editors.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(232,245,233,0.45)' }} />
          <select
            value={thread.assigned_handler_id ?? ''}
            onChange={e => assign(e.target.value ? parseInt(e.target.value) : null)}
            className="glass-input text-xs py-1.5 flex-1"
          >
            <option value="">Unassigned</option>
            {editors.map((ed: any) => (
              <option key={ed.id} value={ed.id}>{ed.name || ed.email}</option>
            ))}
          </select>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0 max-h-[400px]">
        {messages.map((msg, i) => {
          const isOutgoing = msg.sender_kind === 'admin' || msg.sender_kind === 'editor';
          return (
            <div key={msg.id ?? i} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm"
                style={isOutgoing
                  ? { background: 'rgba(76,175,114,0.16)', border: '1px solid rgba(76,175,114,0.22)', color: '#E8F5E9' }
                  : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(232,245,233,0.90)' }
                }>
                {isOutgoing && (msg.sender_name || msg.sender_email) && (
                  <p className="text-[10px] font-bold mb-1" style={{ color: '#E6B84A' }}>
                    {msg.sender_name || msg.sender_email}
                  </p>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                <p className="text-[9px] mt-1 opacity-50">{new Date(msg.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply */}
      {!isResolved && (
        <div className="space-y-2">
          <textarea
            className="glass-input w-full text-sm resize-none"
            rows={3}
            placeholder="Type a reply…"
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }}
            disabled={sending}
          />
          <div className="flex gap-2">
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="flex-1 h-10 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4CAF72, #2E7D32)', color: '#fff' }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /><span>Reply</span></>}
            </button>
            <button
              onClick={resolve}
              disabled={resolving}
              className="px-4 h-10 rounded-full font-semibold text-sm flex items-center gap-1.5 transition-all disabled:opacity-50 hover:bg-white/10"
              style={{ border: '1px solid rgba(76,175,114,0.25)', color: '#81C784' }}
            >
              {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Resolve</span></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
