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

/**
 * Expand nodes to a specific depth
 * @param roots - Root nodes of the tree
 * @param depth - How many levels to expand (1 = just root, 2 = root + children, etc.)
 */
export function expandToDepth(roots: OrgNode[], depth: number): ExpandCollapseState {
  const state: ExpandCollapseState = {};

  const setExpandedToDepth = (node: OrgNode, currentLevel: number = 0) => {
    // Expand if we're within the desired depth
    state[node.id] = currentLevel < depth;
    node.children.forEach(child => setExpandedToDepth(child, currentLevel + 1));
  };

  roots.forEach(root => setExpandedToDepth(root, 0));
  return state;
}

/**
 * Get the path from root to a specific node
 */
export function getNodePath(roots: OrgNode[], nodeId: string): OrgNode[] {
  for (const root of roots) {
    const path = findPathToNode(root, nodeId, []);
    if (path) return path;
  }
  return [];
}

function findPathToNode(node: OrgNode, nodeId: string, currentPath: OrgNode[]): OrgNode[] | null {
  const newPath = [...currentPath, node];

  if (node.id === nodeId) {
    return newPath;
  }

  for (const child of node.children) {
    const foundPath = findPathToNode(child, nodeId, newPath);
    if (foundPath) return foundPath;
  }

  return null;
}

/**
 * Detect circular references in the org data
 * Returns array of node IDs that form cycles
 */
export function detectCircularRefs(users: UserData[]): string[] {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[] = [];

  const userMap = new Map<string, UserData>();
  users.forEach(user => userMap.set(user.fullName, user));

  const dfs = (userName: string): boolean => {
    if (inStack.has(userName)) {
      cycles.push(userName);
      return true;
    }
    if (visited.has(userName)) {
      return false;
    }

    visited.add(userName);
    inStack.add(userName);

    const user = userMap.get(userName);
    if (user?.manager && userMap.has(user.manager)) {
      dfs(user.manager);
    }

    inStack.delete(userName);
    return false;
  };

  users.forEach(user => {
    if (!visited.has(user.fullName)) {
      dfs(user.fullName);
    }
  });

  return cycles;
}

/**
 * Validate and clean org data, handling edge cases
 * Returns cleaned users array and any warnings
 */
export interface ValidationResult {
  users: UserData[];
  warnings: string[];
  stats: {
    totalUsers: number;
    rootNodes: number;
    orphanedNodes: number;
    circularRefs: number;
  };
}

export function validateOrgData(users: UserData[]): ValidationResult {
  const warnings: string[] = [];
  const userNames = new Set(users.map(u => u.fullName));

  // Check for circular references
  const circularRefs = detectCircularRefs(users);
  if (circularRefs.length > 0) {
    warnings.push(`Detected ${circularRefs.length} circular reference(s)`);
  }

  // Count orphaned nodes (manager not in dataset)
  let orphanedCount = 0;
  users.forEach(user => {
    if (user.manager && !userNames.has(user.manager)) {
      orphanedCount++;
    }
  });

  if (orphanedCount > 0) {
    warnings.push(`${orphanedCount} employee(s) have managers not in the dataset`);
  }

  // Count root nodes
  const rootCount = users.filter(u => !u.manager || !userNames.has(u.manager)).length;

  return {
    users, // Return as-is; buildOrgChart handles orphans gracefully
    warnings,
    stats: {
      totalUsers: users.length,
      rootNodes: rootCount,
      orphanedNodes: orphanedCount,
      circularRefs: circularRefs.length,
    }
  };
}

/**
 * Categorize users into properly mapped (in tree) vs unmapped
 * Unmapped = has a manager field that doesn't match any user's fullName
 */
export interface MappingResult {
  /** Users that form a proper tree (root + all descendants) */
  mappedUsers: UserData[];
  /** Users whose manager doesn't exist in the dataset */
  unmappedUsers: UserData[];
  /** The true root(s) - users with no manager or empty manager */
  trueRoots: UserData[];
}

