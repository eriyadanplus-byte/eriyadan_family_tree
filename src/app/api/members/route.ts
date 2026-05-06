import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, rolePermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

function mapMember(row: any) {
  return {
    id:            String(row.id),
    fullName:      row.full_name,
    mobileNumber:  row.mobile_number,
    email:         row.email,
    generation:    row.generation,
    isLate:        row.is_late === 1 || row.is_late === true,
    isOnline:      false,
    birthYear:     row.birth_year,
    deathYear:     row.death_year,
    role:          row.role || 'viewer',
    profilePhotoUrl: row.profile_photo_url,
    gender:        row.gender,
    dob:           row.dob,
    dod:           row.dod,
    location:      row.location,
    bio:           row.bio,
    currentRole:   row.current_role,
    company:       row.company,
    instagram:     row.instagram,
    linkedin:      row.linkedin,
    twitter:       row.twitter,
    facebook:      row.facebook,
    youtube:       row.youtube,
    whatsapp:      row.whatsapp,
    fatherId:      row.father_id != null ? String(row.father_id) : undefined,
    motherId:      row.mother_id != null ? String(row.mother_id) : undefined,
    spouseId:      undefined as string | undefined,
    isStub:        row.is_stub === 1 || row.is_stub === true,
    claimedByUserId: row.claimed_by_user_id,
    addedByMemberId: row.added_by_member_id,
    avatarVersion: row.avatar_version || 0,
    createdVia:     row.created_via || null,
    createdAt:     row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const generation = searchParams.get('generation');
  const search     = searchParams.get('search');
  const isLate     = searchParams.get('isLate');
  const limitParam = searchParams.get('limit');
  let limit = 200;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 200);
    }
  }

  const conditions: string[] = ['m.deleted_at IS NULL'];
  const values: any[] = [];

  if (generation) {
    conditions.push('m.generation = ?');
    values.push(parseInt(generation));
  }
  if (isLate !== null && isLate !== '') {
    conditions.push('m.is_late = ?');
    values.push(isLate === 'true');
  }
  if (search) {
    conditions.push('(LOWER(m.full_name) LIKE ? OR m.mobile_number LIKE ? OR LOWER(m.email) LIKE ?)');
    const like = `%${search.toLowerCase()}%`;
    values.push(like, like, like);
  }

  const sql = `SELECT m.* FROM members m
    WHERE ${conditions.join(' AND ')}
    ORDER BY m.generation ASC, m.full_name ASC LIMIT ${limit}`;
  const rows = await query(sql, values) as any[];

  // Build spouse map from the spouses table (current relationships)
  const spouses = await query(`SELECT member_a_id, member_b_id FROM spouses WHERE status = 'current'`) as any[];
  const spouseMap: Record<string, string> = {};
  for (const s of spouses) {
    spouseMap[String(s.member_a_id)] = String(s.member_b_id);
    spouseMap[String(s.member_b_id)] = String(s.member_a_id);
  }

  return NextResponse.json(rows.map(row => {
    const member = mapMember(row);
    const mid = String(row.id);
    if (spouseMap[mid]) {
      member.spouseId = spouseMap[mid];
    }
    return member;
  }));
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!rolePermissions[session.role]?.canAdd) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const body = await request.json();
  const {
    fullName, mobileNumber, email, location, bio,
    gender, dob, current_role, company,
    dod, isLate, generation,
    fatherId, motherId, spouseId,
    isStub, addedByMemberId, createdVia,
  } = body;

  if (!fullName) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }
  if (!mobileNumber && !isLate) {
    return NextResponse.json({ error: 'Mobile number is required for living members. Mark as late if unavailable.' }, { status: 400 });
  }

  // Guard: founding members (no parents/spouse) require super_admin and empty tree or explicit allowRoot
  const hasNoParent = !fatherId && !motherId && !spouseId;
  if (hasNoParent && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only admin can create founding members' }, { status: 403 });
  }
  if (hasNoParent && session.role === 'super_admin') {
    const existing = await query('SELECT COUNT(*) as cnt FROM members WHERE deleted_at IS NULL') as any[];
    const cnt = Number(existing[0]?.cnt ?? existing[0]?.count ?? 0);
    const allowRoot = body.allowRoot === true;
    if (cnt > 0 && !allowRoot) {
      return NextResponse.json({ error: 'Tree already has members. Use allowRoot to force.' }, { status: 400 });
    }
  }

    try {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO members (id, full_name, mobile_number, email, location, bio, gender, dob, current_role, company, dod, is_late, generation, father_id, mother_id, is_stub, created_by, added_by_member_id, created_via) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, fullName, mobileNumber, email || null, location || null, bio || null,
        gender || null, dob || null, current_role || null, company || null,
        dod || null, isLate ? 1 : 0, generation || 1,
        fatherId || null, motherId || null,
        isStub ? 1 : 0, session.id,
        addedByMemberId || null,
        createdVia || null,
      ]
    );

    // If spouseId provided, create relationship in spouses table
    if (spouseId) {
      const memberA = id < spouseId ? id : spouseId;
      const memberB = id < spouseId ? spouseId : id;
      await query(
        `INSERT INTO spouses (id, member_a_id, member_b_id, status) VALUES (?, ?, ?, 'current')`,
        [crypto.randomUUID(), memberA, memberB]
      );
    }

    const newMember = await query('SELECT * FROM members WHERE id = ?', [id]) as any[];
    return NextResponse.json(mapMember(newMember[0]), { status: 201 });
  } catch (e: any) {
    const message = e?.sqlMessage || e?.message || 'Database error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
