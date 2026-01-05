import React from 'react';

interface ChildrenContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Show the connecting line from parent */
  showConnector?: boolean;
  /** Label to show in the container header (e.g., "12 direct reports") */
  label?: string;
  /** Number of children for line calculations */
  childCount?: number;
}

/**
 * Visual grouping container for child nodes in the org chart.
 * Uses classic org chart tree lines connecting parent to children.
 */
const ChildrenContainer: React.FC<ChildrenContainerProps> = ({
  children,
  className = '',
  showConnector = true,
  label,
  childCount = 0,
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Classic org chart connector lines */}
      {showConnector && (
        <div className="relative flex flex-col items-center">
          {/* Vertical line from parent */}
          <div className="w-0.5 h-6 bg-border" />

          {/* Horizontal spanning line - only show if multiple children */}
          {childCount > 1 && (
            <div className="relative w-full flex justify-center">
              <div
                className="h-0.5 bg-border"
                style={{
                  width: `calc(100% - 40px)`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Label badge */}
      {label && (
        <div className="flex justify-center -mt-2 mb-2 relative z-10">
          <span className="px-3 py-1 text-xs text-muted-foreground bg-background border border-border/50 rounded-full font-medium shadow-sm">
            {label}
          </span>
        </div>
      )}

      {/* Children row with individual drop lines */}
      <div className="relative">
        {/* Children in horizontal row - no wrap for tree visualization */}
        <div
          className="
            flex
            justify-center
            gap-4
            pt-2
          "
        >
          {React.Children.map(children, (child, index) => (
            <div key={index} className="relative flex flex-col items-center">
              {/* Individual vertical connector to each child */}
              {showConnector && (
                <div className="w-0.5 h-4 bg-border -mt-2 mb-1" />
              )}
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChildrenContainer;

