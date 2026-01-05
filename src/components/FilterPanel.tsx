import React, { useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserData } from '../types';

export interface FilterState {
  orgUnits: string[];
  offices: string[];
  maxLevel: number | null;
}

interface FilterPanelProps {
  users: UserData[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxAvailableLevel: number;
  className?: string;
}

/**
 * Filter panel for org chart
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  users,
  filters,
  onFiltersChange,
  maxAvailableLevel,
  className = '',
}) => {
  // Extract unique values for filters
  const { orgUnits, offices } = useMemo(() => {
    const orgSet = new Set<string>();
    const officeSet = new Set<string>();

    for (const user of users) {
      if (user.organizationUnit) orgSet.add(user.organizationUnit);
      if (user.office) officeSet.add(user.office);
    }

    return {
      orgUnits: Array.from(orgSet).sort(),
      offices: Array.from(officeSet).sort(),
    };
  }, [users]);

  const hasActiveFilters = filters.orgUnits.length > 0 || filters.offices.length > 0 || filters.maxLevel !== null;

  const toggleOrgUnit = (unit: string) => {
    const newUnits = filters.orgUnits.includes(unit)
      ? filters.orgUnits.filter(u => u !== unit)
      : [...filters.orgUnits, unit];
    onFiltersChange({ ...filters, orgUnits: newUnits });
  };

  const toggleOffice = (office: string) => {
    const newOffices = filters.offices.includes(office)
      ? filters.offices.filter(o => o !== office)
      : [...filters.offices, office];
    onFiltersChange({ ...filters, offices: newOffices });
  };

  const setMaxLevel = (level: number | null) => {
    onFiltersChange({ ...filters, maxLevel: level });
  };

  const clearFilters = () => {
    onFiltersChange({ orgUnits: [], offices: [], maxLevel: null });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Level filter */}
      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground">Show levels</div>
        <div className="flex flex-wrap gap-1">
          <Badge
            variant={filters.maxLevel === null ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setMaxLevel(null)}
          >
            All
          </Badge>
          {Array.from({ length: Math.min(maxAvailableLevel, 5) }, (_, i) => i + 1).map(level => (
            <Badge
              key={level}
              variant={filters.maxLevel === level ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setMaxLevel(level)}
            >
              L1-L{level}
            </Badge>
          ))}
        </div>
      </div>

      {/* Org unit filter */}
      {orgUnits.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground">Organization</div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-auto">
            {orgUnits.slice(0, 10).map(unit => (
              <Badge
                key={unit}
                variant={filters.orgUnits.includes(unit) ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleOrgUnit(unit)}
              >
                {unit}
              </Badge>
            ))}
            {orgUnits.length > 10 && (
              <span className="text-xs text-muted-foreground">+{orgUnits.length - 10} more</span>
            )}
          </div>
        </div>
      )}

      {/* Office filter */}
      {offices.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground">Office</div>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-auto">
            {offices.slice(0, 8).map(office => (
              <Badge
                key={office}
                variant={filters.offices.includes(office) ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleOffice(office)}
              >
                {office}
              </Badge>
            ))}
            {offices.length > 8 && (
              <span className="text-xs text-muted-foreground">+{offices.length - 8} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;

