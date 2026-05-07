import { SignJWT, jwtVerify } from 'jose';

export interface SessionUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  memberId: string | null;
  canApprove?: boolean;
  name?: string;
  mustChangePassword?: boolean;
}

export const rolePermissions = {
  super_admin: { canAdd: true, canEdit: true, canDelete: true, canExport: true, canManageUsers: true },
  editor: { canAdd: true, canEdit: true, canDelete: true, canExport: false, canManageUsers: false },
  contributor: { canAdd: true, canEdit: true, canDelete: false, canExport: false, canManageUsers: false },
  viewer: { canAdd: false, canEdit: false, canDelete: false, canExport: false, canManageUsers: false },
};

// Edge-compatible password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

function getSecretKey() {
  const secret = process.env.JWT_SECRET
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_ANON_KEY;
  if (!secret) throw new Error('No JWT secret available: set JWT_SECRET or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return new TextEncoder().encode(secret);
}

export async function createToken(payload: { id: string; email: string; role: string; memberId?: string | null; canApprove?: boolean; mustChangePassword?: boolean }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { clockTolerance: 60 });
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as SessionUser['role'],
      memberId: payload.memberId as string | null | undefined ?? null,
      canApprove: payload.canApprove as boolean | undefined,
      name: payload.name as string | undefined,
      mustChangePassword: payload.mustChangePassword as boolean | undefined,
    };
  } catch {
    return null;
  }
}

// Edge-compatible session getter
export async function getSession(request?: Request): Promise<SessionUser | null> {
  let sessionValue: string | undefined;
  const cookieHeader = request?.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  sessionValue = match?.[1];
  if (!sessionValue) return null;
  return await verifyToken(sessionValue);
}

export async function hasPermission(permission: keyof typeof rolePermissions['super_admin'], request?: Request): Promise<boolean> {
  const session = await getSession(request);
  if (!session) return false;
  return rolePermissions[session.role]?.[permission] ?? false;
}

export async function requireAuth(request?: Request): Promise<SessionUser> {
  const session = await getSession(request);
  if (!session) throw new Error('Authentication required');
  return session;
}

export async function requireRole(allowedRoles: SessionUser['role'][], request?: Request): Promise<SessionUser> {
  const session = await requireAuth(request);
  if (!allowedRoles.includes(session.role)) throw new Error('Insufficient permissions');
  return session;
}

export async function getActiveView(request?: Request): Promise<'member' | 'admin'> {
  const cookieHeader = request?.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)eriyaden_view=([^;]+)/);
  return match?.[1] === 'admin' ? 'admin' : 'member';
}

export function canSwitchToAdmin(role: string): boolean {
  return ['super_admin', 'editor', 'contributor'].includes(role);
}
