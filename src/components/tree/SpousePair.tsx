'use client';

import { memo } from 'react';
import { Heart } from 'lucide-react';

interface SpousePairProps {
  member: {
    id: string;
    fullName: string;
    generation: number;
    isLate: boolean;
    isStub?: boolean;
    photo?: string | null;
    gender?: string;
  };
  spouse: {
    id: string;
    fullName: string;
    generation: number;
    isLate: boolean;
    isStub?: boolean;
    photo?: string | null;
    gender?: string;
  } | null;
  isSelected?: boolean;
  onClick?: (id: string) => void;
}

function AvatarCircle({ name, photo, isLate, isStub }: {
  name: string; photo?: string | null; isLate?: boolean; isStub?: boolean;
}) {
  const initials = name?.charAt(0)?.toUpperCase() || '?';
  if (photo) {
    return <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover border border-white/10" />;
  }
  const bg = isLate ? 'bg-rose-500/15' : isStub ? 'bg-yellow-500/15' : 'bg-purple-500/15';
  const fg = isLate ? 'text-rose-400' : isStub ? 'text-yellow-400' : 'text-purple-300';
  return (
    <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center`}>
      <span className={`text-xs font-bold ${fg}`}>{initials}</span>
    </div>
  );
}

function SpousePair({ member, spouse, isSelected, onClick }: SpousePairProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Primary member */}
      <div
        className={`px-2 py-1.5 rounded-xl glass-card cursor-pointer transition-all hover:border-purple-400/50 ${
          isSelected ? 'border-purple-400' : 'border-white/10'
        }`}
        onClick={() => onClick?.(member.id)}
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <AvatarCircle name={member.fullName} photo={member.photo} isLate={member.isLate} isStub={member.isStub} />
          <span className="text-[10px] font-bold text-white font-display text-center line-clamp-1 max-w-[60px]">
            {member.fullName}
          </span>
        </div>
      </div>

      {/* Spouse */}
      {spouse && (
        <>
          <Heart className="w-3 h-3 text-pink-400/50 flex-shrink-0" />
          <div
            className={`px-2 py-1.5 rounded-xl glass-card cursor-pointer transition-all hover:border-pink-400/50 border-white/10`}
            onClick={() => onClick?.(spouse.id)}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <AvatarCircle name={spouse.fullName} photo={spouse.photo} isLate={spouse.isLate} isStub={spouse.isStub} />
              <span className="text-[10px] font-bold text-white font-display text-center line-clamp-1 max-w-[60px]">
                {spouse.fullName}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(SpousePair);
