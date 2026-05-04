import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set({
    name: 'session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  response.cookies.set({
    name: 'eriyaden_view',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
