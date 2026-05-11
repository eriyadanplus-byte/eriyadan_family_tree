import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, verifyPassword, hashPassword } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`change-password:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many password change attempts. Try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  try {
    const session = await requireRole(['super_admin', 'editor'], request);

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    // Fetch user's current password hash
    const rows = await query('SELECT password_hash FROM users WHERE id = ?', [session.id]) as any[];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = rows[0];
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const hashed = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, session.id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === 'Authentication required' || err.message === 'Insufficient permissions') {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error('Change password error:', err);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}

