export interface JobOptionItem {
  _id: string;
  name: string;
  code?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ManageableCategory =
  | 'aiWorkArrangement'
  | 'aiExperienceLevel'
  | 'aiEmploymentType'
  | 'aiEducation'
  | 'aiLanguage'
  | 'aiVisaSponsorship'
  | 'organizationAgency'
  | 'directApply'
  | 'organizationSize'
  | 'seniority'
  | 'sources'
  | 'organizationIndustry'
  | 'aiTaxonomiesA';

export interface CountryOption {
  name: string;
  code?: string;
}

export interface JobFilterOptions {
  aiWorkArrangement?: (JobOptionItem | string)[];
  aiExperienceLevel?: (JobOptionItem | string)[];
  aiEmploymentType?: (JobOptionItem | string)[];
  aiEducation?: (JobOptionItem | string)[];
  aiLanguage?: (JobOptionItem | string)[];
  aiVisaSponsorship?: (JobOptionItem | string)[];
  organizationAgency?: (JobOptionItem | string)[];
  directApply?: (JobOptionItem | string)[];
  organizationSize?: (JobOptionItem | string)[];
  seniority?: (JobOptionItem | string)[];
  sources?: (JobOptionItem | string)[];
  organizationIndustry?: (JobOptionItem | string)[];
  aiTaxonomiesA?: (JobOptionItem | string)[];
  countries?: (CountryOption | string)[];
  [key: string]: unknown;
}

export interface JobFilters {
  title: string;
  titleAdvanced: string;
  description: string;
  descriptionAdvanced: string;

  location: string[];
  locationAdvanced: string;

  organization: string[];
  excludeOrganization: string[];
  organizationAdvanced: string;

  datePostedGte: string | null;
  datePostedLt: string | null;
  dateCreatedGte: string | null;
  dateCreatedLt: string | null;

  sources: string[];
  excludeSources: string[];

  domain: string[];
  excludeDomain: string[];

  organizationIndustry: string[];
  excludeOrganizationIndustry: string[];

  organizationSlug: string[];
  excludeOrganizationSlug: string[];

  organizationHeadcountGte: number | null;
  organizationHeadcountLt: number | null;

  organizationSize: string[];

  organizationFundingGte: number | null;
  organizationFundingLt: number | null;

  organizationAgency: boolean | string | null;

  aiExperienceLevel: string[];
  aiWorkArrangement: string[];
  aiEmploymentType: string[];
  aiLanguage: string[];
  aiEducation: string[];

  aiTaxonomiesAPrimary: string[];
  aiTaxonomiesA: string[];
  excludeAiTaxonomiesA: string[];

  aiVisaSponsorship: boolean | string | null;

  hasSalary: boolean;
  hasNoLocation: boolean;

  seniority: string[];

  directApply: boolean | string | null;

  excludeAtsDuplicate: boolean;
}

export interface JobResponseOptions {
  descriptionFormat: 'text' | 'html' | null;
  includeBasicOrganizationDetails: boolean;
  includeBeta: boolean;
}

export interface SyncTaskConfig {
  enabled: boolean;
  cronExpression: string;
  timeFrame: string;
}

export interface OrgSyncTaskConfig {
  enabled: boolean;
  cronExpression: string;
}

export interface JobSchedulerJobs {
  // 6 Primary Backend Sync Tasks
  activeAts: SyncTaskConfig;
  activeJb: SyncTaskConfig;
  modifiedAts: SyncTaskConfig;
  expiredAts: SyncTaskConfig;
  expiredJb: SyncTaskConfig;
  organizationsSync: OrgSyncTaskConfig;

  // Kebab-case mappings matching backend types
  'active-ats'?: SyncTaskConfig;
  'active-jb'?: SyncTaskConfig;
  'modified-ats'?: SyncTaskConfig;
  'expired-ats'?: SyncTaskConfig;
  'expired-jb'?: SyncTaskConfig;
  'ats-organizations'?: OrgSyncTaskConfig;

  // Legacy fallback aliases
  activeSync?: SyncTaskConfig;
  modifiedSync?: SyncTaskConfig;
  expiredSync?: SyncTaskConfig;
  atsOrganizations?: OrgSyncTaskConfig;
}

export interface JobSettings {
  filters: JobFilters;
  responseOptions: JobResponseOptions;
  schedulerEnabled: boolean;
  jobs: JobSchedulerJobs;
}

export interface SyncLogItem {
  _id: string;
  jobType: string;
  timeFrame?: string;
  status: 'running' | 'success' | 'failed' | string;
  jobsFetched?: number;
  jobsUpserted?: number;
  jobsExpired?: number;
  creditsUsed?: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  triggeredBy?: 'cron' | 'admin-manual' | string;
}

export interface ApiUsage {
  jobsRemaining?: number;
  jobsLimit?: number;
  requestsRemaining?: number;
  requestsLimit?: number;
  nextBillingDate?: string;
  recordedAt?: string;
}

export interface JobStats {
  active: number;
  expired: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  message?: string;
  data: T;
  errors?: Record<string, string[] | string>;
}

export const MANAGEABLE_CATEGORIES: { key: ManageableCategory; label: string; description: string }[] = [
  { key: 'aiWorkArrangement', label: 'AI Work Arrangement', description: 'Remote, hybrid, on-site, etc.' },
  { key: 'aiExperienceLevel', label: 'AI Experience Level', description: 'Entry, mid, senior, director, etc.' },
  { key: 'aiEmploymentType', label: 'AI Employment Type', description: 'Full-time, part-time, contract, internship, etc.' },
  { key: 'aiEducation', label: 'AI Education', description: 'Degree level requirements' },
  { key: 'aiLanguage', label: 'AI Language', description: 'Required languages identified' },
  { key: 'aiVisaSponsorship', label: 'AI Visa Sponsorship', description: 'Sponsorship flags and options' },
  { key: 'organizationAgency', label: 'Organization Agency', description: 'Direct employer vs recruitment agency' },
  { key: 'directApply', label: 'Direct Apply', description: 'Direct application support' },
  { key: 'organizationSize', label: 'Organization Size', description: 'Headcount buckets (e.g. 1-10, 50-200)' },
  { key: 'seniority', label: 'Seniority', description: 'Job board seniority levels' },
  { key: 'sources', label: 'Job Sources', description: 'Platforms (ATS, LinkedIn, Wellfound, YCombinator)' },
  { key: 'organizationIndustry', label: 'Industries', description: 'Company industry categories' },
  { key: 'aiTaxonomiesA', label: 'Taxonomies (Roles/Domains)', description: 'AI categorized job function domains' },
];
