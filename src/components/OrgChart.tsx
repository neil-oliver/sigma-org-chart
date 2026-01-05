import React, { memo, useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Maximize2, Minimize2, RotateCcw, LayoutGrid, LayoutList, Focus, Keyboard, Filter, ZoomIn, ZoomOut, RotateCw, Printer, BarChart3 } from 'lucide-react';
import UserCard from './UserCard';
import CompactUserCard from './CompactUserCard';
import ChildrenContainer from './ChildrenContainer';
import Breadcrumb from './Breadcrumb';
import SearchBar from './SearchBar';
import FilterPanel, { FilterState } from './FilterPanel';
import DetailSidebar from './DetailSidebar';
import OrgAnalytics from './OrgAnalytics';
import { UserData, CardSizeMode } from '../types';
import { useOrgChart } from '../hooks/useOrgChart';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { OrgNode } from '../utils/orgChartUtils';

interface OrgChartProps {
  users: UserData[];
  className?: string;
  /** Initial expand depth (default: 2) */
  initialExpandDepth?: number;
}

interface OrgNodeComponentProps {
  node: OrgNode;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  onFocus: (nodeId: string) => void;
  getNodeDescendantCount: (nodeId: string) => number;
  getDirectChildCount: (nodeId: string) => number;
  hasChildren: (nodeId: string) => boolean;
  isNodeExpanded: (nodeId: string) => boolean;
  cardSizeMode: CardSizeMode;
  isFocusedRoot?: boolean;
  /** Currently selected node for keyboard navigation */
  selectedNodeId?: string | null;
  /** Set selected node */
  onSelect?: (nodeId: string) => void;
  /** Highlighted node from search */
  highlightedNodeId?: string | null;
  /** Open detail sidebar */
  onOpenDetail?: (nodeId: string) => void;
}

/**
 * Memoized node component for performance with large trees
 */
