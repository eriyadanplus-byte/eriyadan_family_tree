import { query } from './db';
import { getSupabaseAdmin } from './supabase-admin';

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  targetMemberId?: string | null;
  targetMemberName?: string;
  timestamp: string;
  metadata?: any;
}

const MAX_IN_MEMORY = 100;
const inMemoryBuffer: AuditEntry[] = [];

export async function pushAudit(entry: AuditEntry) {
  // Persist to database
  try {
    await query(
      'INSERT INTO audit_log (id, user_id, action, target_member_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [entry.id, entry.actor, entry.action, entry.targetMemberId ?? null, entry.metadata ? JSON.stringify(entry.metadata) : null]
    );
  } catch (err) {
    console.error('Audit log DB write failed:', err);
  }

  // Keep in-memory buffer for fast reads
  inMemoryBuffer.unshift(entry);
  if (inMemoryBuffer.length > MAX_IN_MEMORY) {
    inMemoryBuffer.pop();
  }
}

export async function getAuditLog(): Promise<AuditEntry[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc('exec_sql', {
      _sql: `SELECT al.id, al.action,
                    COALESCE(u.email, al.user_id::text) AS actor,
                    al.target_member_id AS "targetMemberId",
                    m.full_name AS "targetMemberName",
                    al.metadata, al.timestamp
             FROM audit_log al
             LEFT JOIN users u ON al.user_id = u.id
             LEFT JOIN members m ON al.target_member_id = m.id
             ORDER BY al.timestamp DESC LIMIT 100`,
      _params: [],
    });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      action: r.action,
      actor: r.actor,
      targetMemberId: r.targetMemberId ?? null,
      targetMemberName: r.targetMemberName ?? undefined,
      timestamp: r.timestamp,
      metadata: r.metadata
        ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata)
        : undefined,
    }));
  } catch (err) {
    console.error('Audit log DB read failed:', err);
    return inMemoryBuffer.slice(0, MAX_IN_MEMORY);
  }
}
