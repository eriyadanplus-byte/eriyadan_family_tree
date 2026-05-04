declare module '@xyflow/react' {
  import * as React from 'react';

  export const ReactFlow: React.ComponentType<any>;
  export const MiniMap: React.ComponentType<any>;
  export const Controls: React.ComponentType<any>;
  export const Background: React.ComponentType<any>;
  export const BackgroundVariant: { Dots: string; Lines: string; Cross: string };
  export const ReactFlowProvider: React.ComponentType<{ children: React.ReactNode }>;
  export function useReactFlow(): { fitView: (options?: any) => void };
}
