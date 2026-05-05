import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(['super_admin', 'editor']);
    const body = await request.json();
    const { memberAId, memberBId } = body;

    if (!memberAId || !memberBId) {
      return NextResponse.json({ error: 'Both member IDs are required' }, { status: 400 });
    }

    // Ensure both members exist
    const members = await query('SELECT id FROM members WHERE id IN (?, ?) AND deleted_at IS NULL', [memberAId, memberBId]) as any[];
    if (members.length !== 2) {
      return NextResponse.json({ error: 'One or both members not found' }, { status: 400 });
    }

    // Insert into spouses table (ensure consistent ordering for UUID constraint)
    const a = memberAId < memberBId ? memberAId : memberBId;
    const b = memberAId < memberBId ? memberBId : memberAId;

    await query(
      'INSERT INTO spouses (member_a_id, member_b_id, status, created_by) VALUES (?, ?, ?, ?)',
      [a, b, 'current', session.id]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Admin spouse link error:', err);
    return NextResponse.json({ error: err.message || 'Failed to link spouses' }, { status: 500 });
  }
}
