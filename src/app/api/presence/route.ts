import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// POST /api/presence - heartbeat to update last_seen
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  if (!isValidUUID(session.id)) {
    console.error('[presence] Invalid session ID format:', session.id);
    return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
  }

  await query(
    'UPDATE users SET last_seen = NOW() WHERE id = ?',
    [session.id]
  );

  return NextResponse.json({ ok: true });
}

// GET /api/presence - returns array of online member IDs (last_seen within 10 min)
export async function GET() {
  const rows = await query(
    `SELECT member_id FROM users
     WHERE last_seen > NOW() - INTERVAL '10 minutes'
     AND status = 'active'
     AND member_id IS NOT NULL`
  ) as any[];
  return NextResponse.json(rows.map((r: any) => String(r.member_id)));
}
