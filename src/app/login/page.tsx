'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TreeDeciduous, Eye, EyeOff, AlertCircle, Loader2, MessageCircle } from 'lucide-react';
import HelpComposer from '@/components/help/HelpComposer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign in failed');
      router.refresh();
      router.push(data.mustChangePassword ? '/change-password' : '/tree');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1F0D' }}>
      <div className="orb orb-green fixed" /><div className="orb orb-gold fixed" />

      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.22)' }}>
            <TreeDeciduous className="w-7 h-7" style={{ color: '#81C784' }} />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>Sign in to explore your family tree</p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl text-sm"
                style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.50)' }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="glass-input" placeholder="your@email.com" required autoFocus />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(232,245,233,0.50)' }}>Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="glass-input pr-12" placeholder="Enter your password" required />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  {showPw
                    ? <EyeOff className="w-5 h-5" style={{ color: 'rgba(232,245,233,0.35)' }} />
                    : <Eye    className="w-5 h-5" style={{ color: 'rgba(232,245,233,0.35)' }} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-full font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #4CAF72, #2E7D32)', boxShadow: '0 4px 20px rgba(76,175,114,0.30)' }}>
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-sm" style={{ color: 'rgba(232,245,233,0.40)' }}>
              Not a member yet?{' '}
              <a href="/signup" className="hover:underline font-semibold" style={{ color: '#81C784' }}>
                Request to Join
              </a>
            </p>
          </div>
        </div>

        <p className="text-center mt-4">
          <a href="/" className="text-sm hover:underline" style={{ color: 'rgba(232,245,233,0.25)' }}>← Back to Home</a>
        </p>
      </div>

      {/* Need Help? floating button */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-xl transition-all hover:scale-105"
        style={{ background: 'rgba(13,31,13,0.96)', border: '1px solid rgba(76,175,114,0.30)', color: '#81C784', backdropFilter: 'blur(12px)' }}
        title="Need help? Talk to admin"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-semibold">Need help?</span>
      </button>

      <HelpComposer
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        triggerStage="login_help"
      />
    </div>
  );
}