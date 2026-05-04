'use client';

import { Suspense } from 'react';
import { useCallback, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TreeDeciduous, Search, Plus, User, Loader2, Crosshair } from 'lucide-react';
import BottomSheet from '@/components/BottomSheet';
import DesktopTree from '@/components/tree/DesktopTree';
import MobileTree from '@/components/tree/MobileTree';
import useMediaQuery from '@/hooks/useMediaQuery';
import { computeLayout } from '@/lib/treeLayout';

interface Member {
  id: string;
  fullName: string;
  generation: number;
  isLate: boolean;
  isOnline?: boolean;
  isStub?: boolean;
  birthYear?: number;
  deathYear?: number;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  photoUrl?: string;
  profilePhotoUrl?: string;
  avatarVersion?: number;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  mobileNumber?: string;
  email?: string;
  location?: string;
  bio?: string;
  gender?: string;
  dob?: string;
  dod?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
}

interface SessionUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  memberId: string | null;
}

const rolePermissions = {
  super_admin: { canAdd: true, canEdit: true, canDelete: true, canExport: true, canManageUsers: true },
  editor: { canAdd: true, canEdit: true, canDelete: true, canExport: false, canManageUsers: false },
  contributor: { canAdd: true, canEdit: true, canDelete: false, canExport: false, canManageUsers: false },
  viewer: { canAdd: false, canEdit: false, canDelete: false, canExport: false, canManageUsers: false },
};

