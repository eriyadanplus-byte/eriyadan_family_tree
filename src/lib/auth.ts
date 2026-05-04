import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
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

// Create JWT token
export function createToken(payload: { id: string; email: string; role: string; memberId?: string | null; canApprove?: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser & { exp: number };
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      memberId: decoded.memberId,
      canApprove: decoded.canApprove,
      name: decoded.name,
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

  return verifyToken(sessionCookie.value);
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
