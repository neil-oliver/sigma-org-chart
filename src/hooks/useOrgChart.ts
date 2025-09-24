import { useState, useMemo, useCallback } from 'react';
import { UserData } from '../types';
import { 
  OrgNode, 
  ExpandCollapseState,
  buildOrgChart,
  getVisibleNodes,
  getDescendantCount,
  getVisibleDescendantCount,
  toggleNodeExpansion,
  expandAll,
  collapseAll
} from '../utils/orgChartUtils';

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
  
  // Helper functions
  getNodeDescendantCount: (nodeId: string) => number;
  getNodeVisibleDescendantCount: (nodeId: string) => number;
  hasChildren: (nodeId: string) => boolean;
}

/**
 * Custom hook for managing org chart state and operations
 */
export function useOrgChart(users: UserData[]): UseOrgChartReturn {
  // Build the org chart tree structure
  const orgTree = useMemo(() => {
    return buildOrgChart(users);
  }, [users]);

  // Initialize expand/collapse state - start with all expanded
  const [expandState, setExpandState] = useState<ExpandCollapseState>(() => {
    return expandAll(orgTree);
  });

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

  return {
    orgTree,
    visibleNodes,
    expandState,
    toggleExpansion,
    expandAllNodes,
    collapseAllNodes,
    isNodeExpanded,
    getNodeDescendantCount,
    getNodeVisibleDescendantCount,
    hasChildren,
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
