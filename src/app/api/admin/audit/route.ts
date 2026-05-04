import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getAuditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(['super_admin', 'editor']);
    return NextResponse.json(getAuditLog());
  } catch { return NextResponse.json({ error: 'Unauthorised' }, { status: 403 }); }
}
