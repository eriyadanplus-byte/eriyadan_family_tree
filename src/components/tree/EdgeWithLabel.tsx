'use client';

import { getSmoothStepPath, EdgeLabelRenderer, BaseEdge, type EdgeProps } from '@xyflow/react';

export default function EdgeWithLabel({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data,
  style,
}: EdgeProps & { data?: { edgeType?: string } }) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const isSpouse = data?.edgeType === 'spouse';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isSpouse ? 'rgba(200,150,46,0.88)' : 'rgba(76,175,114,0.82)',
          strokeWidth: isSpouse ? 2.5 : 2,
          strokeDasharray: isSpouse ? '6 4' : undefined,
          ...style,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              padding: '2px 5px',
              borderRadius: 4,
              fontSize: 8,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: isSpouse ? 'rgba(200,150,46,0.14)' : 'rgba(13,31,13,0.85)',
              color: isSpouse ? '#E6B84A' : 'rgba(129,199,132,0.90)',
              border: `1px solid ${isSpouse ? 'rgba(200,150,46,0.25)' : 'rgba(76,175,114,0.20)'}`,
              whiteSpace: 'nowrap',
            }}
            className="nodrag nopan"
          >
            {String(label)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
