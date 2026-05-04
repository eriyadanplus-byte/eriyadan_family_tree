'use client';

export const dynamic = 'force-static';
export const runtime = 'edge';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { TreeDeciduous, Edit, Phone, Mail, MapPin, Cake, Clock, ArrowLeft } from 'lucide-react';
import RelationsStrip from '@/components/profile/RelationsStrip';
import LineageBreadcrumb from '@/components/profile/LineageBreadcrumb';
import ContactPanel from '@/components/profile/ContactPanel';
import AvatarUpload from '@/components/profile/AvatarUpload';
import EditProfileModal from '@/components/profile/EditProfileModal';

interface Member {
  id: string;
  fullName: string;
  generation: number;
  isLate: boolean;
  isStub?: boolean;
  claimedByUserId?: string;
  addedByMemberId?: string;
  avatarVersion?: number;
  profilePhotoUrl?: string;
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
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  customLinkLabel?: string;
  customLinkUrl?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  current_role?: string;
  company?: string;
  createdAt?: string;
  updatedAt?: string;
  father?: { id: string; fullName: string; photo?: string | null } | null;
  mother?: { id: string; fullName: string; photo?: string | null } | null;
  spouse?: { id: string; fullName: string; photo?: string | null } | null;
  children?: { id: string; fullName: string; generation?: number; photo?: string | null }[];
}

interface SessionUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  memberId: string | null;
}

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id as string;

  const [member, setMember] = useState<Member | null>(null);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lineage, setLineage] = useState<{ id: string; fullName: string }[]>([]);
  const [canViewContact, setCanViewContact] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (memberId) {
      fetchMember(memberId);
    }
  }, [memberId]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const fetchMember = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMember(data);

        // Build lineage breadcrumb
        if (data.fatherId || data.motherId) {
          buildLineage(data.fatherId || data.motherId, []);
        } else {
          setLineage([]);
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
    } finally {
      setLoading(false);
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
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <p className="text-white/60">Member not found.</p>
      </div>
    );
  }

  const isOwnProfile = session?.memberId === member.id;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <main className="px-4 max-w-4xl mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-4">
            <button
              onClick={() => router.push('/tree')}
              className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
              style={{ minHeight: 44 }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tree
            </button>
          </div>

          {/* Profile Header Card */}
          <div className="glass-card p-8 rounded-3xl mb-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative">
                {isOwnProfile ? (
                  <AvatarUpload
                    memberId={member.id}
                    currentVersion={member.avatarVersion || 0}
                    currentUrl={member.profilePhotoUrl || null}
                    onUploaded={(v, url) => setMember({ ...member, avatarVersion: v, profilePhotoUrl: url })}
                  />
                ) : (
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-purple-400 to-emerald-400 opacity-50 blur-xl" />
                    <div className="relative w-24 h-24 rounded-full border-4 border-white/10 bg-surface-container flex items-center justify-center overflow-hidden">
                      {member.profilePhotoUrl ? (
                        <img src={`${member.profilePhotoUrl}?v=${member.avatarVersion || 0}`} alt={member.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white/30 text-3xl font-bold">{member.fullName.charAt(0)}</span>
                      )}
                    </div>
                    {!member.isLate && (
                      <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0a0a0f]" />
                    )}
                  </div>
                )}
                {member.isStub && (
                  <div className="mt-1 text-center text-xs text-yellow-400/70">Unclaimed</div>
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

              {/* Actions */}
              <div className="flex gap-3">
                <Link
                  href={`/tree?focus=${member.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-white hover:bg-white/10 transition-all"
                  style={{ minHeight: 44 }}
                >
                  <TreeDeciduous className="w-4 h-4" />
                  <span>View on Tree</span>
                </Link>
                {isOwnProfile && (
                  <button onClick={() => setShowEdit(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-white hover:bg-white/10 transition-all">
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
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
              facebook={member.facebook}
              youtube={member.youtube}
              whatsapp={member.whatsapp}
              customLinkLabel={member.customLinkLabel}
              customLinkUrl={member.customLinkUrl}
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
          currentUserRole={session?.role}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchMember(member.id);
          }}
        />
      )}
    </div>
  );
}
