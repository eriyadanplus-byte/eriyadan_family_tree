import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAvatarUrl } from '@/lib/avatar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const rows = (await query(
    `SELECT m.id, m.full_name, m.generation, m.is_stub, m.is_late,
            m.profile_photo_url, m.avatar_version, m.gender, m.location, m.dob,
            mf.full_name AS father_name, mm.full_name AS mother_name,
            sp.id AS spouse_id, sp.full_name AS spouse_name,
            sp.gender AS spouse_gender, sp.is_late AS spouse_is_late,
            sp.profile_photo_url AS spouse_photo, sp.avatar_version AS spouse_avatar_version,
            sp.is_stub AS spouse_is_stub
     FROM members m
     LEFT JOIN members mf ON m.father_id = mf.id AND mf.deleted_at IS NULL
     LEFT JOIN members mm ON m.mother_id = mm.id AND mm.deleted_at IS NULL
     LEFT JOIN spouses s
       ON (s.member_a_id = m.id OR s.member_b_id = m.id) AND s.status = 'current'
     LEFT JOIN members sp
       ON sp.id = CASE WHEN s.member_a_id = m.id THEN s.member_b_id ELSE s.member_a_id END
       AND sp.deleted_at IS NULL
     WHERE m.deleted_at IS NULL AND LOWER(m.full_name) LIKE ?
     ORDER BY m.generation ASC, m.full_name ASC
     LIMIT 20`,
    [`%${q.toLowerCase()}%`]
  )) as any[];

  // Deduplicate couples: if both husband and wife appear in results, keep only
  // the one whose spouse_id is NOT also in results OR the one with the lower ID.
  const resultIds = new Set(rows.map((r: any) => String(r.id)));
  const seenCouplePairs = new Set<string>();

  const results = rows
    .filter((r: any) => {
      if (!r.spouse_id) return true; // singleton — always include
      const pairKey = [Math.min(r.id, r.spouse_id), Math.max(r.id, r.spouse_id)].join('-');
      if (seenCouplePairs.has(pairKey)) return false; // already added via the other spouse
      seenCouplePairs.add(pairKey);
      return true;
    })
    .map((r: any) => {
      const hasSpouse = !!r.spouse_id;
      // Normalise to husband-first when gender known, otherwise keep DB order
      const memberIsHusband = r.gender === 'male' || (hasSpouse && r.spouse_gender === 'female');
      const husbandId   = memberIsHusband ? String(r.id) : (r.spouse_id ? String(r.spouse_id) : null);
      const wifeId      = memberIsHusband ? (r.spouse_id ? String(r.spouse_id) : null) : String(r.id);
      const husbandName = memberIsHusband ? r.full_name : r.spouse_name;
      const wifeName    = memberIsHusband ? r.spouse_name : r.full_name;
      const husbandPhoto = memberIsHusband
        ? getAvatarUrl(r.profile_photo_url, String(r.id), r.avatar_version || 0)
        : getAvatarUrl(r.spouse_photo, String(r.spouse_id), r.spouse_avatar_version || 0);
      const wifePhoto = memberIsHusband
        ? getAvatarUrl(r.spouse_photo, String(r.spouse_id), r.spouse_avatar_version || 0)
        : getAvatarUrl(r.profile_photo_url, String(r.id), r.avatar_version || 0);

      return {
        id: String(r.id),
        fullName: r.full_name,
        generation: r.generation,
        isStub: !!r.is_stub,
        isLate: !!r.is_late,
        photo: getAvatarUrl(r.profile_photo_url, String(r.id), r.avatar_version || 0),
        initials: r.full_name?.charAt(0)?.toUpperCase() || '?',
        gender: r.gender,
        location: r.location,
        dob: r.dob,
        fatherName: r.father_name,
        motherName: r.mother_name,
        // Couple fields — null when no spouse
        spouseId: r.spouse_id ? String(r.spouse_id) : null,
        spouseName: r.spouse_name || null,
        spouseIsLate: !!r.spouse_is_late,
        spouseIsStub: !!r.spouse_is_stub,
        spousePhoto: getAvatarUrl(r.spouse_photo, String(r.spouse_id), r.spouse_avatar_version || 0),
        // Husband/wife order for display
        husbandId,
        wifeId,
        husbandName,
        wifeName,
        husbandPhoto,
        wifePhoto,
      };
    });

  return NextResponse.json({ results });
}
