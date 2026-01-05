import React, { memo, useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Maximize2, Minimize2, RotateCcw, LayoutGrid, LayoutList, Focus, Keyboard, Filter, ZoomIn, ZoomOut, Printer, BarChart3, Move } from 'lucide-react';
import UserCard from './UserCard';
import CompactUserCard from './CompactUserCard';
import ChildrenContainer from './ChildrenContainer';
import Breadcrumb from './Breadcrumb';
import SearchBar from './SearchBar';
import FilterPanel, { FilterState } from './FilterPanel';
import DetailSidebar from './DetailSidebar';
import OrgAnalytics from './OrgAnalytics';
import Minimap from './Minimap';
import { UserData, CardSizeMode } from '../types';
import { useOrgChart } from '../hooks/useOrgChart';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { OrgNode, categorizeMappedUsers } from '../utils/orgChartUtils';

interface OrgChartProps {
  users: UserData[];
  className?: string;
  /** Initial expand depth (default: 1 = root + direct reports visible) */
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
  initialExpandDepth = 1,
}) => {
  // Categorize users into mapped vs unmapped FIRST
  const { mappedUsers, unmappedUsers } = useMemo(() => categorizeMappedUsers(users), [users]);

  // Build org tree from ONLY mapped users
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
  } = useOrgChart(mappedUsers, { initialExpandDepth });

  // Focus state - which subtree to show (null = show all)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({ orgUnits: [], offices: [], maxLevel: null });
  const [showFilters, setShowFilters] = useState(false);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);

  // View mode: org chart or unmapped employees
  const [viewMode, setViewMode] = useState<'chart' | 'unmapped'>('chart');

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(100);
  const minZoom = 50;
  const maxZoom = 150;
  const zoomStep = 10;

  // Pan state
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Pan handlers
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  }, [panPosition]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Mouse wheel zoom - use deltaY magnitude for smoother trackpad support
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      // Scale delta based on actual scroll amount, clamped for smoothness
      const scrollDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY) * 0.1, 5);
      setZoomLevel(z => Math.round(Math.max(minZoom, Math.min(maxZoom, z - scrollDelta))));
    }
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
      mapped: mappedUsers.length,
      unmapped: unmappedUsers.length,
      visible: visibleCount,
      focused: focusedNode ? getNodeDescendantCount(focusedNode.id) + 1 : mappedUsers.length,
    };
  }, [users.length, mappedUsers.length, unmappedUsers.length, orgTree.length, nodesToRender, isNodeExpanded, focusedNode, getNodeDescendantCount]);

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
    <div className={`org-chart-container h-full flex flex-col ${className}`}>
      {/* Row 1: Navigation - Breadcrumb + Search + Unmapped Badge */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Breadcrumb - Left */}
        <div className="flex-shrink-0">
          <Breadcrumb
            path={focusPath}
            focusedNodeId={focusedNodeId}
            onNavigate={handleBreadcrumbNavigate}
          />
        </div>

        {/* Search - Center/Flexible */}
        <div className="flex-1 max-w-sm">
          <SearchBar
            users={mappedUsers}
            onSelectUser={handleSearchSelect}
            placeholder="Search employees..."
          />
        </div>

        {/* Stats & Unmapped - Right */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{stats.mapped}</span> mapped
          </span>
          {(stats.unmapped ?? 0) > 0 && (
            <button
              onClick={() => setViewMode(viewMode === 'unmapped' ? 'chart' : 'unmapped')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                viewMode === 'unmapped'
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              <span className="font-medium">{stats.unmapped}</span>
              <span>unmapped</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Tools */}
      <div className="flex items-center gap-1 px-4 py-2 border-b bg-muted/30">
        {/* Expand/Collapse Group */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={expandAllNodes} className="h-8 px-2" title="Expand all">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAllNodes} className="h-8 px-2" title="Collapse all">
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={resetToDefaultExpand} className="h-8 px-2" title="Reset to default">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-5 bg-border mx-2" />

        {/* Card Size Tabs */}
        <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/50">
          <button
            onClick={() => setCardSizeMode('standard')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              cardSizeMode === 'standard'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Standard
          </button>
          <button
            onClick={() => setCardSizeMode('compact')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              cardSizeMode === 'compact'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Compact
          </button>
        </div>

        <div className="w-px h-5 bg-border mx-2" />

        {/* Filters */}
        <Button
          variant={showFilters ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-8 px-2 gap-1.5"
          title="Toggle filters"
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && <span className="w-1.5 h-1.5 bg-primary rounded-full" />}
        </Button>

        {focusedNodeId && (
          <>
            <div className="w-px h-5 bg-border mx-2" />
            <Button variant="ghost" size="sm" onClick={clearFocus} className="h-8 px-2 gap-1.5 text-primary">
              <Focus className="h-4 w-4" />
              <span className="text-xs">Exit Focus</span>
            </Button>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= minZoom} className="h-8 w-8 p-0" title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <button
            onClick={handleZoomReset}
            className="text-xs text-muted-foreground hover:text-foreground w-10 text-center"
            title="Reset zoom"
          >
            {zoomLevel}%
          </button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= maxZoom} className="h-8 w-8 p-0" title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-5 bg-border mx-2" />

        {/* Analytics & Print */}
        <div className="flex items-center gap-1">
          <Button
            variant={showAnalytics ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="h-8 w-8 p-0"
            title="Analytics"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrint} className="h-8 w-8 p-0" title="Print">
            <Printer className="h-4 w-4" />
          </Button>
        </div>

        {/* Keyboard hint */}
        {isKeyboardActive && (
          <div className="hidden lg:flex items-center gap-1 ml-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" />
            <span>↑↓←→ Nav</span>
          </div>
        )}
      </div>

      {/* Performance Warning - only show when needed */}
      {showPerformanceWarning && (
        <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-center">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Showing {stats.visible} nodes may impact performance.
            <Button variant="link" size="sm" onClick={collapseAllNodes} className="text-yellow-800 dark:text-yellow-200 underline ml-1 h-auto p-0">
              Collapse all
            </Button>
          </p>
        </div>
      )}

      {/* Filter Panel - slides in below toolbar */}
      {showFilters && (
        <div className="px-4 py-3 border-b bg-muted/20">
          <FilterPanel
            users={users}
            filters={filters}
            onFiltersChange={setFilters}
            maxAvailableLevel={maxLevel}
          />
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && viewMode === 'chart' && (
        <div className="mb-4">
          <OrgAnalytics orgTree={orgTree} totalUsers={users.length} />
        </div>
      )}

      {/* Unmapped Employees View */}
      {viewMode === 'unmapped' && (
        <div className="flex-1 overflow-auto p-4">
          {unmappedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="text-lg font-medium mb-2">All Employees Mapped</h3>
              <p className="text-muted-foreground max-w-md">
                Every employee in your dataset has a valid manager reference that exists in the data.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>{unmappedUsers.length}</strong> employee{unmappedUsers.length !== 1 ? 's' : ''} have manager values that don't match any employee name in the dataset.
                </p>
              </div>
              <div className="grid gap-3">
                {unmappedUsers.map((user) => (
                  <div
                    key={user.fullName}
                    className="p-4 bg-card border border-border rounded-lg flex items-center gap-4"
                  >
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium">
                        {user.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.fullName}</div>
                      <div className="text-sm text-muted-foreground truncate">{user.jobTitle || 'No title'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Manager listed as:</div>
                      <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        "{user.manager || '(empty)'}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Organization Chart - Infinite Canvas */}
      {viewMode === 'chart' && (
        <div
          className="org-chart relative flex-1 overflow-hidden"
          style={{
            background: 'linear-gradient(hsl(var(--muted) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted) / 0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          onWheel={handleWheel}
        >
          {/* Canvas content - absolutely positioned for infinite panning */}
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '40px',
              transform: `translate(calc(-50% + ${panPosition.x}px), ${panPosition.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              cursor: isPanning ? 'grabbing' : 'grab',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="flex flex-col items-center">
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

          {/* Minimap */}
          <div className="absolute bottom-4 right-4 z-10">
            <Minimap
              orgTree={orgTree}
              isNodeExpanded={isNodeExpanded}
              highlightedNodeId={selectedNodeId || highlightedUserId}
              onNodeClick={(nodeId) => {
                setSelectedNodeId(nodeId);
              }}
            />
          </div>

          {/* Pan hint */}
          <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded pointer-events-none">
            <Move className="inline h-3 w-3 mr-1" />
            Drag to pan • Ctrl+scroll to zoom
          </div>
        </div>
      )}

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
