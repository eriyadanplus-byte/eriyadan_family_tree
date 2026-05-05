// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  initDB: vi.fn().mockResolvedValue(undefined),
  getConnection: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn().mockResolvedValue(null),
  rolePermissions: {},
  requireRole: vi.fn(),
}));

import { GET } from '../members/route';
import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

const mockQuery = vi.mocked(query);

const memberRow = (id: number, overrides = {}) => ({
  id,
  full_name: `Member ${id}`,
  mobile_number: `00${id}`,
  email: null,
  generation: 1,
  is_late: 0,
  birth_year: null,
  death_year: null,
  role: null,
  profile_photo_url: null,
  gender: 'male',
  dob: null,
  dod: null,
  location: null,
  bio: null,
  current_role: null,
  company: null,
  instagram: null,
  linkedin: null,
  twitter: null,
  facebook: null,
  youtube: null,
  whatsapp: null,
  father_id: null,
  mother_id: null,
  spouse_id: null,
  is_stub: 0,
  claimed_by_user_id: null,
  added_by_member_id: null,
  avatar_version: 0,
  created_by: null,
  created_via: null,
  created_at: new Date().toISOString(),
  deleted_at: null,
  ...overrides,
});

describe('GET /api/members — spouse join', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('populates spouseId symmetrically from the spouses table', async () => {
    mockQuery
      .mockResolvedValueOnce([memberRow(1), memberRow(2)] as any)
      .mockResolvedValueOnce([{ member_a_id: 1, member_b_id: 2 }] as any);

    const req = new NextRequest('http://localhost:3000/api/members');
    const response = await GET(req);
    const members = await response.json();

    const m1 = members.find((m: any) => m.id === '1');
    const m2 = members.find((m: any) => m.id === '2');

    expect(m1.spouseId).toBe('2');
    expect(m2.spouseId).toBe('1');
  });

  it('leaves spouseId null/undefined when no current spouse exists', async () => {
    mockQuery
      .mockResolvedValueOnce([memberRow(1)] as any)
      .mockResolvedValueOnce([] as any);

    const req = new NextRequest('http://localhost:3000/api/members');
    const response = await GET(req);
    const members = await response.json();

    expect(members[0].spouseId).toBeFalsy();
  });

  it('overrides any stale spouse_id column value with the spouses table lookup', async () => {
    // member has stale spouse_id=99 in column, but spouses table maps it to 2
    mockQuery
      .mockResolvedValueOnce([memberRow(1, { spouse_id: 99 }), memberRow(2)] as any)
      .mockResolvedValueOnce([{ member_a_id: 1, member_b_id: 2 }] as any);

    const req = new NextRequest('http://localhost:3000/api/members');
    const response = await GET(req);
    const members = await response.json();

    const m1 = members.find((m: any) => m.id === '1');
    expect(m1.spouseId).toBe('2');
  });
});
