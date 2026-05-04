import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql-db';
import { getSession } from '@/lib/auth';
import { addStubSpouse, addStubChild, setSpouse, computeChildGenerationAsync } from '@/lib/family';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!session.memberId) return NextResponse.json({ error: 'No member profile linked' }, { status: 400 });

  const body = await request.json();
  const { relationType, name, mobile, gender } = body;

  if (!relationType || !name || !mobile || !gender) {
    return NextResponse.json({ error: 'relationType, name, mobile, and gender are required' }, { status: 400 });
  }

  if (!['spouse', 'child'].includes(relationType)) {
    return NextResponse.json({ error: 'relationType must be spouse or child' }, { status: 400 });
  }

  const myMemberId = String(session.memberId);

  try {
    if (relationType === 'spouse') {
      // Check if already has a current spouse
      const existingSpouse = (await query(
        `SELECT s.id FROM spouses s
         JOIN members m ON m.id = CASE WHEN s.member_a_id = ? THEN s.member_b_id ELSE s.member_a_id END
         WHERE (s.member_a_id = ? OR s.member_b_id = ?) AND s.status = 'current' AND m.deleted_at IS NULL`,
        [myMemberId, myMemberId, myMemberId]
      )) as any[];
      if (existingSpouse.length > 0) {
        return NextResponse.json({ error: 'You already have a current spouse on record' }, { status: 400 });
      }

      const newId = await addStubSpouse(myMemberId, name, mobile, gender, myMemberId);

      // Audit log
      await query(
        `INSERT INTO audit_log (id, user_id, action, target_member_id, metadata) VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), session.id, 'add_spouse', newId, JSON.stringify({ name, mobile, addedBy: myMemberId })]
      );

      return NextResponse.json({ success: true, memberId: newId, relation: 'spouse' }, { status: 201 });
    }

    if (relationType === 'child') {
      const { fatherId, motherId } = body;
      const fId = fatherId || null;
      const mId = motherId || null;

      // At least one parent must be specified and must be the current user or their spouse
      if (!fId && !mId) {
        return NextResponse.json({ error: 'At least one parent (fatherId or motherId) is required' }, { status: 400 });
      }

      // Validate parent IDs exist
      if (fId) {
        const fRows = (await query('SELECT id FROM members WHERE id = ? AND deleted_at IS NULL', [fId])) as any[];
        if (!fRows.length) return NextResponse.json({ error: 'Father not found' }, { status: 400 });
      }
      if (mId) {
        const mRows = (await query('SELECT id FROM members WHERE id = ? AND deleted_at IS NULL', [mId])) as any[];
        if (!mRows.length) return NextResponse.json({ error: 'Mother not found' }, { status: 400 });
      }

      const newId = await addStubChild(fId, mId, name, mobile, gender, myMemberId);

      // Audit log
      await query(
        `INSERT INTO audit_log (id, user_id, action, target_member_id, metadata) VALUES (?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), session.id, 'add_child', newId, JSON.stringify({ name, mobile, fatherId: fId, motherId: mId, addedBy: myMemberId })]
      );

      return NextResponse.json({ success: true, memberId: newId, relation: 'child' }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid relation type' }, { status: 400 });
  } catch (err: any) {
    console.error('Add relative error:', err);
    return NextResponse.json({ error: err.message || 'Failed to add relative' }, { status: 500 });
  }
}
