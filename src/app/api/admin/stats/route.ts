import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    await requireRole(['super_admin', 'editor']);

    const active = await query('SELECT * FROM members WHERE deleted_at IS NULL') as any[];
    const now = Date.now();
    const month30 = 30 * 24 * 60 * 60 * 1000;

    const addedThisMonth = active.filter(m => m.created_at && (now - new Date(m.created_at).getTime()) < month30).length;
    const genNums = active.map(m => m.generation).filter(Boolean);
    const uniqueGen = new Set(genNums).size;
    const minGen = genNums.length ? Math.min(...genNums) : 0;
    const maxGen = genNums.length ? Math.max(...genNums) : 0;

    const recentMembers = [...active]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10)
      .map(m => ({
        id: m.id, fullName: m.full_name, email: m.email || '', generation: m.generation,
        isLate: !!m.is_late, role: m.role, createdAt: m.created_at,
      }));

    const pendingCount = await query('SELECT COUNT(*) as cnt FROM users WHERE status = ?', ['pending']) as any[];
    const lateCount = await query('SELECT COUNT(*) as cnt FROM members WHERE deleted_at IS NULL AND is_late = true') as any[];
    const livingCount = await query('SELECT COUNT(*) as cnt FROM members WHERE deleted_at IS NULL AND is_late = false') as any[];

    return NextResponse.json({
      totalMembers: active.length, totalGenerations: uniqueGen, addedThisMonth,
      pendingApprovals: pendingCount[0]?.cnt || 0,
      lateMembers: lateCount[0]?.cnt || 0, livingMembers: livingCount[0]?.cnt || 0,
      minGeneration: minGen, maxGeneration: maxGen, recentMembers,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
