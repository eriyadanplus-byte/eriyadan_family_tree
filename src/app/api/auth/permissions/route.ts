import { NextResponse } from 'next/server';
import { getSession, rolePermissions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function GET(request: Request) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const base = { ...(rolePermissions[session.role] ?? {}) };

  // Merge per-user overrides (false values disable role defaults)
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('users')
      .select('permissions_override')
      .eq('id', session.id)
      .single();
    if (data?.permissions_override) {
      Object.assign(base, data.permissions_override);
    }
  } catch { /* ignore — fall back to role defaults */ }

  return NextResponse.json({
    canAdd: base.canAdd ?? false,
    canEdit: base.canEdit ?? false,
    canDelete: base.canDelete ?? false,
    canExport: base.canExport ?? false,
    canManageUsers: base.canManageUsers ?? false,
    canViewContact: true,
    role: session.role,
  });
}
