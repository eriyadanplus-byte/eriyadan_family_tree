'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const PreviewInner = dynamic(() => import('@/components/_RelationshipPreviewInner'), { ssr: false });

interface Member { id: string; fullName: string; generation: number; gender?: string; }
interface Props {
  anchorMember: Member; newMemberName: string;
  relationType: 'child' | 'spouse' | 'sibling';
  fatherId?: string; motherId?: string;
}

const ns = (color: string) => ({
  background: `${color}18`, border: `1px solid ${color}50`,
  color: '#E8F5E9', borderRadius: 12, padding: '8px 12px',
  fontSize: 11, fontWeight: 600, width: 150,
});

export default function RelationshipPreview({ anchorMember, newMemberName, relationType }: Props) {
  const { nodes, edges } = useMemo(() => {
    const nodes: any[] = [], edges: any[] = [];
    if (relationType === 'child') {
      nodes.push(
        { id: 'p', position: { x: 160, y: 20  }, data: { label: anchorMember.fullName }, style: ns('#4CAF72') },
        { id: 'c', position: { x: 160, y: 130 }, data: { label: newMemberName || 'New Member' }, style: ns('#C8962E') },
      );
      edges.push({ id: 'e1', source: 'p', target: 'c', style: { stroke: 'rgba(76,175,114,0.50)', strokeWidth: 2 } });
    } else if (relationType === 'spouse') {
      nodes.push(
        { id: 'a', position: { x: 30,  y: 60 }, data: { label: anchorMember.fullName }, style: ns('#4CAF72') },
        { id: 'b', position: { x: 240, y: 60 }, data: { label: newMemberName || 'New Member' }, style: ns('#C8962E') },
      );
      edges.push({ id: 'e1', source: 'a', target: 'b', style: { stroke: 'rgba(200,150,46,0.60)', strokeWidth: 2, strokeDasharray: '5 4' } });
    } else {
      nodes.push(
        { id: 'par', position: { x: 160, y: 0   }, data: { label: `Gen ${anchorMember.generation - 1} Parent` }, style: ns('#81C784') },
        { id: 'a',   position: { x: 30,  y: 110 }, data: { label: anchorMember.fullName }, style: ns('#4CAF72') },
        { id: 'b',   position: { x: 290, y: 110 }, data: { label: newMemberName || 'New Member' }, style: ns('#C8962E') },
      );
      edges.push(
        { id: 'e1', source: 'par', target: 'a', style: { stroke: 'rgba(76,175,114,0.40)' } },
        { id: 'e2', source: 'par', target: 'b', style: { stroke: 'rgba(76,175,114,0.40)' } },
      );
    }
    return { nodes, edges };
  }, [anchorMember, newMemberName, relationType]);

  return (
    <div className="h-44 w-full rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(76,175,114,0.18)', background: 'rgba(13,31,13,0.80)' }}>
      <PreviewInner nodes={nodes} edges={edges} />
    </div>
  );
}
