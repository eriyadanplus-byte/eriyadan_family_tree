import { describe, it, expect } from 'vitest';
import { computeLayout, TreeNode } from '../treeLayout';

const baseNode = (overrides: Partial<TreeNode> & { id: string; generation: number }): TreeNode => ({
  fullName: `Member ${overrides.id}`,
  isLate: false,
  ...overrides,
});

describe('computeLayout — spouse edges', () => {
  describe('mobile mode', () => {
    it('generates a spouse edge when two members in the same generation are married', () => {
      const members: TreeNode[] = [
        baseNode({ id: '1', generation: 1, spouseId: '2', gender: 'male' }),
        baseNode({ id: '2', generation: 1, spouseId: '1', gender: 'female' }),
      ];

      const { edges } = computeLayout(members, true);
      const spouseEdges = edges.filter(e => e.type === 'spouse');

      expect(spouseEdges).toHaveLength(1);
      expect(spouseEdges[0].id).toBe('spouse-1-2');
      expect(spouseEdges[0].source).toBe('1');
      expect(spouseEdges[0].target).toBe('2');
      expect(spouseEdges[0].label).toBe('Spouse');
    });

    it('deduplicates — only one edge per couple (lower id is source)', () => {
      // Both members reference each other; should produce exactly 1 edge
      const members: TreeNode[] = [
        baseNode({ id: '10', generation: 1, spouseId: '20', gender: 'female' }),
        baseNode({ id: '20', generation: 1, spouseId: '10', gender: 'male' }),
      ];

      const { edges } = computeLayout(members, true);
      expect(edges.filter(e => e.type === 'spouse')).toHaveLength(1);
    });

    it('produces no spouse edges when spouseId is null/undefined (original bug)', () => {
      const members: TreeNode[] = [
        baseNode({ id: '1', generation: 1 }),    // spouseId undefined
        baseNode({ id: '2', generation: 1 }),
      ];

      const { edges } = computeLayout(members, true);
      expect(edges.filter(e => e.type === 'spouse')).toHaveLength(0);
    });

    it('does not create a spouse edge for a spouse in a different generation', () => {
      const members: TreeNode[] = [
        baseNode({ id: '1', generation: 1, spouseId: '2' }),
        baseNode({ id: '2', generation: 2, spouseId: '1' }), // different gen
      ];

      const { edges } = computeLayout(members, true);
      // spouseInGen lookup only finds members in the same generation
      expect(edges.filter(e => e.type === 'spouse')).toHaveLength(0);
    });
  });

  describe('desktop mode', () => {
    it('generates a spouse edge for a couple unit', () => {
      const members: TreeNode[] = [
        baseNode({ id: '1', generation: 1, spouseId: '2', gender: 'male' }),
        baseNode({ id: '2', generation: 1, spouseId: '1', gender: 'female' }),
      ];

      const { edges } = computeLayout(members, false);
      const spouseEdges = edges.filter(e => e.type === 'spouse');

      expect(spouseEdges).toHaveLength(1);
      expect(spouseEdges[0].type).toBe('spouse');
      // The male member is placed first in the unit
      expect(spouseEdges[0].source).toBe('1');
      expect(spouseEdges[0].target).toBe('2');
    });

    it('produces no spouse edges when spouseId is null/undefined (original bug)', () => {
      const members: TreeNode[] = [
        baseNode({ id: '1', generation: 1 }),
        baseNode({ id: '2', generation: 1 }),
      ];

      const { edges } = computeLayout(members, false);
      expect(edges.filter(e => e.type === 'spouse')).toHaveLength(0);
    });

    it('handles a solo member without throwing', () => {
      const members: TreeNode[] = [
        baseNode({ id: '1', generation: 1 }),
      ];

      expect(() => computeLayout(members, false)).not.toThrow();
      const { edges } = computeLayout(members, false);
      expect(edges.filter(e => e.type === 'spouse')).toHaveLength(0);
    });

    it('correctly pairs male-first regardless of array order', () => {
      // female before male in the input array
      const members: TreeNode[] = [
        baseNode({ id: '2', generation: 1, spouseId: '1', gender: 'female' }),
        baseNode({ id: '1', generation: 1, spouseId: '2', gender: 'male' }),
      ];

      const { edges } = computeLayout(members, false);
      const spouseEdge = edges.find(e => e.type === 'spouse');
      expect(spouseEdge).toBeDefined();
      // Male (id:1) should be source
      expect(spouseEdge!.source).toBe('1');
      expect(spouseEdge!.target).toBe('2');
    });
  });

  describe('parent-child edges (for mobile midpoint calculation)', () => {
    it('creates parent-child edges with label "Parents" when both parents exist', () => {
      const members: TreeNode[] = [
        baseNode({ id: 'father-1', generation: 1, gender: 'male' }),
        baseNode({ id: 'mother-1', generation: 1, gender: 'female' }),
        baseNode({ id: 'child-1', generation: 2, fatherId: 'father-1', motherId: 'mother-1' }),
      ];

      const { edges } = computeLayout(members, true);
      const parentEdges = edges.filter(e => e.type === 'parent-child' && e.label === 'Parents');

      expect(parentEdges).toHaveLength(1);
      expect(parentEdges[0].source).toBe('father-1');
      expect(parentEdges[0].target).toBe('child-1');
      expect(parentEdges[0].label).toBe('Parents');
    });

    it('creates parent edges with both parent IDs available for midpoint calculation', () => {
      const members: TreeNode[] = [
        baseNode({ id: 'f', generation: 1, gender: 'male' }),
        baseNode({ id: 'm', generation: 1, gender: 'female' }),
        baseNode({ id: 'c', generation: 2, fatherId: 'f', motherId: 'm' }),
      ];

      const { edges, nodes } = computeLayout(members, true);
      const childNode = nodes.find(n => n.id === 'c');
      const fatherNode = nodes.find(n => n.id === 'f');
      const motherNode = nodes.find(n => n.id === 'm');

      // Verify nodes have positions for mobile layout
      expect(childNode).toBeDefined();
      expect(fatherNode).toBeDefined();
      expect(motherNode).toBeDefined();
      expect(childNode!.position).toBeDefined();
      expect(fatherNode!.position).toBeDefined();
      expect(motherNode!.position).toBeDefined();
    });

    it('creates parent-child edges with father source when only father exists', () => {
      const members: TreeNode[] = [
        baseNode({ id: 'father-1', generation: 1, gender: 'male' }),
        baseNode({ id: 'child-1', generation: 2, fatherId: 'father-1', motherId: undefined }),
      ];

      const { edges } = computeLayout(members, true);
      const parentEdges = edges.filter(e => e.type === 'parent-child');

      expect(parentEdges.length).toBeGreaterThan(0);
      const fatherEdge = parentEdges.find(e => e.source === 'father-1' && e.target === 'child-1');
      expect(fatherEdge).toBeDefined();
    });

    it('creates parent-child edges with mother source when only mother exists', () => {
      const members: TreeNode[] = [
        baseNode({ id: 'mother-1', generation: 1, gender: 'female' }),
        baseNode({ id: 'child-1', generation: 2, fatherId: undefined, motherId: 'mother-1' }),
      ];

      const { edges } = computeLayout(members, true);
      const parentEdges = edges.filter(e => e.type === 'parent-child');

      expect(parentEdges.length).toBeGreaterThan(0);
      const motherEdge = parentEdges.find(e => e.source === 'mother-1' && e.target === 'child-1');
      expect(motherEdge).toBeDefined();
    });
  });
});
