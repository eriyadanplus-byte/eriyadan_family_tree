'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useHelpStream, type HelpStreamEvent } from '@/hooks/useHelpStream';

interface Message {
  id: number;
  sender_kind: 'user' | 'anon' | 'admin' | 'editor';
  sender_name?: string;
  body: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  triggerStage: 'signup_start' | 'signup_final_no_match' | 'login_help';
  contextSnapshot?: Record<string, unknown>;
}

export default function HelpComposer({ isOpen, onClose, triggerStage, contextSnapshot }: Props) {
  const [threadId, setThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Structured form for login_help and signup flows
  const isLoginHelp = triggerStage === 'login_help' || triggerStage === 'signup_start' || triggerStage === 'signup_final_no_match';
  const [formName, setFormName] = useState('');
  const [formWhatsApp, setFormWhatsApp] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formAncestors, setFormAncestors] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleEvent = useCallback((event: HelpStreamEvent) => {
    if (event.kind === 'message' && event.threadId === threadId) {
      const msg = event.payload as Message;
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        if (msg.id) lastMessageIdRef.current = msg.id;
        return [...prev, msg];
      });
    }
  }, [threadId]);

  useHelpStream({ onEvent: handleEvent, lastMessageIdRef, threadId: threadId ?? undefined });

  if (!isOpen) return null;

  const sendMessage = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    if (isLoginHelp && (!formName.trim() || !formWhatsApp.trim())) {
      setError('Name and WhatsApp number are required.');
      return;
    }
    setError('');
    setSending(true);

    try {
      const snapshot = isLoginHelp
        ? {
            ...(contextSnapshot || {}),
            name: formName.trim(),
            whatsapp: formWhatsApp.trim(),
            location: formLocation.trim(),
            ancestors: formAncestors.trim(),
          }
        : contextSnapshot;

      if (!threadId) {
        // Create thread + first message
        const res = await fetch('/api/help/threads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger_stage: triggerStage, body: trimmed, context_snapshot: snapshot }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to send');
        }
        const { threadId: newId } = await res.json();
        setThreadId(newId);
        setMessages([{
          id: Date.now(), // temp id until server echoes
          sender_kind: 'anon',
          body: trimmed,
          created_at: new Date().toISOString(),
        }]);
      } else {
        const res = await fetch(`/api/help/threads/${threadId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: trimmed }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to send');
        }
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        if (msg.id) lastMessageIdRef.current = msg.id;
      }
      setBody('');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="glass-card w-full max-w-md mx-4 mb-0 sm:mb-4 rounded-t-3xl sm:rounded-3xl flex flex-col"
        style={{ maxHeight: '85vh', minHeight: 360, border: '1px solid rgba(76,175,114,0.20)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Message admin"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" style={{ color: '#81C784' }} />
            <span className="font-bold text-white text-sm">Message Admin</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Close">
            <X className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.55)' }} />
          </button>
        </div>

        {/* Intro text (before first message) */}
        {!threadId && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,233,0.60)' }}>
              {triggerStage === 'signup_final_no_match'
                ? "Can't find your ancestor in the tree? Tell the admin who you are and who your relatives are — they'll help place you correctly."
                : triggerStage === 'login_help'
                ? "Need help signing in? Fill in your details below and the admin will assist you."
                : "Not sure where to start? Tell the admin who you are, who your ancestors are, and any details that might help identify your family lineage."}
            </p>
          </div>
        )}

        {/* Message list */}
        {threadId && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => {
              const isOutgoing = msg.sender_kind === 'user' || msg.sender_kind === 'anon';
              return (
                <div key={msg.id ?? i}
                  className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm"
                    style={isOutgoing
                      ? { background: 'rgba(76,175,114,0.18)', border: '1px solid rgba(76,175,114,0.25)', color: '#E8F5E9' }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(232,245,233,0.90)' }
                    }
                  >
                    {!isOutgoing && msg.sender_name && (
                      <p className="text-[10px] font-bold mb-1" style={{ color: '#E6B84A' }}>{msg.sender_name}</p>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-4 px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(239,83,80,0.10)', color: '#EF5350' }}>
            {error}
          </div>
        )}

        {/* Sent confirmation (no thread, after first message) */}
        {!threadId && messages.length > 0 && (
          <div className="mx-4 my-2 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(76,175,114,0.10)', border: '1px solid rgba(76,175,114,0.20)', color: '#81C784' }}>
            ✓ Message sent. Admin will reply here — check back soon.
          </div>
        )}

        {/* Compose */}
        {!messages.length || threadId ? (
          <div className="px-4 pt-2 pb-4 space-y-2">
            {isLoginHelp && !threadId && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(232,245,233,0.45)' }}>Name *</label>
                  <input
                    type="text"
                    className="glass-input w-full text-sm h-9"
                    placeholder="Your full name"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(232,245,233,0.45)' }}>WhatsApp Number *</label>
                  <input
                    type="tel"
                    className="glass-input w-full text-sm h-9"
                    placeholder="+91 98765 43210"
                    value={formWhatsApp}
                    onChange={e => setFormWhatsApp(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(232,245,233,0.45)' }}>Location</label>
                  <input
                    type="text"
                    className="glass-input w-full text-sm h-9"
                    placeholder="City, Country"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(232,245,233,0.45)' }}>Ancestors / Known Relatives</label>
                  <textarea
                    className="glass-input w-full text-sm resize-none"
                    rows={2}
                    placeholder="Who are your known family members in the tree?"
                    value={formAncestors}
                    onChange={e => setFormAncestors(e.target.value)}
                    disabled={sending}
                  />
                </div>
              </div>
            )}
            <textarea
              className="glass-input w-full text-sm resize-none"
              rows={3}
              placeholder={threadId ? 'Type a message…' : isLoginHelp ? 'What do you need help with?' : 'Describe who you are and who your ancestors are…'}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage(); }}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !body.trim() || (isLoginHelp && !threadId && (!formName.trim() || !formWhatsApp.trim()))}
              className="w-full h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #4CAF72, #2E7D32)', color: '#fff' }}
            >
              {sending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Send className="w-4 h-4" /><span>Send Message</span></>}
            </button>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <button
              onClick={onClose}
              className="w-full h-10 rounded-full text-sm font-medium transition-all hover:bg-white/10"
              style={{ color: 'rgba(232,245,233,0.55)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
