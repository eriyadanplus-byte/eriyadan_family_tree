import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { AssignHandlerSchema } from '@/lib/help/schemas';
import bus from '@/lib/help/bus';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const threadId = id;
  if (!threadId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = AssignHandlerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { editor_user_id } = parsed.data;

  // Verify editor exists if assigning
  if (editor_user_id !== null) {
    const users = await query(
      `SELECT id, role FROM users WHERE id = ? AND role = 'editor'`,
      [editor_user_id]
    ) as any[];
    if (!users.length) return NextResponse.json({ error: 'Editor not found' }, { status: 404 });
  }

  await query(
    `UPDATE help_threads SET assigned_handler_id = ? WHERE id = ?`,
    [editor_user_id, threadId]
  );

  bus.publish({ kind: 'thread_updated', threadId, payload: { assigned_handler_id: editor_user_id } });

  return NextResponse.json({ ok: true });
}
