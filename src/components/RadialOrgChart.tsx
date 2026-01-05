import React, { useMemo, useState } from 'react';
import { OrgNode } from '../utils/orgChartUtils';
import { CardSizeMode } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ChevronLeft, Users } from 'lucide-react';
import { Button } from './ui/button';

// Compute a stable index from a string for consistent color selection
function stableIndexFromString(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

// Get border color class based on organization unit
function getNodeBorderColor(organizationUnit?: string): string {
  const colors = [
    'border-violet-500',
    'border-fuchsia-500',
    'border-indigo-500',
    'border-blue-500',
    'border-sky-500',
    'border-emerald-500',
    'border-teal-500',
    'border-amber-500',
  ];

  if (!organizationUnit) {
    return colors[0];
  }

  const index = stableIndexFromString(organizationUnit, colors.length);
  return colors[index];
}

interface RadialOrgChartProps {
  /** The root node(s) to display - typically CEO */
  nodes: OrgNode[];
  /** Size mode for cards */
  cardSizeMode: CardSizeMode;
  /** Currently selected node */
  selectedNodeId?: string | null;
  /** Callback when node is selected */
  onSelect?: (nodeId: string) => void;
  /** Callback when node is double-clicked (focus) */
  onFocus?: (nodeId: string) => void;
  /** Highlighted node from search */
  highlightedNodeId?: string | null;
  /** Open detail sidebar */
  onOpenDetail?: (nodeId: string) => void;
  /** Get descendant count for a node */
  getNodeDescendantCount: (nodeId: string) => number;
  /** Check if node has children */
  hasChildren: (nodeId: string) => boolean;
}

interface NodePosition {
  node: OrgNode;
  x: number;
  y: number;
  angle: number;
  ring: number; // 0 = center, 1 = first ring, etc.
  parentAngle?: number; // For ring 2 nodes, track parent's angle
}

// Compact node size for radial layout
const NODE_RADIUS = 45;
const CENTER_NODE_RADIUS = 55;

/**
 * Calculate dynamic ring radius based on number of children
 */
function calculateRingRadius(childCount: number, ring: number): number {
  // Minimum spacing between nodes (diameter + gap)
  const minNodeSpacing = NODE_RADIUS * 2 + 30;
  // Calculate circumference needed
  const circumferenceNeeded = childCount * minNodeSpacing;
  // Calculate radius from circumference (C = 2πr, so r = C/2π)
  const radiusFromSpacing = circumferenceNeeded / (2 * Math.PI);
  // Minimum radius for visual appeal
  const minRadius = ring === 1 ? 180 : 320;
  return Math.max(radiusFromSpacing, minRadius);
}

/**
 * Calculate positions for nodes in a radial layout with expand-in-place
 * @param expandedNodeIds - Set of node IDs that are expanded (showing their children)
 */
function calculateRadialPositions(
  centerNode: OrgNode,
  centerX: number,
  centerY: number,
  expandedNodeIds: Set<string>
): NodePosition[] {
  const positions: NodePosition[] = [];

  // Center node
  positions.push({
    node: centerNode,
    x: centerX,
    y: centerY,
    angle: 0,
    ring: 0,
  });

  // First ring - direct reports
  const children = centerNode.children;
  const childCount = children.length;

  if (childCount === 0) return positions;

  const ring1Radius = calculateRingRadius(childCount, 1);
  const startAngle = -Math.PI / 2; // Start from top
  const angleStep = (2 * Math.PI) / childCount;

  // Fixed ring 2 offset - keeps children close to their parent
  const ring2Radius = ring1Radius + 100;

  children.forEach((child, index) => {
    const angle = startAngle + (index * angleStep);
    positions.push({
      node: child,
      x: centerX + ring1Radius * Math.cos(angle),
      y: centerY + ring1Radius * Math.sin(angle),
      angle,
      ring: 1,
    });

    // Second ring - only show children if this node is expanded
    if (expandedNodeIds.has(child.id) && child.children.length > 0) {
      const grandchildren = child.children;
      const gcCount = grandchildren.length;

      // Calculate arc span - use 85% of parent's slice
      const arcSpan = angleStep * 0.85;
      const gcAngleStep = gcCount > 1 ? arcSpan / (gcCount - 1) : 0;
      const gcStartAngle = angle - arcSpan / 2;

      grandchildren.forEach((gc, gcIndex) => {
        const gcAngle = gcCount === 1 ? angle : gcStartAngle + (gcIndex * gcAngleStep);

        // Stagger nodes at different radii for network-graph effect
        // Use 4 different distances with more spread
        const staggerPattern = [0, 50, -30, 80, 20, -50];
        const staggerOffset = staggerPattern[gcIndex % staggerPattern.length];
        const staggeredRadius = ring2Radius + staggerOffset;

        positions.push({
          node: gc,
          x: centerX + staggeredRadius * Math.cos(gcAngle),
          y: centerY + staggeredRadius * Math.sin(gcAngle),
          angle: gcAngle,
          ring: 2,
          parentAngle: angle,
        });
      });
    }
  });

  return positions;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const RadialOrgChart: React.FC<RadialOrgChartProps> = ({
  nodes,
  selectedNodeId,
  onSelect,
  highlightedNodeId,
  onOpenDetail,
  getNodeDescendantCount,
  hasChildren,
}) => {
  // Expand-in-place state - track which nodes are expanded
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());

  // The center node is always the root
  const centerNode = nodes[0];

  // Calculate canvas size dynamically - keep compact with fixed ring offset
  const childCount = centerNode?.children.length || 0;
  const ring1Radius = calculateRingRadius(childCount, 1);

  const hasExpandedNodes = expandedNodeIds.size > 0;
  // Fixed ring 2 offset - keeps children close to parent
  const ring2Offset = 100;
  const canvasSize = hasExpandedNodes
    ? Math.max(600, (ring1Radius + ring2Offset) * 2 + 120)
    : Math.max(500, ring1Radius * 2 + 150);
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  // Calculate positions with expand-in-place
  const positions = useMemo(() => {
    if (!centerNode) return [];
    return calculateRadialPositions(centerNode, centerX, centerY, expandedNodeIds);
  }, [centerNode, centerX, centerY, expandedNodeIds]);

  if (!centerNode) {
    return <div className="text-muted-foreground p-8">No data to display</div>;
  }

  const toggleExpand = (nodeId: string) => {
    setExpandedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleNodeClick = (nodeId: string, ring: number) => {
    onSelect?.(nodeId);
    // Toggle expansion for ring 1 nodes with children
    if (ring === 1 && hasChildren(nodeId)) {
      toggleExpand(nodeId);
    }
    // For ring 2 nodes, toggle their expansion to show ring 3
    if (ring === 2 && hasChildren(nodeId)) {
      toggleExpand(nodeId);
    }
  };

  const collapseAll = () => {
    setExpandedNodeIds(new Set());
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    onOpenDetail?.(nodeId);
  };

  // Find parent positions for ring 2 connections
  const ring1Positions = positions.filter(p => p.ring === 1);

  return (
    <div
      className="radial-org-chart relative transition-all duration-500"
      style={{
        width: canvasSize,
        height: canvasSize,
        margin: '0 auto',
      }}
    >
      {/* Collapse all button when nodes are expanded */}
      {expandedNodeIds.size > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={collapseAll}
          className="absolute top-4 right-4 z-20 gap-1"
          title="Collapse all expanded nodes"
        >
          <ChevronLeft className="h-4 w-4" />
          Collapse All
        </Button>
      )}

      {/* SVG for connection lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasSize}
        height={canvasSize}
      >
        {/* Ring 1 connections - center to direct reports */}
        {ring1Positions.map((pos) => {
          const centerPos = positions[0];
          return (
            <line
              key={`line-r1-${pos.node.id}`}
              x1={centerPos.x}
              y1={centerPos.y}
              x2={pos.x}
              y2={pos.y}
              stroke="hsl(var(--border))"
              strokeWidth={2}
              className="transition-all duration-500"
            />
          );
        })}

        {/* Ring 2 connections - direct reports to grandchildren */}
        {positions.filter(p => p.ring === 2).map((pos) => {
          // Find the parent in ring 1
          const parent = ring1Positions.find(p1 =>
            p1.node.children.some(c => c.id === pos.node.id)
          );
          if (!parent) return null;
          return (
            <line
              key={`line-r2-${pos.node.id}`}
              x1={parent.x}
              y1={parent.y}
              x2={pos.x}
              y2={pos.y}
              stroke="hsl(var(--border))"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>

      {/* Render nodes */}
      {positions.map((pos) => {
        const isCenter = pos.ring === 0;
        const isRing2 = pos.ring === 2;
        const isSelected = selectedNodeId === pos.node.id;
        const isHighlighted = highlightedNodeId === pos.node.id;
        const nodeHasChildren = hasChildren(pos.node.id);
        const descendantCount = getNodeDescendantCount(pos.node.id);
        const isExpanded = expandedNodeIds.has(pos.node.id);

        // For ring 2 nodes, find how many siblings they have to scale down if crowded
        let ring2SiblingCount = 0;
        if (isRing2) {
          // Find parent (ring 1 node that is expanded and contains this child)
          const parent = centerNode.children.find(
            c => expandedNodeIds.has(c.id) && c.children.some(gc => gc.id === pos.node.id)
          );
          ring2SiblingCount = parent?.children.length || 0;
        }
        // Scale down ring 2 nodes when there are many siblings
        const ring2Scale = ring2SiblingCount > 8 ? 0.7 : ring2SiblingCount > 5 ? 0.8 : 1;
        const baseRing2Radius = NODE_RADIUS - 10;
        const nodeRadius = isCenter ? CENTER_NODE_RADIUS : isRing2 ? baseRing2Radius * ring2Scale : NODE_RADIUS;
        const user = pos.node.user;

        return (
          <div
            key={pos.node.id}
            className={`absolute transition-all duration-500 ease-out cursor-pointer group`}
            style={{
              left: pos.x - nodeRadius,
              top: pos.y - nodeRadius,
              width: nodeRadius * 2,
              height: nodeRadius * 2,
              zIndex: isCenter ? 10 : isRing2 ? 3 : 5,
            }}
            onClick={() => handleNodeClick(pos.node.id, pos.ring)}
            onContextMenu={(e) => handleContextMenu(e, pos.node.id)}
          >
            {/* Circular node with department color */}
            <div
              className={`w-full h-full rounded-full bg-card border-3 shadow-lg flex flex-col items-center justify-center transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary/30' :
                isExpanded ? 'bg-primary/5' : ''
              } ${isHighlighted ? 'ring-2 ring-amber-500/30 animate-pulse' : ''
              } ${nodeHasChildren && !isCenter ? 'hover:scale-110 hover:shadow-xl' : 'hover:shadow-xl'
              } ${getNodeBorderColor(user.organizationUnit)}`}
            >
              <Avatar className={isCenter ? 'h-14 w-14' : isRing2 ? 'h-8 w-8' : 'h-10 w-10'}>
                <AvatarImage src={user.profileImage} alt={user.fullName} />
                <AvatarFallback className={`text-xs ${isCenter ? 'text-sm' : ''}`}>
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>

              {/* Name - only show for center and ring 1 */}
              {!isRing2 && (
                <div className={`text-center mt-1 px-1 ${isCenter ? 'max-w-[90px]' : 'max-w-[70px]'}`}>
                  <div className={`font-medium truncate ${isCenter ? 'text-xs' : 'text-[10px]'}`}>
                    {user.fullName.split(' ')[0]}
                  </div>
                </div>
              )}
            </div>

            {/* Descendant count badge */}
            {nodeHasChildren && (
              <div className={`absolute flex items-center gap-0.5 bg-primary text-primary-foreground rounded-full shadow-sm ${
                isCenter ? '-bottom-1 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5' :
                isRing2 ? '-bottom-1 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0' :
                '-bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0'
              }`}>
                <Users className={isCenter ? 'h-3 w-3' : 'h-2.5 w-2.5'} />
                {descendantCount}
              </div>
            )}

            {/* Hover tooltip for ring 2 (small nodes) */}
            {isRing2 && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                {user.fullName}
                <div className="text-muted-foreground text-[10px]">{user.jobTitle}</div>
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
};

export default RadialOrgChart;

