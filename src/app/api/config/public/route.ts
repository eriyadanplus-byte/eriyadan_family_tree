import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const rows = await query(
      'SELECT setting_value FROM app_settings WHERE setting_key = ?',
      ['inAppMessage']
    ) as any[];
    return NextResponse.json({ inAppMessage: rows[0]?.setting_value || '' });
  } catch {
    return NextResponse.json({ inAppMessage: '' });
  }
}

