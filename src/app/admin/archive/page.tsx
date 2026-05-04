'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, Shield, History, Settings, User, Loader2,
  Calendar, MapPin, ChevronRight
} from 'lucide-react';

// AdminSidebar provided by AppShell

interface Member {
  id: string;
  fullName: string;
  generation: number;
  isLate: boolean;
  birthYear?: number;
  deathYear?: number;
  location?: string;
  bio?: string;
}

export default function AdminArchivePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members?isLate=true');
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLate: false }),
      });
      await fetchMembers();
    } catch (error) {
      console.error('Failed to restore member:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-12">
        <header className="mb-8">
          <h2 className="text-3xl font-display text-white">Archive Management</h2>
          <p className="text-on-surface-variant text-sm">Manage departed family members</p>
        </header>

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-rose-500/10">
              <p className="text-2xl font-display text-white">{members.length}</p>
              <p className="text-xs text-rose-400 uppercase tracking-wider">Archived</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-display text-white">
                {members.length > 0 ? Math.min(...members.filter(m => m.birthYear).map(m => m.birthYear!)) : '-'}
              </p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Earliest</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-display text-white">
                {members.length > 0 ? Math.max(...members.filter(m => m.deathYear).map(m => m.deathYear!)) : '-'}
              </p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Most Recent</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/12 bg-white/5">
            <h4 className="text-lg font-display text-white">Archived Members ({members.length})</h4>
          </div>
          
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No archived members</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {members.map(member => (
                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-rose-500/30 bg-rose-500/10 flex items-center justify-center">
                      <span className="text-rose-400">🕯️</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.fullName}</p>
                      <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                        <span>Gen {member.generation}</span>
                        {member.birthYear && member.deathYear && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {member.birthYear} — {member.deathYear}
                          </span>
                        )}
                        {member.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {member.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(member.id)}
                    className="px-4 py-2 rounded-xl glass text-white text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <span>Restore</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}