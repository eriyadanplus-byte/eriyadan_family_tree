import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['super_admin', 'editor'], request);
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 403 });
  }

  try {
    const roleFilter = request.nextUrl.searchParams.get('role');
    const supabase = getSupabaseAdmin();

    let usersQ = supabase
      .from('users')
      .select('id, email, name, role, status, member_id, created_at')
      .order('created_at', { ascending: false });
    if (roleFilter) usersQ = usersQ.eq('role', roleFilter);

    const { data: users, error: usersErr } = await usersQ;
    if (usersErr) throw new Error(usersErr.message);

    // Resolve member names for linked users
    const memberIds = [...new Set((users ?? []).map(u => u.member_id).filter(Boolean))];
    let memberMap: Record<string, string> = {};
    if (memberIds.length > 0) {
      const { data: members } = await supabase
        .from('members')
        .select('id, full_name')
        .is('deleted_at', null)
        .in('id', memberIds);
      memberMap = Object.fromEntries((members ?? []).map(m => [m.id, m.full_name]));
    }

    const rows = (users ?? []).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      memberId: u.member_id,
      createdAt: u.created_at,
      memberName: u.member_id ? (memberMap[u.member_id] ?? null) : null,
    }));

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['super_admin'], request);
    const { userId, role } = await request.json();
    if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
    const validRoles = ['super_admin', 'editor', 'contributor', 'viewer'];
    if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { error, count } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) throw new Error(error.message);
    if (count === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed to update user' }, { status: 500 }); }
}
