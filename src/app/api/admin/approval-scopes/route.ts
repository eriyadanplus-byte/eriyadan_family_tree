import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, rolePermissions } from '@/lib/auth';
import { descendantIds } from '@/lib/family';

export const dynamic = 'force-dynamic';

// GET: List all approval scopes (admin) or own scopes (editor)
export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let sql: string;
  let params: any[];

  if (session.role === 'super_admin') {
    sql = `SELECT s.id, s.user_id, s.root_member_id, s.created_by, s.created_at,
                  u.email, u.name AS user_name, u.role AS user_role,
                  m.full_name AS root_member_name
           FROM approval_scopes s
           JOIN users u ON s.user_id = u.id
           JOIN members m ON s.root_member_id = m.id AND m.deleted_at IS NULL
           ORDER BY u.name ASC`;
    params = [];
  } else if (session.role === 'editor' && session.memberId) {
    sql = `SELECT s.id, s.user_id, s.root_member_id, s.created_by, s.created_at,
                  m.full_name AS root_member_name
           FROM approval_scopes s
           JOIN members m ON s.root_member_id = m.id AND m.deleted_at IS NULL
           WHERE s.user_id = ?`;
    params = [session.id];
  } else {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  const rows = (await query(sql, params)) as any[];
  return NextResponse.json({ scopes: rows });
}

// POST: Create a new approval scope (admin only)
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const { userId, rootMemberId } = await request.json();
  if (!userId || !rootMemberId) return NextResponse.json({ error: 'userId and rootMemberId are required' }, { status: 400 });

  // Verify user exists and is an editor
  const users = (await query('SELECT id, role, can_approve FROM users WHERE id = ?', [userId])) as any[];
  if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (users[0].role !== 'editor') return NextResponse.json({ error: 'Only editors can be assigned approval scopes' }, { status: 400 });

  // Verify member exists
  const members = (await query('SELECT id FROM members WHERE id = ? AND deleted_at IS NULL', [rootMemberId])) as any[];
  if (!members.length) return NextResponse.json({ error: 'Root member not found' }, { status: 404 });

  // Ensure can_approve is set
  if (!users[0].can_approve) {
    await query('UPDATE users SET can_approve = 1 WHERE id = ?', [userId]);
  }

  const id = crypto.randomUUID();
  await query(
    'INSERT INTO approval_scopes (id, user_id, root_member_id, created_by) VALUES (?, ?, ?, ?)',
    [id, userId, rootMemberId, session.id]
  );

  return NextResponse.json({ success: true, scopeId: id }, { status: 201 });
}

// DELETE: Remove an approval scope (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const { scopeId } = await request.json();
  if (!scopeId) return NextResponse.json({ error: 'scopeId is required' }, { status: 400 });

  await query('DELETE FROM approval_scopes WHERE id = ?', [scopeId]);
  return NextResponse.json({ success: true });
}

// Helper: check if an editor can approve a user whose ancestorId is a given member
async function canEditorApprove(editorUserId: string, ancestorMemberId: string): Promise<boolean> {
  const scopes = (await query(
    'SELECT root_member_id FROM approval_scopes WHERE user_id = ?',
    [editorUserId]
  )) as any[];

  for (const scope of scopes) {
    const descIds = await descendantIds(String(scope.root_member_id));
    if (descIds.includes(String(ancestorMemberId))) return true;
  }
  return false;
}