function TreePageContent({ focusId }: { focusId: string | null }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Center the tree on mount and resize
  useEffect(() => {
    const centerTree = () => {
      // Set proper vertical offset to bring tree into view
      setPan({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
    };
    centerTree();
    window.addEventListener('resize', centerTree);
    return () => window.removeEventListener('resize', centerTree);
  }, []);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationFilter, setGenerationFilter] = useState<number | null>(null);

  useEffect(() => {
    fetchSession();
    fetchMembers();

    // Presence heartbeat: update last_seen every 5 minutes
    const heartbeat = () => {
      fetch('/api/presence', { method: 'POST' }).catch(() => {});
    };
    heartbeat();
    const interval = setInterval(heartbeat, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSession = async () => {
    try {
      setError(null);
      const res = await fetch('/api/auth/session');
      if (!res.ok) throw new Error('Failed to load session');
      if (res.ok) {
        const data = await res.json();
        setSession(data.user);
      }
    } catch (error: any) {
      console.error('Failed to fetch session:', error);
      setError(error.message || 'Failed to load session');
    }
  };

  const canEdit = session && rolePermissions[session.role as keyof typeof rolePermissions]?.canEdit;

  const filteredMembers = useMemo(() => {
    if (generationFilter === null) return members;
    return members.filter(m => m.generation === generationFilter);
  }, [members, generationFilter]);

  const generations = useMemo(() => {
    const gens = Array.from(new Set(members.map(m => m.generation))).sort((a, b) => a - b);
    return gens;
  }, [members]);

  const fetchMembers = async () => {
    try {
      setError(null);
      const [membersRes, onlineRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/presence'),
      ]);
      if (!membersRes.ok) throw new Error('Failed to load members');
      const data = await membersRes.json();
      if (!Array.isArray(data)) throw new Error('Invalid response from server');
      let onlineIds: string[] = [];
      if (onlineRes.ok) {
        onlineIds = await onlineRes.json();
      }
      const onlineSet = new Set(onlineIds);
      const membersWithStatus = Array.isArray(data) ? data.map((m: any) => ({
        ...m,
        isOnline: onlineSet.has(String(m.id)),
      })) : [];
      setMembers(membersWithStatus);
    } catch (error: any) {
      console.error('Failed to fetch members:', error);
      setError(error.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const handleFitToScreen = () => {
    setZoom(1);
    if (typeof window !== 'undefined') {
      setPan({ x: window.innerWidth / 2, y: 0 });
    } else {
      setPan({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleFindMe = () => {
    const targetId = session?.memberId ? String(session.memberId) : null;
    if (!targetId) return;
    const member = members.find(m => String(m.id) === targetId) || null;
    setSelectedMember(member);
    router.push(`/tree?focus=${targetId}`);

    if (!isMobile && member) {
      // Compute layout to find node position and pan to it
      const { nodes } = computeLayout(filteredMembers.map(m => ({
        id: m.id, fullName: m.fullName, generation: m.generation,
        isLate: m.isLate, fatherId: m.fatherId, motherId: m.motherId,
        spouseId: m.spouseId, gender: m.gender,
      })));
      const node = nodes.find(n => n.id === targetId);
      if (node && typeof window !== 'undefined') {
        const NODE_W = 140;
        const NODE_H = 130;
        setPan({
          x: window.innerWidth  / 2 - (node.position.x + NODE_W / 2) * zoom,
          y: window.innerHeight / 2 - (node.position.y + NODE_H / 2) * zoom,
        });
      }
    }
    // MobileTree handles its own scroll-to via focusId prop
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
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 bg-rose-500/90 text-white rounded-lg shadow-lg">
          {error}
        </div>
      )}

      <main className="fixed inset-0 overflow-hidden pt-14 md:pt-16 pb-16 md:pb-0">
        {/* Generation Filter Bar */}
        <div className="absolute top-14 md:top-16 left-0 right-0 z-30 flex items-center gap-2 px-4 py-2 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 overflow-x-auto">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold flex-shrink-0">Filter</span>
          <button
            onClick={() => setGenerationFilter(null)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0 ${generationFilter === null ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            All
          </button>
          {generations.map(gen => (
            <button
              key={gen}
              onClick={() => setGenerationFilter(generationFilter === gen ? null : gen)}
               className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0 ${generationFilter === gen ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              Gen {gen}
            </button>
          ))}
        </div>

        {isMobile ? (
          <MobileTree members={filteredMembers} focusId={focusId} onMemberClick={setSelectedMember} />
        ) : (
          <DesktopTree
            members={filteredMembers}
            selectedMember={selectedMember}
            focusId={focusId}
            zoom={zoom}
            pan={pan}
            isDragging={isDragging}
            dragStart={dragStart}
            onMemberClick={setSelectedMember}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitToScreen={handleFitToScreen}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        )}
      </main>

      {/* Find Me Button */}
      <button
        onClick={handleFindMe}
        className="fixed bottom-24 md:bottom-8 right-8 z-40 p-3 glass rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        style={{ minWidth: 44, minHeight: 44 }}
        title="Find me"
      >
        <Crosshair className="w-5 h-5" />
      </button>

      <BottomSheet isOpen={!!selectedMember} onClose={() => setSelectedMember(null)}>
        {selectedMember && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-white/10 bg-surface-container flex items-center justify-center overflow-hidden">
                {selectedMember?.profilePhotoUrl || selectedMember?.photoUrl ? (
                  <img
                    src={`${selectedMember.profilePhotoUrl || selectedMember.photoUrl}?v=${selectedMember.avatarVersion || 0}`}
                    alt={selectedMember.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white/30" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-display text-white">{selectedMember.fullName}</h3>
                <p className="text-white/40 text-sm">Gen {selectedMember.generation} • {selectedMember.isLate ? 'Late' : 'Living'}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Relation chips */}
              <div className="flex flex-wrap gap-2">
                {selectedMember.fatherId && (
                  <Link href={`/tree?focus=${selectedMember.fatherId}`} className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">
                    Father: {members.find(m => m.id === selectedMember.fatherId)?.fullName || 'Unknown'}
                  </Link>
                )}
                {selectedMember.motherId && (
                  <Link href={`/tree?focus=${selectedMember.motherId}`} className="px-2 py-1 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-bold uppercase">
                    Mother: {members.find(m => m.id === selectedMember.motherId)?.fullName || 'Unknown'}
                  </Link>
                )}
                {selectedMember.spouseId && (
                  <Link href={`/tree?focus=${selectedMember.spouseId}`} className="px-2 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase">
                    Spouse: {members.find(m => m.id === selectedMember.spouseId)?.fullName || 'Unknown'}
                  </Link>
                )}
              </div>

              {selectedMember.mobileNumber && (
                <div>
                  <span className="text-white/40 text-xs uppercase">Mobile</span>
                  <p className="text-white text-sm">{selectedMember.mobileNumber}</p>
                </div>
              )}
              {selectedMember.email && (
                <div>
                  <span className="text-white/40 text-xs uppercase">Email</span>
                  <p className="text-white text-sm">{selectedMember.email}</p>
                </div>
              )}
              {selectedMember.location && (
                <div>
                  <span className="text-white/40 text-xs uppercase">Location</span>
                  <p className="text-white text-sm">{selectedMember.location}</p>
                </div>
              )}
              {selectedMember.bio && (
                <div>
                  <span className="text-white/40 text-xs uppercase">Bio</span>
                  <p className="text-white text-sm">{selectedMember.bio}</p>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-3 mt-6">
                <Link
                  href={`/profile/${selectedMember.id}`}
                  className="flex-1 py-2 rounded-lg bg-white/10 text-white text-sm font-medium flex items-center justify-center gap-2"
                  style={{ minHeight: 44 }}
                >
                  <User className="w-4 h-4" /> Profile
                </Link>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function TreePageContentWithSearchParams() {
  const searchParams = useSearchParams();
  return <TreePageContent focusId={searchParams.get('focus')} />;
}

export default function TreePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TreePageContentWithSearchParams />
    </Suspense>
  );
}
