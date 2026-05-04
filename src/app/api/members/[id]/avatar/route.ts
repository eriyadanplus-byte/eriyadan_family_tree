import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';

const MAX_SIZE = 220 * 1024; // 220 KB hard limit (client compresses to ≤200KB)

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`avatar:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many avatar uploads. Try again later.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfterSec) },
    });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  // Verify member exists
  const memberRows = (await query('SELECT id FROM members WHERE id = ? AND deleted_at IS NULL', [id])) as any[];
  if (!memberRows.length) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Only the member themselves or admin/editor can upload
  const isSelf = session.memberId === id;
  const isPrivileged = ['super_admin', 'editor'].includes(session.role);
  if (!isSelf && !isPrivileged) {
    return NextResponse.json({ error: 'Not authorized to change this avatar' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('avatar') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  // Validate type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  // Validate size
  const buffer = new Uint8Array(await file.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE) {
    return NextResponse.json({ error: `Image too large (${Math.round(buffer.byteLength / 1024)}KB). Max ${MAX_SIZE / 1024}KB.` }, { status: 400 });
  }

  // Upload to Supabase Storage bucket 'avatars'
  const bucket = supabase.storage.from('avatars');
  const fileName = `${id}.jpg`;
  const { error: uploadError } = await bucket.upload(fileName, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (uploadError) {
    console.error('Supabase avatar upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload avatar to cloud storage' }, { status: 500 });
  }
  const { data: publicUrlData } = bucket.getPublicUrl(fileName);
  const photoUrl = publicUrlData.publicUrl;

  // Bump avatar_version and set profile_photo_url
  try {
    await query(
      `UPDATE members SET "avatar_version" = "avatar_version" + 1, "profile_photo_url" = ? WHERE id = ?`,
      [photoUrl, id]
    );
  } catch (err: any) {
    console.error('Avatar update error:', err.message);
    return NextResponse.json({ error: 'Failed to update avatar metadata', detail: err.message }, { status: 500 });
  }

  const updated = (await query('SELECT "avatar_version" FROM members WHERE id = ?', [id])) as any[];
  const avatarVersion = updated[0]?.avatar_version || 1;

  return NextResponse.json({
    success: true,
    avatarVersion,
    url: photoUrl,
  });
}
