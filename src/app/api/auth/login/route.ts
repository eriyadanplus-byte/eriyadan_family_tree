import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql-db';
import { createToken, verifyPassword, hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

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

    const rows = await query('SELECT * FROM users WHERE email = ?', [email]) as any[];
    const user = rows[0];
    if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    if (user.status === 'pending') return NextResponse.json({ error: 'Your account is pending admin approval' }, { status: 403 });
    if (user.status === 'inactive') return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });

    const isValid = user.password === password || await verifyPassword(password, user.password).catch(() => false);
    if (!isValid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

    const memberIdStr = user.member_id != null ? String(user.member_id) : null;
    const token = createToken({ id: String(user.id), email: user.email, role: user.role, memberId: memberIdStr, canApprove: !!user.can_approve });
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, memberId: memberIdStr, canApprove: !!user.can_approve, name: user.name }
    });
    response.cookies.set('session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
