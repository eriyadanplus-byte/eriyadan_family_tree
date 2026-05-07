'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPw]   = useState('');
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [done, setDone]                   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setDone(true);
      setTimeout(() => {
        router.push('/tree');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1F0D' }}>
      <div className="orb orb-green fixed" /><div className="orb orb-gold fixed" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.22)' }}>
            <KeyRound className="w-7 h-7" style={{ color: '#81C784' }} />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">Set New Password</h1>
          <p className="text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>
            A temporary password was set for your account. Choose a new password to continue.
          </p>
        </div>

        <div className="p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4" style={{ color: '#81C784' }}>
              <CheckCircle className="w-10 h-10" />
              <p className="text-sm font-medium">Password updated! Redirecting…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl text-sm"
                  style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(232,245,233,0.50)' }}>New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="glass-input pr-12"
                    placeholder="Min 8 characters"
                    required
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowNew(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                    {showNew
                      ? <EyeOff className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />
                      : <Eye className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(232,245,233,0.50)' }}>Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPw(e.target.value)}
                    className="glass-input pr-12"
                    placeholder="Repeat new password"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                    {showConfirm
                      ? <EyeOff className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />
                      : <Eye className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: loading ? 'rgba(76,175,114,0.4)' : 'rgba(76,175,114,0.85)',
                  color: '#0D1F0D',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
