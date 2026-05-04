import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/mysql-db';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const AVATAR_DIR = path.join(process.cwd(), 'public', 'avatars');
const MAX_SIZE = 220 * 1024; // 220 KB hard limit (client compresses to ≤200KB)

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_SIZE) {
    return NextResponse.json({ error: `Image too large (${Math.round(buffer.length / 1024)}KB). Max ${MAX_SIZE / 1024}KB.` }, { status: 400 });
  }

  // Ensure directory exists
  try {
    await mkdir(AVATAR_DIR, { recursive: true });
  } catch {
    // may already exist
  }

  // Write file — always JPEG
  const filePath = path.join(AVATAR_DIR, `${id}.jpg`);
  await writeFile(filePath, new Uint8Array(buffer));

  // Bump avatar_version and set profile_photo_url
  await query(
    `UPDATE members SET avatar_version = avatar_version + 1, profile_photo_url = ? WHERE id = ?`,
    [`/avatars/${id}.jpg`, id]
  );

  const updated = (await query('SELECT avatar_version FROM members WHERE id = ?', [id])) as any[];

  return NextResponse.json({
    success: true,
    avatarVersion: updated[0]?.avatar_version || 1,
    url: `/avatars/${id}.jpg?v=${updated[0]?.avatar_version || 1}`,
  });
}
