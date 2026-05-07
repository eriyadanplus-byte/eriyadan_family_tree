'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Shield, History, Settings, Download, User,
  MoreVertical, Search, Filter, TrendingUp, TreeDeciduous,
  CalendarClock, ArrowRight, Plus, AlertCircle, Loader2, Edit, Trash2, X, Camera, GitBranch
} from 'lucide-react';
import AvatarUpload from '@/components/profile/AvatarUpload';

// AdminSidebar provided by AppShell

interface Member {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  generation: number;
  role: string;
  isLate: boolean;
  lastActive: string;
  location?: string;
  bio?: string;
  gender?: string;
  dob?: string;
  dod?: string;
  currentRole?: string;
  company?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  profilePhotoUrl?: string;
  avatarVersion?: number;
  createdVia?: string | null;
}

export default function AdminMembersPage() {
  const [currentRole, setCurrentRole] = useState<string>('super_admin');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.role) setCurrentRole(d.user.role); })
      .catch(() => {});
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setError(null);
      const res = await fetch('/api/members', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid response from server');
      setMembers(data);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      setError(error.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingMember) return;
    try {
      await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMember),
        credentials: 'include',
      });
      await fetchMembers();
      setEditingMember(null);
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/members/${id}`, { 
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Delete failed (${res.status})`);
      }
      await fetchMembers();
    } catch (error: any) {
      console.error('Failed to delete member:', error);
      setError(error.message || 'Failed to delete member');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      'super_admin': { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/20', text: 'text-purple-400' },
      'editor': { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400' },
      'contributor': { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/20', text: 'text-blue-400' },
      'viewer': { bg: 'bg-white/10 text-white/60 border-white/10', text: 'text-white/60' },
    };
    return badges[role] || badges.viewer;
  };

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-display text-white">Members Management</h2>
            <p className="text-on-surface-variant text-sm">Manage all family lineage members</p>
          </div>
          <Link href="/admin/add-member" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white hover:shadow-[0_0_20px_rgba(123,97,255,0.5)] transition-all">
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </Link>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(239,83,80,0.10)', border: '1px solid rgba(239,83,80,0.20)', color: '#EF5350' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/12 flex justify-between items-center bg-white/5">
            <h4 className="text-lg font-display text-white">All Members ({members.length})</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-container/50 border border-white/12 rounded-full py-1.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:ring-0 transition-all w-64"
                placeholder="Search members..."
              />
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="bg-white/2 text-on-surface-variant text-[10px] uppercase tracking-[0.15em] font-bold">
                <th className="px-3 py-3">Member</th>
                <th className="px-3 py-3">Generation</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-white/5 transition-all">
                  <td className="px-3 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-white/12 p-0.5">
                      <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center">
                        <User className="w-4 h-4 text-white/30" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{member.fullName}</p>
                      <p className="text-xs text-white/40">{member.email || member.mobileNumber}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-white/80">
                    Gen {member.generation}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadge(member.role).bg}`}>
                      {(member.role || 'viewer').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {member.isLate ? (
                      <span className="text-rose-400 text-xs">Late</span>
                    ) : (
                      <span className="text-emerald-400 text-xs">Living</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {member.createdVia === 'generation_seed' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Generation Seed
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentRole !== 'contributor' && (
                        <Link
                          href={`/admin/lineage?memberId=${member.id}`}
                          className="p-2 rounded-lg hover:bg-purple-500/20 transition-colors text-white/60 hover:text-purple-400"
                          title="Set lineage (parents / spouse)"
                        >
                          <GitBranch className="w-4 h-4" />
                        </Link>
                      )}
                      {currentRole !== 'contributor' && (
                        <button
                          onClick={() => setEditingMember(member)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {currentRole !== 'contributor' && (
                        <button
                          onClick={() => handleDelete(member.id)}
                          disabled={deletingId === member.id}
                          className="p-2 rounded-lg hover:bg-rose-500/20 transition-colors text-white/60 hover:text-rose-400"
                        >
                          {deletingId === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {currentRole === 'contributor' && (
                        <span className="text-xs" style={{ color: 'rgba(232,245,233,0.25)' }}>View only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingMember(null)} />
          <div className="relative w-full max-w-2xl glass-card rounded-3xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-display text-white">Edit Member</h3>
              <button onClick={() => setEditingMember(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <AvatarUpload
                  memberId={editingMember.id}
                  currentVersion={editingMember.avatarVersion || 0}
                  currentUrl={editingMember.profilePhotoUrl || null}
                  onUploaded={(v, url) => setEditingMember({ ...editingMember, avatarVersion: v, profilePhotoUrl: url })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/40">FULL NAME</label>
                  <input type="text" value={editingMember.fullName}
                    onChange={(e) => setEditingMember({ ...editingMember, fullName: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">MOBILE</label>
                  <input type="text" value={editingMember.mobileNumber}
                    onChange={(e) => setEditingMember({ ...editingMember, mobileNumber: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">EMAIL</label>
                  <input type="email" value={editingMember.email || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">ROLE</label>
                  <select value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm">
                    <option value="viewer">Viewer</option>
                    <option value="contributor">Contributor</option>
                    <option value="editor">Editor</option>
                    <option value="super_admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">GENDER</label>
                  <select value={editingMember.gender || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">GENERATION</label>
                  <input type="number" value={editingMember.generation}
                    onChange={(e) => setEditingMember({ ...editingMember, generation: parseInt(e.target.value) || 1 })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">DATE OF BIRTH</label>
                  <input type="date" value={editingMember.dob || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, dob: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">LOCATION</label>
                  <input type="text" value={editingMember.location || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, location: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">PROFESSION</label>
                  <input type="text" value={editingMember.currentRole || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, currentRole: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">COMPANY</label>
                  <input type="text" value={editingMember.company || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, company: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/40">BIO</label>
                <textarea value={editingMember.bio || ''} rows={3}
                  onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                  className="w-full rounded-xl glass-input px-4 text-white text-sm min-h-[80px] resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/40">INSTAGRAM</label>
                  <input type="text" value={editingMember.instagram || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, instagram: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">LINKEDIN</label>
                  <input type="text" value={editingMember.linkedin || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, linkedin: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">TWITTER / X</label>
                  <input type="text" value={editingMember.twitter || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, twitter: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">FACEBOOK</label>
                  <input type="text" value={editingMember.facebook || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, facebook: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">YOUTUBE</label>
                  <input type="text" value={editingMember.youtube || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, youtube: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40">WHATSAPP</label>
                  <input type="text" value={editingMember.whatsapp || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, whatsapp: e.target.value })}
                    className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editingMember.isLate}
                    onChange={(e) => setEditingMember({ ...editingMember, isLate: e.target.checked })}
                    className="w-4 h-4 rounded" />
                  <span className="text-white text-sm">Mark as Deceased</span>
                </label>
                {editingMember.isLate && (
                  <div className="flex-1">
                    <label className="text-xs text-white/40 block mb-1">DATE OF DEATH</label>
                    <input type="date" value={editingMember.dod || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, dod: e.target.value })}
                      className="w-full h-10 rounded-xl glass-input px-4 text-white text-sm" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 py-2.5 rounded-xl glass text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white hover:bg-purple-600 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}