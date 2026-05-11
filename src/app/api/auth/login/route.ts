import { NextRequest, NextResponse } from 'next/server';
import { createToken, verifyPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createBrowserClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)!,
  );
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`login:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  || process.env.SUPABASE_URL;
    const akey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !akey) {
      console.error('Login: missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY)');
      return NextResponse.json({ error: 'Server misconfiguration: Supabase env vars not set' }, { status: 500 });
    }

    const supabase = getSupabase();

    // Uses SECURITY DEFINER function — accessible by anon, bypasses RLS safely
    const { data: rows, error: rpcError } = await supabase.rpc('authenticate_user', { p_email: email });
    if (rpcError) {
      console.error('Login RPC error:', rpcError.message, rpcError.code, rpcError.details);
      return NextResponse.json({ error: `DB error: ${rpcError.message}` }, { status: 500 });
    }

    const user = rows?.[0];
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    if (user.status === 'pending')  return NextResponse.json({ error: 'Your account is pending admin approval' }, { status: 403 });
    if (user.status === 'inactive') return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });

    const isValid = await verifyPassword(password, user.password_hash).catch(() => false);
    if (!isValid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    // Update last_seen via SECURITY DEFINER function (fire-and-forget, ignore errors)
    supabase.rpc('update_last_seen', { p_user_id: user.id }).then(() => {}, () => {});

    const memberIdStr = user.member_id != null ? String(user.member_id) : null;
    const mustChangePassword = !!user.must_change_password;
    const token = await createToken({
      id: String(user.id),
      email: user.email,
      role: user.role,
      memberId: memberIdStr,
      canApprove: !!user.can_approve,
      mustChangePassword,
    });

    const response = NextResponse.json({
      success: true,
      mustChangePassword,
      user: { id: user.id, email: user.email, role: user.role, memberId: memberIdStr, canApprove: !!user.can_approve, name: user.name },
    });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

