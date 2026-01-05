import React, { useEffect, useState, useCallback } from 'react';
import { client, useConfig, useElementData } from '@sigmacomputing/plugin';
import { Button } from './components/ui/button';
import { Settings as SettingsIcon } from 'lucide-react';
import Settings, { DEFAULT_SETTINGS } from './Settings';
import OrgChart from './components/OrgChart';
import { 
  SigmaConfig, 
  SigmaData, 
  PluginSettings, 
  ConfigParseError 
} from './types/sigma';
import { UserData } from './types';
import './App.css';

// Configure the plugin editor panel
client.config.configureEditorPanel([
  { name: 'source', type: 'element' },
  { name: 'fullNameColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Full Name Column' },
  { name: 'emailColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Email Column' },
  { name: 'slackColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Slack Username Column' },
  { name: 'profileImageColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Profile Image Column' },
  { name: 'jobTitleColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Job Title Column' },
  { name: 'organizationColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Organization Unit Column' },
  { name: 'managerColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Manager Column' },
  { name: 'officeColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Office Column' },
  { name: 'startDateColumn', type: 'column', source: 'source', allowMultiple: false, label: 'Start Date Column' },
  { name: 'config', type: 'text', label: 'Settings Config (JSON)', defaultValue: "{}" },
  { name: 'editMode', type: 'toggle', label: 'Edit Mode' }
]);

// Mirror of theme presets for applying CSS variables after save
const PRESET_THEMES: Record<string, { name: string; colors: Record<string, string> }> = {
  light: {
    name: 'Light',
    colors: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '240 9% 10%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%',
      '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '240 5.9% 10%',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      '--background': '240 10% 3.9%',
      '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '240 5.9% 10%',
      '--secondary': '240 3.7% 15.9%',
      '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%',
      '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%',
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%',
      '--input': '240 3.7% 15.9%',
      '--ring': '240 4.9% 83.9%',
    },
  },
};

const applyThemeFromSettings = (settings: PluginSettings): void => {
  const theme = settings.styling?.theme || 'light';
  const colors = theme === 'custom'
    ? (settings.styling?.customColors || PRESET_THEMES.light.colors)
    : (PRESET_THEMES[theme]?.colors || PRESET_THEMES.light.colors);
  Object.entries(colors).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
};

const App: React.FC = (): React.JSX.Element => {
  const config: SigmaConfig = useConfig();
  const sigmaData: SigmaData = useElementData(config.source || '');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<PluginSettings>(DEFAULT_SETTINGS);

  // Parse config JSON and load settings
  useEffect(() => {
    if (config.config?.trim()) {
      try {
        const parsedConfig = JSON.parse(config.config) as Partial<PluginSettings>;
        const newSettings: PluginSettings = { ...DEFAULT_SETTINGS, ...parsedConfig };
        setSettings(newSettings);
      } catch (err) {
        const error: ConfigParseError = {
          message: 'Invalid config JSON',
          originalError: err
        };
        console.error('Config parse error:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [config.config]);

  // Apply saved styling whenever settings change
  useEffect(() => {
    if (settings?.styling) {
      applyThemeFromSettings(settings);
    }
  }, [settings]);

  const handleSettingsSave = useCallback((newSettings: PluginSettings): void => {
    setSettings(newSettings);
    setShowSettings(false);
  }, []);

  const handleShowSettings = useCallback((): void => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback((): void => {
    setShowSettings(false);
  }, []);

  // Transform Sigma data into user data
  const transformToUserData = useCallback((): UserData[] => {
    if (!sigmaData || !config.fullNameColumn) {
      return [];
    }

    // Get the number of rows from the full name column
    const rowCount = sigmaData[config.fullNameColumn]?.length || 0;
    const users: UserData[] = [];

    for (let i = 0; i < rowCount; i++) {
      const user: UserData = {
        fullName: (config.fullNameColumn ? (sigmaData[config.fullNameColumn]?.[i] as string) : '') || 'Unknown',
        email: config.emailColumn ? (sigmaData[config.emailColumn]?.[i] as string) || '' : '',
        slackUsername: config.slackColumn ? (sigmaData[config.slackColumn]?.[i] as string) || '' : '',
        profileImage: config.profileImageColumn ? (sigmaData[config.profileImageColumn]?.[i] as string) || '' : '',
        jobTitle: config.jobTitleColumn ? (sigmaData[config.jobTitleColumn]?.[i] as string) || '' : '',
        organizationUnit: config.organizationColumn ? (sigmaData[config.organizationColumn]?.[i] as string) || '' : '',
        manager: config.managerColumn ? (sigmaData[config.managerColumn]?.[i] as string) || '' : '',
        office: config.officeColumn ? (sigmaData[config.officeColumn]?.[i] as string) || '' : '',
        startDate: config.startDateColumn ? (sigmaData[config.startDateColumn]?.[i] as string) || '' : ''
      };
      users.push(user);
    }

    return users;
  }, [sigmaData, config]);

  const users = transformToUserData();

  // Early return for missing source
  if (!config.source) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-10"
        style={{ 
          backgroundColor: String(settings.backgroundColor) || 'white',
          color: String(settings.textColor) || 'black'
        }}
      >
        <div className="text-center max-w-xl">
          <h3 className="text-lg font-semibold mb-2">{settings.title || 'Sigma Plugin Template'}</h3>
          <p className="text-muted-foreground">Please select a data source to get started.</p>
        </div>
      </div>
    );
  }

  // Early return for missing required columns
  if (!config.fullNameColumn) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-10"
        style={{ 
          backgroundColor: String(settings.backgroundColor) || 'white',
          color: String(settings.textColor) || 'black'
        }}
      >
        <div className="text-center max-w-xl">
          <h3 className="text-lg font-semibold mb-2">Data Source Selected</h3>
          <p className="text-muted-foreground">Please configure the required columns to display the org chart.</p>
          <p className="text-sm text-muted-foreground mt-2">
            At minimum, you need to select a "Full Name Column" to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: String(settings.backgroundColor) || 'white',
        color: String(settings.textColor) || 'black'
      }}
    >
      {config.editMode && (
        <Button
          className="absolute top-5 right-5 z-10 gap-2"
          onClick={handleShowSettings}
          size="sm"
          title="Open plugin settings"
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
      )}

      {/* Main content - takes remaining height */}
      <div className="flex-1 overflow-hidden">
        {users.length > 0 ? (
          <OrgChart users={users} className="h-full" />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/30">
            <div className="text-center max-w-md p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold mb-2">No Employees Found</h4>
              <p className="text-muted-foreground mb-4">
                We couldn't find any employee data. This usually means the data source isn't connected or the column mapping needs to be configured.
              </p>
              <div className="text-left bg-card rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Quick checklist:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">1.</span>
                    <span>Ensure a data source (worksheet) is connected to this plugin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">2.</span>
                    <span>Map the <strong>Full Name</strong> column in Settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">3.</span>
                    <span>Optionally map <strong>Manager</strong> column to build the hierarchy</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <Settings
        isOpen={showSettings}
        onClose={handleCloseSettings}
        currentSettings={settings}
        onSave={handleSettingsSave}
        client={client}
      />
    </div>
  );
};

export default App;


