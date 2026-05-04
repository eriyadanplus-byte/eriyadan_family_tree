import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import bus from '@/lib/help/bus';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const grantId = id;
  if (!grantId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const grants = await query(
    `SELECT id, editor_user_id, revoked_at FROM messaging_handler_grants WHERE id = ?`,
    [grantId]
  ) as any[];

  const grant = grants[0];
  if (!grant) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (grant.revoked_at) return NextResponse.json({ error: 'Already revoked' }, { status: 409 });

  await query(
    `UPDATE messaging_handler_grants SET revoked_at = NOW() WHERE id = ?`,
    [grantId]
  );

  // Notify SSE bus so open streams for this editor can be dropped
  bus.publish({ kind: 'grant_revoked', editorUserId: grant.editor_user_id });

  return NextResponse.json({ ok: true });
}
