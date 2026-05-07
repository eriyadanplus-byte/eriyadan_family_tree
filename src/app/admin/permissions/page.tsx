'use client';

import { useState, useEffect } from 'react';
import { User, Loader2, Check, MessageCircle } from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  memberId: string | null;
  memberName: string | null;
  createdAt: string;
}

const rolePermissions: Record<string, { canAdd: boolean; canEdit: boolean; canDelete: boolean; canExport: boolean }> = {
  super_admin: { canAdd: true, canEdit: true, canDelete: true, canExport: true },
  editor: { canAdd: true, canEdit: true, canDelete: true, canExport: false },
  contributor: { canAdd: true, canEdit: true, canDelete: false, canExport: false },
  viewer: { canAdd: false, canEdit: false, canDelete: false, canExport: false },
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  editor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  contributor: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  viewer: 'bg-white/10 text-white/60 border-white/10',
};

export default function AdminPermissionsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [grantedEditors, setGrantedEditors] = useState<Set<string>>(new Set());
  const [grantIdMap, setGrantIdMap] = useState<Record<string, number>>({});
  const [togglingGrant, setTogglingGrant] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    const res = await fetch('/api/help/grants');
    if (!res.ok) return;
    const data = await res.json();
    const active = new Set<string>();
    const idMap: Record<string, number> = {};
    for (const g of data.grants ?? []) {
      if (!g.revoked_at) {
        active.add(String(g.editor_user_id));
        idMap[String(g.editor_user_id)] = g.id;
      }
    }
    setGrantedEditors(active);
    setGrantIdMap(idMap);
  };

  const toggleMessagingHandler = async (userId: string, currently: boolean) => {
    setTogglingGrant(userId);
    try {
      if (currently) {
        const grantId = grantIdMap[userId];
        if (grantId) {
          await fetch(`/api/help/grants/${grantId}`, { method: 'DELETE' });
          setGrantedEditors(prev => { const s = new Set(prev); s.delete(userId); return s; });
        }
      } else {
        const res = await fetch('/api/help/grants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ editor_user_id: parseInt(userId) }),
        });
        if (res.ok) {
          const { id } = await res.json();
          setGrantedEditors(prev => new Set(Array.from(prev).concat(userId)));
          setGrantIdMap(prev => ({ ...prev, [userId]: id }));
        }
      }
    } finally {
      setTogglingGrant(null);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch {
      console.error('Failed to update role');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8">
        <h2 className="text-3xl font-display text-white">Permissions</h2>
        <p className="text-on-surface-variant text-sm">Manage user access and roles</p>
      </header>

      {/* Role Management table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/12 bg-white/5">
          <h4 className="text-lg font-display text-white">Role Management</h4>
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/40"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-white/40">No users found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/2 text-on-surface-variant text-[10px] uppercase tracking-[0.15em] font-bold">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Add</th>
                <th className="px-6 py-4 text-center">Edit</th>
                <th className="px-6 py-4 text-center">Delete</th>
                <th className="px-6 py-4 text-center">Export</th>
                <th className="px-6 py-4 text-center">Msg Handler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(user => {
                const perms = rolePermissions[user.role] || rolePermissions.viewer;
                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-white/12 bg-surface-container flex items-center justify-center">
                          <User className="w-4 h-4 text-white/30" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.name || user.memberName || 'Unnamed'}</p>
                          <p className="text-xs text-white/40">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={savingId === user.id}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${roleColors[user.role] || roleColors.viewer} bg-transparent cursor-pointer`}
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="editor">Editor</option>
                        <option value="contributor">Contributor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        user.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-white/10 text-white/40'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    {(['canAdd', 'canEdit', 'canDelete', 'canExport'] as const).map(perm => (
                      <td key={perm} className="px-6 py-4 text-center">
                        <div title="Read-only" className={`w-6 h-6 rounded flex items-center justify-center cursor-default pointer-events-none ${
                          perms[perm]
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/5 text-white/20'
                        }`}>
                          {perms[perm] && <Check className="w-4 h-4" />}
                        </div>
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center">
                      {user.role === 'editor' ? (
                        <button
                          onClick={() => toggleMessagingHandler(user.id, grantedEditors.has(user.id))}
                          disabled={togglingGrant === user.id}
                          title={grantedEditors.has(user.id) ? 'Revoke messaging handler' : 'Grant messaging handler'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-all ${
                            grantedEditors.has(user.id)
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              : 'bg-white/5 text-white/25 hover:bg-white/10'
                          }`}
                        >
                          {togglingGrant === user.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <MessageCircle className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <span className="text-white/15 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Role Descriptions */}
      <div className="glass-card p-6 rounded-2xl mt-6">
        <h4 className="text-lg font-display text-white mb-4">Role Descriptions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5">
            <span className="text-purple-400 font-bold text-sm">Super Admin</span>
            <p className="text-white/40 text-xs mt-1">Full access to all features including user management</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <span className="text-emerald-400 font-bold text-sm">Editor</span>
            <p className="text-white/40 text-xs mt-1">Can add, edit, and delete members</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <span className="text-blue-400 font-bold text-sm">Contributor</span>
            <p className="text-white/40 text-xs mt-1">Can add and edit own entries</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <span className="text-white/60 font-bold text-sm">Viewer</span>
            <p className="text-white/40 text-xs mt-1">Read-only access to the family tree</p>
          </div>
        </div>
      </div>
    </div>
  );
}
