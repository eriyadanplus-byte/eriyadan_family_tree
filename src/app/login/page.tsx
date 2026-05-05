'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TreeDeciduous, Eye, EyeOff, AlertCircle, Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
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
      router.push('/tree');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign in failed')
      setLoading(false)
    }
  }

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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(232,245,233,0.35)' }}>Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all hover:bg-white/5 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-11 rounded-xl font-medium text-sm transition-all hover:bg-white/5 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

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
