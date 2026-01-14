import React from 'react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Settings as SettingsIcon, Users, User, GitBranch, Database, Columns3, Palette } from 'lucide-react';

interface StepCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  complete?: boolean;
}

function StepCard({ icon: Icon, title, children, complete = false }: StepCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`h-9 w-9 rounded-md flex items-center justify-center border ${complete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border-border'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium leading-none">{title}</h4>
            {complete && (
              <Badge variant="secondary" className="text-[10px]">Configured</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface OnboardingProps {
  hasSource: boolean;
  hasFullName: boolean;
  hasManager: boolean;
  editMode: boolean;
  onOpenSettings: () => void;
}

function Onboarding({
  hasSource,
  hasFullName,
  hasManager,
  editMode,
  onOpenSettings,
}: OnboardingProps) {
  return (
    <div className="h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="rounded-xl border border-border bg-card text-card-foreground p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">Sigma Org Chart</h2>
                <Badge variant="secondary">Getting Started</Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Visualize your organization's structure as an interactive hierarchy. Configure your data source 
                and key columns to build a beautiful org chart. Navigate, search, and explore your team.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" className="gap-2" onClick={onOpenSettings} disabled={!editMode}>
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>

          {!editMode && (
            <div className="mt-4 rounded-md border border-border bg-muted/30 text-muted-foreground px-4 py-3 text-sm">
              Enable Edit Mode in the Sigma properties panel to configure the plugin.
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StepCard icon={Database} title="Choose Data Source" complete={hasSource}>
              Select a Sigma element containing your employee data. Each row represents one person in your organization.
            </StepCard>
            <StepCard icon={User} title="Configure Required Columns" complete={hasFullName}>
              Map the <span className="font-medium">Full Name Column</span> to identify each person. This is the minimum required field.
            </StepCard>
            <StepCard icon={GitBranch} title="Build Hierarchy" complete={hasManager}>
              Set the <span className="font-medium">Manager Column</span> to establish reporting relationships and create the org structure.
            </StepCard>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/20 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Columns3 className="h-4 w-4" />
              Optional Enhancements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <div>
                  <span className="font-medium text-foreground">Job Title</span> – Display roles
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <div>
                  <span className="font-medium text-foreground">Email</span> – Contact information
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <div>
                  <span className="font-medium text-foreground">Profile Image</span> – Avatars
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <div>
                  <span className="font-medium text-foreground">Organization Unit</span> – Departments
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <div>
                  <span className="font-medium text-foreground">Office Location</span> – Physical location
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <div>
                  <span className="font-medium text-foreground">Start Date</span> – Tenure information
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-border bg-muted/20 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Customize Your Chart
            </h3>
            <p className="text-sm text-muted-foreground">
              Once configured, use the Settings panel to customize themes, colors, and display preferences 
              to match your organization's branding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
