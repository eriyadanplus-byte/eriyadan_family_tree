import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json();
  const { name, email, newPassword } = body;
  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  if (newPassword) {
    const hashed = await hashPassword(newPassword);
    updates.push('"password" = ?');
    values.push(hashed);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(session.id);
  await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
  return NextResponse.json({ success: true });
}
