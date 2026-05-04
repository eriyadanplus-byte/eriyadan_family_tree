'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TreeDeciduous, Search as SearchIcon, Plus, User, Settings, 
  History, Calendar, MapPin, Loader2, ChevronRight
} from 'lucide-react';

interface Member {
  id: string;
  fullName: string;
  mobileNumber: string;
  generation: number;
  isLate: boolean;
  birthYear?: number;
  deathYear?: number;
  location?: string;
  bio?: string;
}

export default function ArchivePage() {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 h-16 glass rounded-2xl m-4 shadow-2xl shadow-purple-500/10">
        <Link href="/" className="flex items-center gap-3">
          <TreeDeciduous className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold tracking-[0.2em] text-white uppercase font-display hidden md:block">
            Eriyadan's Legacy
          </h1>
        </Link>
        
        <nav className="hidden md:flex items-center ml-auto gap-6">
          <Link href="/tree" className="text-white/60 text-sm hover:text-white transition-all">Tree</Link>
          <Link href="/archive" className="text-purple-400 text-sm">Archive</Link>
          <Link href="/admin" className="text-white/60 text-sm hover:text-white transition-all">Admin</Link>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <Link href="/search">
            <SearchIcon className="w-5 h-5 text-white/60 hover:text-white transition-all" />
          </Link>
          <Link href="/profile">
            <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                <User className="w-4 h-4 text-white/40" />
              </div>
            </div>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-24 px-4 md:px-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <History className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display text-white">Legacy Archive</h1>
            <p className="text-white/40">Honoring our departed ancestors</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-display text-white">{members.length}</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Remembered</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-display text-white">
                {members.length > 0 ? Math.min(...members.filter(m => m.birthYear).map(m => m.birthYear!)) : '-'}
              </p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Earliest Born</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-display text-white">
                {members.length > 0 ? Math.max(...members.filter(m => m.deathYear).map(m => m.deathYear!)) : '-'}
              </p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Most Recent</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-display text-white mb-4">Memorial Records</h2>
          
          {members.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No departed family members to display</p>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border border-rose-500/30 bg-rose-500/10 flex items-center justify-center">
                      <span className="text-rose-400 text-xl">🕯️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-display text-white">{member.fullName}</h3>
                      <div className="flex items-center gap-4 text-sm text-white/40 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {member.birthYear} — {member.deathYear || '?'}
                        </span>
                        {member.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {member.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/tree?id=${member.id}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </Link>
                </div>
                {member.bio && (
                  <p className="text-white/60 text-sm mt-4 pl-18">{member.bio}</p>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-safe glass rounded-t-[32px] border-t border-white/12">
        <Link href="/tree" className="flex flex-col items-center justify-center text-white/30 p-2">
          <TreeDeciduous className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-widest mt-1">Tree</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-white/30 p-2">
          <SearchIcon className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-widest mt-1">Search</span>
        </Link>
        <Link href="/archive" className="flex flex-col items-center justify-center text-purple-400 bg-white/5 rounded-full p-2 scale-95">
          <History className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-widest mt-1">Archive</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center text-white/30 p-2">
          <User className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-widest mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
}