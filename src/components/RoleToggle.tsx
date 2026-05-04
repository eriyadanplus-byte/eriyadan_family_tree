'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';

interface RoleToggleProps {
  currentView: 'member' | 'admin';
  canSwitch: boolean;
}

export default function RoleToggle({ currentView, canSwitch }: RoleToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!canSwitch) return null;

  const handleToggle = async (view: 'member' | 'admin') => {
    if (view === currentView) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view }),
      });

      if (res.ok) {
        if (view === 'admin') {
          router.push('/admin');
        } else {
          router.push('/tree');
        }
      }
    } catch (error) {
      console.error('Failed to switch view:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-full glass" style={{ minWidth: 88, minHeight: 44 }}>
      <button
        onClick={() => handleToggle('member')}
        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
          currentView === 'member'
            ? 'bg-purple-500 text-white'
            : 'text-white/40 hover:text-white'
        }`}
        disabled={loading}
        style={{ minHeight: 36 }}
      >
        Member
      </button>
      <button
        onClick={() => handleToggle('admin')}
        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
          currentView === 'admin'
            ? 'bg-purple-500 text-white'
            : 'text-white/40 hover:text-white'
        }`}
        disabled={loading}
        style={{ minHeight: 36 }}
      >
        Admin
      </button>
    </div>
  );
}
