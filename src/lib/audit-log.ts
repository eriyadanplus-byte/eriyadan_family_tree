// In-memory audit log for dev; replace with DB in production
export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  targetMemberName?: string;
  timestamp: string;
  metadata?: any;
}

const auditLog: AuditEntry[] = [];

export function pushAudit(entry: AuditEntry) {
  auditLog.unshift(entry);
}

export function getAuditLog(): AuditEntry[] {
  return auditLog.slice(0, 100);
}
