import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { verifyAnonHelpToken, hashAnonToken, HELP_ANON_COOKIE } from '@/lib/helpToken';
import { canAccessThread, type HelpThread } from '@/lib/help/permissions';
import { SendMessageSchema } from '@/lib/help/schemas';
import bus from '@/lib/help/bus';

export const dynamic = 'force-dynamic';

// 10 messages per identity per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const threadId = id;
  if (!threadId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const rows = await query(
    `SELECT id, user_id, anon_token_hash, status, assigned_handler_id FROM help_threads WHERE id = ?`,
    [threadId]
  ) as any[];
  const thread = rows[0] as HelpThread | undefined;
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (thread.status === 'resolved') return NextResponse.json({ error: 'Thread is resolved' }, { status: 409 });

  const body = await request.json().catch(() => null);
  const parsed = SendMessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const session = await getSession();
  let senderKind: 'user' | 'anon' | 'admin' | 'editor' = 'anon';
  let senderUserId: string | null = null;
  let authorized = false;

  if (session) {
    senderUserId = session.id;
    senderKind = session.role === 'super_admin' ? 'admin' : 'editor';
    authorized = await canAccessThread(session, thread);
    // The owning user can also reply
    if (!authorized && thread.user_id && String(thread.user_id) === session.id) {
      authorized = true;
      senderKind = 'user';
    }
  } else {
    const cookieStore = await cookies();
    const anonCookie = cookieStore.get(HELP_ANON_COOKIE);
    if (anonCookie?.value && verifyAnonHelpToken(anonCookie.value)) {
      const hash = hashAnonToken(anonCookie.value);
      if (hash === thread.anon_token_hash) {
        authorized = true;
        senderKind = 'anon';
      }
    }
  }

  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const rateLimitKey = session ? `user:${session.id}` : `anon:${thread.anon_token_hash}`;
  if (isRateLimited(rateLimitKey)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const result = await query(
    `INSERT INTO help_messages (thread_id, sender_kind, sender_user_id, body) VALUES (?, ?, ?, ?)`,
    [threadId, senderKind, senderUserId, parsed.data.body]
  ) as any;

  // Update thread status: if user/anon sent, mark pending_admin
  if (senderKind === 'user' || senderKind === 'anon') {
    await query(`UPDATE help_threads SET status = 'pending_admin' WHERE id = ?`, [threadId]);
  }

  const newMessage = {
    id: result.insertId,
    thread_id: threadId,
    sender_kind: senderKind,
    sender_user_id: senderUserId,
    body: parsed.data.body,
    created_at: new Date().toISOString(),
  };

  bus.publish({ kind: 'message', threadId, payload: newMessage });

  return NextResponse.json(newMessage, { status: 201 });
}
