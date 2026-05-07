'use client';

import { useState, useEffect } from 'react';
import { History, User, Loader2, Shield, UserPlus, UserMinus, Edit, Trash2 } from 'lucide-react';

// AdminSidebar provided by AppShell

interface AuditEntry {
  id: string;
  action: string;
  metadata: Record<string, any> | null;
  timestamp: string;
  actor: string;
  targetMemberId: string | null;
  targetMemberName: string | null;
}

const actionIcons: Record<string, React.ComponentType<any>> = {
  user_approved: UserPlus,
  user_rejected: UserMinus,
  member_created: UserPlus,
  member_updated: Edit,
  member_deleted: Trash2,
};

const actionColors: Record<string, string> = {
  user_approved: 'text-emerald-400 bg-emerald-500/20',
  user_rejected: 'text-rose-400 bg-rose-500/20',
  member_created: 'text-blue-400 bg-blue-500/20',
  member_updated: 'text-amber-400 bg-amber-500/20',
  member_deleted: 'text-rose-400 bg-rose-500/20',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit?limit=100');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit log');
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="p-8 lg:p-12">
      <header className="mb-8">
        <h2 className="text-3xl font-display text-white">Audit Log</h2>
        <p className="text-on-surface-variant text-sm">Track all administrative actions</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl text-center">
          <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No audit entries yet.</p>
          <p className="text-white/20 text-sm mt-1">Actions like user approvals and member edits will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map(entry => {
            const Icon = actionIcons[entry.action] || Shield;
            const colorClass = actionColors[entry.action] || 'text-white/40 bg-white/10';
            const [textColor, bgColor] = colorClass.split(' ');

            return (
              <div key={entry.id} className="glass-card p-4 rounded-xl flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${textColor}`}>{formatAction(entry.action)}</span>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-white/40 text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-white/60 text-sm">
                    By <span className="text-white/80 font-medium">{entry.actor}</span>
                    {entry.targetMemberName && (
                      <> · Target: <span className="text-white/80 font-medium">{entry.targetMemberName}</span></>
                    )}
                  </p>
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(entry.metadata).map(([key, val]) => (
                        <span key={key} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/40">
                          {key}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
