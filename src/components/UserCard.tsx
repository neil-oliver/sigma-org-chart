import React from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Mail, MessageCircle, Building2, MapPin, Calendar, Users, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { UserData } from '../types';
import CardMenu from './CardMenu';

interface UserCardProps {
  user: UserData;
  className?: string;
  // Org chart specific props
  hasChildren?: boolean;
  childCount?: number;
  isExpanded?: boolean;
  level?: number;
  onToggleExpand?: () => void;
  /** Callback to open detail sidebar */
  onViewDetails?: () => void;
  /** Callback to focus on this person's team */
  onFocusTeam?: () => void;
}

// Compute a stable index from a string for consistent color selection
function stableIndexFromString(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

// Choose a vibrant two-stop gradient based on organization unit
function getGradientClasses(organizationUnit?: string): string {
  const vibrantVariants = [
    // Explicit class strings so Tailwind can see them during build
    'from-violet-500/90 to-pink-400/90',
    'from-fuchsia-500/90 to-rose-400/90',
    'from-indigo-500/90 to-violet-400/90',
    'from-blue-500/90 to-cyan-400/90',
    'from-sky-500/90 to-blue-400/90',
    'from-emerald-500/90 to-teal-400/90',
    'from-teal-500/90 to-cyan-400/90',
    'from-amber-500/90 to-orange-400/90',
  ];

  if (!organizationUnit) {
    return 'from-violet-500/90 to-pink-400/90';
  }

  const index = stableIndexFromString(organizationUnit, vibrantVariants.length);
  return vibrantVariants[index];
}

// Choose a solid color (dominant stop of the gradient) for the org unit pill
function getPillClasses(organizationUnit?: string): string {
  const pillVariants = [
    'bg-violet-500/15 text-violet-800 border-violet-500/30',
    'bg-fuchsia-500/15 text-fuchsia-800 border-fuchsia-500/30',
    'bg-indigo-500/15 text-indigo-800 border-indigo-500/30',
    'bg-blue-500/15 text-blue-800 border-blue-500/30',
    'bg-sky-500/15 text-sky-800 border-sky-500/30',
    'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
    'bg-teal-500/15 text-teal-800 border-teal-500/30',
    'bg-amber-500/15 text-amber-800 border-amber-500/30',
  ];

  if (!organizationUnit) {
    return 'bg-violet-500/15 text-violet-800 border-violet-500/30';
  }
  const index = stableIndexFromString(organizationUnit, pillVariants.length);
  return pillVariants[index];
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  className,
  hasChildren = false,
  childCount = 0,
  isExpanded = false,
  level = 0,
  onToggleExpand,
  onViewDetails,
  onFocusTeam,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatStartDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const handleCopyEmail = () => {
    if (user.email) {
      navigator.clipboard?.writeText(user.email).catch(() => {
        // no-op
      });
    }
  };

  return (
    <Card className={`w-80 overflow-hidden rounded-xl border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group ${className}`}>
      <div className={`relative h-24 w-full bg-gradient-to-br ${getGradientClasses(user.organizationUnit)}`}>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {/* Menu button */}
          <CardMenu
            size="md"
            variant="header"
            onViewDetails={onViewDetails}
            onFocusTeam={onFocusTeam}
            onCopyEmail={handleCopyEmail}
            email={user.email}
            hasChildren={hasChildren}
          />
          {user.email && (
            <a
              href={`mailto:${user.email}`}
              title="Email"
              className="rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30 transition-colors"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
          {user.email && (
            <button
              type="button"
              onClick={handleCopyEmail}
              title="Copy email"
              className="rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/30 transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand/Collapse button */}
        {hasChildren && (
          <div className="absolute left-3 top-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30 transition-colors"
              title={isExpanded ? `Hide ${childCount} direct reports` : `Show ${childCount} direct reports`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="-mt-10 px-6">
        <Avatar className="h-20 w-20 ring-4 ring-card shadow-md relative z-10">
          <AvatarImage
            src={user.profileImage}
            alt={user.fullName}
            className="object-cover"
          />
          <AvatarFallback delayMs={0} className="text-lg font-semibold bg-muted text-foreground/80">
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>
      </div>

      <CardContent className="pt-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold leading-tight truncate">{user.fullName}</h3>
            <p className="text-sm text-muted-foreground truncate">{user.jobTitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {user.organizationUnit && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${getPillClasses(user.organizationUnit)}`}>
                <Building2 className="h-3.5 w-3.5" />
                {user.organizationUnit}
              </span>
            )}
            {user.office && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {user.office}
              </span>
            )}
            {user.startDate && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Started {formatStartDate(user.startDate)}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {user.email && (
              <a
                href={`mailto:${user.email}`}
                className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </a>
            )}
            {user.slackUsername && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="truncate">@{user.slackUsername}</span>
              </div>
            )}
            {user.manager && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="truncate">Reports to: {user.manager}</span>
              </div>
            )}
            {hasChildren && childCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="truncate">
                  {childCount} direct report{childCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
