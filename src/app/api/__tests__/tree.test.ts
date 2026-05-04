// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/mysql-db', () => ({
  query: vi.fn(),
  initDB: vi.fn().mockResolvedValue(undefined),
  getConnection: vi.fn(),
}));

import { GET } from '../tree/route';
import { NextRequest } from 'next/server';
import { query } from '@/lib/mysql-db';

const mockQuery = vi.mocked(query);

const memberRow = (id: number, overrides = {}) => ({
  id,
  full_name: `Member ${id}`,
  generation: 1,
  is_late: 0,
  is_stub: 0,
  gender: 'male',
  profile_photo_url: null,
  avatar_version: 0,
  father_id: null,
  mother_id: null,
  mobile_number: `00${id}`,
  email: null,
  location: null,
  dob: null,
  ...overrides,
});

describe('GET /api/tree — spouse join', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('populates spouseId symmetrically for a current spouse pair', async () => {
    mockQuery
      .mockResolvedValueOnce([memberRow(1, { gender: 'male' }), memberRow(2, { gender: 'female' })] as any)
      .mockResolvedValueOnce([{ member_a_id: 1, member_b_id: 2, status: 'current' }] as any);

    const req = new NextRequest('http://localhost:3000/api/tree');
    const response = await GET(req);
    const data = await response.json();

    const gen1 = data.generations[1] as any[];
    const alice = gen1.find((m: any) => m.id === '1');
    const bob = gen1.find((m: any) => m.id === '2');

    expect(alice.spouseId).toBe('2');
    expect(bob.spouseId).toBe('1');
  });

  it('leaves spouseId null when no spouse rows are returned', async () => {
    mockQuery
      .mockResolvedValueOnce([memberRow(1)] as any)
      .mockResolvedValueOnce([] as any);

    const req = new NextRequest('http://localhost:3000/api/tree');
    const response = await GET(req);
    const data = await response.json();

    const gen1 = data.generations[1] as any[];
    expect(gen1[0].spouseId).toBeNull();
  });

  it('also exposes a spouseMap in the response root', async () => {
    mockQuery
      .mockResolvedValueOnce([memberRow(1), memberRow(2)] as any)
      .mockResolvedValueOnce([{ member_a_id: 1, member_b_id: 2, status: 'current' }] as any);

    const req = new NextRequest('http://localhost:3000/api/tree');
    const response = await GET(req);
    const data = await response.json();

    expect(data.spouseMap['1']).toBe('2');
    expect(data.spouseMap['2']).toBe('1');
  });
});
