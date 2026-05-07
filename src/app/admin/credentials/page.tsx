'use client';

import { useState, useEffect } from 'react';
import { KeyRound, UserPlus, Eye, EyeOff, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface MemberRow {
  id: string;
  fullName: string;
  generation: number;
  mobileNumber?: string;
  gender?: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  memberId: string | null;
  memberName: string | null;
}

const roleColors: Record<string, string> = {
  super_admin: 'text-purple-400',
  editor: 'text-emerald-400',
  contributor: 'text-blue-400',
  viewer: 'text-white/50',
};

export default function AdminCredentialsPage() {
  const [members, setMembers]           = useState<MemberRow[]>([]);
  const [users, setUsers]               = useState<UserRow[]>([]);
  const [loadingMembers, setLM]         = useState(true);
  const [loadingUsers, setLU]           = useState(true);
  const [membersErr, setMembersErr]     = useState('');
  const [usersErr, setUsersErr]         = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [formEmail, setFormEmail]       = useState('');
  const [formPw, setFormPw]             = useState('');
  const [formRole, setFormRole]         = useState('viewer');
  const [showPw, setShowPw]             = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitErr, setSubmitErr]       = useState('');
  const [successMsg, setSuccessMsg]     = useState('');

  // Reset state for section 2
  const [resetUserId, setResetUserId]   = useState<string | null>(null);
  const [resetPw, setResetPw]           = useState('');
  const [showResetPw, setShowResetPw]   = useState(false);
  const [resetting, setResetting]       = useState(false);
  const [resetErr, setResetErr]         = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    fetchMembers();
    fetchUsers();
  }, []);

  async function fetchMembers() {
    setLM(true);
    setMembersErr('');
    try {
      const res = await fetch('/api/members?noAccount=true&limit=200');
      const data = await res.json();
      if (!res.ok) { setMembersErr(data.error || `Error ${res.status}`); return; }
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      setMembersErr(err instanceof Error ? err.message : 'Failed to load members');
    } finally { setLM(false); }
  }

  async function fetchUsers() {
    setLU(true);
    setUsersErr('');
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) { setUsersErr(data.error || `Error ${res.status}`); return; }
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch (err) {
      setUsersErr(err instanceof Error ? err.message : 'Failed to load users');
    } finally { setLU(false); }
  }

  function openForm(memberId: string) {
    setExpandedId(memberId);
    setFormEmail('');
    setFormPw('');
    setFormRole('viewer');
    setSubmitErr('');
    setSuccessMsg('');
    setShowPw(false);
  }

  async function handleCreate(e: React.FormEvent, memberId: string) {
    e.preventDefault();
    setSubmitErr('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/create-for-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, email: formEmail, password: formPw, role: formRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');
      setSuccessMsg(`Account created for ${formEmail}. Share the email and password you set with them — they will be asked to change it on first login.`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setExpandedId(null);
      fetchUsers();
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: React.FormEvent, userId: string) {
    e.preventDefault();
    setResetErr('');
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setResetSuccess(`Password reset. Share the new password with ${data.email} — they will be asked to change it on next login.`);
      setResetUserId(null);
      setResetPw('');
    } catch (err) {
      setResetErr(err instanceof Error ? err.message : 'Failed');
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Credentials</h1>
        <p className="text-sm" style={{ color: 'rgba(232,245,233,0.45)' }}>
          Create accounts for living members and reset passwords for existing users.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.25)', color: '#81C784' }}>
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {resetSuccess && (
        <div className="flex items-start gap-3 p-4 rounded-xl text-sm"
          style={{ background: 'rgba(76,175,114,0.12)', border: '1px solid rgba(76,175,114,0.25)', color: '#81C784' }}>
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Section 1: Members without accounts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4" style={{ color: '#81C784' }} />
            Living Members Without Accounts
          </h2>
          <button onClick={fetchMembers} className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
            <RefreshCw className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.45)' }} />
          </button>
        </div>

        {loadingMembers ? (
          <div className="flex items-center gap-2 py-6" style={{ color: 'rgba(232,245,233,0.45)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading members…</span>
          </div>
        ) : membersErr ? (
          <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
            style={{ background: 'rgba(239,83,80,0.10)', color: '#EF5350' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{membersErr}
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'rgba(232,245,233,0.35)' }}>All living members have accounts.</p>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between p-3">
                  <div>
                    <span className="text-sm font-medium text-white">{m.fullName}</span>
                    <span className="ml-2 text-xs" style={{ color: 'rgba(232,245,233,0.40)' }}>Gen {m.generation}</span>
                    {m.mobileNumber && (
                      <span className="ml-2 text-xs" style={{ color: 'rgba(232,245,233,0.40)' }}>{m.mobileNumber}</span>
                    )}
                  </div>
                  <button
                    onClick={() => expandedId === m.id ? setExpandedId(null) : openForm(m.id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{
                      background: 'rgba(76,175,114,0.14)',
                      border: '1px solid rgba(76,175,114,0.25)',
                      color: '#81C784',
                    }}
                  >
                    Create Account
                  </button>
                </div>

                {expandedId === m.id && (
                  <form onSubmit={e => handleCreate(e, m.id)}
                    className="p-4 border-t space-y-3"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    {submitErr && (
                      <div className="flex items-center gap-2 text-xs p-2 rounded-lg"
                        style={{ background: 'rgba(239,83,80,0.10)', color: '#EF5350' }}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{submitErr}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                          style={{ color: 'rgba(232,245,233,0.50)' }}>Email (Username)</label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          className="glass-input text-sm"
                          placeholder="member@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                          style={{ color: 'rgba(232,245,233,0.50)' }}>Role</label>
                        <select
                          value={formRole}
                          onChange={e => setFormRole(e.target.value)}
                          className="glass-input text-sm"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="contributor">Contributor</option>
                          <option value="editor">Editor</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: 'rgba(232,245,233,0.50)' }}>Temporary Password</label>
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={formPw}
                          onChange={e => setFormPw(e.target.value)}
                          className="glass-input text-sm pr-10"
                          placeholder="Min 6 chars — phone number, birth year, etc."
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showPw
                            ? <EyeOff className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />
                            : <Eye className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />}
                        </button>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(232,245,233,0.35)' }}>
                        Share this with the member directly. They will be asked to change it on first login.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(76,175,114,0.85)', color: '#0D1F0D' }}
                      >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        {submitting ? 'Creating…' : 'Create Account'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedId(null)}
                        className="px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ color: 'rgba(232,245,233,0.50)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: All users with reset password */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4" style={{ color: '#81C784' }} />
            All User Accounts
          </h2>
          <button onClick={fetchUsers} className="p-1.5 rounded-lg transition-colors hover:bg-white/5">
            <RefreshCw className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.45)' }} />
          </button>
        </div>

        {loadingUsers ? (
          <div className="flex items-center gap-2 py-6" style={{ color: 'rgba(232,245,233,0.45)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading users…</span>
          </div>
        ) : usersErr ? (
          <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
            style={{ background: 'rgba(239,83,80,0.10)', color: '#EF5350' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{usersErr}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm py-4" style={{ color: 'rgba(232,245,233,0.35)' }}>No user accounts found.</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between p-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-white truncate block">{u.name || u.email}</span>
                    <span className="text-xs truncate block" style={{ color: 'rgba(232,245,233,0.40)' }}>{u.email}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-medium ${roleColors[u.role] ?? 'text-white/50'}`}>{u.role}</span>
                    <button
                      onClick={() => {
                        setResetUserId(resetUserId === u.id ? null : u.id);
                        setResetPw('');
                        setResetErr('');
                        setResetSuccess('');
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                      style={{
                        background: 'rgba(200,150,46,0.12)',
                        border: '1px solid rgba(200,150,46,0.22)',
                        color: '#E6B84A',
                      }}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                {resetUserId === u.id && (
                  <form onSubmit={e => handleReset(e, u.id)}
                    className="p-4 border-t space-y-3"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    {resetErr && (
                      <div className="flex items-center gap-2 text-xs p-2 rounded-lg"
                        style={{ background: 'rgba(239,83,80,0.10)', color: '#EF5350' }}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />{resetErr}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: 'rgba(232,245,233,0.50)' }}>New Temporary Password</label>
                      <div className="relative">
                        <input
                          type={showResetPw ? 'text' : 'password'}
                          value={resetPw}
                          onChange={e => setResetPw(e.target.value)}
                          className="glass-input text-sm pr-10"
                          placeholder="Min 6 chars"
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowResetPw(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showResetPw
                            ? <EyeOff className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />
                            : <Eye className="w-4 h-4" style={{ color: 'rgba(232,245,233,0.40)' }} />}
                        </button>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(232,245,233,0.35)' }}>
                        Share this with the user. They will be required to change it on next login.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={resetting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{ background: 'rgba(200,150,46,0.85)', color: '#0D1F0D' }}
                      >
                        {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        {resetting ? 'Resetting…' : 'Set Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetUserId(null)}
                        className="px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ color: 'rgba(232,245,233,0.50)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
