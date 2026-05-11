import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';

  const like = `%${search.toLowerCase()}%`;

  try {
    // Return all couples where both partners exist and are not deleted
    // Canonicalise: always father=male or member_a, mother=member_b via the spouses table
    const rows = await query(
      `SELECT
         ma.id        AS father_id,
         ma.full_name AS father_name,
         mb.id        AS mother_id,
         mb.full_name AS mother_name,
         ma.generation
       FROM spouses s
       JOIN members ma ON ma.id = s.member_a_id
       JOIN members mb ON mb.id = s.member_b_id
       WHERE s.status = 'current'
         AND ma.deleted_at IS NULL
         AND mb.deleted_at IS NULL
         AND (
           LOWER(ma.full_name) LIKE ?
           OR LOWER(mb.full_name) LIKE ?
           OR LOWER(CONCAT(ma.full_name, ' ', mb.full_name)) LIKE ?
           OR LOWER(CONCAT(mb.full_name, ' ', ma.full_name)) LIKE ?
         )
       ORDER BY ma.generation ASC, ma.full_name ASC
       LIMIT 20`,
      [like, like, like, like]
    );

    const couples = (rows as any[]).map(r => ({
      fatherId:   String(r.father_id),
      fatherName: r.father_name,
      motherId:   String(r.mother_id),
      motherName: r.mother_name,
      generation: r.generation,
    }));

    return NextResponse.json({ couples });
  } catch (e: any) {
    const message = e?.sqlMessage || e?.message || 'Database error';
    return NextResponse.json({ error: message, couples: [] }, { status: 500 });
  }
}

