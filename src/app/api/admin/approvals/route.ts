import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { descendantIds } from '@/lib/family';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });

    const isSuperAdmin = session.role === 'super_admin';
    const isEditorWithApprove = session.role === 'editor' && !!session.canApprove;

    if (!isSuperAdmin && !isEditorWithApprove) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
    }

    const rows = await query(`
      SELECT u.id as userId, u.email, u.name as fullName, u.mobile_number as mobileNumber,
             u.created_at as requestedAt, u.member_id as ancestorId, m.full_name as ancestorName,
             u.secondary_ancestor_id as secondaryAncestorId, m2.full_name as secondaryAncestorName,
             u.relation_type as relationType
      FROM users u
      LEFT JOIN members m  ON u.member_id             = m.id  AND m.deleted_at  IS NULL
      LEFT JOIN members m2 ON u.secondary_ancestor_id = m2.id AND m2.deleted_at IS NULL
      WHERE u.status = 'pending'
      ORDER BY u.created_at DESC
    `) as any[];

    let result = rows.map(r => ({
      userId: r.userid ?? r.userId,
      email: r.email,
      fullName: r.fullname ?? r.fullName ?? r.email,
      mobileNumber: r.mobilenumber ?? r.mobileNumber ?? '',
      ancestorId: r.ancestorid ?? r.ancestorId ?? null,
      ancestorName: (r.ancestorid ?? r.ancestorId) ? (r.ancestorname ?? r.ancestorName ?? 'Unknown') : 'Root member',
      secondaryAncestorId: r.secondaryancestorid ?? r.secondaryAncestorId ?? null,
      secondaryAncestorName: (r.secondaryancestorid ?? r.secondaryAncestorId) ? (r.secondaryancestorname ?? r.secondaryAncestorName ?? 'Unknown') : null,
      relationType: r.relationtype ?? r.relationType ?? null,
      requestedAt: r.requestedat ?? r.requestedAt ?? new Date().toISOString(),
    }));

    if (isEditorWithApprove && !isSuperAdmin) {
      const scopes = (await query(
        'SELECT root_member_id FROM approval_scopes WHERE user_id = ?',
        [session.id]
      )) as any[];
      const allowedIds = new Set<string>();
      for (const s of scopes) {
        const desc = await descendantIds(String(s.root_member_id));
        desc.forEach(id => allowedIds.add(id));
      }
      result = result.filter(r => !r.ancestorId || allowedIds.has(r.ancestorId));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Approvals GET error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to load approvals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });

    const isSuperAdmin = session.role === 'super_admin';
    const isEditorWithApprove = session.role === 'editor' && !!session.canApprove;

    if (!isSuperAdmin && !isEditorWithApprove) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    let body: { action?: string; userId?: string; role?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { action, userId, role } = body;
    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    const users = await query('SELECT * FROM users WHERE id = ?', [userId]) as any[];
    if (users.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = users[0];

    if (isEditorWithApprove && !isSuperAdmin && user.member_id) {
      const scopes = (await query(
        'SELECT root_member_id FROM approval_scopes WHERE user_id = ?',
        [session.id]
      )) as any[];
      let inScope = false;
      for (const s of scopes) {
        const desc = await descendantIds(String(s.root_member_id));
        if (desc.includes(String(user.member_id))) { inScope = true; break; }
      }
      if (!inScope) return NextResponse.json({ error: 'This user is outside your approval scope' }, { status: 403 });
    }

    if (action === 'approve') {
      const assignedRole = role || 'viewer';
      const primaryAncestorId = user.member_id ? String(user.member_id) : null;
      const secondaryAncestorId = user.secondary_ancestor_id ? String(user.secondary_ancestor_id) : null;
      const relationType = user.relation_type || 'child';

      const ancestor = primaryAncestorId
        ? (await query('SELECT * FROM members WHERE id = ? AND deleted_at IS NULL', [primaryAncestorId]) as any[])[0]
        : null;

      if (relationType === 'spouse') {
        const spouseGen = ancestor ? ancestor.generation : 1;
        const spouseResult = await query(
          'INSERT INTO members (full_name, mobile_number, email, generation, father_id, mother_id, is_late, created_by) VALUES (?, ?, ?, ?, ?, ?, false, ?) RETURNING id',
          [user.name || user.email, user.mobile_number || '', user.email, spouseGen, null, null, session.id]
        ) as any;
        const newMemberId = String(spouseResult.insertId ?? spouseResult[0]?.id);
        if (primaryAncestorId) {
          const { setSpouse } = await import('@/lib/family');
          await setSpouse(newMemberId, primaryAncestorId);
        }
        await query('UPDATE users SET status = ?, role = ?, member_id = ? WHERE id = ?', ['active', assignedRole, newMemberId, userId]);
        return NextResponse.json({ success: true, message: 'Spouse approved and linked to family tree' });
      }

      if (relationType === 'sibling') {
        const sibGen = ancestor ? ancestor.generation : 1;
        const sibFatherId = ancestor?.father_id ? String(ancestor.father_id) : null;
        const sibMotherId = ancestor?.mother_id ? String(ancestor.mother_id) : null;
        const sibResult = await query(
          'INSERT INTO members (full_name, mobile_number, email, generation, father_id, mother_id, is_late, created_by) VALUES (?, ?, ?, ?, ?, ?, false, ?) RETURNING id',
          [user.name || user.email, user.mobile_number || '', user.email, sibGen, sibFatherId, sibMotherId, session.id]
        ) as any;
        const sibMemberId = String(sibResult.insertId ?? sibResult[0]?.id);
        await query('UPDATE users SET status = ?, role = ?, member_id = ? WHERE id = ?', ['active', assignedRole, sibMemberId, userId]);
        return NextResponse.json({ success: true, message: 'Sibling approved and added to the family tree' });
      }

      // Child path (default)
      let fatherId: string | null = null;
      let motherId: string | null = null;
      if (primaryAncestorId && secondaryAncestorId) {
        const [pRows, sRows] = await Promise.all([
          query('SELECT gender FROM members WHERE id = ? AND deleted_at IS NULL', [primaryAncestorId]) as Promise<any[]>,
          query('SELECT gender FROM members WHERE id = ? AND deleted_at IS NULL', [secondaryAncestorId]) as Promise<any[]>,
        ]);
        const pGender = pRows[0]?.gender;
        const sGender = sRows[0]?.gender;
        if (pGender === 'female') { motherId = primaryAncestorId; fatherId = secondaryAncestorId; }
        else if (sGender === 'female') { fatherId = primaryAncestorId; motherId = secondaryAncestorId; }
        else { fatherId = primaryAncestorId; motherId = secondaryAncestorId; }
      } else if (primaryAncestorId) {
        const pRows = await query('SELECT gender FROM members WHERE id = ? AND deleted_at IS NULL', [primaryAncestorId]) as any[];
        const pGender = pRows[0]?.gender;
        if (pGender === 'female') motherId = primaryAncestorId;
        else fatherId = primaryAncestorId;
        const { getSpouse } = await import('@/lib/family');
        const spouse = await getSpouse(primaryAncestorId);
        if (spouse) {
          if (pGender === 'female') fatherId = String(spouse.id);
          else motherId = String(spouse.id);
        }
      }

      const childResult = await query(
        'INSERT INTO members (full_name, mobile_number, email, generation, father_id, mother_id, is_late, created_by) VALUES (?, ?, ?, ?, ?, ?, false, ?) RETURNING id',
        [user.name || user.email, user.mobile_number || '', user.email,
         ancestor ? ancestor.generation + 1 : 1, fatherId, motherId, session.id]
      ) as any;
      const childMemberId = String(childResult.insertId ?? childResult[0]?.id);
      await query('UPDATE users SET status = ?, role = ?, member_id = ? WHERE id = ?', ['active', assignedRole, childMemberId, userId]);
      return NextResponse.json({ success: true, message: 'Member approved and added to the family tree' });
    }

    if (action === 'reject') {
      await query('UPDATE users SET status = ? WHERE id = ?', ['rejected', userId]);
      return NextResponse.json({ success: true, message: 'User rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Approval POST error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process request' }, { status: 500 });
  }
}
