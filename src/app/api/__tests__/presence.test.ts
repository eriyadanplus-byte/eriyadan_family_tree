// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  initDB: vi.fn().mockResolvedValue(undefined),
  getConnection: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

import { POST, GET } from '../presence/route';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

const mockGetSession = vi.mocked(getSession);
const mockQuery = vi.mocked(query);

describe('POST /api/presence — UUID validation', () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockQuery.mockReset();
  });

  it('rejects requests without a session', async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost:3000/api/presence'));
    expect(response.status).toBe(401);
    expect(await response.text()).toBe('Unauthorized');
  });

  it('rejects invalid UUID session IDs with 400', async () => {
    mockGetSession.mockResolvedValue({ id: '1', email: 'test@test.com', role: 'viewer' } as any);

    const response = await POST(new Request('http://localhost:3000/api/presence'));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid session ID format');
  });

  it('rejects non-UUID strings like "abc" with 400', async () => {
    mockGetSession.mockResolvedValue({ id: 'abc', email: 'test@test.com', role: 'viewer' } as any);

    const response = await POST(new Request('http://localhost:3000/api/presence'));
    expect(response.status).toBe(400);
  });

  it('accepts valid UUID v4 format', async () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    mockGetSession.mockResolvedValue({ id: validUUID, email: 'test@test.com', role: 'viewer' } as any);
    mockQuery.mockResolvedValue({ affectedRows: 1 });

    const response = await POST(new Request('http://localhost:3000/api/presence'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET last_seen'),
      expect.arrayContaining([validUUID])
    );
  });

  it('accepts uppercase UUID', async () => {
    const uppercaseUUID = '550E8400-E29B-41D4-A716-446655440000';
    mockGetSession.mockResolvedValue({ id: uppercaseUUID, email: 'test@test.com', role: 'viewer' } as any);
    mockQuery.mockResolvedValue({ affectedRows: 1 });

    const response = await POST(new Request('http://localhost:3000/api/presence'));
    expect(response.status).toBe(200);
  });

  it('rejects malformed UUID patterns', async () => {
    const invalidUUIDs = [
      '550e8400-e29b-41d4-a716-44665544000',  // too short
      '550e8400-e29b-41d4-a716-44665544000g', // invalid char
      '550e8400e29b41d4a716446655440000',     // no hyphens
      'not-a-uuid-at-all',                      // completely invalid
    ];

    for (const invalidUUID of invalidUUIDs) {
      mockGetSession.mockResolvedValue({ id: invalidUUID, email: 'test@test.com', role: 'viewer' } as any);
      const response = await POST(new Request('http://localhost:3000/api/presence'));
      expect(response.status).toBe(400);
    }
  });
});

describe('GET /api/presence — online users', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns array of online member IDs from last_seen check', async () => {
    mockQuery.mockResolvedValue([
      { member_id: 'abc-123-uuid-1' },
      { member_id: 'def-456-uuid-2' },
    ] as any);

    const response = await GET(new Request('http://localhost:3000/api/presence'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(['abc-123-uuid-1', 'def-456-uuid-2']);
  });

  it('returns empty array when no users are online', async () => {
    mockQuery.mockResolvedValue([] as any);

    const response = await GET(new Request('http://localhost:3000/api/presence'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it('converts member_id to string', async () => {
    mockQuery.mockResolvedValue([
      { member_id: 123 }, // numeric from some DBs
    ] as any);

    const response = await GET(new Request('http://localhost:3000/api/presence'));
    const data = await response.json();
    expect(typeof data[0]).toBe('string');
  });
});
