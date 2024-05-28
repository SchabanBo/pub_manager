export interface Package {
  name: string;
  currentVersion: string;
  lineNumber: number;
  isDevDependency: boolean;
  data: PackageData | undefined;
  gitHistory: string;
}

export interface PackageData {
  latestVersion: string;
  publishedDate: string;
  description: string;
  platformTags: string[];
  isTags: string[];
  licenses: string[];
}
