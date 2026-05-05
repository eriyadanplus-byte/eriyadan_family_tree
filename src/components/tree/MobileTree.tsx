'use client';

import { useMemo, useEffect, useRef } from 'react';
import { computeLayout } from '@/lib/treeLayout';

const GEN_COLORS = ['#C8962E','#4CAF72','#81C784','#26A69A','#42A5F5','#AB47BC','#EC407A','#FF7043'];
export const genColor = (g: number) => GEN_COLORS[(g - 1) % GEN_COLORS.length];

interface Props { members: any[]; focusId?: string | null; onMemberClick?: (m: any) => void; }

const NODE_WIDTH = 148;
const NODE_HEIGHT = 118;
const PADDING = 28;

export default function MobileTree({ members, focusId, onMemberClick }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => {
    const nodes = members.map((m: any) => ({
      id: m.id,
      position: { x: 0, y: 0 },
      data: {
        label: m.fullName,
        generation: m.generation,
        isLate: m.isLate,
        gender: m.gender,
        spouseId: m.spouseId,
      },
    }));
    const { nodes: pos, edges } = computeLayout(
      members.map((m: any) => ({
        id: m.id,
        fullName: m.fullName,
        generation: m.generation,
        isLate: m.isLate,
        fatherId: m.fatherId,
        motherId: m.motherId,
        spouseId: m.spouseId,
        gender: m.gender,
      })),
      true
    );

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    pos.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.position.y + NODE_HEIGHT);
    });

    if (!pos.length) {
      minX = 0;
      minY = 0;
      maxX = NODE_WIDTH;
      maxY = NODE_HEIGHT;
    }

    const width = Math.max(maxX - minX + PADDING * 2, NODE_WIDTH + PADDING * 2);
    const height = Math.max(maxY - minY + PADDING * 2, NODE_HEIGHT + PADDING * 2);
    const offsetX = PADDING - minX;
    const offsetY = PADDING - minY;

    return { nodes: pos, edges, width, height, offsetX, offsetY };
  }, [members]);

  // Scroll the focused node into view when focusId changes
  useEffect(() => {
    if (!focusId || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector(`[data-member-id="${focusId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }, [focusId]);

  const findNode = (id: string) => layout.nodes.find((node) => node.id === id);

  function getEdgeEndpoints(edge: typeof layout.edges[0], source: typeof layout.nodes[0], target: typeof layout.nodes[0]) {
    const sx = source.position.x + layout.offsetX + NODE_WIDTH / 2;
    const sy = source.position.y + layout.offsetY + NODE_HEIGHT / 2;
    const tx = target.position.x + layout.offsetX + NODE_WIDTH / 2;
    const ty = target.position.y + layout.offsetY + NODE_HEIGHT / 2;

    if (edge.type === 'parent-child' && edge.label === 'Parents') {
      const child = members.find((m: any) => m.id === edge.target);
      if (child?.fatherId && child?.motherId) {
        const fatherNode = findNode(String(child.fatherId));
        const motherNode = findNode(String(child.motherId));
        if (fatherNode && motherNode) {
          const fatherX = fatherNode.position.x + layout.offsetX + NODE_WIDTH / 2;
          const fatherY = fatherNode.position.y + layout.offsetY + NODE_HEIGHT / 2;
          const motherX = motherNode.position.x + layout.offsetX + NODE_WIDTH / 2;
          const motherY = motherNode.position.y + layout.offsetY + NODE_HEIGHT / 2;
          return {
            x1: (fatherX + motherX) / 2,
            y1: (fatherY + motherY) / 2,
            x2: tx,
            y2: ty,
          };
        }
      }
    }

    return { x1: sx, y1: sy, x2: tx, y2: ty };
  }

  return (
    <div ref={scrollContainerRef} className="w-full h-full overflow-auto py-4 px-3">
      <div className="relative min-h-full" style={{ minWidth: layout.width, minHeight: layout.height }}>
        {/* SVG edges rendered first so nodes appear on top */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: layout.width, height: layout.height }}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {layout.edges.map((edge) => {
            const source = findNode(edge.source);
            const target = findNode(edge.target);
            if (!source || !target) return null;
            const { x1, y1, x2, y2 } = getEdgeEndpoints(edge, source, target);
            const isSpouse = edge.type === 'spouse';
            return (
              <line
                key={edge.id}
                data-edge-type={edge.type}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isSpouse ? 'rgba(200,150,46,0.88)' : 'rgba(76,175,114,0.82)'}
                strokeWidth={isSpouse ? 2.5 : 2}
                strokeDasharray={isSpouse ? '6 4' : undefined}
              />
            );
          })}
        </svg>

        {layout.nodes.map((node) => {
          const isFocused = focusId === node.id;
          const member = members.find((m: any) => m.id === node.id);
          const initials = (node.data.label as string).split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
          const hasPhoto = member?.profilePhotoUrl || member?.photoUrl;
          return (
            <button
              key={node.id}
              data-member-id={node.id}
              type="button"
              onClick={() => onMemberClick?.(member)}
              className={`absolute rounded-3xl border bg-[#0F210F] p-4 text-left shadow-xl transition-all ${
                isFocused ? 'border-emerald-400/70 shadow-emerald-500/20 animate-focus-ring' : 'border-white/10 hover:border-emerald-400/30'
              }`}
              style={{
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                left: node.position.x + layout.offsetX,
                top: node.position.y + layout.offsetY,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                {hasPhoto ? (
                  <img
                    src={`${member?.profilePhotoUrl || member?.photoUrl}?v=${member?.avatarVersion || 0}`}
                    alt={node.data.label as string}
                    className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border border-white/10"
                    style={{ background: `${genColor(node.data.generation)}22` }}
                  >
                    <span className="text-[10px] font-bold text-white/85">{initials}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{node.data.label}</p>
                  <p className="text-[11px] text-white/50 truncate">
                    {node.data.gender ? `${node.data.gender.charAt(0).toUpperCase()}${node.data.gender.slice(1)}` : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>{node.data.isLate ? 'Deceased' : 'Living'}</span>
                <span style={{ color: genColor(node.data.generation) }}>Gen {node.data.generation}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
