'use client';

import Link from 'next/link';
import { User } from 'lucide-react';

interface Member {
  id: string;
  fullName: string;
  gender?: string;
  generation?: number;
}

interface RelationsStripProps {
  father?: Member | null;
  mother?: Member | null;
  spouse?: Member | null;
  children?: Member[];
}

export default function RelationsStrip({ father, mother, spouse, children }: RelationsStripProps) {
  const members = [
    { label: 'Father', member: father },
    { label: 'Mother', member: mother },
    { label: 'Spouse', member: spouse },
    ...(children?.map((child) => ({ label: 'Child', member: child })) || []),
  ].filter((item) => item.member);

  if (members.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs text-white/40 uppercase tracking-wider">Family</h4>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
        {members.map(({ label, member }) => (
          <Link
            key={member!.id}
            href={`/profile/${member!.id}`}
            className="flex-shrink-0 w-24 flex flex-col items-center gap-2 p-3 glass rounded-xl hover:border-[#7B61FF]/30 transition-all"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
              <User className="w-5 h-5 text-white/30" />
            </div>
            <span className="text-white text-xs font-medium text-center line-clamp-2">
              {member!.fullName}
            </span>
            <span className="text-[10px] text-white/30">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
