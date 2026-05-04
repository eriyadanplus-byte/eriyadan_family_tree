import { query } from './db';

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
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
      [entry.id, entry.actor, entry.action, null, entry.metadata ? JSON.stringify(entry.metadata) : null]
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
    const rows = await query(
      `SELECT id, action, user_id as actor, metadata, timestamp
       FROM audit_log ORDER BY timestamp DESC LIMIT ?`,
      [MAX_IN_MEMORY]
    ) as any[];

    return rows.map(r => ({
      id: r.id,
      action: r.action,
      actor: r.actor,
      timestamp: r.timestamp,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : undefined,
    }));
  } catch (err) {
    console.error('Audit log DB read failed:', err);
    return inMemoryBuffer.slice(0, MAX_IN_MEMORY);
  }
}
