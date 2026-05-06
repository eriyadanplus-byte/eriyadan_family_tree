import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/icons/apple-touch-icon.png', request.url), 301);
}
