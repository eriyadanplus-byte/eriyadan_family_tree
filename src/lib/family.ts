import { query } from './db';

// ─── Types ─────────────────────────────────────────────

export interface MemberBrief {
  id: string;
  full_name: string;
  generation: number;
  is_stub: number;
  profile_photo_url?: string | null;
  avatar_version?: number;
  mobile_number?: string;
  gender?: string;
  location?: string;
  dob?: string;
}

// ─── Spouse helpers ────────────────────────────────────

export async function getSpouse(memberId: string): Promise<MemberBrief | null> {
  const rows = (await query(
    `SELECT m.id, m.full_name, m.generation, m.is_stub, m.profile_photo_url, m.avatar_version
     FROM spouses s
     JOIN members m ON m.id = CASE WHEN s.member_a_id = ? THEN s.member_b_id ELSE s.member_a_id END
     WHERE (s.member_a_id = ? OR s.member_b_id = ?) AND s.status = 'current' AND m.deleted_at IS NULL`,
    [memberId, memberId, memberId]
  )) as any[];
  return rows[0] || null;
}

export async function setSpouse(
  aId: string,
  bId: string,
  status: 'current' | 'former' | 'late' = 'current',
  createdBy?: string
) {
  const a = aId < bId ? aId : bId;
  const b = aId < bId ? bId : aId;
  await query(
    `INSERT INTO spouses (member_a_id, member_b_id, status, created_by) VALUES (?, ?, ?, ?)
     ON CONFLICT (member_a_id, member_b_id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()`,
    [a, b, status, createdBy || 'system']
  );
}

// ─── Children helpers ──────────────────────────────────

export async function getChildren(memberId: string): Promise<MemberBrief[]> {
  return (await query(
    `SELECT id, full_name, generation, is_stub, profile_photo_url, avatar_version, mobile_number, gender, location, dob
     FROM members WHERE (father_id = ? OR mother_id = ?) AND deleted_at IS NULL
     ORDER BY dob IS NULL, dob ASC, id ASC`,
    [memberId, memberId]
  )) as any[];
}

// ─── Generation rules ──────────────────────────────────

export function computeChildGeneration(g1?: number | null, g2?: number | null): number {
  const maxG = Math.max(g1 ?? 0, g2 ?? 0);
  if (maxG === 0) throw new Error('At least one parent must already exist in the tree');
  return maxG + 1;
}

export async function computeChildGenerationAsync(
  fatherId?: string | null,
  motherId?: string | null
): Promise<number> {
  let fg: number | null = null;
  let mg: number | null = null;
  if (fatherId) {
    const r = (await query('SELECT generation FROM members WHERE id = ? AND deleted_at IS NULL', [fatherId])) as any[];
    if (r.length) fg = r[0].generation;
  }
  if (motherId) {
    const r = (await query('SELECT generation FROM members WHERE id = ? AND deleted_at IS NULL', [motherId])) as any[];
    if (r.length) mg = r[0].generation;
  }
  return computeChildGeneration(fg, mg);
}

export async function getMemberGeneration(memberId: string): Promise<number> {
  const rows = (await query('SELECT generation FROM members WHERE id = ? AND deleted_at IS NULL', [memberId])) as any[];
  if (!rows.length) throw new Error('Member not found');
  return rows[0].generation;
}

// ─── Descendant / Ancestry checks ─────────────────────

export async function isDescendantOf(ancestorId: string, targetId: string): Promise<boolean> {
  if (ancestorId === targetId) return true;
  const visited = new Set<string>();
  const queue = [targetId];
  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    if (current === ancestorId) return true;
    const rows = (await query(
      'SELECT father_id, mother_id FROM members WHERE id = ? AND deleted_at IS NULL',
      [current]
    )) as any[];
    if (!rows.length) continue;
    const { father_id, mother_id } = rows[0];
    if (father_id) queue.push(String(father_id));
    if (mother_id) queue.push(String(mother_id));
  }
  return false;
}

export async function descendantIds(ancestorId: string): Promise<string[]> {
  const result = new Set<string>([ancestorId]);
  const queue = [ancestorId];
  while (queue.length) {
    const id = queue.shift()!;
    const rows = (await query(
      `SELECT id FROM members WHERE (father_id = ? OR mother_id = ?) AND deleted_at IS NULL`,
      [id, id]
    )) as any[];
    for (const r of rows) {
      const childId = String(r.id);
      if (!result.has(childId)) {
        result.add(childId);
        queue.push(childId);
      }
    }
  }
  return Array.from(result);
}

// ─── Stub / claim helpers ──────────────────────────────

