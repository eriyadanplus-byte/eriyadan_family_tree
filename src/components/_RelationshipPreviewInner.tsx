'use client';

// Client-only — loaded exclusively via dynamic() from RelationshipPreview.tsx
import { ReactFlow } from '@xyflow/react';

interface Props { nodes: any[]; edges: any[]; }

export default function RelationshipPreviewInner({ nodes, edges }: Props) {
  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      style={{ background: 'transparent' }}
    />
  );
}
