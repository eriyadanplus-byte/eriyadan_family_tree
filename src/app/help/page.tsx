'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [form, setForm] = useState({
    ancestorName: '',
    place: '',
    contactNumber: '',
    whatsappNumber: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.message.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/help/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_stage: 'contact_form',
          inquiry_kind: 'contact_form',
          body: form.message,
          ancestor_name: form.ancestorName || undefined,
          place: form.place || undefined,
          contact_number: form.contactNumber || undefined,
          whatsapp_number: form.whatsappNumber || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to send');
      }
      setSent(true);
      toast.success('Message sent! We will get back to you shortly.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0D1F0D' }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.25)' }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: '#81C784' }} />
          </div>
          <h2 className="text-2xl font-display text-white mb-2">Thank You!</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,245,233,0.55)' }}>
            Your message has been received. An admin will reach out to you soon via the contact details you provided.
          </p>
          <button
            onClick={() => { setSent(false); setForm({ ancestorName: '', place: '', contactNumber: '', whatsappNumber: '', message: '' }); }}
            className="mt-6 px-6 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(76,175,114,0.15)', border: '1px solid rgba(76,175,114,0.30)', color: '#81C784' }}
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex items-start justify-center" style={{ background: '#0D1F0D' }}>
      <div className="w-full max-w-lg mt-8">
        <h1 className="text-2xl font-display text-white mb-1">Contact Admin</h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(232,245,233,0.45)' }}>
          Fill in your details and message. We will reach out to you shortly.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-5 rounded-2xl space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.45)' }}>Ancestor&apos;s Name</label>
              <input type="text" value={form.ancestorName} onChange={set('ancestorName')}
                placeholder="e.g. Eriyadan Al-Rashidi"
                className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.45)' }}>Your Place / Location</label>
              <input type="text" value={form.place} onChange={set('place')}
                placeholder="e.g. Dubai, UAE"
                className="glass-input w-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(232,245,233,0.45)' }}>Contact Number</label>
                <input type="tel" value={form.contactNumber} onChange={set('contactNumber')}
                  placeholder="+971 50 000 0000"
                  className="glass-input w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(232,245,233,0.45)' }}>WhatsApp Number</label>
                <input type="tel" value={form.whatsappNumber} onChange={set('whatsappNumber')}
                  placeholder="+971 50 000 0000 (if different)"
                  className="glass-input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.45)' }}>Message *</label>
              <textarea value={form.message} onChange={set('message')} required
                rows={4} placeholder="Describe how you are connected to the family…"
                className="glass-input w-full resize-none min-h-[100px]" />
            </div>
          </div>

          <button type="submit" disabled={sending || !form.message.trim()}
            className="w-full h-12 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #4CAF72, #2E7D32)', boxShadow: '0 4px 20px rgba(76,175,114,0.30)' }}>
            {sending
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
              : <><Send className="w-5 h-5" /> Send Message</>}
          </button>
        </form>
      </div>
    </div>
  );
}
