import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export interface SessionUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'contributor' | 'viewer';
  memberId: string | null;
  canApprove?: boolean;
  name?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const SALT_ROUNDS = 10;

// Production guard: prevent accidental use of the default dev secret
if (JWT_SECRET === 'dev-secret-change-in-production' && process.env.NODE_ENV === 'production') {
  throw new Error(
    'FATAL: JWT_SECRET is set to the insecure default value in production. ' +
    'Set a strong random JWT_SECRET environment variable before starting the server.'
  );
}

// Role permissions
export const rolePermissions = {
  super_admin: {
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canManageUsers: true,
  },
  editor: {
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canExport: false,
    canManageUsers: false,
  },
  contributor: {
    canAdd: true,
    canEdit: true,
    canDelete: false,
    canExport: false,
    canManageUsers: false,
  },
  viewer: {
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canManageUsers: false,
  },
};

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

// Create JWT token
export async function createToken(payload: { id: string; email: string; role: string; memberId?: string | null; canApprove?: boolean }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

// Verify JWT token
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
    };
  } catch {
    return null;
  }
}

// Get current session
export async function getSession(): Promise<SessionUser | null> {
  const sessionCookie = (await cookies()).get('session');

  if (!sessionCookie?.value) {
    return null;
  }

  return await verifyToken(sessionCookie.value);
}

// Check if user has permission
export async function hasPermission(permission: keyof typeof rolePermissions['super_admin']): Promise<boolean> {
  const session = await getSession();

  if (!session) {
    return false;
  }

  return rolePermissions[session.role]?.[permission] ?? false;
}

// Require authentication
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();

  if (!session) {
    throw new Error('Authentication required');
  }

  return session;
}

// Require specific role
export async function requireRole(allowedRoles: SessionUser['role'][]): Promise<SessionUser> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role)) {
    throw new Error('Insufficient permissions');
  }

  return session;
}

// Get active view from cookie
export async function getActiveView(): Promise<'member' | 'admin'> {
  const viewCookie = (await cookies()).get('eriyaden_view');
  return (viewCookie?.value === 'admin' ? 'admin' : 'member') as 'member' | 'admin';
}

// Check if user can switch to admin view
export function canSwitchToAdmin(role: string): boolean {
  return ['super_admin', 'editor', 'contributor'].includes(role);
}
