'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Simple inline SVG icons to avoid lucide-react hydration crashes
const Icons: Record<string, JSX.Element> = {
  LayoutDashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  ShieldCheck: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  History: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  UserPlus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  Trees: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L8 8h8L12 2z"/><path d="M8 8L4 14h8L8 8z"/><path d="M16 8l-4 6h8l-4-6z"/><line x1="12" y1="14" x2="12" y2="22"/></svg>,
  Archive: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  MessageCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
};

const NAV = [
  { href: '/admin',             label: 'Dashboard',   icon: 'LayoutDashboard' },
  { href: '/admin/approvals',   label: 'Approvals',   icon: 'UserPlus',  badge: true },
  { href: '/admin/help',        label: 'Help Inbox',  icon: 'MessageCircle' },
  { href: '/admin/members',     label: 'All Members', icon: 'Users' },
  { href: '/admin/founding',    label: 'Generation Seed', icon: 'Trees' },
  { href: '/admin/permissions', label: 'Permissions', icon: 'ShieldCheck' },
  { href: '/admin/audit',       label: 'Audit Log',   icon: 'History' },
  { href: '/admin/settings',    label: 'Settings',    icon: 'Settings' },
];

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col py-4 px-3 overflow-x-hidden"
      style={{ background: 'rgba(13,31,13,0.95)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Logo area */}
      <div className="px-3 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: '#81C784' }}>{Icons.Trees}</span>
          <span className="font-display font-bold text-white text-sm">Admin Panel</span>
        </div>
        <p className="text-[10px] pl-6" style={{ color: 'rgba(232,245,233,0.35)' }}>Eriyadan's Legacy</p>
      </div>

       {/* Nav links */}
       <nav className="flex-1 space-y-1 overflow-x-hidden">
         {NAV.map(({ href, label, icon, badge }) => {
           const active = pathname === href || (href !== '/admin' && pathname?.startsWith(href));
           return (
             <Link key={href} href={href}
               onClick={onNavigate}
                 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'text-white' : 'hover:bg-white/5'} truncate`}
               style={active ? {
                 background: 'rgba(76,175,114,0.14)',
                 color: '#E8F5E9',
                 border: '1px solid rgba(76,175,114,0.20)',
               } : { color: 'rgba(232,245,233,0.55)' }}>
               <span style={{ flexShrink: 0 }}>{Icons[icon]}</span>
               <span className="truncate">{label}</span>
              {badge && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(200,150,46,0.20)', color: '#E6B84A' }}>
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to tree */}
      <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/tree" onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
          style={{ color: 'rgba(232,245,233,0.45)' }}>
          <span>{Icons.Trees}</span>
          <span>← Family Tree</span>
        </Link>
      </div>
    </div>
  );
}
