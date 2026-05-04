'use client';

import Link from 'next/link';

interface LineageBreadcrumbProps {
  members: { id: string; fullName: string }[]; // From root → self
}

export default function LineageBreadcrumb({ members }: LineageBreadcrumbProps) {
  if (!members || members.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs text-white/40 uppercase tracking-wider">Family Lineage</h4>
      <nav className="flex items-center gap-2 text-sm flex-wrap">
        {members.map((member, index) => (
          <span key={member.id} className="flex items-center gap-2">
            <Link
              href={`/profile/${member.id}`}
              className={`hover:text-[#41eec2] transition-colors ${index === members.length - 1 ? 'text-white font-medium' : 'text-white/60'}`}
              style={{ minWidth: 44, minHeight: 44 }}
            >
              {member.fullName}
            </Link>
            {index < members.length - 1 && (
              <span className="text-white/20">»</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
