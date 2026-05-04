'use client';
// Client-only — loaded exclusively via dynamic({ssr:false}) from MobileTree.tsx
import { useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';

const GEN_COLORS = ['#C8962E','#4CAF72','#81C784','#26A69A','#42A5F5','#AB47BC','#EC407A','#FF7043'];
const genColor = (g: number) => GEN_COLORS[(g - 1) % GEN_COLORS.length];

function MemberNodeCard({ data }: any) {
  const color    = genColor(data.generation ?? 1);
  const label    = typeof data.label === 'string' ? data.label : '';
  const initials = label.trim().split(/\s+/).map((w: string) => w[0] ?? '').join('').slice(0,2).toUpperCase() || '?';

  return (
    <div onClick={() => data.onClick?.()} className="cursor-pointer"
      style={{
        width: 140,
        minWidth: 140,
        minHeight: 130,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}>

      <div style={{
        width: 92,
        height: 92,
        borderRadius: '50%',
        background: 'rgba(18,32,18,0.96)',
        border: `2px solid ${data.isLate ? 'rgba(239,83,80,0.40)' : `${color}40`}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
        position: 'relative',
      }}>
        {data.photo ? (
          <img src={data.photo} alt={label}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(255,255,255,0.06)',
            }} />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: `${color}18`,
            border: `1.5px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 20,
            color: color,
          }}>{initials}</div>
        )}
        {/* LED Status Indicator */}
        <div style={{
          position: 'absolute', top: -4, right: -4, width: 12, height: 12,
          borderRadius: '50%', border: '2px solid #111',
          background: data.isLate ? '#EF5350' : data.isOnline ? '#4CAF50' : '#FF9800',
          boxShadow: data.isLate ? '0 0 6px rgba(239,83,80,0.5)' : 
                     data.isOnline ? '0 0 6px rgba(76,175,80,0.5)' : 
                     '0 0 6px rgba(255,152,0,0.5)',
        }} title={data.isLate ? 'Deceased' : data.isOnline ? 'Online' : 'Offline (inactive > 10 min)'} />
      </div>

      <div style={{
        width: '100%',
        marginTop: 8,
        borderRadius: 22,
        padding: '10px 12px',
        background: 'rgba(13,31,13,0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: '#E8F5E9',
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const NODE_TYPES = { member: MemberNodeCard };

interface InnerProps { nodes: any[]; edges: any[]; focusId?: string | null; }

function FitViewEffect({ focusId }: { focusId?: string | null }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    // Always fit view on load to make tree visible
    const timer = window.setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [fitView]);

  useEffect(() => {
    if (focusId) {
      fitView({ nodes: [{ id: focusId }], duration: 600, padding: 0.2 });
    }
  }, [focusId, fitView]);

  useEffect(() => {
    const handleResize = () => fitView({ duration: 300, padding: 0.2 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitView]);

  return null;
}

function FlowCanvas({ nodes, edges, focusId }: InnerProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ duration: 600, padding: 0.2 }}
        minZoom={0.1} maxZoom={2}
        nodesDraggable={false} nodesConnectable={false}
        style={{ width: '100%', height: '100%', backgroundColor: '#0D1F0D' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(76,175,114,0.15)" gap={24} />
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
