declare module '@xyflow/react' {
  import * as React from 'react';

  export const ReactFlow: React.ComponentType<any>;
  export const MiniMap: React.ComponentType<any>;
  export const Controls: React.ComponentType<any>;
  export const Background: React.ComponentType<any>;
  export const BackgroundVariant: { Dots: string; Lines: string; Cross: string };
  export const ReactFlowProvider: React.ComponentType<{ children: React.ReactNode }>;
  export function useReactFlow(): { fitView: (options?: any) => void };
  export const BaseEdge: React.ComponentType<any>;
  export const EdgeLabelRenderer: React.ComponentType<{ children: React.ReactNode }>;
  export function getSmoothStepPath(options: any): [string, number, number, number, number];
  export function getBezierPath(options: any): [string, number, number, number, number];
  export function getStraightPath(options: any): [string, number, number];
  export const Position: { Top: string; Bottom: string; Left: string; Right: string };
  export interface EdgeProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: any;
    targetPosition: any;
    label?: string | React.ReactNode;
    data?: any;
    style?: React.CSSProperties;
    markerEnd?: string;
    markerStart?: string;
    selected?: boolean;
  }
}
