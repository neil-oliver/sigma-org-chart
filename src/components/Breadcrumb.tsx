import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { OrgNode } from '../utils/orgChartUtils';

interface BreadcrumbProps {
  /** Path from root to current focused node */
  path: OrgNode[];
  /** Called when user clicks a breadcrumb item */
  onNavigate: (nodeId: string | null) => void;
  /** Current focused node ID (null = root view) */
  focusedNodeId: string | null;
  className?: string;
}

/**
 * Breadcrumb navigation showing hierarchy path to current focused node.
 * Clicking any breadcrumb navigates to that level.
 */
const Breadcrumb: React.FC<BreadcrumbProps> = ({
  path,
  onNavigate,
  focusedNodeId,
  className = '',
}) => {
  // If no focused node, show minimal breadcrumb
  if (!focusedNodeId || path.length === 0) {
    return (
      <nav className={`flex items-center gap-1 text-sm ${className}`} aria-label="Breadcrumb">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
          <Home className="h-3.5 w-3.5" />
          Organization
        </span>
      </nav>
    );
  }

  return (
    <nav className={`flex items-center gap-1 text-sm flex-wrap ${className}`} aria-label="Breadcrumb">
      {/* Root/Home button */}
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        title="Back to full org chart"
      >
        <Home className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Organization</span>
      </button>

      {/* Path items */}
      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        const isFocused = node.id === focusedNodeId;

        return (
          <React.Fragment key={node.id}>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            
            {isLast || isFocused ? (
              // Current/focused node - not clickable
              <span 
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary font-medium truncate max-w-[200px]"
                title={node.user.fullName}
              >
                <span className="text-xs text-primary/60 font-normal">L{node.level + 1}</span>
                {node.user.fullName}
              </span>
            ) : (
              // Navigable ancestor
              <button
                onClick={() => onNavigate(node.id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground truncate max-w-[200px]"
                title={`Focus on ${node.user.fullName}`}
              >
                <span className="text-xs opacity-60">L{node.level + 1}</span>
                {node.user.fullName}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;

