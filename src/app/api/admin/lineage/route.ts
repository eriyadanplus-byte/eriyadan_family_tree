import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { setSpouse } from '@/lib/family';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function resolveMemberId(session: any, reqMemberId?: string | null): Promise<string | null> {
  if (reqMemberId && session.role === 'super_admin') return reqMemberId;
  return session.memberId ? String(session.memberId) : null;
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const memberId = await resolveMemberId(session, searchParams.get('memberId'));

  if (!memberId) {
    return NextResponse.json({ error: 'Admin has no linked member profile' }, { status: 404 });
  }

  const rows = await query(
    `SELECT m.id, m.full_name, m.generation, m.father_id, m.mother_id, m.spouse_id,
            mf.full_name AS father_name, mm.full_name AS mother_name,
            sp.id AS spouse_member_id,
            sp.full_name AS spouse_name
     FROM members m
     LEFT JOIN members mf ON mf.id = m.father_id AND mf.deleted_at IS NULL
     LEFT JOIN members mm ON mm.id = m.mother_id AND mm.deleted_at IS NULL
     LEFT JOIN spouses s ON (s.member_a_id = m.id OR s.member_b_id = m.id) AND s.status = 'current'
     LEFT JOIN members sp ON sp.id = CASE WHEN s.member_a_id = m.id THEN s.member_b_id ELSE s.member_a_id END AND sp.deleted_at IS NULL
     WHERE m.id = ? AND m.deleted_at IS NULL`,
    [memberId]
  ) as any[];

  if (!rows.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const m = rows[0];
  return NextResponse.json({
    id: String(m.id),
    fullName: m.full_name,
    generation: m.generation,
    fatherId: m.father_id ? String(m.father_id) : null,
    fatherName: m.father_name || null,
    motherId: m.mother_id ? String(m.mother_id) : null,
    motherName: m.mother_name || null,
    spouseId: m.spouse_member_id ? String(m.spouse_member_id) : null,
    spouseName: m.spouse_name || null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { generation, fatherId, motherId, spouseId, memberId: bodyMemberId } = body;

  const memberId = await resolveMemberId(session, bodyMemberId);
  if (!memberId) {
    return NextResponse.json({ error: 'No linked member profile' }, { status: 404 });
  }

  if (generation !== undefined && (typeof generation !== 'number' || generation < 1 || generation > 100)) {
    return NextResponse.json({ error: 'Generation must be between 1 and 100' }, { status: 400 });
  }

  // Auto-align generation to spouse's generation so they pair in the same lane
  let effectiveGeneration = generation ?? null;
  let generationAligned = false;
  if (spouseId) {
    const [spGen] = await query(
      'SELECT generation FROM members WHERE id = ? AND deleted_at IS NULL',
      [spouseId]
    ) as any[];
    if (spGen && spGen.generation != null) {
      effectiveGeneration = spGen.generation;
      generationAligned = true;
    }
  }

  await query(
    `UPDATE members SET
       generation = COALESCE(?, generation),
       father_id  = ?,
       mother_id  = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [effectiveGeneration, fatherId || null, motherId || null, memberId]
  );

  // Sync spouse in the spouses table
  const prevSpouseRows = await query(
    `SELECT CASE WHEN member_a_id = ? THEN member_b_id ELSE member_a_id END AS prev_spouse_id
     FROM spouses WHERE (member_a_id = ? OR member_b_id = ?) AND status = 'current'`,
    [memberId, memberId, memberId]
  ) as any[];
  const prevSpouseId = prevSpouseRows[0]?.prev_spouse_id ? String(prevSpouseRows[0].prev_spouse_id) : null;

  if (prevSpouseId && prevSpouseId !== String(spouseId)) {
    await query(
      `UPDATE spouses SET status = 'former' WHERE (member_a_id = ? OR member_b_id = ?) AND status = 'current'`,
      [memberId, memberId]
    );
    await query(
      `UPDATE members SET spouse_id = NULL WHERE id = ? AND spouse_id = ?`,
      [prevSpouseId, memberId]
    );
  }

  if (spouseId) {
    await setSpouse(memberId, String(spouseId), 'current', memberId);
    await query(`UPDATE members SET spouse_id = ? WHERE id = ?`, [spouseId, memberId]);
    await query(`UPDATE members SET spouse_id = ? WHERE id = ?`, [memberId, spouseId]);
  } else {
    await query(`UPDATE members SET spouse_id = NULL WHERE id = ?`, [memberId]);
  }

  return NextResponse.json({ success: true, generationAligned, effectiveGeneration });
}
