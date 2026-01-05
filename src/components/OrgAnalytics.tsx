import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Users, Layers, GitBranch, BarChart3 } from 'lucide-react';
import { OrgNode } from '../utils/orgChartUtils';

interface OrgAnalyticsProps {
  orgTree: OrgNode[];
  totalUsers: number;
  className?: string;
}

interface AnalyticsData {
  maxDepth: number;
  avgSpanOfControl: number;
  maxSpanOfControl: number;
  levelDistribution: { level: number; count: number }[];
  managersCount: number;
  individualContributors: number;
}

function computeAnalytics(orgTree: OrgNode[]): AnalyticsData {
  let maxDepth = 0;
  let totalDirectReports = 0;
  let managersCount = 0;
  let maxSpanOfControl = 0;
  const levelCounts: Map<number, number> = new Map();

  const traverse = (nodes: OrgNode[], depth: number) => {
    for (const node of nodes) {
      // Track depth
      maxDepth = Math.max(maxDepth, depth);
      
      // Track level distribution
      levelCounts.set(depth, (levelCounts.get(depth) || 0) + 1);
      
      // Track span of control
      const directReports = node.children.length;
      if (directReports > 0) {
        managersCount++;
        totalDirectReports += directReports;
        maxSpanOfControl = Math.max(maxSpanOfControl, directReports);
      }
      
      traverse(node.children, depth + 1);
    }
  };

  traverse(orgTree, 0);

  const avgSpanOfControl = managersCount > 0 
    ? Math.round((totalDirectReports / managersCount) * 10) / 10 
    : 0;

  // Convert level counts to sorted array
  const levelDistribution = Array.from(levelCounts.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => a.level - b.level);

  const totalPeople = levelDistribution.reduce((sum, l) => sum + l.count, 0);
  const individualContributors = totalPeople - managersCount;

  return {
    maxDepth,
    avgSpanOfControl,
    maxSpanOfControl,
    levelDistribution,
    managersCount,
    individualContributors,
  };
}

const OrgAnalytics: React.FC<OrgAnalyticsProps> = ({ orgTree, totalUsers, className = '' }) => {
  const analytics = useMemo(() => computeAnalytics(orgTree), [orgTree]);

  if (totalUsers === 0) return null;

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Organization Analytics</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-2xl font-bold">{totalUsers}</div>
          <div className="text-xs text-muted-foreground">Total Employees</div>
        </div>

        {/* Org Depth */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <Layers className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-2xl font-bold">{analytics.maxDepth + 1}</div>
          <div className="text-xs text-muted-foreground">Org Levels</div>
        </div>

        {/* Avg Span of Control */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <GitBranch className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-2xl font-bold">{analytics.avgSpanOfControl}</div>
          <div className="text-xs text-muted-foreground">Avg Reports/Manager</div>
        </div>

        {/* Managers vs ICs */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-2xl font-bold">
            {analytics.managersCount}
            <span className="text-sm font-normal text-muted-foreground"> / {analytics.individualContributors}</span>
          </div>
          <div className="text-xs text-muted-foreground">Managers / ICs</div>
        </div>
      </div>

      {/* Level Distribution Bar */}
      <div className="mt-4">
        <div className="text-xs text-muted-foreground mb-2">Distribution by Level</div>
        <div className="flex gap-1 h-8">
          {analytics.levelDistribution.map(({ level, count }) => {
            const maxCount = Math.max(...analytics.levelDistribution.map(l => l.count));
            const height = (count / maxCount) * 100;
            return (
              <div
                key={level}
                className="flex-1 flex flex-col items-center justify-end"
                title={`Level ${level + 1}: ${count} people`}
              >
                <div 
                  className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                />
                <div className="text-[10px] text-muted-foreground mt-1">L{level + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default OrgAnalytics;

