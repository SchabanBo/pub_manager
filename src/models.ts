export interface Package {
  name: string;
  currentVersion: string;
  lineNumber: number;
  isDevDependency: boolean;
  data?: PackageData ;
  gitHistory: string;
}

export interface PackageData {
  latestVersion: string;
  resolvable?: string;
  publishedDate: string;
  description: string;
  platformTags: string[];
  isTags: string[];
  licenses: string[];
}
