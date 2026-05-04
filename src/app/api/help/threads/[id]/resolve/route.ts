import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { canAccessThread, type HelpThread } from '@/lib/help/permissions';
import bus from '@/lib/help/bus';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const threadId = id;
  if (!threadId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const rows = await query(
    `SELECT id, user_id, anon_token_hash, status, assigned_handler_id FROM help_threads WHERE id = ?`,
    [threadId]
  ) as any[];
  const thread = rows[0] as HelpThread | undefined;
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!(await canAccessThread(session, thread))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await query(
    `UPDATE help_threads SET status = 'resolved', resolved_at = NOW() WHERE id = ?`,
    [threadId]
  );

  bus.publish({ kind: 'thread_updated', threadId, payload: { status: 'resolved' } });

  return NextResponse.json({ ok: true });
}
