import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword, createToken } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const passwordHash = await hashPassword(newPassword);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, must_change_password: false })
      .eq('id', session.id);
    if (updateErr) return NextResponse.json({ error: `Failed to update password: ${updateErr.message}` }, { status: 500 });

    // Re-issue JWT with mustChangePassword=false so middleware stops redirecting
    const newToken = await createToken({
      id: session.id,
      email: session.email,
      role: session.role,
      memberId: session.memberId,
      canApprove: session.canApprove,
      mustChangePassword: false,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err: any) {
    if (err.message === 'Authentication required') {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}

