'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TreeDeciduous, Edit, Phone, Mail, MapPin, Cake, Clock, Shield, LayoutDashboard, Users, UserPlus, LogOut, Settings, X } from 'lucide-react';
import RelationsStrip from '@/components/profile/RelationsStrip';
import LineageBreadcrumb from '@/components/profile/LineageBreadcrumb';
import ContactPanel from '@/components/profile/ContactPanel';
import EditProfileModal from '@/components/profile/EditProfileModal';

interface Member {
  id: string;
  fullName: string;
  generation: number;
  isLate: boolean;
  mobileNumber?: string;
  email?: string;
  location?: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  bio?: string;
  dob?: string;
  dod?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  whatsapp?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  current_role?: string;
  company?: string;
  createdAt?: string;
  updatedAt?: string;
  father?: { id: string; fullName: string } | null;
  mother?: { id: string; fullName: string } | null;
  spouse?: { id: string; fullName: string } | null;
  children?: { id: string; fullName: string; generation?: number }[];
}

interface SessionUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  memberId: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lineage, setLineage] = useState<{ id: string; fullName: string }[]>([]);
  const [canViewContact, setCanViewContact] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAccountEdit, setShowAccountEdit] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data.user);
        if (data.user?.memberId) {
          fetchMember(data.user.memberId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/members/${memberId}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);

        // Build lineage breadcrumb
        if (data.fatherId || data.motherId) {
          buildLineage(data.fatherId || data.motherId, []);
        }

        // Check permissions
        const permRes = await fetch('/api/auth/permissions');
        if (permRes.ok) {
          const permData = await permRes.json();
          setCanViewContact(permData.canViewContact ?? true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch member:', error);
    }
  };

  const buildLineage = async (memberId: string | undefined, acc: { id: string; fullName: string }[]) => {
    if (!memberId) {
      setLineage(acc.reverse());
      return;
    }
    try {
      const res = await fetch(`/api/members/${memberId}`);
      if (res.ok) {
        const data = await res.json();
        acc.push({ id: data.id, fullName: data.fullName });
        if (data.fatherId || data.motherId) {
          buildLineage(data.fatherId || data.motherId, acc);
        } else {
          setLineage(acc.reverse());
        }
      }
    } catch (error) {
      console.error('Failed to build lineage:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    // Admin/editor without a linked member record gets a useful landing card
    if (session && (session.role === 'super_admin' || session.role === 'editor')) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card p-8 rounded-3xl text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(123,97,255,0.12)', border: '1px solid rgba(123,97,255,0.22)' }}>
              <Shield className="w-7 h-7" style={{ color: '#7B61FF' }} />
            </div>
            <h2 className="text-2xl font-display text-white mb-2">Admin Account</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(232,245,233,0.45)' }}>
              You are signed in as <strong className="text-white">{session.email}</strong> with <strong className="text-purple-400">{session.role.replace('_', ' ')}</strong> privileges.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/admin/members" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all">
                <Users className="w-4 h-4" /> All Members
              </Link>
              <button onClick={() => setShowAccountEdit(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all">
                <Settings className="w-4 h-4" /> Edit Account
              </button>
              <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'; }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-white/60">No profile found. Please contact admin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="px-4 max-w-4xl mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header Card */}
          <div className="glass-card p-8 rounded-3xl mb-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-purple-400 to-emerald-400 opacity-50 blur-xl" />
                <div className="relative w-32 h-32 rounded-full border-4 border-white/10 bg-surface-container flex items-center justify-center overflow-hidden">
                  <span className="text-white/30 text-4xl font-bold">
                    {member.fullName.charAt(0)}
                  </span>
                </div>
                {!member.isLate && (
                  <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0a0a0f]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-3xl font-display text-white">{member.fullName}</h2>
                  {member.isLate && (
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase">
                      In Loving Memory
                    </span>
                  )}
                </div>
                <p className="text-white/60 mb-2">Gen {member.generation}</p>
                {member.current_role && (
                  <p className="text-purple-400 font-medium">
                    {member.current_role}{member.company ? ` at ${member.company}` : ''}
                  </p>
                )}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/60 mt-3">
                  {member.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {member.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-white hover:bg-white/10 transition-all"
                style={{ minHeight: 44 }}
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <Link href="/tree" className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-white hover:bg-white/10 transition-all"
                style={{ minHeight: 44 }}>
                <TreeDeciduous className="w-4 h-4" />
                <span>Tree</span>
              </Link>
            </div>
          </div>

          {/* Quick Relations Strip */}
          <div className="glass-card p-6 rounded-2xl mb-6">
            <RelationsStrip
              father={member.father}
              mother={member.mother}
              spouse={member.spouse}
              children={member.children}
            />
          </div>

          {/* About */}
          {member.bio && (
            <div className="glass-card p-6 rounded-2xl mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">About</h3>
              <p className="text-white/80 leading-relaxed">{member.bio.slice(0, 500)}</p>
            </div>
          )}

          {/* Lineage Breadcrumb */}
          <div className="glass-card p-6 rounded-2xl mb-6">
            <LineageBreadcrumb members={lineage} />
          </div>

          {/* Contact Panel */}
          <div className="glass-card p-6 rounded-2xl mb-6">
            <ContactPanel
              mobileNumber={member.mobileNumber}
              email={member.email}
              location={member.location}
              instagram={member.instagram}
              linkedin={member.linkedin}
              twitter={member.twitter}
              whatsapp={member.whatsapp}
              canViewContact={canViewContact}
            />
          </div>

          {/* Activity (replacing feed) */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Activity</h3>
            <div className="space-y-3 text-sm text-white/60">
              {member.createdAt && (
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Joined Eriyadan's Legacy on {new Date(member.createdAt).toLocaleDateString()}
                </p>
              )}
              {member.updatedAt && (
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Last updated {new Date(member.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      {showEdit && member && (
        <EditProfileModal
          member={member}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            if (session?.memberId) fetchMember(session.memberId);
          }}
        />
      )}
      {showAccountEdit && (
        <AccountEditModal session={session} onClose={() => setShowAccountEdit(false)} />
      )}
    </div>
  );
}

function AccountEditModal({ session, onClose }: { session: SessionUser | null; onClose: () => void }) {
  const [name, setName] = useState(session?.email?.split('@')[0] || '');
  const [email, setEmail] = useState(session?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body: any = {};
      if (name.trim()) body.name = name.trim();
      if (email.trim()) body.email = email.trim();
      if (newPassword) body.newPassword = newPassword;
      const res = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update');
      }
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display text-white">Edit Account</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        {error && <div className="mb-4 p-3 rounded-xl text-sm bg-rose-500/10 border border-rose-500/20 text-rose-400">{error}</div>}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-white/40">DISPLAY NAME</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40">EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40">NEW PASSWORD (leave blank to keep)</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" placeholder="••••••••" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass text-white hover:bg-white/10 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
