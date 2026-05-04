'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  TreeDeciduous, Search as SearchIcon, Plus, User, Settings, Filter,
  CalendarClock, Download, MoreVertical, TrendingUp, Loader2, Edit, Trash2, X
} from 'lucide-react';

interface Member {
  id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  generation: number;
  isLate: boolean;
  role: string;
  location?: string;
  createdAt?: string;
}

export default function SearchPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [generationFilter, setGenerationFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'living' | 'late'>('all');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q && generationFilter === null && statusFilter === 'all') {
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (generationFilter !== null) params.set('generation', String(generationFilter));
      if (statusFilter !== 'all') params.set('isLate', statusFilter === 'late' ? 'true' : 'false');
      params.set('limit', '30');
      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, generationFilter, statusFilter]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(doSearch, 300);
    return () => clearTimeout(timerRef.current);
  }, [searchQuery, generationFilter, statusFilter, doSearch]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      'super_admin': { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/20', text: 'text-purple-400' },
      'editor': { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', text: 'text-emerald-400' },
      'contributor': { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/20', text: 'text-blue-400' },
      'viewer': { bg: 'bg-white/10 text-white/60 border-white/10', text: 'text-white/60' },
    };
    return badges[role] || badges.viewer;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="px-4 md:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-white mb-2">Search Family Lineage</h1>
          <p className="text-white/40">Find ancestors and family members across 8 generations</p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 rounded-2xl glass-input pl-12 pr-4 text-white text-lg placeholder:text-white/20"
              placeholder="Search by name, email, phone, or location..."
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-white/40 uppercase tracking-wider">Filters:</span>
            <select
              value={generationFilter ?? ''}
              onChange={(e) => setGenerationFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="h-9 rounded-lg glass-input px-3 text-white text-xs"
            >
              <option value="">All Generations</option>
              {[1,2,3,4,5,6,7,8].map(g => (
                <option key={g} value={g}>Gen {g}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 rounded-lg glass-input px-3 text-white text-xs"
            >
              <option value="all">All Status</option>
              <option value="living">Living</option>
              <option value="late">Late</option>
            </select>
            {(searchQuery || generationFilter !== null || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setGenerationFilter(null); setStatusFilter('all'); }}
                className="h-9 px-3 rounded-lg glass text-white text-xs hover:bg-white/10 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {members.length > 0 && (
          <div className="mb-6">
            <p className="text-white/60 text-sm">
              Found {members.length} result{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {members.map((member: Member) => (
            <Link
              key={member.id}
              href={`/tree?id=${member.id}`}
              className="block glass-card p-4 rounded-2xl hover:bg-white/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-white/10 bg-surface-container flex items-center justify-center">
                  <User className="w-6 h-6 text-white/30" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-medium">{member.fullName}</h3>
                    {member.isLate && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">Late</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                    <span>Gen {member.generation}</span>
                    {member.email && <span>{member.email}</span>}
                    {member.mobileNumber && <span>{member.mobileNumber}</span>}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getRoleBadge(member.role).bg} border`}>
                  {(member.role || 'viewer').replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {members.length === 0 && !loading && (searchQuery || generationFilter !== null || statusFilter !== 'all') && (
          <div className="text-center py-12">
            <p className="text-white/40 text-sm">No members match your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}