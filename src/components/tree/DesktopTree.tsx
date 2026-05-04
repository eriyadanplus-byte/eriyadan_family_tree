'use client';

import { useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Users } from 'lucide-react';
import { computeLayout } from '@/lib/treeLayout';

interface Props {
  members: any[];
  selectedMember: any;
  focusId?: string | null;
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
  onMemberClick: (m: any) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

const NODE_W = 140;
const NODE_H = 130;

// Stitch reference palette — warm tones matching the design mockups
const GEN_COLORS: Record<number, { bg: string; border: string; text: string; avatar: string }> = {
  1: { bg: 'rgba(200,150,46,0.10)',  border: 'rgba(200,150,46,0.40)', text: '#E6B84A', avatar: 'rgba(200,150,46,0.20)' },
  2: { bg: 'rgba(76,175,114,0.10)',  border: 'rgba(76,175,114,0.40)', text: '#81C784', avatar: 'rgba(76,175,114,0.20)' },
  3: { bg: 'rgba(38,166,154,0.10)',  border: 'rgba(38,166,154,0.40)', text: '#4DB6AC', avatar: 'rgba(38,166,154,0.20)' },
  4: { bg: 'rgba(66,165,245,0.10)',  border: 'rgba(66,165,245,0.40)', text: '#64B5F6', avatar: 'rgba(66,165,245,0.20)' },
  5: { bg: 'rgba(171,71,188,0.10)',  border: 'rgba(171,71,188,0.40)', text: '#CE93D8', avatar: 'rgba(171,71,188,0.20)' },
  6: { bg: 'rgba(236,64,122,0.10)',  border: 'rgba(236,64,122,0.40)', text: '#F48FB1', avatar: 'rgba(236,64,122,0.20)' },
  7: { bg: 'rgba(255,112,67,0.10)',  border: 'rgba(255,112,67,0.40)', text: '#FFAB91', avatar: 'rgba(255,112,67,0.20)' },
};

const LATE = { bg: 'rgba(239,83,80,0.08)', border: 'rgba(239,83,80,0.30)', text: '#EF5350', avatar: 'rgba(239,83,80,0.15)' };

function getGenStyle(gen: number, isLate: boolean) {
  if (isLate) return LATE;
  return GEN_COLORS[gen] ?? GEN_COLORS[2];
}

export default function DesktopTree({
  members, zoom, pan, isDragging, focusId,
  onMemberClick, onZoomIn, onZoomOut, onFitToScreen,
  onMouseDown, onMouseMove, onMouseUp, selectedMember,
}: Props) {

  const { nodes, edges, lanes } = useMemo(() => {
    return computeLayout(members.map(m => ({
      id: m.id, fullName: m.fullName, generation: m.generation,
      isLate: m.isLate, fatherId: m.fatherId, motherId: m.motherId,
      spouseId: m.spouseId, gender: m.gender,
    })));
  }, [members]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach(n => map.set(n.id, n.position));
    return map;
  }, [nodes]);

  const svgBounds = useMemo(() => {
    let minX = 0, maxX = 0, maxY = 0;
    nodes.forEach(n => {
      minX = Math.min(minX, n.position.x - NODE_W - 200);
      maxX = Math.max(maxX, n.position.x + NODE_W + 200);
      maxY = Math.max(maxY, n.position.y + NODE_H + 200);
    });
    // left offset so SVG covers negative-x node positions
    const left = Math.min(minX, -200);
    const width = Math.max(maxX - left, 2000);
    return { left, width, height: Math.max(maxY, 2000) };
  }, [nodes]);

  // Build SVG path + midpoint for label.
  // ox = x-offset to convert DOM position.x to SVG coordinate space
  // (SVG is positioned at left: svgBounds.left, so SVG_x = DOM_x - svgBounds.left)
  const buildEdge = (edge: typeof edges[0], ox: number) => {
    const s = nodeMap.get(edge.source);
    const t = nodeMap.get(edge.target);
    if (!s || !t) return null;

    if (edge.type === 'spouse') {
      // Horizontal couple bar at node vertical centre
      const sy = s.y + NODE_H / 2;
      const ty = t.y + NODE_H / 2;
      const sx = s.x + NODE_W / 2 - ox;
      const tx = t.x - NODE_W / 2 - ox;
      return { d: `M ${sx} ${sy} H ${tx}`, mx: (sx + tx) / 2, my: sy };
    }

    // Parent → child: orthogonal elbow from couple midpoint (or parent bottom)
    const spouseEdge = edges.find(e => e.type === 'spouse' && (e.source === edge.source || e.target === edge.source));
    let sx: number, sy: number;
    if (spouseEdge) {
      const s2 = nodeMap.get(spouseEdge.source === edge.source ? spouseEdge.target : spouseEdge.source);
      if (s2) {
        // position.x is the visual center — midpoint between the two couple centers
        sx = (s.x + s2.x) / 2 - ox;
        sy = s.y + NODE_H;
      } else {
        sx = s.x - ox;
        sy = s.y + NODE_H;
      }
    } else {
      // position.x is already the visual center
      sx = s.x - ox;
      sy = s.y + NODE_H;
    }

    const tx = t.x - ox; // position.x is the visual center of the child node
    const ty = t.y;
    const midY = sy + (ty - sy) * 0.5;

    return {
      d: `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`,
      mx: (sx + tx) / 2,
      my: midY,
    };
  };

  return (
    <>
      {/* Canvas */}
      <div className="fixed inset-0 overflow-hidden select-none"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          backgroundColor: '#0D1F0D',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px, 24px 24px',
        }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

        <div className="absolute inset-0" style={{
          transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.12s ease-out',
        }}>

