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