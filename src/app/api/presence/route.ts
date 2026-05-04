import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/mysql-db';

export const dynamic = 'force-dynamic';

// POST /api/presence - heartbeat to update last_seen
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.memberId) return new Response('Unauthorized', { status: 401 });

  await query(
    'UPDATE users SET last_seen = NOW() WHERE member_id = ?',
    [session.memberId]
  );

  return NextResponse.json({ ok: true });
}

// GET /api/presence - returns array of online member IDs (last_seen within 10 min)
export async function GET() {
  const rows = await query(
    `SELECT member_id FROM users 
     WHERE last_seen > NOW() - INTERVAL 10 MINUTE 
     AND status = 'active'`
  ) as any[];
  return NextResponse.json(rows.map((r: any) => String(r.member_id)));
}
