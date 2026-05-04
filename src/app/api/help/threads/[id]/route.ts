import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { verifyAnonHelpToken, hashAnonToken, HELP_ANON_COOKIE } from '@/lib/helpToken';
import { canAccessThread, type HelpThread } from '@/lib/help/permissions';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function getThread(id: string): Promise<HelpThread | null> {
  const rows = await query(
    `SELECT id, user_id, anon_token_hash, trigger_stage, status, assigned_handler_id FROM help_threads WHERE id = ?`,
    [id]
  ) as any[];
  return rows[0] ?? null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const threadId = id;
  if (!threadId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const thread = await getThread(threadId);
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Auth: session user OR anon cookie owner
  const session = await getSession();
  let authorized = false;

  if (session) {
    authorized = await canAccessThread(session, thread);
    // Allow the owning user to see their own thread
    if (!authorized && thread.user_id && String(thread.user_id) === session.id) authorized = true;
  } else {
    const cookieStore = await cookies();
    const anonCookie = cookieStore.get(HELP_ANON_COOKIE);
    if (anonCookie?.value) {
      const hash = hashAnonToken(anonCookie.value);
      authorized = hash === thread.anon_token_hash;
    }
  }

  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Fetch messages, with optional backfill since a given id
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  const sinceCondition = since ? 'AND hm.id > ?' : '';
  const messagesValues: any[] = [threadId];
  if (since) messagesValues.push(since);

  const messages = await query(
    `SELECT hm.id, hm.sender_kind, hm.sender_user_id, hm.body, hm.created_at, hm.read_at,
            u.name as sender_name, u.email as sender_email
     FROM help_messages hm
     LEFT JOIN users u ON u.id = hm.sender_user_id
     WHERE hm.thread_id = ? ${sinceCondition}
     ORDER BY hm.created_at ASC`,
    messagesValues
  ) as any[];

  const threadDetail = await query(
    `SELECT ht.*, u.email as user_email, u.name as user_name
     FROM help_threads ht
     LEFT JOIN users u ON u.id = ht.user_id
     WHERE ht.id = ?`,
    [threadId]
  ) as any[];

  return NextResponse.json({ thread: threadDetail[0], messages });
}
