import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { GrantSchema } from '@/lib/help/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const grants = await query(
    `SELECT g.id, g.editor_user_id, g.granted_by_admin_id, g.granted_at, g.revoked_at,
            u.name as editor_name, u.email as editor_email
     FROM messaging_handler_grants g
     JOIN users u ON u.id = g.editor_user_id
     ORDER BY g.granted_at DESC`
  ) as any[];

  return NextResponse.json({ grants });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = GrantSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { editor_user_id } = parsed.data;

  // Verify editor exists
  const users = await query(
    `SELECT id FROM users WHERE id = ? AND role = 'editor'`,
    [editor_user_id]
  ) as any[];
  if (!users.length) return NextResponse.json({ error: 'Editor not found' }, { status: 404 });

  // Revoke any existing active grant first (idempotent re-grant)
  await query(
    `UPDATE messaging_handler_grants SET revoked_at = ?
     WHERE editor_user_id = ? AND revoked_at IS NULL`,
    [new Date().toISOString(), editor_user_id]
  );

  const result = await query(
    `INSERT INTO messaging_handler_grants (editor_user_id, granted_by_admin_id) VALUES (?, ?)`,
    [editor_user_id, session.id]
  ) as any;

  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
