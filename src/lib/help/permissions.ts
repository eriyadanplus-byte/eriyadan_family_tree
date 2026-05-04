import { query } from '@/lib/mysql-db';
import type { SessionUser } from '@/lib/auth';

export interface HelpThread {
  id: number;
  assigned_handler_id: number | null;
  user_id: number | null;
  anon_token_hash: string | null;
  status: 'open' | 'pending_admin' | 'resolved';
}

async function hasActiveGrant(userId: string | number): Promise<boolean> {
  const rows = await query(
    `SELECT 1 FROM messaging_handler_grants
     WHERE editor_user_id = ? AND revoked_at IS NULL
     LIMIT 1`,
    [userId]
  ) as any[];
  return rows.length > 0;
}

/** Returns true if the user can see the full help inbox (all threads). */
export async function canViewHandlerInbox(user: SessionUser): Promise<boolean> {
  if (user.role === 'super_admin') return true;
  if (user.role === 'editor') return hasActiveGrant(user.id);
  return false;
}

/** Returns true if the user can access a specific thread (global grant OR per-thread assignment). */
export async function canAccessThread(user: SessionUser, thread: HelpThread): Promise<boolean> {
  if (user.role === 'super_admin') return true;
  if (user.role === 'editor') {
    if (String(thread.assigned_handler_id) === String(user.id)) return true;
    return hasActiveGrant(user.id);
  }
  return false;
}

/** Returns true if user can reply/act on any thread (used for inbox-level guard). */
export async function canHandleHelpMessages(user: SessionUser): Promise<boolean> {
  return canViewHandlerInbox(user);
}
