import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { verifyAnonHelpToken, hashAnonToken, issueAnonHelpToken, HELP_ANON_COOKIE } from '@/lib/helpToken';
import { canViewHandlerInbox } from '@/lib/help/permissions';
import { CreateThreadSchema } from '@/lib/help/schemas';
import bus from '@/lib/help/bus';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter: 10 creates per identity per minute
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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = CreateThreadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const {
    trigger_stage, body: messageBody, context_snapshot,
    inquiry_kind, ancestor_name, place, contact_number, whatsapp_number,
  } = parsed.data;

  // Identify caller: logged-in user OR anon cookie
  const session = await getSession();
  let userId: string | null = null;
  let anonTokenHash: string | null = null;
  let senderKind: 'user' | 'anon' = 'anon';
  let newAnonToken: string | null = null;

  if (session) {
    userId = session.id;
    senderKind = 'user';
  } else {
    const cookieStore = await cookies();
    const anonCookie = cookieStore.get(HELP_ANON_COOKIE);
    if (anonCookie?.value && (await verifyAnonHelpToken(anonCookie.value))) {
      anonTokenHash = await hashAnonToken(anonCookie.value);
    } else {
      const issued = await issueAnonHelpToken();
      newAnonToken = issued.token;
      anonTokenHash = issued.hash;
    }
  }

  const rateLimitKey = userId ? `user:${userId}` : `anon:${anonTokenHash}`;
  if (isRateLimited(rateLimitKey)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Coalesce: reuse existing open thread for this identity
  let existingThread: any = null;
  if (userId) {
    const rows = await query(
      `SELECT id FROM help_threads WHERE user_id = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1`,
      [userId]
    ) as any[];
    existingThread = rows[0] ?? null;
  } else if (anonTokenHash) {
    const rows = await query(
      `SELECT id FROM help_threads WHERE anon_token_hash = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1`,
      [anonTokenHash]
    ) as any[];
    existingThread = rows[0] ?? null;
  }

  let threadId: string;
  if (existingThread) {
    threadId = existingThread.id;
  } else {
    const result = await query(
      `INSERT INTO help_threads
         (user_id, anon_token_hash, trigger_stage, inquiry_kind, context_snapshot,
          ancestor_name, place, contact_number, whatsapp_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, anonTokenHash, trigger_stage,
        inquiry_kind ?? 'general',
        context_snapshot ? JSON.stringify(context_snapshot) : null,
        ancestor_name ?? null, place ?? null, contact_number ?? null, whatsapp_number ?? null,
      ]
    ) as any;
    threadId = String(result.insertId);
  }

  // Insert the first message
  await query(
    `INSERT INTO help_messages (thread_id, sender_kind, sender_user_id, body) VALUES (?, ?, ?, ?)`,
    [threadId, senderKind, userId, messageBody]
  );

  // Publish to SSE bus
  bus.publish({ kind: existingThread ? 'message' : 'new_thread', threadId, payload: { trigger_stage, body: messageBody } });

  const response = NextResponse.json({ threadId }, { status: 201 });

  // Set anon cookie if freshly issued
  if (newAnonToken) {
    response.cookies.set(HELP_ANON_COOKIE, newAnonToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  return response;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await canViewHandlerInbox(session))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assignedToMe = searchParams.get('assigned_to_me') === 'true';

  const conditions = ['1=1'];
  const values: any[] = [];

  if (status) {
    conditions.push('ht.status = ?');
    values.push(status);
  }
  if (assignedToMe) {
    conditions.push('ht.assigned_handler_id = ?');
    values.push(session.id);
  }

  const threads = await query(
    `SELECT ht.id, ht.trigger_stage, ht.status, ht.context_snapshot, ht.assigned_handler_id,
            ht.created_at, ht.resolved_at,
            u.email as user_email, u.name as user_name,
            (SELECT COUNT(*) FROM help_messages hm WHERE hm.thread_id = ht.id AND hm.read_at IS NULL AND hm.sender_kind IN ('user','anon')) as unread_count
     FROM help_threads ht
     LEFT JOIN users u ON u.id = ht.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ht.created_at DESC
     LIMIT 100`,
    values
  ) as any[];

  return NextResponse.json({ threads });
}
