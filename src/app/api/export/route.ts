import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { query } from '@/lib/db';
import { getSession, rolePermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!rolePermissions[session.role]?.canExport)
    return NextResponse.json({ error: 'Export permission required' }, { status: 403 });

  const format = new URL(request.url).searchParams.get('format') || 'json';
  const members = await query('SELECT * FROM members WHERE deleted_at IS NULL ORDER BY generation ASC, full_name ASC') as any[];

  const rows = members.map(m => ({
    'Full Name': m.full_name,
    'Email': m.email || '',
    'Mobile': m.mobile_number || '',
    'Generation': m.generation,
    'Status': m.is_late ? 'Deceased' : 'Living',
    'Gender': m.gender || '',
    'Location': m.location || '',
    'Bio': m.bio || '',
  }));

  const date = new Date().toISOString().split('T')[0];

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Family Tree');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="family-tree-${date}.xlsx"`,
      }
    });
  }

  if (format === 'csv') {
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const v = String((r as any)[h] || '');
        return v.includes(',') ? `"${v}"` : v;
      }).join(','))
    ].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="family-tree-${date}.csv"`,
      }
    });
  }

  return NextResponse.json(rows, {
    headers: { 'Content-Disposition': `attachment; filename="family-tree-${date}.json"` }
  });
}
