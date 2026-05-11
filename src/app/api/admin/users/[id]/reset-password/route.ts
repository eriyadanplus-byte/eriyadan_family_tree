import { NextRequest, NextResponse } from 'next/server';
import { requireRole, hashPassword } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['super_admin'], request);
    const { id: targetId } = await params;

    if (session.id === targetId) {
      return NextResponse.json({ error: 'Use the change-password page to update your own password' }, { status: 400 });
    }

    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', targetId)
      .limit(1);
    if (fetchErr) return NextResponse.json({ error: 'DB error' }, { status: 500 });
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordHash = await hashPassword(newPassword);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, must_change_password: true })
      .eq('id', targetId);
    if (updateErr) return NextResponse.json({ error: `Failed to reset password: ${updateErr.message}` }, { status: 500 });

    return NextResponse.json({ success: true, userId: targetId, email: users[0].email });
  } catch (err: any) {
    if (err.message === 'Authentication required' || err.message === 'Insufficient permissions') {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
