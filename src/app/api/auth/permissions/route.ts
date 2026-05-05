import { NextResponse } from 'next/server';
import { getSession, rolePermissions } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(request: Request) {
  const session = await getSession(request);

  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const permissions = rolePermissions[session.role] || {};

  return NextResponse.json({
    canAdd: permissions.canAdd ?? false,
    canEdit: permissions.canEdit ?? false,
    canDelete: permissions.canDelete ?? false,
    canExport: permissions.canExport ?? false,
    canManageUsers: permissions.canManageUsers ?? false,
    canViewContact: true, // All authenticated family members can view contact info
    role: session.role,
  });
}
