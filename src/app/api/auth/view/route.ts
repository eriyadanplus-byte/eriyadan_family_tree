import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { view } = await request.json();
    if (view !== 'member' && view !== 'admin')
      return NextResponse.json({ error: 'Invalid view' }, { status: 400 });

    if (view === 'admin' && !['super_admin', 'editor', 'contributor'].includes(session.role))
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

    const response = NextResponse.json({ success: true, view });
    response.cookies.set({
      name: 'eriyaden_view', value: view,
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Failed to switch view' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const view = request.cookies.get('eriyaden_view')?.value || 'member';
  return NextResponse.json({ view });
}
