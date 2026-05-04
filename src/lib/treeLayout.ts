export interface TreeNode {
  id: string;
  fullName: string;
  generation: number;
  isLate: boolean;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  gender?: string;
}

export interface LayoutNode {
  id: string;
  position: { x: number; y: number };
  data: {
    label: string;
    generation: number;
    isLate: boolean;
    gender?: string;
    spouseId?: string;
  };
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  type: 'parent-child' | 'spouse';
  /** Human-readable relationship label shown on the edge */
  label?: string;
}

export interface GenerationLane {
  generation: number;
  y: number;
  label: string;
  count: number;
}

// ─── Relationship label helper ────────────────────
function getRelationLabel(
  parentNode: TreeNode,
  childGeneration: number,
  members: TreeNode[]
): string {
  const genDiff = childGeneration - parentNode.generation;
  const gender  = parentNode.gender;

  if (genDiff === 1) {
    return gender === 'female' ? 'Mother' : 'Father';
  }
  if (genDiff === 2) {
    return gender === 'female' ? 'Grandmother' : 'Grandfather';
  }
  if (genDiff === 3) {
    return gender === 'female' ? 'Great-Grandmother' : 'Great-Grandfather';
  }
  return gender === 'female' ? 'Ancestor (F)' : 'Ancestor (M)';
}

