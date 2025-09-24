import React from 'react';
import { Button } from './ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import UserCard from './UserCard';
import { UserData } from '../types';
import { useOrgChart } from '../hooks/useOrgChart';
import { OrgNode } from '../utils/orgChartUtils';

interface OrgChartProps {
  users: UserData[];
  className?: string;
}

interface OrgNodeComponentProps {
  node: OrgNode;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  getNodeDescendantCount: (nodeId: string) => number;
  getNodeVisibleDescendantCount: (nodeId: string) => number;
  hasChildren: (nodeId: string) => boolean;
  isNodeExpanded?: (nodeId: string) => boolean;
}

const OrgNodeComponent: React.FC<OrgNodeComponentProps> = ({
  node,
  isExpanded,
  onToggleExpand,
  getNodeDescendantCount,
  getNodeVisibleDescendantCount,
  hasChildren,
  isNodeExpanded
}) => {
  const nodeHasChildren = hasChildren(node.id);
  const descendantCount = getNodeDescendantCount(node.id);
  const visibleDescendantCount = getNodeVisibleDescendantCount(node.id);

  return (
    <div className="org-node flex flex-col items-center">
      {/* User Card */}
      <UserCard
        user={node.user}
        hasChildren={nodeHasChildren}
        childCount={descendantCount}
        visibleChildCount={visibleDescendantCount}
        isExpanded={isExpanded}
        level={node.level}
        onToggleExpand={() => onToggleExpand(node.id)}
        className="mb-8"
      />
      
      {/* Children Container */}
      {nodeHasChildren && isExpanded && (
        <div className="children-container relative">
          {/* Vertical line from parent */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-border"></div>
          
          {/* Horizontal line connecting children */}
          {node.children.length > 1 && (
            <div 
              className="absolute top-4 bg-border h-0.5"
              style={{
                left: `${(1 / node.children.length) * 50}%`,
                right: `${(1 / node.children.length) * 50}%`,
              }}
            ></div>
          )}
          
          {/* Children Grid */}
          <div 
            className="flex justify-center items-start gap-8 pt-6"
            style={{
              minWidth: `${Math.max(node.children.length * 320, 320)}px`
            }}
          >
            {node.children.map((child) => (
              <div key={child.id} className="relative">
                {/* Vertical line to child */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-border"></div>
                
                <OrgNodeComponent
                  node={child}
                  isExpanded={isNodeExpanded ? isNodeExpanded(child.id) : true}
                  onToggleExpand={onToggleExpand}
                  getNodeDescendantCount={getNodeDescendantCount}
                  getNodeVisibleDescendantCount={getNodeVisibleDescendantCount}
                  hasChildren={hasChildren}
                  isNodeExpanded={isNodeExpanded}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const OrgChart: React.FC<OrgChartProps> = ({ users, className = '' }) => {
  const {
    orgTree,
    expandState,
    toggleExpansion,
    expandAllNodes,
    collapseAllNodes,
    isNodeExpanded,
    getNodeDescendantCount,
    getNodeVisibleDescendantCount,
    hasChildren,
  } = useOrgChart(users);

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
      {/* Control Panel */}
      <div className="flex justify-center items-center gap-2 mb-8">
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
      </div>

      {/* Organization Chart */}
      <div className="org-chart overflow-x-auto">
        <div className="flex justify-center items-start gap-12 min-w-fit pb-8">
          {orgTree.map((rootNode) => (
            <OrgNodeComponent
              key={rootNode.id}
              node={rootNode}
              isExpanded={isNodeExpanded(rootNode.id)}
              onToggleExpand={toggleExpansion}
              getNodeDescendantCount={getNodeDescendantCount}
              getNodeVisibleDescendantCount={getNodeVisibleDescendantCount}
              hasChildren={hasChildren}
              isNodeExpanded={isNodeExpanded}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrgChart;
