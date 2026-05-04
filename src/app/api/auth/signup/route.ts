import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql-db';
import { hashPassword } from '@/lib/auth';
import { findStubMatch, claimStub, getSpouse } from '@/lib/family';
import { hashAnonToken, HELP_ANON_COOKIE } from '@/lib/helpToken';
import { rateLimit } from '@/lib/rate-limit';

async function linkAnonThread(request: NextRequest, userId: number) {
  const anonToken = request.cookies.get(HELP_ANON_COOKIE)?.value;
  if (!anonToken) return;
  const hash = hashAnonToken(anonToken);
  await query(
    `UPDATE help_threads SET user_id = ?, anon_token_hash = NULL WHERE anon_token_hash = ? AND status != 'resolved'`,
    [userId, hash]
  );
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`signup:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many signup attempts. Try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  try {
    const body = await request.json();
    const { email, password, name, mobile, ancestorId, secondaryAncestorId, relationType, stubMemberId } = body;

    if (!email || !password || !name) return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    if (!ancestorId) return NextResponse.json({ error: 'Please select your ancestor — contact admin if you are a founding member.' }, { status: 400 });

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (existing.length > 0) return NextResponse.json({ error: 'Email already registered' }, { status: 400 });

    // ─── Auto-approval path: stub claim ──────────────────────
    // If the user selected a stub member and the name+mobile match strictly,
    // auto-approve: claim the stub, activate the user immediately.
    if (stubMemberId && ancestorId && relationType) {
      const stubMatch = await findStubMatch(name, mobile || '', ancestorId, relationType);
      if (stubMatch && stubMatch.stubMemberId === String(stubMemberId)) {
        const hashedPw = await hashPassword(password);
        const result = (await query(
          `INSERT INTO users (email, name, mobile_number, password, role, status, member_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [email, name, mobile || '', hashedPw, 'viewer', 'active', stubMemberId]
        )) as any;

        // Claim the stub — mark as claimed by this user
        await claimStub(stubMemberId, String(result.insertId));

        // Auto-fill missing parent from spouse relationship (1c: even if parent is late)
        const stubRows = await query(
          'SELECT father_id, mother_id FROM members WHERE id = ? AND deleted_at IS NULL',
          [stubMemberId]
        ) as any[];
        if (stubRows.length) {
          const stub = stubRows[0];
          let updateNeeded = false;
          let fatherId = stub.father_id ? String(stub.father_id) : null;
          let motherId = stub.mother_id ? String(stub.mother_id) : null;
          if (fatherId && !motherId) {
            const spouse = await getSpouse(fatherId);
            if (spouse) { motherId = String(spouse.id); updateNeeded = true; }
          } else if (motherId && !fatherId) {
            const spouse = await getSpouse(motherId);
            if (spouse) { fatherId = String(spouse.id); updateNeeded = true; }
          }
          if (updateNeeded) {
            await query(
              'UPDATE members SET father_id = ?, mother_id = ? WHERE id = ?',
              [fatherId, motherId, stubMemberId]
            );
          }
        }

        await linkAnonThread(request, result.insertId);

        return NextResponse.json({
          success: true,
          autoApproved: true,
          message: 'Account created and linked to your family profile automatically.',
        }, { status: 201 });
      }
      // Stub match failed — fall through to normal pending flow
    }

    // ─── Normal pending path ─────────────────────────────────
    if (ancestorId) {
      const anc = await query('SELECT id FROM members WHERE id = ? AND deleted_at IS NULL', [ancestorId]) as any[];
      if (anc.length === 0) return NextResponse.json({ error: 'Selected ancestor not found' }, { status: 400 });
    }

    // Resolve the second parent: from the couple selection or from spouse lookup
    let resolvedSecondaryId = secondaryAncestorId || null;
    if (!resolvedSecondaryId && ancestorId && relationType === 'child') {
      const spouse = await getSpouse(String(ancestorId));
      if (spouse) resolvedSecondaryId = String(spouse.id);
    }

    const validRelationTypes = ['child', 'spouse', 'sibling'] as const;
    const relationTypeValue = relationType && validRelationTypes.includes(relationType) ? relationType : null;

    const hashedPw = await hashPassword(password);
    const pendingResult = (await query(
      'INSERT INTO users (email, name, mobile_number, password, role, status, member_id, secondary_ancestor_id, relation_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, name, mobile || '', hashedPw, 'viewer', 'pending', ancestorId || null, resolvedSecondaryId || null, relationTypeValue]
    )) as any;
    await linkAnonThread(request, pendingResult.insertId);

    return NextResponse.json({ success: true, autoApproved: false, message: 'Registration submitted. Awaiting admin approval.' }, { status: 201 });
  } catch (err: any) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
