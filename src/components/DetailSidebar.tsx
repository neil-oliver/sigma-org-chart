import React from 'react';
import { X, Mail, MapPin, Building2, Users, Briefcase, User, Calendar, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { UserData } from '../types';

interface DetailSidebarProps {
  user: UserData | null;
  onClose: () => void;
  managerName?: string;
  directReportCount?: number;
  totalDescendantCount?: number;
  level?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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

// Get gradient classes based on organization unit
function getGradientClasses(organizationUnit?: string): string {
  const gradients = [
    'from-violet-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
    'from-indigo-500 to-blue-600',
    'from-blue-500 to-cyan-600',
    'from-sky-500 to-teal-600',
    'from-emerald-500 to-green-600',
    'from-teal-500 to-cyan-600',
    'from-amber-500 to-orange-600',
  ];

  if (!organizationUnit) {
    return gradients[0];
  }

  const index = stableIndexFromString(organizationUnit, gradients.length);
  return gradients[index];
}

// Get accent color for badges
function getAccentColor(organizationUnit?: string): string {
  const colors = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ];

  if (!organizationUnit) {
    return colors[0];
  }

  const index = stableIndexFromString(organizationUnit, colors.length);
  return colors[index];
}

/**
 * Sidebar panel showing full user details
 */
const DetailSidebar: React.FC<DetailSidebarProps> = ({
  user,
  onClose,
  managerName,
  directReportCount = 0,
  totalDescendantCount = 0,
  level = 0,
}) => {
  if (!user) return null;

  const gradientClass = getGradientClasses(user.organizationUnit);
  const accentClass = getAccentColor(user.organizationUnit);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Colorful Header */}
      <div className={`relative h-28 bg-gradient-to-br ${gradientClass}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
          title="Close details panel"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Avatar overlapping header */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
            <AvatarImage src={user.profileImage} alt={user.fullName} className="object-cover" />
            <AvatarFallback className="text-xl font-medium bg-muted">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pt-14 px-4 pb-4 space-y-5">
        {/* Profile Header */}
        <div className="text-center">
          <h2 className="text-lg font-semibold">{user.fullName}</h2>
          <p className="text-sm text-muted-foreground">{user.jobTitle || 'No title'}</p>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${accentClass}`}>
              <Star className="h-3 w-3" />
              Level {level + 1}
            </span>
            {directReportCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                <Users className="h-3 w-3" />
                {directReportCount} direct
              </span>
            )}
            {totalDescendantCount > directReportCount && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                {totalDescendantCount} total
              </span>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <Card className="p-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Contact</h4>
          {user.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <a href={`mailto:${user.email}`} className="text-primary hover:underline truncate">
                {user.email}
              </a>
            </div>
          )}
          {user.office && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{user.office}</span>
            </div>
          )}
          {user.organizationUnit && (
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{user.organizationUnit}</span>
            </div>
          )}
        </Card>

        {/* Manager & Reporting */}
        {managerName && (
          <Card className="p-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Reporting</h4>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-muted-foreground">Reports to: </span>
                <span className="font-medium">{managerName}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Start Date & Tenure */}
        {user.startDate && (
          <Card className="p-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Tenure</h4>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-muted-foreground">Started: </span>
                <span className="font-medium">{new Date(user.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DetailSidebar;

