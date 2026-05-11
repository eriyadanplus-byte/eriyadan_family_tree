import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let db = false;
  try {
    await query('SELECT 1');
    db = true;
  } catch {}
  return NextResponse.json({ ok: true, db, ts: new Date().toISOString() }, {
    status: db ? 200 : 503,
  });
}

