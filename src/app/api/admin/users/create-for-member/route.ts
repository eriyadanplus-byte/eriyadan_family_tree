import { NextRequest, NextResponse } from 'next/server';
import { requireRole, hashPassword } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['super_admin'], request);

    const { memberId, email, password, role } = await request.json();

    if (!memberId || !email || !password) {
      return NextResponse.json({ error: 'memberId, email, and password are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const assignedRole = ['viewer', 'contributor', 'editor'].includes(role) ? role : 'viewer';
    const supabase = getSupabaseAdmin();

    // Verify member exists and is living
    const { data: members, error: memberErr } = await supabase
      .from('members')
      .select('id, full_name, is_late')
      .eq('id', memberId)
      .is('deleted_at', null)
      .limit(1);
    if (memberErr) return NextResponse.json({ error: 'DB error checking member' }, { status: 500 });
    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    const member = members[0];
    if (member.is_late) {
      return NextResponse.json({ error: 'Cannot create account for a deceased member' }, { status: 400 });
    }

    // Check no existing account for this member
    const { data: existingByMember } = await supabase
      .from('users')
      .select('id')
      .eq('member_id', memberId)
      .limit(1);
    if (existingByMember && existingByMember.length > 0) {
      return NextResponse.json({ error: 'This member already has a user account' }, { status: 409 });
    }

    // Check email not already in use
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);
    if (existingByEmail && existingByEmail.length > 0) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        member_id: memberId,
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        name: member.full_name,
        role: assignedRole,
        status: 'active',
        must_change_password: true,
      })
      .select('id')
      .single();

    if (insertErr) return NextResponse.json({ error: `Failed to create account: ${insertErr.message}` }, { status: 500 });

    return NextResponse.json({ success: true, userId: newUser.id, email: email.toLowerCase().trim() });
  } catch (err: any) {
    if (err.message === 'Authentication required' || err.message === 'Insufficient permissions') {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error('Create account for member error:', err);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