const OrgNodeComponent: React.FC<OrgNodeComponentProps> = memo(({
  node,
  isExpanded,
  onToggleExpand,
  onFocus,
  getNodeDescendantCount,
  getDirectChildCount,
  hasChildren,
  isNodeExpanded,
  cardSizeMode,
  isFocusedRoot = false,
  selectedNodeId,
  onSelect,
  highlightedNodeId,
  onOpenDetail,
}) => {
  const nodeHasChildren = hasChildren(node.id);
  const directChildCount = getDirectChildCount(node.id);
  const totalDescendantCount = getNodeDescendantCount(node.id);
  const isSelected = selectedNodeId === node.id;
  const isHighlighted = highlightedNodeId === node.id;

  // Focused root or actual root always uses standard card
  // Otherwise use compact if in compact mode
  const useCompactCard = cardSizeMode === 'compact' && node.level > 0 && !isFocusedRoot;

  const handleExpandClick = () => {
    onSelect?.(node.id);
    if (nodeHasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleDoubleClick = () => {
    if (nodeHasChildren) {
      onFocus(node.id);
    }
  };

  // Right-click or long-press to open detail
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenDetail?.(node.id);
  };

  return (
    <div
      className={`org-node flex flex-col items-center ${isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''} ${isHighlighted ? 'animate-pulse' : ''}`}
      onContextMenu={handleContextMenu}
    >
      {/* User Card - Compact or Standard based on mode */}
      {useCompactCard ? (
        <CompactUserCard
          user={node.user}
          hasChildren={nodeHasChildren}
          childCount={directChildCount}
          isExpanded={isExpanded}
          onClick={handleExpandClick}
          onDoubleClick={handleDoubleClick}
          level={node.level}
          showLevelBadge={true}
          isHighlighted={isSelected || isHighlighted}
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          onClick={() => onSelect?.(node.id)}
          title={nodeHasChildren ? "Double-click to focus | Right-click for details" : "Right-click for details"}
          className={isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-2 rounded-lg' : ''}
        >
          <UserCard
            user={node.user}
            hasChildren={nodeHasChildren}
            childCount={totalDescendantCount}
            visibleChildCount={directChildCount}
            isExpanded={isExpanded}
            level={node.level}
            onToggleExpand={handleExpandClick}
          />
        </div>
      )}

      {/* Children Container with flex-wrap */}
      {nodeHasChildren && isExpanded && (
        <ChildrenContainer
          showConnector={true}
          label={`${directChildCount} direct report${directChildCount !== 1 ? 's' : ''}`}
          childCount={directChildCount}
        >
          {node.children.map((child) => (
            <OrgNodeComponent
              key={child.id}
              node={child}
              isExpanded={isNodeExpanded(child.id)}
              onToggleExpand={onToggleExpand}
              onFocus={onFocus}
              getNodeDescendantCount={getNodeDescendantCount}
              getDirectChildCount={getDirectChildCount}
              hasChildren={hasChildren}
              isNodeExpanded={isNodeExpanded}
              cardSizeMode={cardSizeMode}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              highlightedNodeId={highlightedNodeId}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </ChildrenContainer>
      )}
    </div>
  );
});

const OrgChart: React.FC<OrgChartProps> = ({
  users,
  className = '',
  initialExpandDepth = 2,
}) => {
  const {
    orgTree,
    toggleExpansion,
    expandAllNodes,
    collapseAllNodes,
    resetToDefaultExpand,
    isNodeExpanded,
    getNodeDescendantCount,
    getDirectChildCount,
    hasChildren,
    cardSizeMode,
    setCardSizeMode,
    findNode,
    getNodePath,
  } = useOrgChart(users, { initialExpandDepth });

  // Focus state - which subtree to show (null = show all)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({ orgUnits: [], offices: [], maxLevel: null });
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(100);
  const minZoom = 50;
  const maxZoom = 150;
  const zoomStep = 10;

  // Analytics panel state
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(z => Math.min(z + zoomStep, maxZoom));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(z => Math.max(z - zoomStep, minZoom));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(100);
  }, []);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Detail sidebar state
  const [selectedDetailNodeId, setSelectedDetailNodeId] = useState<string | null>(null);
  const selectedDetailNode = selectedDetailNodeId ? findNode(selectedDetailNodeId) : null;

  const handleOpenDetail = useCallback((nodeId: string) => {
    setSelectedDetailNodeId(nodeId);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedDetailNodeId(null);
  }, []);

  // Get manager name for detail sidebar
  const getManagerName = useCallback((node: OrgNode | null): string | undefined => {
    if (!node) return undefined;
    // Find parent by searching tree
    const findParent = (nodes: OrgNode[], target: string): OrgNode | null => {
      for (const n of nodes) {
        if (n.children.some(c => c.id === target)) return n;
        const found = findParent(n.children, target);
        if (found) return found;
      }
      return null;
    };
    const parent = findParent(orgTree, node.id);
    return parent?.user.fullName;
  }, [orgTree]);

  // Get the focused node and path to it
  const focusedNode = focusedNodeId ? findNode(focusedNodeId) : null;
  const focusPath = focusedNodeId ? getNodePath(focusedNodeId) : [];

  // Calculate max level in tree
  const maxLevel = useMemo(() => {
    let max = 0;
    const traverse = (nodes: OrgNode[]) => {
      for (const node of nodes) {
        max = Math.max(max, node.level);
        traverse(node.children);
      }
    };
    traverse(orgTree);
    return max + 1; // Convert 0-indexed to 1-indexed
  }, [orgTree]);

  // Handle focus navigation
  const handleFocus = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
  }, []);

  const handleBreadcrumbNavigate = useCallback((nodeId: string | null) => {
    setFocusedNodeId(nodeId);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  // Keyboard navigation
  const { selectedNodeId, setSelectedNodeId, isKeyboardActive } = useKeyboardNavigation({
    orgTree: focusedNode ? [focusedNode] : orgTree,
    isNodeExpanded,
    toggleExpansion,
    onFocus: handleFocus,
    focusedNodeId,
    clearFocus,
    hasChildren,
    findNode,
  });

  // Handle search selection - focus on user and expand path
  const handleSearchSelect = useCallback((userId: string) => {
    // Find the node by user name
    const findNodeByName = (nodes: OrgNode[]): OrgNode | null => {
      for (const node of nodes) {
        if (node.user.fullName === userId) return node;
        const found = findNodeByName(node.children);
        if (found) return found;
      }
      return null;
    };

    const node = findNodeByName(orgTree);
    if (node) {
      // Expand path to node
      const path = getNodePath(node.id);
      path.forEach(p => {
        if (!isNodeExpanded(p.id)) {
          toggleExpansion(p.id);
        }
      });
      // Highlight the node
      setHighlightedUserId(node.id);
      setSelectedNodeId(node.id);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightedUserId(null), 3000);
    }
  }, [orgTree, getNodePath, isNodeExpanded, toggleExpansion, setSelectedNodeId]);

  const toggleCardSize = () => {
    setCardSizeMode(cardSizeMode === 'compact' ? 'standard' : 'compact');
  };

  // Check if filters are active
  const hasActiveFilters = filters.orgUnits.length > 0 || filters.offices.length > 0 || filters.maxLevel !== null;

  // Determine which nodes to render (focused subtree or all)
  const nodesToRender = focusedNode ? [focusedNode] : orgTree;

  // Calculate stats
  const stats = useMemo(() => {
    if (orgTree.length === 0) return { total: 0, visible: 0, focused: 0 };
    let visibleCount = 0;
    const countVisible = (nodes: OrgNode[]) => {
      for (const node of nodes) {
        visibleCount++;
        if (isNodeExpanded(node.id)) {
          countVisible(node.children);
        }
      }
    };
    countVisible(nodesToRender);
    return {
      total: users.length,
      visible: visibleCount,
      focused: focusedNode ? getNodeDescendantCount(focusedNode.id) + 1 : users.length,
    };
  }, [users.length, orgTree.length, nodesToRender, isNodeExpanded, focusedNode, getNodeDescendantCount]);

  // Performance warning threshold
  const visibleNodeWarningThreshold = 200;
  const showPerformanceWarning = stats.visible > visibleNodeWarningThreshold;

  if (orgTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h4 className="text-lg font-medium mb-2">No Organization Chart Data</h4>
          <p className="text-muted-foreground">
            Please ensure your data includes the required fields to build an organizational hierarchy.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`org-chart-container ${className}`}>
      {/* Performance Warning */}
      {showPerformanceWarning && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Showing {stats.visible} nodes may impact performance. Consider using filters or focusing on a subtree.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAllNodes}
            className="mt-2"
          >
            Collapse All
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4 max-w-md mx-auto">
        <SearchBar
          users={users}
          onSelectUser={handleSearchSelect}
          placeholder="Search employees..."
        />
      </div>

      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Breadcrumb
          path={focusPath}
          focusedNodeId={focusedNodeId}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>

      {/* Filter Panel (collapsible) */}
      {showFilters && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg max-w-2xl mx-auto">
          <FilterPanel
            users={users}
            filters={filters}
            onFiltersChange={setFilters}
            maxAvailableLevel={maxLevel}
          />
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="mb-4 flex justify-center gap-6 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{stats.total}</span> total employees
        </span>
        {focusedNode && (
          <span>
            <span className="font-medium text-foreground">{stats.focused}</span> in subtree
          </span>
        )}
        <span>
          <span className="font-medium text-foreground">{stats.visible}</span> visible
        </span>
      </div>

      {/* Control Panel */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-6 p-3 bg-muted/30 rounded-lg">
        <Button
          variant="outline"
          size="sm"
          onClick={expandAllNodes}
          className="gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={collapseAllNodes}
          className="gap-2"
        >
          <Minimize2 className="h-4 w-4" />
          Collapse All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={resetToDefaultExpand}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant={cardSizeMode === 'compact' ? 'default' : 'outline'}
          size="sm"
          onClick={toggleCardSize}
          className="gap-2"
        >
          {cardSizeMode === 'compact' ? (
            <>
              <LayoutGrid className="h-4 w-4" />
              Compact
            </>
          ) : (
            <>
              <LayoutList className="h-4 w-4" />
              Standard
            </>
          )}
        </Button>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="ml-1 text-xs bg-primary-foreground text-primary rounded-full px-1.5">!</span>}
        </Button>
        {focusedNodeId && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={clearFocus}
              className="gap-2"
            >
              <Focus className="h-4 w-4" />
              Exit Focus
            </Button>
          </>
        )}
        {isKeyboardActive && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Keyboard className="h-3 w-3" />
              <span className="hidden sm:inline">↑↓←→ Navigate | Enter Expand | Space Focus | Esc Exit</span>
            </div>
          </>
        )}
        <div className="w-px h-6 bg-border mx-1" />
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= minZoom}
            className="h-8 w-8 p-0"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{zoomLevel}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= maxZoom}
            className="h-8 w-8 p-0"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          {zoomLevel !== 100 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomReset}
              className="h-8 w-8 p-0"
              title="Reset zoom"
            >
              <RotateCw className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant={showAnalytics ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="gap-2"
          title="Show analytics"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Analytics</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2"
          title="Print org chart"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Print</span>
        </Button>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-4">
          <OrgAnalytics orgTree={orgTree} totalUsers={users.length} />
        </div>
      )}

      {/* Organization Chart - vertical scroll, no horizontal scroll */}
      <div className="org-chart overflow-y-auto overflow-x-auto">
        <div
          className="flex flex-wrap justify-center items-start gap-6 pb-8 transition-transform duration-200 origin-top"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {nodesToRender.map((node) => (
            <OrgNodeComponent
              key={node.id}
              node={node}
              isExpanded={isNodeExpanded(node.id)}
              onToggleExpand={toggleExpansion}
              onFocus={handleFocus}
              getNodeDescendantCount={getNodeDescendantCount}
              getDirectChildCount={getDirectChildCount}
              hasChildren={hasChildren}
              isNodeExpanded={isNodeExpanded}
              cardSizeMode={cardSizeMode}
              isFocusedRoot={focusedNodeId === node.id}
              selectedNodeId={selectedNodeId}
              onSelect={setSelectedNodeId}
              highlightedNodeId={highlightedUserId}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      </div>

      {/* Detail Sidebar */}
      {selectedDetailNode && (
        <DetailSidebar
          user={selectedDetailNode.user}
          onClose={handleCloseDetail}
          managerName={getManagerName(selectedDetailNode)}
          directReportCount={getDirectChildCount(selectedDetailNode.id)}
          totalDescendantCount={getNodeDescendantCount(selectedDetailNode.id)}
          level={selectedDetailNode.level}
        />
      )}
    </div>
  );
};

export default OrgChart;
