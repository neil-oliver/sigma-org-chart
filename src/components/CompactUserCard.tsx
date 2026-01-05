import React from 'react';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { UserData } from '../types';

interface CompactUserCardProps {
  user: UserData;
  className?: string;
  hasChildren?: boolean;
  childCount?: number;
  isExpanded?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  /** Level in the hierarchy (0-indexed) */
  level?: number;
  /** Show level indicator badge */
  showLevelBadge?: boolean;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Compute a stable index from a string for consistent color selection
function stableIndexFromString(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

// Choose accent color based on organization unit
function getAccentColor(organizationUnit?: string): string {
  const colors = [
    'bg-violet-500',
    'bg-fuchsia-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-sky-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-amber-500',
  ];

  if (!organizationUnit) {
    return colors[0];
  }

  const index = stableIndexFromString(organizationUnit, colors.length);
  return colors[index];
}

const CompactUserCard: React.FC<CompactUserCardProps> = ({
  user,
  className = '',
  hasChildren = false,
  childCount = 0,
  isExpanded = false,
  isHighlighted = false,
  isDimmed = false,
  onClick,
  onDoubleClick,
  level = 0,
  showLevelBadge = true,
}) => {
  const accentColor = getAccentColor(user.organizationUnit);

  return (
    <Card
      className={`
        w-40 p-3 cursor-pointer relative
        transition-all duration-200
        hover:shadow-md hover:scale-[1.02]
        border bg-card/80 backdrop-blur-sm
        ${isHighlighted ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${isDimmed ? 'opacity-40' : ''}
        ${className}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-lg ${accentColor}`} />

      {/* Level badge */}
      {showLevelBadge && (
        <div className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
          L{level + 1}
        </div>
      )}

      <div className="flex flex-col items-center text-center pt-1">
        {/* Avatar */}
        <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
          <AvatarImage
            src={user.profileImage}
            alt={user.fullName}
            className="object-cover"
          />
          <AvatarFallback className="text-xs font-medium bg-muted">
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Name */}
        <h4 className="mt-2 text-sm font-medium leading-tight truncate w-full">
          {user.fullName}
        </h4>

        {/* Title */}
        <p className="text-xs text-muted-foreground truncate w-full">
          {user.jobTitle || 'No title'}
        </p>

        {/* Expand indicator with child count */}
        {hasChildren && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <Users className="h-3 w-3" />
            <span>{childCount}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CompactUserCard;