// ─── Main layout function ─────────────────────────
export function computeLayout(
  members: TreeNode[],
  mobile: boolean = false
): { nodes: LayoutNode[]; edges: LayoutEdge[]; lanes: GenerationLane[] } {

    const GEN_HEIGHT  = 220;
    const NODE_W      = 140;
    const NODE_H      = 130;
    const SPOUSE_GAP  = 36;
    const FAMILY_GAP  = 90;

  const nodes:  LayoutNode[]     = [];
  const edges:  LayoutEdge[]     = [];
  const lanes:  GenerationLane[] = [];

  const memberMap = new Map<string, TreeNode>();
  members.forEach(m => memberMap.set(m.id, m));

  // Group by generation
  const genGroups: Record<number, TreeNode[]> = {};
  members.forEach(m => {
    if (!genGroups[m.generation]) genGroups[m.generation] = [];
    genGroups[m.generation].push(m);
  });

  const sortedGens = Object.keys(genGroups).map(Number).sort((a, b) => a - b);
  const minGen     = sortedGens[0] ?? 1;

  // ── Position nodes ──────────────────────────────
  sortedGens.forEach(gen => {
    const genMembers = genGroups[gen];

    if (mobile) {
      // Mobile: vertical stack per generation, generations offset horizontally
      const yStart = 20;
      const xOffset = (gen - minGen) * (NODE_W + 90);
      let currentY = yStart;

      genMembers.forEach((member) => {
        nodes.push({
          id: member.id,
          position: { x: xOffset, y: currentY },
          data: {
            label:      member.fullName,
            generation: member.generation,
            isLate:     member.isLate,
            gender:     member.gender,
            spouseId:   member.spouseId,
          },
        });
        currentY += NODE_H + 32;
      });

      lanes.push({
        generation: gen,
        y: yStart,
        label: `Generation ${gen}`,
        count: genMembers.length,
      });

      // Mobile: create spouse edges within this generation
      genMembers.forEach((m) => {
        if (m.spouseId) {
          const spouseInGen = genMembers.find((gm) => gm.id === m.spouseId);
          if (spouseInGen && m.id < spouseInGen.id) {
            edges.push({
              id: `spouse-${m.id}-${spouseInGen.id}`,
              source: m.id,
              target: spouseInGen.id,
              type: 'spouse',
              label: 'Spouse',
            });
          }
        }
      });
    } else {

    const processed  = new Set<string>();
    const units:      TreeNode[][] = [];

    genMembers.forEach(m => {
      if (processed.has(m.id)) return;
      const spouseInGen = m.spouseId && genMembers.find(gm => gm.id === m.spouseId);
      if (spouseInGen && !processed.has(spouseInGen.id)) {
        const pair = m.gender === 'male' ? [m, spouseInGen] :
                       spouseInGen.gender === 'male' ? [spouseInGen, m] : [m, spouseInGen];
        units.push(pair);
        processed.add(m.id);
        processed.add(spouseInGen.id);
      } else {
        units.push([m]);
        processed.add(m.id);
      }
    });

    // Calculate total width for centering
    const totalWidth = units.reduce((sum, u) => {
      return sum + (u.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W);
    }, 0) + Math.max(0, units.length - 1) * FAMILY_GAP;

    let cx = -totalWidth / 2;
    const y = (gen - minGen) * GEN_HEIGHT + 100;

    units.forEach(unit => {
      const uw     = unit.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W;
      const center = cx + uw / 2;

      unit.forEach((member, idx) => {
        const xOff = unit.length === 2
          ? (idx === 0 ? -(NODE_W / 2 + SPOUSE_GAP / 2) : (NODE_W / 2 + SPOUSE_GAP / 2))
          : 0;

        nodes.push({
          id: member.id,
          position: { x: center + xOff, y },
          data: {
            label:      member.fullName,
            generation: member.generation,
            isLate:     member.isLate,
            gender:     member.gender,
            spouseId:   member.spouseId,
          },
        });
      });

      // Spouse edge
      if (unit.length === 2) {
        edges.push({
          id:     `spouse-${unit[0].id}-${unit[1].id}`,
          source: unit[0].id,
          target: unit[1].id,
          type:   'spouse',
          label:  'Spouse',
        });
      }

      cx += uw + FAMILY_GAP;
    });

    lanes.push({
      generation: gen,
      y,
      label: `Generation ${gen}`,
      count: genMembers.length,
    });
    }
  });

  // ── Parent-child edges with labels ──────────────
  const addedEdges = new Set<string>();

  members.forEach(child => {
    const fatherId = child.fatherId ? String(child.fatherId) : null;
    const motherId = child.motherId ? String(child.motherId) : null;
    const bothParentsInTree = fatherId && memberMap.has(fatherId) && motherId && memberMap.has(motherId);

    // When both parents exist in tree, create only ONE edge from father;
    // the render code will draw from couple midpoint. Otherwise use whichever parent exists.
    let sourceParentId: string | null = null;
    if (bothParentsInTree) {
      sourceParentId = fatherId;
    } else if (fatherId && memberMap.has(fatherId)) {
      sourceParentId = fatherId;
    } else if (motherId && memberMap.has(motherId)) {
      sourceParentId = motherId;
    }

    if (!sourceParentId) return;

    const edgeKey = `${sourceParentId}->${child.id}`;
    if (addedEdges.has(edgeKey)) return;
    addedEdges.add(edgeKey);

    const parentNode = memberMap.get(sourceParentId)!;
    const spouseEdge = edges.find(
      e => e.type === 'spouse' && (e.source === sourceParentId || e.target === sourceParentId)
    );

    // Use source parent as the edge source; render will detect spouse and draw from midpoint
    let sourceId = sourceParentId;

    const edgeId = `pc-${sourceId}-${child.id}`;
    if (edges.some(e => e.id === edgeId)) return;

    const genDiff = child.generation - parentNode.generation;
    const label = bothParentsInTree && genDiff === 1 ? 'Parents' : getRelationLabel(parentNode, child.generation, members);

    edges.push({
      id:     edgeId,
      source: sourceId,
      target: child.id,
      type:   'parent-child',
      label,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const pcCount = edges.filter(e => e.type === 'parent-child').length;
    const spouseCount = edges.filter(e => e.type === 'spouse').length;
    const bothParentLabels = edges.filter(e => e.type === 'parent-child' && e.label === 'Parents').length;
    console.log('[treeLayout] nodes:', nodes.length, 'spouse edges:', spouseCount, 'parent-child edges:', pcCount, 'Parents labels:', bothParentLabels);

    // Verbose diagnostics — enable with: localStorage.debug_tree = '1'
    if (typeof window !== 'undefined' && window.localStorage?.getItem('debug_tree') === '1') {
      const memberIds = new Set(members.map(m => String(m.id)));
      members.forEach(m => {
        const f = m.fatherId ? String(m.fatherId) : null;
        const mo = m.motherId ? String(m.motherId) : null;
        const hasFather = f && memberIds.has(f);
        const hasMother = mo && memberIds.has(mo);
        if (f || mo) {
          console.log(`[treeLayout] member ${m.fullName} (id=${m.id}, gen=${m.generation}) father=${f} found=${hasFather} mother=${mo} found=${hasMother}`);
        }
      });
      const orphans = members.filter(m => {
        const f = m.fatherId ? String(m.fatherId) : null;
        const mo = m.motherId ? String(m.motherId) : null;
        return (f && !memberIds.has(f)) || (mo && !memberIds.has(mo));
      });
      if (orphans.length) {
        console.log('[treeLayout] members with missing parents (filtered out or not in data):', orphans.map(o => o.fullName));
      }
    }
  }

  return { nodes, edges, lanes };
}
