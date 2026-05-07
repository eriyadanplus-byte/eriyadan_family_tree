'use client';
// Client-only — loaded exclusively via dynamic({ssr:false}) from MobileTree.tsx
import '@xyflow/react/dist/style.css';
import { useEffect } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import EdgeWithLabel from './EdgeWithLabel';

const GEN_COLORS = ['#C8962E','#4CAF72','#81C784','#26A69A','#42A5F5','#AB47BC','#EC407A','#FF7043'];
const genColor = (g: number) => GEN_COLORS[(g - 1) % GEN_COLORS.length];

function MemberNodeCard({ data }: any) {
  const color    = genColor(data.generation ?? 1);
  const label    = typeof data.label === 'string' ? data.label : '';
  const initials = label.trim().split(/\s+/).map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div
      onClick={() => data.onClick?.()}
      className="cursor-pointer"
      style={{ width: 140, minWidth: 140, minHeight: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
    >
      <div style={{
        width: 92, height: 92, borderRadius: '50%',
        background: 'rgba(18,32,18,0.96)',
        border: `2px solid ${data.isLate ? 'rgba(239,83,80,0.40)' : `${color}40`}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)', position: 'relative',
      }}>
        {data.photo ? (
          <img src={data.photo} alt={label}
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.06)' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: `${color}18`, border: `1.5px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 20, color: color,
          }}>{initials}</div>
        )}
        {/* Status dot */}
        <div style={{
          position: 'absolute', top: -4, right: -4, width: 12, height: 12,
          borderRadius: '50%', border: '2px solid #111',
          background: data.isLate ? '#EF5350' : data.isOnline ? '#4CAF50' : '#FF9800',
          boxShadow: data.isLate ? '0 0 6px rgba(239,83,80,0.5)' : data.isOnline ? '0 0 6px rgba(76,175,80,0.5)' : '0 0 6px rgba(255,152,0,0.5)',
        }} />
      </div>

      <div style={{
        width: '100%', marginTop: 8, borderRadius: 22, padding: '10px 12px',
        background: 'rgba(13,31,13,0.92)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11.5, fontWeight: 700, color: '#E8F5E9', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const NODE_TYPES = { member: MemberNodeCard };
const EDGE_TYPES = { labeled: EdgeWithLabel };

interface InnerProps { nodes: any[]; edges: any[]; focusId?: string | null; }

function FitViewEffect({ focusId }: { focusId?: string | null }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = window.setTimeout(() => fitView({ duration: 800, padding: 0.25 }), 100);
    return () => window.clearTimeout(t);
  }, [fitView]);

  useEffect(() => {
    if (focusId) fitView({ nodes: [{ id: focusId }], duration: 600, padding: 0.3 });
  }, [focusId, fitView]);

  useEffect(() => {
    const fn = () => fitView({ duration: 300, padding: 0.25 });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [fitView]);

  return null;
}

function FlowCanvas({ nodes, edges, focusId }: InnerProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ duration: 600, padding: 0.25 }}
        minZoom={0.08}
        maxZoom={2}
        zoomOnPinch={true}
        zoomOnScroll={false}
        panOnScroll={true}
        panOnDrag={true}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        style={{ width: '100%', height: '100%', backgroundColor: '#0D1F0D' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(76,175,114,0.10)" gap={32} />
        <Controls
          showInteractive={false}
          style={{
            background: 'rgba(13,31,13,0.92)',
            border: '1px solid rgba(76,175,114,0.15)',
            borderRadius: 16,
            backdropFilter: 'blur(16px)',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        />
        <FitViewEffect focusId={focusId} />
      </ReactFlow>
    </div>
  );
}

export default function MobileTreeInner({ nodes, edges, focusId }: InnerProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvas nodes={nodes} edges={edges} focusId={focusId} />
    </ReactFlowProvider>
  );
}
