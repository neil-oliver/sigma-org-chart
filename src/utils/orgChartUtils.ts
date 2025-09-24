import { UserData } from '../types';

export interface OrgNode {
  user: UserData;
  children: OrgNode[];
  id: string;
  parentId: string | null;
  level: number;
  isExpanded: boolean;
}

export interface ExpandCollapseState {
  [nodeId: string]: boolean;
}

/**
 * Transform flat array of users into hierarchical tree structure
 */
export function buildOrgChart(users: UserData[]): OrgNode[] {
  // Create a map of users by their full name for quick lookup
  const userMap = new Map<string, UserData>();
  users.forEach(user => {
    userMap.set(user.fullName, user);
  });

  // Create nodes map
  const nodes = new Map<string, OrgNode>();
  
  // First pass: create all nodes
  users.forEach(user => {
    const node: OrgNode = {
      user,
      children: [],
      id: user.fullName,
      parentId: user.manager || null,
      level: 0,
      isExpanded: true // Default to expanded
    };
    nodes.set(user.fullName, node);
  });

  // Second pass: build parent-child relationships and calculate levels
  const rootNodes: OrgNode[] = [];
  
  nodes.forEach(node => {
    if (node.parentId && nodes.has(node.parentId)) {
      // Add this node as child of its parent
      const parent = nodes.get(node.parentId)!;
      parent.children.push(node);
      node.level = parent.level + 1;
    } else {
      // This is a root node (no manager or manager not found)
      rootNodes.push(node);
    }
  });

  // Sort children by name for consistent ordering
  const sortChildren = (node: OrgNode) => {
    node.children.sort((a, b) => a.user.fullName.localeCompare(b.user.fullName));
    node.children.forEach(sortChildren);
  };

  rootNodes.forEach(sortChildren);
  
  return rootNodes;
}

/**
 * Get all visible nodes based on expand/collapse state
 */
export function getVisibleNodes(roots: OrgNode[], expandState: ExpandCollapseState): OrgNode[] {
  const visible: OrgNode[] = [];
  
  const traverse = (node: OrgNode) => {
    visible.push(node);
    
    // Only traverse children if this node is expanded
    if (expandState[node.id] !== false) {
      node.children.forEach(traverse);
    }
  };
  
  roots.forEach(traverse);
  return visible;
}

/**
 * Count total number of descendants for a node
 */
export function getDescendantCount(node: OrgNode): number {
  return node.children.reduce((count, child) => {
    return count + 1 + getDescendantCount(child);
  }, 0);
}

/**
 * Get all descendants that are currently visible
 */
export function getVisibleDescendantCount(node: OrgNode, expandState: ExpandCollapseState): number {
  if (expandState[node.id] === false) {
    return 0;
  }
  
  return node.children.reduce((count, child) => {
    return count + 1 + getVisibleDescendantCount(child, expandState);
  }, 0);
}

/**
 * Find a node by ID in the tree
 */
export function findNode(roots: OrgNode[], nodeId: string): OrgNode | null {
  for (const root of roots) {
    const found = findNodeInTree(root, nodeId);
    if (found) return found;
  }
  return null;
}

function findNodeInTree(node: OrgNode, nodeId: string): OrgNode | null {
  if (node.id === nodeId) return node;
  
  for (const child of node.children) {
    const found = findNodeInTree(child, nodeId);
    if (found) return found;
  }
  
  return null;
}

/**
 * Toggle expand/collapse state for a node
 */
export function toggleNodeExpansion(
  expandState: ExpandCollapseState, 
  nodeId: string
): ExpandCollapseState {
  return {
    ...expandState,
    [nodeId]: expandState[nodeId] !== false ? false : true
  };
}

/**
 * Expand all nodes in the tree
 */
export function expandAll(roots: OrgNode[]): ExpandCollapseState {
  const state: ExpandCollapseState = {};
  
  const setExpanded = (node: OrgNode) => {
    state[node.id] = true;
    node.children.forEach(setExpanded);
  };
  
  roots.forEach(setExpanded);
  return state;
}

/**
 * Collapse all nodes except root level
 */
export function collapseAll(roots: OrgNode[]): ExpandCollapseState {
  const state: ExpandCollapseState = {};
  
  const setCollapsed = (node: OrgNode, level: number = 0) => {
    // Keep root level expanded, collapse everything else
    state[node.id] = level === 0;
    node.children.forEach(child => setCollapsed(child, level + 1));
  };
  
  roots.forEach(root => setCollapsed(root));
  return state;
}
