import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const [membersRow] = await query('SELECT COUNT(*) as count FROM members WHERE deleted_at IS NULL') as any[];
  const [usersRow]    = await query('SELECT COUNT(*) as count FROM users') as any[];
  return NextResponse.json({
    success: true,
    db: 'mysql',
    members: membersRow?.count ?? 0,
    users: usersRow?.count ?? 0,
  });
}

