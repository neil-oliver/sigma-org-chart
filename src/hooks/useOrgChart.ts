import { useState, useMemo, useCallback, useEffect } from 'react';
import { UserData, CardSizeMode } from '../types';
import {
  OrgNode,
  ExpandCollapseState,
  buildOrgChart,
  getVisibleNodes,
  getDescendantCount,
  getVisibleDescendantCount,
  toggleNodeExpansion,
  expandAll,
  collapseAll,
  expandToDepth,
  getNodePath
} from '../utils/orgChartUtils';

export interface UseOrgChartOptions {
  /** How many levels to expand initially (default: 2 = root + direct reports) */
  initialExpandDepth?: number;
  /** Default card size mode */
  cardSizeMode?: CardSizeMode;
}

export interface UseOrgChartReturn {
  // Tree structure
  orgTree: OrgNode[];
  visibleNodes: OrgNode[];

  // Expand/Collapse state
  expandState: ExpandCollapseState;
  toggleExpansion: (nodeId: string) => void;
  expandAllNodes: () => void;
  collapseAllNodes: () => void;
  isNodeExpanded: (nodeId: string) => boolean;
  resetToDefaultExpand: () => void;

  // Navigation helpers
  getNodePath: (nodeId: string) => OrgNode[];
  findNode: (nodeId: string) => OrgNode | null;

  // Card size
  cardSizeMode: CardSizeMode;
  setCardSizeMode: (mode: CardSizeMode) => void;

  // Helper functions
  getNodeDescendantCount: (nodeId: string) => number;
  getNodeVisibleDescendantCount: (nodeId: string) => number;
  hasChildren: (nodeId: string) => boolean;
  getDirectChildCount: (nodeId: string) => number;
}

const DEFAULT_OPTIONS: UseOrgChartOptions = {
  initialExpandDepth: 1, // Just root expanded, showing first-level direct reports
  cardSizeMode: 'standard',
};

/**
 * Custom hook for managing org chart state and operations
 */
export function useOrgChart(
  users: UserData[],
  options: UseOrgChartOptions = {}
): UseOrgChartReturn {
  const { initialExpandDepth, cardSizeMode: defaultCardSizeMode } = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  // Build the org chart tree structure
  const orgTree = useMemo(() => {
    return buildOrgChart(users);
  }, [users]);

  // Card size mode state
  const [cardSizeMode, setCardSizeMode] = useState<CardSizeMode>(defaultCardSizeMode!);

  // Initialize expand/collapse state based on initial depth
  const [expandState, setExpandState] = useState<ExpandCollapseState>(() => {
    return expandToDepth(orgTree, initialExpandDepth!);
  });

  // Reset expand state when tree changes significantly
  useEffect(() => {
    setExpandState(expandToDepth(orgTree, initialExpandDepth!));
  }, [orgTree, initialExpandDepth]);

  // Get currently visible nodes based on expand state
  const visibleNodes = useMemo(() => {
    return getVisibleNodes(orgTree, expandState);
  }, [orgTree, expandState]);

  // Toggle expansion of a specific node
  const toggleExpansion = useCallback((nodeId: string) => {
    setExpandState(currentState => toggleNodeExpansion(currentState, nodeId));
  }, []);

  // Expand all nodes
  const expandAllNodes = useCallback(() => {
    setExpandState(expandAll(orgTree));
  }, [orgTree]);

  // Collapse all nodes except root level
  const collapseAllNodes = useCallback(() => {
    setExpandState(collapseAll(orgTree));
  }, [orgTree]);

  // Check if a node is expanded
  const isNodeExpanded = useCallback((nodeId: string): boolean => {
    return expandState[nodeId] !== false;
  }, [expandState]);

  // Get total descendant count for a node
  const getNodeDescendantCount = useCallback((nodeId: string): number => {
    for (const root of orgTree) {
      const node = findNodeInTree(root, nodeId);
      if (node) return getDescendantCount(node);
    }
    return 0;
  }, [orgTree]);

  // Get visible descendant count for a node
  const getNodeVisibleDescendantCount = useCallback((nodeId: string): number => {
    for (const root of orgTree) {
      const node = findNodeInTree(root, nodeId);
      if (node) return getVisibleDescendantCount(node, expandState);
    }
    return 0;
  }, [orgTree, expandState]);

  // Check if a node has children
  const hasChildren = useCallback((nodeId: string): boolean => {
    for (const root of orgTree) {
      const node = findNodeInTree(root, nodeId);
      if (node) return node.children.length > 0;
    }
    return false;
  }, [orgTree]);

  // Get direct child count for a node
  const getDirectChildCount = useCallback((nodeId: string): number => {
    for (const root of orgTree) {
      const node = findNodeInTree(root, nodeId);
      if (node) return node.children.length;
    }
    return 0;
  }, [orgTree]);

  // Reset to default expand state
  const resetToDefaultExpand = useCallback(() => {
    setExpandState(expandToDepth(orgTree, initialExpandDepth!));
  }, [orgTree, initialExpandDepth]);

  // Find a node by ID
  const findNode = useCallback((nodeId: string): OrgNode | null => {
    for (const root of orgTree) {
      const node = findNodeInTree(root, nodeId);
      if (node) return node;
    }
    return null;
  }, [orgTree]);

  // Get path from root to a node
  const getNodePathCallback = useCallback((nodeId: string): OrgNode[] => {
    return getNodePath(orgTree, nodeId);
  }, [orgTree]);

  return {
    orgTree,
    visibleNodes,
    expandState,
    toggleExpansion,
    expandAllNodes,
    collapseAllNodes,
    isNodeExpanded,
    resetToDefaultExpand,
    getNodePath: getNodePathCallback,
    findNode,
    cardSizeMode,
    setCardSizeMode,
    getNodeDescendantCount,
    getNodeVisibleDescendantCount,
    hasChildren,
    getDirectChildCount,
  };
}

// Helper function to find a node in the tree
function findNodeInTree(node: OrgNode, nodeId: string): OrgNode | null {
  if (node.id === nodeId) return node;

  for (const child of node.children) {
    const found = findNodeInTree(child, nodeId);
    if (found) return found;
  }

  return null;
}
