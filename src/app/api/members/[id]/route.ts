import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, rolePermissions } from '@/lib/auth';

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
    father: father ? { id: father.id, fullName: father.full_name, photo: father.profile_photo_url ? `/avatars/${father.id}.jpg?v=${father.avatar_version || 0}` : null } : null,
    mother: mother ? { id: mother.id, fullName: mother.full_name, photo: mother.profile_photo_url ? `/avatars/${mother.id}.jpg?v=${mother.avatar_version || 0}` : null } : null,
    spouse: spouseRow ? { id: spouseRow.id, fullName: spouseRow.full_name, photo: spouseRow.profile_photo_url ? `/avatars/${spouseRow.id}.jpg?v=${spouseRow.avatar_version || 0}` : null } : null,
    children: children.map(c => ({ id: c.id, fullName: c.full_name, generation: c.generation, photo: c.profile_photo_url ? `/avatars/${c.id}.jpg?v=${c.avatar_version || 0}` : null })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { id } = await params;
  const isSelfEdit = String(session.memberId) === String(id);
  const isPrivileged = rolePermissions[session.role]?.canEdit ?? false;
  const canEdit = isPrivileged || isSelfEdit;
  if (!canEdit) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const body = await request.json();
  const fields = [];
  const values = [];

  // Full field map for privileged roles (editor, contributor, super_admin)
  const fullFieldMap: Record<string, string> = {
    fullName: 'full_name', email: 'email', generation: 'generation', isLate: 'is_late',
    birthYear: 'birth_year', deathYear: 'death_year', profilePhotoUrl: 'profile_photo_url',
    gender: 'gender', dob: 'dob', dod: 'dod', location: 'location', bio: 'bio',
    currentRole: 'current_role', company: 'company', instagram: 'instagram',
    linkedin: 'linkedin', twitter: 'twitter', facebook: 'facebook', youtube: 'youtube', whatsapp: 'whatsapp',
    fatherId: 'father_id', motherId: 'mother_id', spouseId: 'spouse_id', mobileNumber: 'mobile_number',
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
    if (body[key] !== undefined) { fields.push(`${dbField} = ?`); values.push(body[key]); }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(id);
  await query(`UPDATE members SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, values);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!rolePermissions[session.role]?.canDelete) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });

  const { id } = await params;
  await query('UPDATE members SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL', [id]);
  return NextResponse.json({ success: true });
}