export async function findStubMatch(
  fullName: string,
  mobileNumber: string,
  relationTargetId: string,
  relationType: 'child' | 'spouse' | 'sibling'
): Promise<{ stubMemberId: string } | null> {
  const name = fullName.trim();
  const mobile = mobileNumber.trim();

  if (relationType === 'child') {
    const rows = (await query(
      `SELECT id FROM members WHERE is_stub = 1 AND deleted_at IS NULL
         AND (father_id = ? OR mother_id = ?) AND full_name = ? AND mobile_number = ?`,
      [relationTargetId, relationTargetId, name, mobile]
    )) as any[];
    if (rows.length) return { stubMemberId: String(rows[0].id) };
  }

  if (relationType === 'spouse') {
    const rows = (await query(
      `SELECT id FROM members WHERE is_stub = 1 AND deleted_at IS NULL
         AND full_name = ? AND mobile_number = ?
         AND id IN (
           SELECT m.id FROM spouses s JOIN members m ON m.id = CASE WHEN s.member_a_id = ? THEN s.member_b_id ELSE s.member_a_id END
           WHERE (s.member_a_id = ? OR s.member_b_id = ?) AND s.status = 'current'
         )`,
      [name, mobile, relationTargetId, relationTargetId, relationTargetId]
    )) as any[];
    if (rows.length) return { stubMemberId: String(rows[0].id) };
  }

  if (relationType === 'sibling') {
    // Sibling = share at least one parent
    const parentRows = (await query(
      'SELECT father_id, mother_id FROM members WHERE id = ? AND deleted_at IS NULL',
      [relationTargetId]
    )) as any[];
    if (!parentRows.length) return null;
    const { father_id, mother_id } = parentRows[0];
    const conditions: string[] = [];
    const params: any[] = [1, name, mobile]; // is_stub, full_name, mobile_number
    if (father_id) { conditions.push('father_id = ?'); params.push(father_id); }
    if (mother_id) { conditions.push('mother_id = ?'); params.push(mother_id); }
    if (!conditions.length) return null;
    const rows = (await query(
      `SELECT id FROM members WHERE is_stub = ? AND deleted_at IS NULL AND full_name = ? AND mobile_number = ?
         AND (${conditions.join(' OR ')}) AND id != ?`,
      [...params, relationTargetId]
    )) as any[];
    if (rows.length) return { stubMemberId: String(rows[0].id) };
  }

  return null;
}

export async function claimStub(stubMemberId: string, userId: string): Promise<void> {
  await query(
    'UPDATE members SET is_stub = 0, claimed_by_user_id = ? WHERE id = ?',
    [userId, stubMemberId]
  );
}

// ─── Add relative helpers ──────────────────────────────

export async function addStubSpouse(
  partnerId: string,
  spouseName: string,
  spouseMobile: string,
  spouseGender: string,
  addedByMemberId: string
): Promise<string> {
  const partnerGen = await getMemberGeneration(partnerId);
  const result = (await query(
    `INSERT INTO members (full_name, mobile_number, generation, gender, is_stub, added_by_member_id, created_by)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [spouseName, spouseMobile, partnerGen, spouseGender, addedByMemberId, addedByMemberId]
  )) as any;
  const newId = String(result.insertId);
  await setSpouse(partnerId, newId, 'current', addedByMemberId);
  return newId;
}

export async function addStubChild(
  fatherId: string | null,
  motherId: string | null,
  childName: string,
  childMobile: string,
  childGender: string,
  addedByMemberId: string
): Promise<string> {
  const childGen = await computeChildGenerationAsync(fatherId, motherId);
  const result = (await query(
    `INSERT INTO members (full_name, mobile_number, generation, gender, father_id, mother_id, is_stub, added_by_member_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [childName, childMobile, childGen, childGender, fatherId || null, motherId || null, addedByMemberId, addedByMemberId]
  )) as any;
  return String(result.insertId);
}

// ─── Search helpers (for signup disambiguation) ────────

export async function searchMembersRich(queryText: string, limit = 15): Promise<MemberBrief[]> {
  if (queryText.length < 2) return [];
  const rows = (await query(
    `SELECT m.id, m.full_name, m.generation, m.is_stub, m.profile_photo_url, m.avatar_version,
            m.mobile_number, m.gender, m.location, m.dob,
            mf.full_name AS father_name, mm.full_name AS mother_name
     FROM members m
     LEFT JOIN members mf ON m.father_id = mf.id AND mf.deleted_at IS NULL
     LEFT JOIN members mm ON m.mother_id = mm.id AND mm.deleted_at IS NULL
      WHERE m.deleted_at IS NULL AND LOWER(m.full_name) LIKE ?
      ORDER BY m.generation ASC, m.full_name ASC
      LIMIT ${limit}`,
    [`%${queryText.toLowerCase()}%`]
  )) as any[];
  return rows.map((r: any) => ({
    id: String(r.id),
    full_name: r.full_name,
    generation: r.generation,
    is_stub: r.is_stub,
    profile_photo_url: r.profile_photo_url,
    avatar_version: r.avatar_version,
    mobile_number: r.mobile_number,
    gender: r.gender,
    location: r.location,
    dob: r.dob,
    father_name: r.father_name,
    mother_name: r.mother_name,
  }));
}

export async function getMembersByGeneration(gen: number): Promise<MemberBrief[]> {
  return (await query(
    `SELECT id, full_name, generation, is_stub, profile_photo_url, avatar_version, mobile_number, gender, location, dob
     FROM members WHERE generation = ? AND deleted_at IS NULL ORDER BY full_name ASC`,
    [gen]
  )) as any[];
}
