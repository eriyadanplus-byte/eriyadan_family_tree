'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { computeLayout } from '@/lib/treeLayout';
import { Position } from '@xyflow/react';

// Load ReactFlow tree inside browser only (no SSR — avoids hydration issues)
const MobileTreeInner = dynamic(() => import('./MobileTreeInner'), { ssr: false });

interface Props { members: any[]; focusId?: string | null; onMemberClick?: (m: any) => void; }

export default function MobileTree({ members, focusId, onMemberClick }: Props) {
  const { rfNodes, rfEdges } = useMemo(() => {
    if (!members.length) return { rfNodes: [], rfEdges: [] };

    const treeNodes = members.map((m: any) => ({
      id: m.id,
      fullName: m.fullName,
      generation: m.generation,
      isLate: m.isLate,
      fatherId: m.fatherId,
      motherId: m.motherId,
      spouseId: m.spouseId,
      gender: m.gender,
    }));

    const { nodes, edges } = computeLayout(treeNodes, true);

    // Member lookup for extra fields (photo, isOnline, etc.)
    const memberMap = new Map(members.map((m: any) => [m.id, m]));

    const rfNodes = nodes.map((n) => {
      const member = memberMap.get(n.id);
      return {
        id: n.id,
        type: 'member',
        position: n.position,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        data: {
          label: n.data.label,
          generation: n.data.generation,
          isLate: n.data.isLate,
          gender: n.data.gender,
          isOnline: member?.isOnline ?? false,
          photo: member?.profilePhotoUrl
            ? `${member.profilePhotoUrl}?v=${member.avatarVersion || 0}`
            : undefined,
          onClick: member ? () => onMemberClick?.(member) : undefined,
        },
      };
    });

    const rfEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'labeled',
      label: e.label ?? '',
      data: { edgeType: e.type },
    }));

    return { rfNodes, rfEdges };
  }, [members, onMemberClick]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MobileTreeInner nodes={rfNodes} edges={rfEdges} focusId={focusId} />
    </div>
  );
}