export function categorizeMappedUsers(users: UserData[]): MappingResult {
  const userNames = new Set(users.map(u => u.fullName));

  // True roots: no manager at all (empty string, null, undefined)
  const trueRoots = users.filter(u => !u.manager || u.manager.trim() === '');

  // Unmapped: has a manager but that manager doesn't exist in dataset
  const unmappedUsers = users.filter(u =>
    u.manager &&
    u.manager.trim() !== '' &&
    !userNames.has(u.manager)
  );

  // Build set of all users reachable from true roots
  const mappedSet = new Set<string>();

  // Create quick lookup of children by manager
  const childrenByManager = new Map<string, UserData[]>();
  users.forEach(user => {
    if (user.manager && userNames.has(user.manager)) {
      const children = childrenByManager.get(user.manager) || [];
      children.push(user);
      childrenByManager.set(user.manager, children);
    }
  });

  // BFS from true roots to find all mapped users
  const queue = [...trueRoots];
  while (queue.length > 0) {
    const user = queue.shift()!;
    if (mappedSet.has(user.fullName)) continue;
    mappedSet.add(user.fullName);

    const children = childrenByManager.get(user.fullName) || [];
    queue.push(...children);
  }

  const mappedUsers = users.filter(u => mappedSet.has(u.fullName));

  return {
    mappedUsers,
    unmappedUsers,
    trueRoots,
  };
}

/**
 * Filter criteria for org tree
 */
export interface FilterCriteria {
  orgUnits: string[];
  offices: string[];
  maxLevel: number | null;
}

/**
 * Result of filtering the org tree
 */
export interface FilterResult {
  /** Filtered tree (only contains paths to matching nodes) */
  filteredTree: OrgNode[];
  /** Count of nodes that match the filter */
  matchCount: number;
  /** Total nodes before filtering */
  totalCount: number;
}

/**
 * Check if a node matches the filter criteria
 */
function nodeMatchesFilter(node: OrgNode, filters: FilterCriteria): boolean {
  // If no filters active, everything matches
  if (filters.orgUnits.length === 0 && filters.offices.length === 0 && filters.maxLevel === null) {
    return true;
  }

  // Check max level (0-indexed, so maxLevel=1 means only level 0)
  if (filters.maxLevel !== null && node.level >= filters.maxLevel) {
    return false;
  }

  // Check org unit filter
  if (filters.orgUnits.length > 0) {
    if (!node.user.organizationUnit || !filters.orgUnits.includes(node.user.organizationUnit)) {
      return false;
    }
  }

  // Check office filter
  if (filters.offices.length > 0) {
    if (!node.user.office || !filters.offices.includes(node.user.office)) {
      return false;
    }
  }

  return true;
}

/**
 * Filter the org tree based on criteria
 *
 * Strategy:
 * - Keep nodes that match the filter
 * - Also keep ancestor nodes (to preserve hierarchy) even if they don't match
 * - Prune branches where no descendants match
 * - Mark nodes as "dimmed" if they don't match but are kept as ancestors
 */
export function filterOrgTree(roots: OrgNode[], filters: FilterCriteria): FilterResult {
  // If no filters are active, return original tree
  if (filters.orgUnits.length === 0 && filters.offices.length === 0 && filters.maxLevel === null) {
    let totalCount = 0;
    const countNodes = (nodes: OrgNode[]) => {
      for (const node of nodes) {
        totalCount++;
        countNodes(node.children);
      }
    };
    countNodes(roots);
    return { filteredTree: roots, matchCount: totalCount, totalCount };
  }

  let matchCount = 0;
  let totalCount = 0;

  const filterNode = (node: OrgNode): OrgNode | null => {
    totalCount++;

    const matches = nodeMatchesFilter(node, filters);
    if (matches) {
      matchCount++;
    }

    // Filter children recursively
    const filteredChildren: OrgNode[] = [];
    for (const child of node.children) {
      const filteredChild = filterNode(child);
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    }

    // Keep this node if it matches OR if any children were kept
    if (matches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  };

  const filteredTree: OrgNode[] = [];
  for (const root of roots) {
    const filtered = filterNode(root);
    if (filtered) {
      filteredTree.push(filtered);
    }
  }

  return { filteredTree, matchCount, totalCount };
}

/**
 * Check if a node matches the filter (for dimming purposes)
 * Exposed for use in rendering to dim non-matching ancestor nodes
 */
export function doesNodeMatchFilter(node: OrgNode, filters: FilterCriteria): boolean {
  return nodeMatchesFilter(node, filters);
}
