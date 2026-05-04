'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TreeDeciduous, Search, Plus, User, Settings, LayoutDashboard } from 'lucide-react';
const NAV = [
  { href: '/tree',     label: 'Tree',    Icon: TreeDeciduous },
  { href: '/search',   label: 'Search',  Icon: Search },
  { href: '/admin/add-member', label: 'Add',     Icon: Plus, isFab: true, requiresCanAdd: true },
  { href: '/profile',  label: 'Profile', Icon: User },
  { href: '/admin',    label: 'Admin',   Icon: LayoutDashboard, requiresAdmin: true },
  { href: '/settings', label: 'More',    Icon: Settings },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [canAdd, setCanAdd] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const role = d?.user?.role;
        setCanAdd(['super_admin', 'editor', 'contributor'].includes(role));
        setIsAdmin(['super_admin', 'editor'].includes(role));
      }).catch(() => {});
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-3 md:hidden overflow-x-hidden"
      style={{
        background: 'rgba(13,31,13,0.96)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      {NAV.map(({ href, label, Icon, isFab, requiresCanAdd, requiresAdmin }) => {
        if (requiresCanAdd && !canAdd) return null;
        if (requiresAdmin && !isAdmin) return null;
        const active = pathname === href || (href === '/tree' && pathname?.startsWith('/tree') && !pathname.startsWith('/tree/add'));

        if (isFab) return (
          <Link key={href} href={href} aria-label={label}
            className="flex h-12 w-12 items-center justify-center rounded-full transition-transform active:scale-95 mx-1"
            style={{ background: 'linear-gradient(135deg,#4CAF72,#2E7D32)', boxShadow: '0 4px 16px rgba(76,175,114,0.45)' }}>
            <Icon size={24} className="text-white" />
          </Link>
        );

        return (
          <Link key={href} href={href} aria-label={label}
            className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 transition-colors mx-1"
            style={{ minWidth: 44, minHeight: 44, color: active ? '#81C784' : 'rgba(232,245,233,0.40)' }}>
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
            {active && <span className="absolute bottom-1 h-1 w-4 rounded-full" style={{ background: '#81C784' }} />}
          </Link>
        );
      })}
    </nav>
  );
}
