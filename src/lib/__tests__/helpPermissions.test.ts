// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/mysql-db', () => ({
  query: vi.fn(),
  initDB: vi.fn().mockResolvedValue(undefined),
  getConnection: vi.fn(),
}));

import { canViewHandlerInbox, canAccessThread, type HelpThread } from '../help/permissions';
import type { SessionUser } from '../auth';
import { query } from '@/lib/mysql-db';

const mockQuery = vi.mocked(query);

const adminUser: SessionUser = { id: '1', email: 'admin@test.com', role: 'super_admin', memberId: null };
const editorUser: SessionUser = { id: '2', email: 'editor@test.com', role: 'editor', memberId: null };
const viewerUser: SessionUser = { id: '3', email: 'viewer@test.com', role: 'viewer', memberId: null };

const thread: HelpThread = { id: 10, assigned_handler_id: null, user_id: 99, anon_token_hash: null, status: 'open' };
const threadAssignedToEditor: HelpThread = { ...thread, assigned_handler_id: 2 };

beforeEach(() => mockQuery.mockReset());

describe('canViewHandlerInbox', () => {
  it('returns true for super_admin without any DB query', async () => {
    const result = await canViewHandlerInbox(adminUser);
    expect(result).toBe(true);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns true for editor with active grant', async () => {
    mockQuery.mockResolvedValueOnce([{ 1: 1 }] as any); // row exists
    expect(await canViewHandlerInbox(editorUser)).toBe(true);
  });

  it('returns false for editor without active grant', async () => {
    mockQuery.mockResolvedValueOnce([] as any); // no row
    expect(await canViewHandlerInbox(editorUser)).toBe(false);
  });

  it('returns false for viewer role', async () => {
    expect(await canViewHandlerInbox(viewerUser)).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('canAccessThread', () => {
  it('super_admin can access any thread', async () => {
    expect(await canAccessThread(adminUser, thread)).toBe(true);
  });

  it('editor with global grant can access unassigned thread', async () => {
    mockQuery.mockResolvedValueOnce([{ 1: 1 }] as any); // active grant exists
    expect(await canAccessThread(editorUser, thread)).toBe(true);
  });

  it('editor without global grant can access thread assigned to them', async () => {
    mockQuery.mockResolvedValueOnce([] as any); // no global grant
    expect(await canAccessThread(editorUser, threadAssignedToEditor)).toBe(true);
  });

  it('editor without global grant cannot access thread not assigned to them', async () => {
    mockQuery.mockResolvedValueOnce([] as any); // no global grant
    const otherThread: HelpThread = { ...thread, assigned_handler_id: 999 };
    expect(await canAccessThread(editorUser, otherThread)).toBe(false);
  });

  it('viewer cannot access any thread', async () => {
    expect(await canAccessThread(viewerUser, thread)).toBe(false);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
