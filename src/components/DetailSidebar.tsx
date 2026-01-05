import React from 'react';
import { X, Mail, MapPin, Building2, Users, Briefcase, User } from 'lucide-react';
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

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Employee Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <Avatar className="h-20 w-20 mx-auto ring-4 ring-background shadow-lg">
            <AvatarImage src={user.profileImage} alt={user.fullName} className="object-cover" />
            <AvatarFallback className="text-xl font-medium bg-primary/10">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-3 text-lg font-semibold">{user.fullName}</h2>
          <p className="text-sm text-muted-foreground">{user.jobTitle || 'No title'}</p>
          <div className="mt-2 inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full">
            Level {level + 1}
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

        {/* Org Info */}
        <Card className="p-4 space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Organization</h4>
          {managerName && (
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-muted-foreground">Reports to: </span>
                <span className="font-medium">{managerName}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Direct reports: </span>
              <span className="font-medium">{directReportCount}</span>
            </div>
          </div>
          {totalDescendantCount > directReportCount && (
            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <span className="text-muted-foreground">Total org: </span>
                <span className="font-medium">{totalDescendantCount}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Start Date */}
        {user.startDate && (
          <Card className="p-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Additional Info</h4>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Started:</span>
              <span className="font-medium">{new Date(user.startDate).toLocaleDateString()}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DetailSidebar;

