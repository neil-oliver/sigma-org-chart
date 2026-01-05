import React, { memo, useState, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Maximize2, Minimize2, RotateCcw, LayoutGrid, LayoutList, Focus, Keyboard, Filter, ZoomIn, ZoomOut, Printer, BarChart3, Move, Network, GitBranch, ChevronUp, ChevronDown, Crosshair } from 'lucide-react';
import UserCard from './UserCard';
import CompactUserCard from './CompactUserCard';
import ChildrenContainer from './ChildrenContainer';
import Breadcrumb from './Breadcrumb';
import SearchBar from './SearchBar';
import FilterPanel, { FilterState } from './FilterPanel';
import DetailSidebar from './DetailSidebar';
import OrgAnalytics from './OrgAnalytics';
import Minimap from './Minimap';
import RadialOrgChart from './RadialOrgChart';
import { UserData, CardSizeMode } from '../types';
import { useOrgChart } from '../hooks/useOrgChart';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { OrgNode, categorizeMappedUsers, filterOrgTree, FilterCriteria } from '../utils/orgChartUtils';

export type LayoutMode = 'tree' | 'radial';

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
  /** Focus on this node's team (from search highlight) */
  onFocusTeam?: (nodeId: string) => void;
  /** Dismiss the search highlight */
  onDismissHighlight?: () => void;
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
  onFocusTeam,
  onDismissHighlight,
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
    e.stopPropagation(); // Prevent bubbling to parent nodes
    onOpenDetail?.(node.id);
  };

  return (
    <div
      className="org-node flex flex-col items-center"
      onContextMenu={handleContextMenu}
      data-node-id={node.id}
    >
      {/* Highlight wrapper with action buttons when this node is highlighted from search */}
      {isHighlighted ? (
        <div className="relative">
          {/* Dashed highlight border */}
          <div className="absolute -inset-3 border-2 border-dashed border-yellow-400 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/20 pointer-events-none" />

          {/* Card content */}
          <div className="relative">
            {useCompactCard ? (
              <div className={`rounded-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500/70 ring-offset-2 ring-offset-background shadow-lg shadow-blue-500/20' : ''}`}>
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
                  onViewDetails={() => onOpenDetail?.(node.id)}
                  onFocusTeam={() => onFocusTeam?.(node.id)}
                />
              </div>
            ) : (
              <div
                onDoubleClick={handleDoubleClick}
                onClick={() => onSelect?.(node.id)}
                title="Click ⋮ for more actions"
                className="rounded-lg transition-shadow"
              >
                <UserCard
                  user={node.user}
                  hasChildren={nodeHasChildren}
                  childCount={directChildCount}
                  isExpanded={isExpanded}
                  level={node.level}
                  onToggleExpand={handleExpandClick}
                  onViewDetails={() => onOpenDetail?.(node.id)}
                  onFocusTeam={() => onFocusTeam?.(node.id)}
                />
              </div>
            )}
          </div>

          {/* Action buttons below the card */}
          <div className="relative flex items-center justify-center gap-2 mt-2 -mb-1">
            {nodeHasChildren && (
              <button
                onClick={(e) => { e.stopPropagation(); onFocusTeam?.(node.id); }}
                className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-sm"
              >
                Focus on team ({totalDescendantCount})
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDismissHighlight?.(); }}
              className="px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        /* Normal non-highlighted card */
        useCompactCard ? (
          <div className={`rounded-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500/70 ring-offset-2 ring-offset-background shadow-lg shadow-blue-500/20' : ''}`}>
            <CompactUserCard
              user={node.user}
              hasChildren={nodeHasChildren}
              childCount={directChildCount}
              isExpanded={isExpanded}
              onClick={handleExpandClick}
              onDoubleClick={handleDoubleClick}
              level={node.level}
              showLevelBadge={true}
              isHighlighted={isSelected}
              onViewDetails={() => onOpenDetail?.(node.id)}
              onFocusTeam={() => onFocusTeam?.(node.id)}
            />
          </div>
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            onClick={() => onSelect?.(node.id)}
            title="Click ⋮ for more actions"
            className={`rounded-lg transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500/70 ring-offset-2 ring-offset-background shadow-lg shadow-blue-500/20' : ''}`}
          >
            <UserCard
              user={node.user}
              hasChildren={nodeHasChildren}
              childCount={directChildCount}
              isExpanded={isExpanded}
              level={node.level}
              onToggleExpand={handleExpandClick}
              onViewDetails={() => onOpenDetail?.(node.id)}
              onFocusTeam={() => onFocusTeam?.(node.id)}
            />
          </div>
        )
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
              onFocusTeam={onFocusTeam}
              onDismissHighlight={onDismissHighlight}
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

  // Layout mode: tree or radial
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('tree');

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(70);
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
    setZoomLevel(70);
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

  // Double-click to zoom in/out
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Shift+double-click to zoom out, regular double-click to zoom in
    if (e.shiftKey) {
      setZoomLevel(z => Math.max(z - zoomStep * 2, minZoom));
    } else {
      setZoomLevel(z => Math.min(z + zoomStep * 2, maxZoom));
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
  const {
    selectedNodeId,
    setSelectedNodeId,
    isKeyboardActive,
    goToParent,
    goToChild,
    focusOnSelected,
  } = useKeyboardNavigation({
    orgTree: focusedNode ? [focusedNode] : orgTree,
    isNodeExpanded,
    toggleExpansion,
    onFocus: handleFocus,
    focusedNodeId,
    clearFocus,
    hasChildren,
    findNode,
  });

  // Full reset: clear focus, filters, highlight, selection, zoom, and reset expand state
  const handleFullReset = useCallback(() => {
    setFocusedNodeId(null);
    setFilters({ orgUnits: [], offices: [], maxLevel: null });
    setHighlightedUserId(null);
    setSelectedNodeId(null);
    setZoomLevel(70);
    setPanPosition({ x: 0, y: 0 });
    resetToDefaultExpand();
  }, [resetToDefaultExpand, setSelectedNodeId]);

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
      // Clear any existing focus/breadcrumb first
      if (focusedNodeId) {
        setFocusedNodeId(null);
      }

      // Reset pan position to center
      setPanPosition({ x: 0, y: 0 });

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

      // Center the view on the node after DOM updates
      // Use a longer delay and calculate pan position to center the element
      setTimeout(() => {
        const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
        const canvasElement = document.querySelector('.org-chart');
        if (nodeElement && canvasElement) {
          const nodeRect = nodeElement.getBoundingClientRect();
          const canvasRect = canvasElement.getBoundingClientRect();

          // Calculate offset needed to center the node in the viewport
          const targetX = canvasRect.width / 2 - (nodeRect.left - canvasRect.left + nodeRect.width / 2);
          const targetY = canvasRect.height / 2 - (nodeRect.top - canvasRect.top + nodeRect.height / 2);

          // Adjust for current pan and zoom
          const scale = zoomLevel / 100;
          setPanPosition({
            x: targetX / scale,
            y: targetY / scale + 40, // account for paddingTop
          });
        }
      }, 250); // Longer delay to allow all expansions to render
    }
  }, [orgTree, getNodePath, isNodeExpanded, toggleExpansion, setSelectedNodeId, focusedNodeId, zoomLevel]);

  // Dismiss the search highlight
  const handleDismissHighlight = useCallback(() => {
    setHighlightedUserId(null);
  }, []);

  // Focus on a node's team from search highlight
  const handleFocusTeam = useCallback((nodeId: string) => {
    setFocusedNodeId(nodeId);
    setHighlightedUserId(null);

    // Reset pan position to center
    setPanPosition({ x: 0, y: 0 });

    // Expand the focused node's direct children
    const node = findNode(nodeId);
    if (node) {
      // Expand the focused node itself
      if (!isNodeExpanded(nodeId)) {
        toggleExpansion(nodeId);
      }
      // Expand first level children
      node.children.forEach(child => {
        if (!isNodeExpanded(child.id) && hasChildren(child.id)) {
          toggleExpansion(child.id);
        }
      });
    }
  }, [findNode, isNodeExpanded, toggleExpansion, hasChildren]);

  // Check if filters are active
  const hasActiveFilters = filters.orgUnits.length > 0 || filters.offices.length > 0 || filters.maxLevel !== null;

  // Determine which nodes to render (focused subtree or all)
  const baseNodesToRender = useMemo(() => {
    return focusedNode ? [focusedNode] : orgTree;
  }, [focusedNode, orgTree]);

  // Apply filters to the tree
  const filterResult = useMemo(() => {
    const filterCriteria: FilterCriteria = {
      orgUnits: filters.orgUnits,
      offices: filters.offices,
      maxLevel: filters.maxLevel,
    };
    return filterOrgTree(baseNodesToRender, filterCriteria);
  }, [baseNodesToRender, filters.orgUnits, filters.offices, filters.maxLevel]);

  const nodesToRender = filterResult.filteredTree;

  // Calculate stats
  const stats = useMemo(() => {
    if (orgTree.length === 0) return { total: 0, visible: 0, focused: 0, filtered: 0 };
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
      // Include filter stats
      filteredMatch: filterResult.matchCount,
      filteredTotal: filterResult.totalCount,
    };
  }, [users.length, mappedUsers.length, unmappedUsers.length, orgTree.length, nodesToRender, isNodeExpanded, focusedNode, getNodeDescendantCount, filterResult.matchCount, filterResult.totalCount]);

  // Performance warning threshold
  const visibleNodeWarningThreshold = 200;
  const showPerformanceWarning = stats.visible > visibleNodeWarningThreshold;

  if (orgTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg m-4">
        <div className="text-center max-w-lg p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold mb-2">Unable to Build Org Chart</h4>
          <p className="text-muted-foreground mb-4">
            We have employee data but couldn't build a hierarchy. This usually means the Manager column isn't mapped or manager names don't match employee names.
          </p>
          <div className="text-left bg-card rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Possible fixes:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>Check that the <strong>Manager</strong> column is mapped in Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>Ensure manager values exactly match employee full names (case-sensitive)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400">•</span>
                <span>At least one person should have no manager (the CEO/root)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`org-chart-container h-full flex flex-col ${className}`}>
      {/* Row 1: Navigation - Breadcrumb + Search + Unmapped Badge */}
      <div className="print:hidden flex items-center gap-4 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
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
      <div className="print:hidden flex items-center gap-1 px-4 py-2 border-b bg-muted/30">
        {/* Expand/Collapse Group */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={expandAllNodes} className="h-8 px-2" title="Expand all">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAllNodes} className="h-8 px-2" title="Collapse all">
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleFullReset} className="h-8 px-2" title="Reset all (view, filters, focus)">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-5 bg-border mx-2" />

        {/* Card Size Tabs */}
        <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/50">
          <button
            onClick={() => setCardSizeMode('standard')}
            title="Standard card size - shows more details"
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
            title="Compact card size - fits more nodes"
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

        {/* Layout Mode Toggle */}
        <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/50">
          <button
            onClick={() => setLayoutMode('tree')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              layoutMode === 'tree'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Tree layout"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Tree
          </button>
          <button
            onClick={() => setLayoutMode('radial')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              layoutMode === 'radial'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Radial layout"
          >
            <Network className="h-3.5 w-3.5" />
            Radial
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

        {/* Selection Navigation - only show when a node is selected */}
        {selectedNodeId && (
          <>
            <div className="w-px h-5 bg-border mx-2" />
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToParent}
                className="h-7 w-7 p-0"
                title="Go to parent (←)"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToChild}
                className="h-7 w-7 p-0"
                title="Go to first child (→)"
                disabled={!hasChildren(selectedNodeId)}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={focusOnSelected}
                className="h-7 px-2 gap-1"
                title="Focus on this subtree (F)"
                disabled={!hasChildren(selectedNodeId)}
              >
                <Crosshair className="h-3.5 w-3.5" />
                <span className="text-xs">Focus</span>
              </Button>
            </div>
          </>
        )}

        {focusedNodeId && (
          <>
            <div className="w-px h-5 bg-border mx-2" />
            <Button variant="ghost" size="sm" onClick={clearFocus} className="h-8 px-2 gap-1.5 text-primary" title="Exit focus mode and show full tree (Esc)">
              <Focus className="h-4 w-4" />
              <span className="text-xs">Exit Focus</span>
            </Button>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom Controls - combined */}
        <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoomLevel <= minZoom}
            className="h-7 w-7 p-0 rounded-r-none"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <button
            onClick={handleZoomReset}
            className="text-xs font-medium text-muted-foreground hover:text-foreground w-12 h-7 text-center bg-background border-x border-border"
            title="Reset zoom to 100%"
          >
            {zoomLevel}%
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoomLevel >= maxZoom}
            className="h-7 w-7 p-0 rounded-l-none"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
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
            title="Toggle organization analytics panel"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrint} className="h-8 w-8 p-0" title="Print org chart">
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
        <div className="print:hidden px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-center">
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
        <div className="print:hidden px-4 py-3 border-b bg-muted/20">
          <FilterPanel
            users={users}
            filters={filters}
            onFiltersChange={setFilters}
            maxAvailableLevel={maxLevel}
          />
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Showing <span className="font-medium text-foreground">{stats.filteredMatch}</span> of{' '}
                <span className="font-medium text-foreground">{stats.filteredTotal}</span> employees
              </span>
              <button
                onClick={() => setFilters({ orgUnits: [], offices: [], maxLevel: null })}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && viewMode === 'chart' && (
        <div className="print:hidden mb-4">
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
          onDoubleClick={handleDoubleClick}
        >
          {/* Canvas content - centered with transform for panning/zooming */}
          <div
            className="absolute inset-0 flex justify-center"
            style={{
              paddingTop: '40px',
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              cursor: isPanning ? 'grabbing' : 'grab',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Tree Layout */}
            {layoutMode === 'tree' && (
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
                    onFocusTeam={handleFocusTeam}
                    onDismissHighlight={handleDismissHighlight}
                  />
                ))}
              </div>
            )}

            {/* Radial Layout */}
            {layoutMode === 'radial' && (
              <RadialOrgChart
                nodes={nodesToRender}
                cardSizeMode={cardSizeMode}
                selectedNodeId={selectedNodeId}
                onSelect={setSelectedNodeId}
                onFocus={handleFocus}
                highlightedNodeId={highlightedUserId}
                onOpenDetail={handleOpenDetail}
                getNodeDescendantCount={getNodeDescendantCount}
                hasChildren={hasChildren}
              />
            )}
          </div>

          {/* Minimap - only show in tree mode */}
          {layoutMode === 'tree' && (
            <div className="print:hidden absolute bottom-4 right-4 z-10">
              <Minimap
                orgTree={nodesToRender}
                isNodeExpanded={isNodeExpanded}
                highlightedNodeId={selectedNodeId || highlightedUserId}
                onNodeClick={(nodeId) => {
                  setSelectedNodeId(nodeId);
                }}
              />
            </div>
          )}

          {/* Help hints at top right */}
          <div className="print:hidden absolute top-3 right-3 flex items-center gap-3 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-1.5 rounded-full pointer-events-none z-10">
            <span><Move className="inline h-3 w-3 mr-1" />Drag to pan</span>
            <span className="text-muted-foreground/50">•</span>
            <span>Double-click to zoom</span>
            <span className="text-muted-foreground/50">•</span>
            <span>Click to expand/collapse</span>
            <span className="text-muted-foreground/50">•</span>
            <span>Right-click for details</span>
          </div>

          {/* Detail Sidebar - inside canvas so it's bounded by canvas height */}
          {selectedDetailNode && (
            <div className="print:hidden">
              <DetailSidebar
                user={selectedDetailNode.user}
                onClose={handleCloseDetail}
                managerName={getManagerName(selectedDetailNode)}
                directReportCount={getDirectChildCount(selectedDetailNode.id)}
                totalDescendantCount={getNodeDescendantCount(selectedDetailNode.id)}
                level={selectedDetailNode.level}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrgChart;
