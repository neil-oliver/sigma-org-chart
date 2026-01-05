import { useCallback, useEffect, useState } from 'react';
import { OrgNode } from '../utils/orgChartUtils';

interface UseKeyboardNavigationOptions {
  /** Root nodes of the tree */
  orgTree: OrgNode[];
  /** Check if a node is expanded */
  isNodeExpanded: (nodeId: string) => boolean;
  /** Toggle node expansion */
  toggleExpansion: (nodeId: string) => void;
  /** Focus on a specific subtree */
  onFocus: (nodeId: string) => void;
  /** Currently focused node ID (for subtree view) */
  focusedNodeId: string | null;
  /** Clear focus (return to full view) */
  clearFocus: () => void;
  /** Check if node has children */
  hasChildren: (nodeId: string) => boolean;
  /** Find node by ID */
  findNode: (nodeId: string) => OrgNode | null;
}

interface UseKeyboardNavigationReturn {
  /** Currently selected node ID for keyboard navigation */
  selectedNodeId: string | null;
  /** Set the selected node */
  setSelectedNodeId: (nodeId: string | null) => void;
  /** Is keyboard navigation active */
  isKeyboardActive: boolean;
  /** Navigate to parent of selected node */
  goToParent: () => void;
  /** Navigate to first child of selected node (expands if needed) */
  goToChild: () => void;
  /** Focus on selected node's subtree */
  focusOnSelected: () => void;
}

/**
 * Hook for keyboard navigation in org chart
 * - Arrow Up/Down: Navigate siblings
 * - Arrow Left: Go to parent
 * - Arrow Right: Go to first child (expands if needed)
 * - Enter: Toggle expand/collapse
 * - Space: Focus on selected subtree
 * - Escape: Clear selection or exit focus mode
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions
): UseKeyboardNavigationReturn {
  const {
    orgTree,
    isNodeExpanded,
    toggleExpansion,
    onFocus,
    focusedNodeId,
    clearFocus,
    hasChildren,
    findNode,
  } = options;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  // Find siblings and current index
  const findSiblings = useCallback((nodeId: string): { siblings: OrgNode[], index: number, parent: OrgNode | null } => {
    // Check if it's a root node
    const rootIndex = orgTree.findIndex(n => n.id === nodeId);
    if (rootIndex >= 0) {
      return { siblings: orgTree, index: rootIndex, parent: null };
    }

    // Search through tree for parent
    const findInTree = (nodes: OrgNode[], parent: OrgNode | null): { siblings: OrgNode[], index: number, parent: OrgNode | null } | null => {
      for (const node of nodes) {
        const childIndex = node.children.findIndex(c => c.id === nodeId);
        if (childIndex >= 0) {
          return { siblings: node.children, index: childIndex, parent: node };
        }
        const found = findInTree(node.children, node);
        if (found) return found;
      }
      return null;
    };

    return findInTree(orgTree, null) || { siblings: [], index: -1, parent: null };
  }, [orgTree]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't capture keys when user is typing in an input, textarea, or contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // Only handle if we have a selection
    if (!selectedNodeId) {
      // On first arrow key, select first visible node
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const firstNode = focusedNodeId ? findNode(focusedNodeId) : orgTree[0];
        if (firstNode) {
          setSelectedNodeId(firstNode.id);
          setIsKeyboardActive(true);
          event.preventDefault();
        }
      }
      return;
    }

    const node = findNode(selectedNodeId);
    if (!node) return;

    switch (event.key) {
      case 'ArrowUp': {
        event.preventDefault();
        const { siblings, index } = findSiblings(selectedNodeId);
        if (index > 0) {
          setSelectedNodeId(siblings[index - 1].id);
        }
        break;
      }
      case 'ArrowDown': {
        event.preventDefault();
        const { siblings, index } = findSiblings(selectedNodeId);
        if (index < siblings.length - 1) {
          setSelectedNodeId(siblings[index + 1].id);
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const { parent } = findSiblings(selectedNodeId);
        if (parent) {
          setSelectedNodeId(parent.id);
        }
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (hasChildren(selectedNodeId)) {
          if (!isNodeExpanded(selectedNodeId)) {
            toggleExpansion(selectedNodeId);
          }
          // Move to first child after a short delay for expansion
          setTimeout(() => {
            const updatedNode = findNode(selectedNodeId);
            if (updatedNode && updatedNode.children.length > 0) {
              setSelectedNodeId(updatedNode.children[0].id);
            }
          }, 50);
        }
        break;
      }
      case 'Enter': {
        event.preventDefault();
        if (hasChildren(selectedNodeId)) {
          toggleExpansion(selectedNodeId);
        }
        break;
      }
      case ' ':
      case 'f':
      case 'F': {
        event.preventDefault();
        if (hasChildren(selectedNodeId)) {
          onFocus(selectedNodeId);
        }
        break;
      }
      case 'Escape': {
        event.preventDefault();
        if (focusedNodeId) {
          clearFocus();
        } else {
          setSelectedNodeId(null);
          setIsKeyboardActive(false);
        }
        break;
      }
    }
  }, [selectedNodeId, focusedNodeId, orgTree, findNode, findSiblings, hasChildren, isNodeExpanded, toggleExpansion, onFocus, clearFocus]);

  // Navigate to parent of selected node
  const goToParent = useCallback(() => {
    if (!selectedNodeId) return;
    const { parent } = findSiblings(selectedNodeId);
    if (parent) {
      setSelectedNodeId(parent.id);
      setIsKeyboardActive(true);
    }
  }, [selectedNodeId, findSiblings]);

  // Navigate to first child of selected node (expands if needed)
  const goToChild = useCallback(() => {
    if (!selectedNodeId) return;
    if (hasChildren(selectedNodeId)) {
      if (!isNodeExpanded(selectedNodeId)) {
        toggleExpansion(selectedNodeId);
      }
      // Move to first child after a short delay for expansion
      setTimeout(() => {
        const node = findNode(selectedNodeId);
        if (node && node.children.length > 0) {
          setSelectedNodeId(node.children[0].id);
          setIsKeyboardActive(true);
        }
      }, 50);
    }
  }, [selectedNodeId, hasChildren, isNodeExpanded, toggleExpansion, findNode]);

  // Focus on selected node's subtree
  const focusOnSelected = useCallback(() => {
    if (!selectedNodeId) return;
    if (hasChildren(selectedNodeId)) {
      onFocus(selectedNodeId);
    }
  }, [selectedNodeId, hasChildren, onFocus]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    selectedNodeId,
    setSelectedNodeId,
    isKeyboardActive,
    goToParent,
    goToChild,
    focusOnSelected,
  };
}

