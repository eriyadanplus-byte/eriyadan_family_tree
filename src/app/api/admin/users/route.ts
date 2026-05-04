import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['super_admin', 'editor']);
    const roleFilter = request.nextUrl.searchParams.get('role');
    const rows = await query(
      `SELECT u.id, u.email, u.name, u.role, u.status, u.member_id as memberId, u.created_at as createdAt, m.full_name as memberName
       FROM users u
       LEFT JOIN members m ON u.member_id = m.id AND m.deleted_at IS NULL
       ${roleFilter ? 'WHERE u.role = ?' : ''}
       ORDER BY u.created_at DESC`,
      roleFilter ? [roleFilter] : []
    );
    return NextResponse.json(rows);
  } catch { return NextResponse.json({ error: 'Unauthorised' }, { status: 403 }); }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['super_admin']);
    const { userId, role } = await request.json();
    if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
    const validRoles = ['super_admin', 'editor', 'contributor', 'viewer'];
    if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    const result = await query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    if ((result as any).affectedRows === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed to update user' }, { status: 500 }); }
}
