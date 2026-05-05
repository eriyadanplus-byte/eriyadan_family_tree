'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle, Users, Clock, GitBranch } from 'lucide-react';

interface PendingUser {
  userId: string; email: string; fullName: string;
  mobileNumber: string; ancestorName: string; requestedAt: string;
}

const ROLES = [
  { value: 'viewer',      label: 'Viewer',      desc: 'Can only view the family tree' },
  { value: 'contributor', label: 'Contributor',  desc: 'Can add and edit members' },
  { value: 'editor',      label: 'Editor',       desc: 'Full edit access, no admin panel' },
];

export default function ApprovalsPage() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = async () => {
    try {
      const res  = await fetch('/api/admin/approvals');
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Approvals API error:', data);
        setPending([]);
      } else {
        // DON'T filter - just set whatever the API returns
        console.log('Raw API response:', JSON.stringify(data));
        // Handle both array response and error object
        if (data && typeof data === 'object' && Array.isArray(data)) {
          setPending(data);
          // Build roleMap for each user - normalize empty userId to index key
          const defaults: Record<string, string> = {};
          data.forEach((u: any, i: number) => { 
            // Use index as fallback key if userId is empty
            const key = (u && u.userId) ? u.userId : 'idx_' + i;
            defaults[key] = 'viewer'; 
          });
          setRoleMap(defaults);
        } else if (data && data.error) {
          console.error('API returned error:', data.error);
          setPending([]);
        } else {
          setPending([]);
        }
      }
    } catch (err) {
      console.error('Fetch pending error:', err);
      setPending([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handle = async (userId: string, action: 'approve' | 'reject') => {
    // Guard against undefined or empty userId - use index fallback
    const key = userId ? userId : 'idx_0';
    if (!key) {
      showToast('Invalid user ID. Please refresh the page and try again.', false);
      return;
    }
    setProcessing(key);
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, role: roleMap[userId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(action === 'approve' ? '✅ Member approved and added to the tree!' : '❌ User rejected.');
      await fetchPending();
    } catch (e: any) {
      showToast(e.message || 'Failed to process', false);
    } finally { setProcessing(null); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[200] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl transition-all ${toast.ok ? 'bg-green-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(200,150,46,0.15)', border: '1px solid rgba(200,150,46,0.25)' }}>
            <Clock className="w-5 h-5" style={{ color: '#E6B84A' }} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Pending Approvals</h1>
            <p className="text-sm" style={{ color: 'rgba(232,245,233,0.50)' }}>
              {pending.length} {pending.length === 1 ? 'person' : 'people'} waiting to join the family
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#81C784' }} />
        </div>
      )}

      {!loading && pending.length === 0 && (
        <div className="text-center py-20 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#81C784' }} />
          <h3 className="font-display text-xl font-semibold text-white mb-2">All caught up!</h3>
          <p style={{ color: 'rgba(232,245,233,0.45)' }}>No pending membership requests right now.</p>
        </div>
      )}

<div className="space-y-4">
        {pending.map((user: any, idx: number) => (
          <div key={user?.userId || idx} className="rounded-2xl p-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* User info */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                  style={{ background: 'rgba(76,175,114,0.15)', color: '#81C784', border: '1px solid rgba(76,175,114,0.25)' }}>
                  {(!user.fullName && !user.email) ? '?' : (user.fullName || user.email || 'User').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{!user.fullName && !user.email ? 'Unknown User' : (user.fullName || user.email)}</p>
                  <p className="text-sm" style={{ color: 'rgba(232,245,233,0.55)' }}>{user.email || 'No email'}</p>
                  {user.mobileNumber && (
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(232,245,233,0.40)' }}>{user.mobileNumber}</p>
                  )}
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: 'rgba(200,150,46,0.12)', color: '#E6B84A', border: '1px solid rgba(200,150,46,0.20)' }}>
                Pending
              </span>
            </div>

            {/* Ancestor info */}
            <div className="flex items-center gap-2 mb-5 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <GitBranch size={14} style={{ color: '#81C784' }} />
              <span className="text-sm" style={{ color: 'rgba(232,245,233,0.55)' }}>
                Selected ancestor: <span className="font-semibold text-white">{(user.ancestorName)}</span>
              </span>
            </div>

            {/* Role selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'rgba(232,245,233,0.45)' }}>Assign Role on Approval</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => setRoleMap(m => ({ ...m, [user.userId]: r.value }))}
                    className={`p-3 rounded-xl text-left transition-all border ${roleMap[user.userId] === r.value ? 'border-[rgba(76,175,114,0.40)]' : 'border-[rgba(255,255,255,0.08)]'}`}
                    style={{
                      background: roleMap[user.userId] === r.value ? 'rgba(76,175,114,0.12)' : 'rgba(255,255,255,0.03)',
                      borderColor: roleMap[user.userId] === r.value ? 'rgba(76,175,114,0.40)' : 'rgba(255,255,255,0.08)',
                    }}>
                    <p className="text-sm font-semibold text-white">{r.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'rgba(232,245,233,0.45)' }}>{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons - AGGRESSIVE STYLING FOR VISIBILITY */}
            <div className="flex gap-3 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                onClick={() => handle(user.userId || 'idx_' + idx, 'approve')} 
                disabled={!!processing}
                className="flex-1 h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                style={{ 
                  background: '#22c55e', 
                  color: '#ffffff',
                  border: '2px solid #16a34a',
                  boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
                }}>
                {processing === (user.userId || 'idx_' + idx) ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                APPROVE
              </button>
              <button 
                onClick={() => handle(user.userId || 'idx_' + idx, 'reject')} 
                disabled={!!processing}
                className="px-8 h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                style={{ 
                  background: '#fef2f2', 
                  color: '#dc2626',
                  border: '2px solid #dc2626'
                }}>
                <XCircle className="w-5 h-5" /> REJECT
              </button>
            </div>

            <p className="text-xs mt-3" style={{ color: 'rgba(232,245,233,0.30)' }}>
              Requested {user.requestedAt ? new Date(user.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}