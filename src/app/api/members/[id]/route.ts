import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, rolePermissions } from '@/lib/auth';
import { getAvatarUrl } from '@/lib/avatar';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await query('SELECT * FROM members WHERE id = ? AND deleted_at IS NULL', [id]) as any[];
  const member = rows[0];
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const father = member.father_id ? (await query('SELECT id, full_name, profile_photo_url, avatar_version FROM members WHERE id = ? AND deleted_at IS NULL', [member.father_id]) as any[])[0] : null;
  const mother = member.mother_id ? (await query('SELECT id, full_name, profile_photo_url, avatar_version FROM members WHERE id = ? AND deleted_at IS NULL', [member.mother_id]) as any[])[0] : null;
  const spouseRow = (await query(
    `SELECT m.id, m.full_name, m.profile_photo_url, m.avatar_version
     FROM spouses s
     JOIN members m ON m.id = CASE WHEN s.member_a_id = ? THEN s.member_b_id ELSE s.member_a_id END
     WHERE (s.member_a_id = ? OR s.member_b_id = ?) AND s.status = 'current' AND m.deleted_at IS NULL`,
    [id, id, id]
  ) as any[])[0];
  const children = await query('SELECT id, full_name, generation, profile_photo_url, avatar_version FROM members WHERE (father_id = ? OR mother_id = ?) AND deleted_at IS NULL', [id, id]) as any[];

  return NextResponse.json({
    id: member.id, fullName: member.full_name, email: member.email, generation: member.generation,
    isLate: !!member.is_late, birthYear: member.birth_year, deathYear: member.death_year,
    profilePhotoUrl: member.profile_photo_url, gender: member.gender, dob: member.dob, dod: member.dod,
    location: member.location, bio: member.bio, currentRole: member.current_role, company: member.company,
    instagram: member.instagram, linkedin: member.linkedin, twitter: member.twitter, facebook: member.facebook, youtube: member.youtube, whatsapp: member.whatsapp,
    mobileNumber: member.mobile_number,
    isStub: !!member.is_stub,
    claimedByUserId: member.claimed_by_user_id,
    addedByMemberId: member.added_by_member_id,
    avatarVersion: member.avatar_version || 0,
    father: father ? { id: father.id, fullName: father.full_name, photo: getAvatarUrl(father.profile_photo_url, father.id, father.avatar_version || 0) } : null,
    mother: mother ? { id: mother.id, fullName: mother.full_name, photo: getAvatarUrl(mother.profile_photo_url, mother.id, mother.avatar_version || 0) } : null,
    spouse: spouseRow ? { id: spouseRow.id, fullName: spouseRow.full_name, photo: getAvatarUrl(spouseRow.profile_photo_url, spouseRow.id, spouseRow.avatar_version || 0) } : null,
    children: children.map(c => ({ id: c.id, fullName: c.full_name, generation: c.generation, photo: getAvatarUrl(c.profile_photo_url, c.id, c.avatar_version || 0) })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { id } = await params;
  const isSelfEdit = String(session.memberId) === String(id);
  const isPrivileged = rolePermissions[session.role]?.canEdit ?? false;
  const canEdit = isPrivileged || isSelfEdit;
  if (!canEdit) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const body = await request.json();

  // When revoking deceased status, force dod to null regardless of what was sent
  if (body.isLate === false) {
    body.dod = null;
  }
  // When marking as deceased but dod is empty string, store as null
  if (body.isLate === true && !body.dod) {
    body.dod = null;
  }

  const fields: string[] = [];
  const values: any[] = [];

  // Full field map for privileged roles (editor, contributor, super_admin)
  // NOTE: spouseId is NOT in the members table - spouses are tracked in the spouses table
  const fullFieldMap: Record<string, string> = {
    fullName: 'full_name', email: 'email', generation: 'generation', isLate: 'is_late',
    birthYear: 'birth_year', deathYear: 'death_year', profilePhotoUrl: 'profile_photo_url',
    gender: 'gender', dob: 'dob', dod: 'dod', location: 'location', bio: 'bio',
    currentRole: 'current_role', company: 'company', instagram: 'instagram',
    linkedin: 'linkedin', twitter: 'twitter', facebook: 'facebook', youtube: 'youtube', whatsapp: 'whatsapp',
    fatherId: 'father_id', motherId: 'mother_id', mobileNumber: 'mobile_number',
    isStub: 'is_stub', claimedByUserId: 'claimed_by_user_id', addedByMemberId: 'added_by_member_id', avatarVersion: 'avatar_version',
  };
  // Restricted field map for self-editing members (no lineage/admin fields)
  const selfFieldMap: Record<string, string> = {
    fullName: 'full_name', email: 'email', profilePhotoUrl: 'profile_photo_url',
    gender: 'gender', dob: 'dob', location: 'location', bio: 'bio',
    currentRole: 'current_role', company: 'company', mobileNumber: 'mobile_number',
    instagram: 'instagram', linkedin: 'linkedin', twitter: 'twitter',
    facebook: 'facebook', youtube: 'youtube', whatsapp: 'whatsapp', avatarVersion: 'avatar_version',
  };
  const fieldMap = isPrivileged ? fullFieldMap : selfFieldMap;

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      fields.push(`"${dbField}" = ?`);
      // Keep booleans as booleans — PostgreSQL is_late/is_stub are BOOLEAN columns
      // and exec_sql RPC handles jsonb booleans correctly (TRUE/FALSE)
      if (key === 'isLate' || key === 'isStub') {
        values.push(!!body[key]);
      } else {
        values.push(body[key] ?? null);
      }
    }
  }
  // Always include dod in the update when isLate is explicitly set, even if dod wasn't in the body
  if (body.isLate !== undefined && !fields.some(f => f.includes('"dod"'))) {
    fields.push('"dod" = ?');
    values.push(body.isLate ? (body.dod ?? null) : null);
  }

  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(id);
  const sql = `UPDATE members SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
  try {
    await query(sql, values);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PUT /api/members] ERROR:', err.message, '| member:', id);
    return NextResponse.json({ error: err.message || 'Failed to save member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!rolePermissions[session.role]?.canDelete) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const { id } = await params;
  const now = new Date().toISOString();
  console.log('[DELETE] Starting delete for member:', id, 'session role:', session.role);
  
  try {
    // First verify member exists
    const existing = await query('SELECT id, full_name, deleted_at FROM members WHERE id = ?', [id]) as any[];
    console.log('[DELETE] Existing member:', existing);
    
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    
    if (existing[0].deleted_at) {
      console.log('[DELETE] Member already deleted');
      return NextResponse.json({ success: true, message: 'Already deleted' });
    }
    
    // Now soft delete
    const result = await query('UPDATE members SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL', [now, id]) as any;
    console.log('[DELETE] Update result:', result);
    
    // Verify it was deleted
    const verify = await query('SELECT deleted_at FROM members WHERE id = ?', [id]) as any[];
    console.log('[DELETE] After delete, deleted_at:', verify[0]?.deleted_at);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE] Member delete error:', err.message, '| id:', id, '| stack:', err.stack);
    return NextResponse.json({ error: 'Failed to delete member', detail: err.message }, { status: 500 });
  }
}
