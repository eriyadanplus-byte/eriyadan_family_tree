import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const generation = searchParams.get('generation');

  try {
    // Fetch all members (or filtered by generation)
    const genFilter = generation ? ` AND m.generation = ${parseInt(generation)}` : '';
    const members = (await query(
      `SELECT m.id, m.full_name, m.generation, m.is_late, m.is_stub, m.gender,
              m.profile_photo_url, m.avatar_version, m.father_id, m.mother_id,
              m.mobile_number, m.email, m.location, m.dob,
              CASE WHEN u.last_seen > NOW() - INTERVAL '10 minutes' THEN 1 ELSE 0 END as is_online
       FROM members m
       LEFT JOIN users u ON u.member_id = m.id
       WHERE m.deleted_at IS NULL${genFilter}
       ORDER BY m.generation ASC, m.dob IS NULL, m.dob ASC, m.id ASC`
    )) as any[];

    // Fetch all current spouse pairs
    const spouses = (await query(
      `SELECT s.member_a_id, s.member_b_id, s.status
       FROM spouses s
       WHERE s.status = 'current'`
    )) as any[];

    // Build spouse map: memberId -> spouseMemberId
    const spouseMap: Record<string, string> = {};
    for (const s of spouses) {
      spouseMap[String(s.member_a_id)] = String(s.member_b_id);
      spouseMap[String(s.member_b_id)] = String(s.member_a_id);
    }

    // Build member lookup
    const memberLookup: Record<string, any> = {};
    for (const m of members) {
      memberLookup[String(m.id)] = m;
    }

    // Group by generation
    const generations: Record<number, any[]> = {};
    for (const m of members) {
      const gen = m.generation || 1;
      if (!generations[gen]) generations[gen] = [];
      const mid = String(m.id);
      const spouseId = spouseMap[mid];

      generations[gen].push({
        id: mid,
        fullName: m.full_name,
        generation: gen,
        isLate: !!m.is_late,
        isOnline: !!m.is_online,
        isStub: !!m.is_stub,
        gender: m.gender,
        photo: m.profile_photo_url ? `/avatars/${mid}.jpg?v=${m.avatar_version || 0}` : null,
        fatherId: m.father_id ? String(m.father_id) : null,
        motherId: m.mother_id ? String(m.mother_id) : null,
        spouseId: spouseId || null,
        spouse: spouseId && memberLookup[spouseId] ? {
          id: spouseId,
          fullName: memberLookup[spouseId].full_name,
          generation: memberLookup[spouseId].generation,
          isLate: !!memberLookup[spouseId].is_late,
          isOnline: !!memberLookup[spouseId].is_online,
          isStub: !!memberLookup[spouseId].is_stub,
          gender: memberLookup[spouseId].gender,
          photo: memberLookup[spouseId].profile_photo_url ? `/avatars/${spouseId}.jpg?v=${memberLookup[spouseId].avatar_version || 0}` : null,
        } : null,
        mobileNumber: m.mobile_number,
        email: m.email,
        location: m.location,
        dob: m.dob,
      });
    }

    return NextResponse.json({ generations, spouseMap });
  } catch (err: any) {
    console.error('Tree API error:', err);
    return NextResponse.json({ error: 'Failed to load tree' }, { status: 500 });
  }
}
