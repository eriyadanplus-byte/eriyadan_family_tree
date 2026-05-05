import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';


export async function GET(request: Request) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: session.id,
      email: session.email,
      role: session.role,
      memberId: session.memberId,
    },
  });
}
