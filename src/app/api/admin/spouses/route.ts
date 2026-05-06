import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { setSpouse } from '@/lib/family';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['super_admin', 'editor', 'contributor']);
    const body = await request.json();
    const { memberAId, memberBId } = body;

    if (!memberAId || !memberBId) {
      return NextResponse.json({ error: 'Both member IDs are required' }, { status: 400 });
    }

    await setSpouse(memberAId, memberBId, 'current', session.id);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Admin spouse link error:', err);
    return NextResponse.json({ error: err.message || 'Failed to link spouses' }, { status: 500 });
  }
}
