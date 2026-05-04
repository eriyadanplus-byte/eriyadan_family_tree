'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Shield, History, Settings, Download, User,
  MoreVertical, Search, Filter, TrendingUp, TreeDeciduous,
  CalendarClock, ArrowRight, Plus, AlertCircle, Loader2, GitBranch
} from 'lucide-react';

// AdminSidebar provided by AppShell

interface Stats {
  totalMembers: number;
  totalGenerations: number;
  addedThisMonth: number;
  pendingApprovals: number;
  lateMembers: number;
  livingMembers: number;
  minGeneration: number;
  maxGeneration: number;
  recentMembers: { id: string; fullName: string; email: string; generation: number; isLate: boolean; role: string; createdAt: string }[];
}

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      'Admin': { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/20', text: 'text-purple-400' },
      'Editor': { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400' },
      'Viewer': { bg: 'bg-white/10 text-white/60 border-white/10', text: 'text-white/60' },
    };
    return badges[role] || badges.Viewer;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
        {/* Admin View Banner */}
        <div className="mb-4 p-3 md:p-4 glass rounded-xl border-purple-500/30 bg-purple-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">You're in Admin View</p>
              <p className="text-[10px] text-white/40">Switch to member view to access the family tree</p>
            </div>
          </div>
          <button
            onClick={() => {
              fetch('/api/auth/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ view: 'member' }),
              }).then(() => window.location.href = '/tree');
            }}
            className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-all"
            style={{ minHeight: 44 }}
          >
            Back to Member View
          </button>
        </div>
        {/* Header */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-display text-white">System Dashboard</h2>
            <p className="text-on-surface-variant text-sm">Overview of your family lineage and network health.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm text-white hover:shadow-[0_0_15px_rgba(123,97,255,0.3)] transition-all">
              <Filter className="w-4 h-4" />
              <span>Refine View</span>
            </button>
            <Link href="/admin/add-member" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 text-white hover:shadow-[0_0_20px_rgba(123,97,255,0.5)] transition-all">
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </Link>
          </div>
        </header>

        {/* Empty tree CTA */}
        {(stats?.totalMembers ?? 0) === 0 && (
          <div className="mb-8 p-6 glass rounded-2xl border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <TreeDeciduous className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Start the Family Tree</p>
                <p className="text-xs text-white/40">No members yet. Add the founding ancestor to begin.</p>
              </div>
            </div>
            <Link href="/admin/founding" className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-all">
              Generation Seed
            </Link>
          </div>
        )}

        {/* Bento Grid Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="glass p-4 md:p-6 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 text-purple-400/20">
              <Users style={{ fontSize: '48px' }} />
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Total Members</p>
            <h3 className="text-3xl font-display text-white">{stats?.totalMembers ?? '...'}</h3>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stats?.livingMembers ?? 0} living · {stats?.lateMembers ?? 0} late
            </p>
          </div>
          <div className="glass p-4 md:p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-6 text-purple-400/20">
              <TreeDeciduous style={{ fontSize: '48px' }} />
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Generations</p>
            <h3 className="text-3xl font-display text-white">{stats?.totalGenerations ?? '...'}</h3>
            <p className="text-xs text-white/40 mt-2">Gen {stats?.minGeneration ?? 0} – {stats?.maxGeneration ?? 0}</p>
          </div>
          <div className="glass p-4 md:p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 md:p-6 text-purple-400/20">
              <CalendarClock style={{ fontSize: '48px' }} />
            </div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Added This Month</p>
            <h3 className="text-3xl font-display text-white">{stats?.addedThisMonth ?? '...'}</h3>
            <p className="text-xs text-white/40 mt-2">Last 30 days</p>
          </div>
          <Link href="/admin/approvals" className="glass p-4 md:p-6 rounded-xl relative overflow-hidden border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors block cursor-pointer">
            <div className="absolute top-0 right-0 p-4 md:p-6 text-rose-500/40">
              <AlertCircle style={{ fontSize: '48px' }} />
            </div>
            <p className="text-xs text-rose-400 uppercase tracking-widest mb-1">Pending Approvals</p>
            <div className="flex items-center gap-3">
              <h3 className="text-3xl font-display text-white">{stats?.pendingApprovals ?? '...'}</h3>
              {(stats?.pendingApprovals ?? 0) > 0 && (
                <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">URGENT</span>
              )}
            </div>
            <p className="text-xs text-rose-400 mt-2 font-medium">Click to view and process</p>
          </Link>
        </section>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-6">
          {/* Members Table */}
          <div className="col-span-12 md:col-span-8 space-y-6">
            <div className="glass rounded-2xl overflow-hidden">
              <div className="p-4 md:p-6 border-b border-white/12 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white/5">
                <h4 className="text-lg font-display text-white">Verified Lineage Members</h4>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-surface-container/50 border border-white/12 rounded-full py-1.5 pl-10 pr-4 text-sm focus:border-purple-500 focus:ring-0 transition-all w-full sm:w-64"
                    placeholder="Search ancestors..."
                  />
                </div>
              </div>
              {/* Mobile card layout */}
              <div className="sm:hidden divide-y divide-white/5">
                {loading ? (
                  <div className="px-4 py-6 text-center text-white/40 text-sm">Loading members...</div>
                ) : !stats?.recentMembers?.length ? (
                  <div className="px-4 py-6 text-center text-white/40 text-sm">No members found. Add your first member.</div>
                ) : stats.recentMembers.map(member => (
                  <div key={member.id} className="p-3 flex items-start gap-3 hover:bg-white/5 transition-all">
                    <div className="w-9 h-9 rounded-full border border-white/12 flex-shrink-0 mt-0.5">
                      <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center">
                        <User className="w-4 h-4 text-white/30" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{member.fullName}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-white/40">Gen {member.generation} · {member.isLate ? 'Late' : 'Living'}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadge(member.role).bg}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                    <Link href={`/profile/${member.id}`} className="text-white/40 hover:text-white transition-colors flex-shrink-0 mt-1">
                      <MoreVertical className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop/tablet table layout */}
              <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/2 text-on-surface-variant text-[10px] uppercase tracking-[0.15em] font-bold">
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Generation</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40 text-sm">Loading members...</td></tr>
                  ) : !stats?.recentMembers?.length ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40 text-sm">No members found. Add your first member.</td></tr>
                  ) : stats.recentMembers.map(member => (
                    <tr key={member.id} className="hover:bg-white/5 transition-all">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full border border-white/12 p-0.5 flex-shrink-0">
                          <div className="w-full h-full rounded-full bg-surface-container flex items-center justify-center">
                            <User className="w-4 h-4 text-white/30" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{member.fullName}</p>
                          <p className="text-xs text-white/40 truncate">{member.email || 'No email'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80 whitespace-nowrap">
                        Gen {member.generation} · {member.isLate ? 'Late' : 'Living'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRoleBadge(member.role).bg}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-white/40 whitespace-nowrap">{member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/profile/${member.id}`} className="text-white/40 hover:text-white transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="p-4 flex justify-center border-t border-white/5 bg-white/2">
                <Link href="/admin/members" className="text-xs text-purple-400 font-bold uppercase tracking-widest flex items-center gap-2 hover:underline">
                  View All {stats?.totalMembers ?? 0} Members
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Side Actions */}
          <div className="col-span-12 xl:col-span-4 space-y-6">
            {/* Export Section */}
            <div className="glass p-6 rounded-2xl bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-5 h-5 text-emerald-400" />
                <h4 className="text-lg font-display text-white">Data Export</h4>
              </div>
              <p className="text-xs text-white/40 mb-4">Generate a secure snapshot of the entire family database for offline archiving.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => window.open('/api/export?format=xlsx', '_blank')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/12 hover:border-emerald-400 hover:text-emerald-400 transition-all group">
                  <span style={{ fontSize: '24px' }}>📊</span>
                  <span className="text-[10px] font-bold">EXCEL</span>
                </button>
                <button onClick={() => window.open('/api/export?format=csv', '_blank')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/12 hover:border-emerald-400 hover:text-emerald-400 transition-all group">
                  <span style={{ fontSize: '24px' }}>📄</span>
                  <span className="text-[10px] font-bold">CSV</span>
                </button>
                <button onClick={() => window.open('/api/export?format=json', '_blank')} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/12 hover:border-emerald-400 hover:text-emerald-400 transition-all group">
                  <span style={{ fontSize: '24px' }}>🔧</span>
                  <span className="text-[10px] font-bold">JSON</span>
                </button>
              </div>
            </div>

            {/* Edit My Lineage — super_admin only */}
            <Link
              href="/admin/lineage"
              className="flex items-center gap-4 p-5 rounded-2xl glass border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Edit My Lineage</p>
                <p className="text-xs text-white/40">Set your generation, parents &amp; spouse in the tree</p>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 flex-shrink-0" />
            </Link>

            {/* Quick Help */}
            <div className="p-6 rounded-2xl bg-surface-container border border-white/5">
              <p className="text-xs flex items-center gap-2 mb-2">
                <span style={{ fontSize: '14px' }}>ℹ️</span>
                ADMIN TIP
              </p>
              <p className="text-sm italic text-white/60">"Use the Permissions section to restrict specific historical eras to Verified Lineage members only."</p>
            </div>
          </div>
        </div>
    </div>
  );
}