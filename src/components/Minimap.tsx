import React, { useMemo } from 'react';
import { OrgNode } from '../utils/orgChartUtils';

interface MinimapProps {
  orgTree: OrgNode[];
  isNodeExpanded: (nodeId: string) => boolean;
  className?: string;
  highlightedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
}

interface FlatNode {
  id: string;
  x: number;
  y: number;
  parentId?: string;
}

const NODE_WIDTH = 8;
const NODE_HEIGHT = 4;
const H_GAP = 4;
const V_GAP = 10;

const Minimap: React.FC<MinimapProps> = ({
  orgTree,
  isNodeExpanded,
  className = '',
  highlightedNodeId,
  onNodeClick,
}) => {
  const { flatNodes, dimensions } = useMemo(() => {
    const nodes: FlatNode[] = [];
    let maxX = 0;
    let maxY = 0;

    // Flatten tree and calculate positions
    const processLevel = (
      levelNodes: OrgNode[],
      level: number,
      parentId?: string,
      parentX?: number
    ): number => {
      if (levelNodes.length === 0) return parentX || 0;

      const y = level * (NODE_HEIGHT + V_GAP) + 10;
      maxY = Math.max(maxY, y + NODE_HEIGHT);

      // Calculate total width needed for this level's subtrees
      let totalWidth = 0;
      const subtreeWidths: number[] = [];

      for (const node of levelNodes) {
        const expanded = isNodeExpanded(node.id);
        const children = expanded ? node.children : [];
        // Estimate width: either this node or its expanded children
        const childWidth = children.length > 0
          ? children.length * (NODE_WIDTH + H_GAP) - H_GAP
          : NODE_WIDTH;
        subtreeWidths.push(Math.max(NODE_WIDTH, childWidth));
        totalWidth += subtreeWidths[subtreeWidths.length - 1] + H_GAP;
      }
      totalWidth -= H_GAP;

      // Center under parent or start from left
      let startX = parentX !== undefined
        ? parentX - totalWidth / 2 + NODE_WIDTH / 2
        : 10;

      startX = Math.max(10, startX);

      let currentX = startX;
      for (let i = 0; i < levelNodes.length; i++) {
        const node = levelNodes[i];
        const nodeX = currentX + subtreeWidths[i] / 2 - NODE_WIDTH / 2;

        nodes.push({
          id: node.id,
          x: nodeX,
          y,
          parentId,
        });

        maxX = Math.max(maxX, nodeX + NODE_WIDTH);

        // Process children if expanded
        if (isNodeExpanded(node.id) && node.children.length > 0) {
          processLevel(node.children, level + 1, node.id, nodeX + NODE_WIDTH / 2);
        }

        currentX += subtreeWidths[i] + H_GAP;
      }

      return startX + totalWidth / 2;
    };

    processLevel(orgTree, 0);

    return {
      flatNodes: nodes,
      dimensions: { width: Math.max(maxX + 10, 100), height: Math.max(maxY + 10, 50) },
    };
  }, [orgTree, isNodeExpanded]);

  // Create a map for quick lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, FlatNode>();
    for (const n of flatNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [flatNodes]);

  if (flatNodes.length === 0) {
    return (
      <div className={`bg-background/90 border border-border rounded-lg p-2 shadow-lg ${className}`}>
        <div className="text-xs text-muted-foreground">No data</div>
      </div>
    );
  }

  const svgWidth = Math.min(dimensions.width, 180);
  const svgHeight = Math.min(dimensions.height, 100);

  return (
    <div className={`bg-background/95 border border-border rounded-lg p-2 shadow-lg backdrop-blur ${className}`}>
      <div className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Minimap</div>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="text-foreground"
        style={{ background: 'hsl(var(--muted) / 0.3)', borderRadius: 4 }}
      >
        {/* Draw lines first */}
        {flatNodes.map((node) => {
          if (!node.parentId) return null;
          const parent = nodeMap.get(node.parentId);
          if (!parent) return null;

          return (
            <line
              key={`line-${node.id}`}
              x1={parent.x + NODE_WIDTH / 2}
              y1={parent.y + NODE_HEIGHT}
              x2={node.x + NODE_WIDTH / 2}
              y2={node.y}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
          );
        })}

        {/* Draw nodes */}
        {flatNodes.map((node) => {
          const isHighlighted = node.id === highlightedNodeId;

          return (
            <rect
              key={node.id}
              x={node.x}
              y={node.y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              rx={1}
              fill={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
              fillOpacity={isHighlighted ? 1 : 0.5}
              className="cursor-pointer hover:opacity-80"
              onClick={() => onNodeClick?.(node.id)}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default Minimap;

