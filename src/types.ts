export interface ConfigParseError {
  message: string;
  originalError: Error;
}

export interface PluginSettings {
  [key: string]: string | number | boolean | null;
}

export interface DataInfo {
  rowCount: number;
  columnName: string;
  hasData: boolean;
}

// User data structure for org chart
export interface UserData {
  fullName: string;
  email: string;
  slackUsername: string;
  profileImage: string;
  jobTitle: string;
  organizationUnit: string;
  manager: string;
  office: string;
  startDate: string;
}

// Card display size mode
export type CardSizeMode = 'compact' | 'standard';

// Org chart display settings
export interface OrgChartDisplaySettings {
  cardSizeMode: CardSizeMode;
  initialExpandDepth: number; // How many levels to expand by default (1 = just root, 2 = root + direct reports)
  showConnectingLines: boolean;
}