          {/* Generation lane labels */}
          {lanes.map(lane => {
            const style = getGenStyle(lane.generation, false);
            return (
              <div key={lane.generation}
                className="absolute flex items-center gap-2 pointer-events-none"
                style={{ left: -230, top: lane.y - 14 }}>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                  style={{ color: style.text, background: style.bg, border: `1px solid ${style.border}` }}>
                  Gen {lane.generation}
                </span>
                <span className="text-[8px] flex items-center gap-1"
                  style={{ color: 'rgba(232,245,233,0.22)' }}>
                  <Users size={8} />{lane.count}
                </span>
              </div>
            );
          })}

          {/* SVG edges + relationship labels */}
          <svg className="absolute pointer-events-none"
            style={{ top: 0, left: svgBounds.left, overflow: 'visible' }}
            width={svgBounds.width} height={svgBounds.height}>
            {edges.map(edge => {
              const built = buildEdge(edge, svgBounds.left);
              if (!built) return null;
              const isSpouse = edge.type === 'spouse';

              return (
                <g key={edge.id}>
                  <path d={built.d} fill="none"
                    data-edge-type={edge.type}
                    stroke={isSpouse ? 'rgba(200,150,46,0.90)' : 'rgba(76,175,114,0.85)'}
                    strokeWidth={isSpouse ? 3 : 2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Relationship label */}
                  {edge.label && (
                    <foreignObject
                      x={built.mx - 38} y={built.my - 9}
                      width={76} height={18}
                      style={{ overflow: 'visible', pointerEvents: 'none' }}>
                      <div style={{
                        background: isSpouse ? 'rgba(200,150,46,0.14)' : 'rgba(13,31,13,0.85)',
                        border: `1px solid ${isSpouse ? 'rgba(200,150,46,0.30)' : 'rgba(76,175,114,0.22)'}`,
                        borderRadius: 6, padding: '1px 5px',
                        fontSize: 8, fontWeight: 700,
                        color: isSpouse ? '#E6B84A' : 'rgba(129,199,132,0.90)',
                        textAlign: 'center', whiteSpace: 'nowrap',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}>
                        {edge.label}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Member nodes */}
          {nodes.map(({ id, position, data }) => {
            const member     = members.find(m => m.id === id);
            const isSelected = selectedMember?.id === id;
            const isFocused  = focusId === id;
            const style      = getGenStyle(data.generation, data.isLate);
            const initials   = (data.label as string).split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div key={id}
                data-member-id={id}
                className={`absolute cursor-pointer transition-all duration-200${isFocused ? ' animate-focus-ring' : ''}`}
                style={{
                  left: position.x - NODE_W / 2, top: position.y, width: NODE_W, height: NODE_H,
                  borderRadius: '50%',
                  outline: isFocused ? '3px solid rgba(76,175,114,0.9)' : undefined,
                  outlineOffset: isFocused ? '4px' : undefined,
                }}
                onClick={() => onMemberClick(member)}>

                <div className="absolute inset-x-0 top-0 flex flex-col items-center"
                style={{ paddingTop: 10 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', padding: 4,
              background: 'rgba(18,32,18,0.96)',
              border: `2px solid ${style.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isSelected ? `0 0 0 12px rgba(129,199,132,0.12)` : '0 0 0 10px rgba(0,0,0,0.18)',
            }}>
              {member?.profilePhotoUrl || member?.photoUrl ? (
                <img
                  src={`${member?.profilePhotoUrl || member?.photoUrl}?v=${member?.avatarVersion || 0}`}
                  alt={data.label as string}
                  style={{
                    width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.06)',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: style.avatar, border: `1.5px solid ${style.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18, color: style.text,
                }}>{initials}</div>
              )}
            </div>
            {/* LED Status Indicator */}
            <div style={{
              position: 'absolute', top: -4, right: -4, width: 12, height: 12,
              borderRadius: '50%', border: '2px solid #111',
              background: member?.isLate ? '#EF5350' : member?.isOnline ? '#4CAF50' : '#FF9800',
              boxShadow: member?.isLate ? '0 0 6px rgba(239,83,80,0.5)' : 
                         member?.isOnline ? '0 0 6px rgba(76,175,80,0.5)' : 
                         '0 0 6px rgba(255,152,0,0.5)',
            }} title={member?.isLate ? 'Deceased' : member?.isOnline ? 'Online' : 'Offline (inactive > 10 min)'} />
          </div>

          <div className="absolute left-4 right-4 bottom-10 rounded-2xl px-3 py-2"
            style={{
              background: 'rgba(13,31,13,0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            <p style={{
              fontSize: 11.5, fontWeight: 700, color: '#E8F5E9',
              lineHeight: 1.2, margin: 0, textAlign: 'center',
              overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {data.label}
            </p>
          </div>
        </div>
            );
          })}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="fixed bottom-8 right-8 z-40 hidden md:flex flex-col rounded-2xl overflow-hidden shadow-xl"
        style={{ background: 'rgba(13,31,13,0.92)', border: '1px solid rgba(76,175,114,0.15)', backdropFilter: 'blur(16px)' }}>
        {[
          { Icon: ZoomIn,    action: onZoomIn,      title: 'Zoom in' },
          { Icon: ZoomOut,   action: onZoomOut,     title: 'Zoom out' },
          { Icon: Maximize2, action: onFitToScreen, title: 'Fit to screen' },
        ].map(({ Icon, action, title }, i) => (
          <button key={title} onClick={action} title={title}
            className="p-3 transition-colors hover:bg-white/10 flex items-center justify-center"
            style={{
              color: 'rgba(232,245,233,0.55)',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              minWidth: 44, minHeight: 44,
            }}>
            <Icon size={18} />
          </button>
        ))}
      </div>
    </>
  );
}
