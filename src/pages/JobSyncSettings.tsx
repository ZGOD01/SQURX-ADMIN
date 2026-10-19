import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SlidersHorizontal,
  Clock,
  Activity,
  FolderOpen,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  JobSettings,
  JobFilters,
  JobResponseOptions,
  JobSchedulerJobs,
  SyncTaskConfig,
  OrgSyncTaskConfig,
  ActiveSyncConfig,
  ExpiredSyncConfig,
  CatchUpConfig,
  JobFilterOptions,
  SyncLogItem,
  ApiUsage,
  JobStats,
} from '../types/jobsAdmin';
import { jobsAdminApi } from '../services/jobsAdminApi';
import JobsFiltersSection from '../components/jobs/JobsFiltersSection';
import SchedulerSection from '../components/jobs/SchedulerSection';
import SyncActivitySection from '../components/jobs/SyncActivitySection';
import ManageOptionsSection from '../components/jobs/ManageOptionsSection';
import { validateCronExpression } from '../utils/cronValidator';

type ActiveTab = 'filters' | 'schedule' | 'activity' | 'options';

/**
 * Deep difference computation for partial settings updates
 */
function computeSettingsDiff(
  original: JobSettings,
  current: JobSettings
): Partial<JobSettings> | null {
  const diff: Partial<JobSettings> = {};
  let hasChanges = false;

  // 1. Scheduler enabled
  if (original.schedulerEnabled !== current.schedulerEnabled) {
    diff.schedulerEnabled = current.schedulerEnabled;
    hasChanges = true;
  }

  // 2. Response Options
  const respDiff: Partial<JobResponseOptions> = {};
  let hasRespDiff = false;
  const respKeys: (keyof JobResponseOptions)[] = [
    'descriptionFormat',
    'includeBasicOrganizationDetails',
    'includeBeta',
  ];
  for (const k of respKeys) {
    if (original.responseOptions[k] !== current.responseOptions[k]) {
      (respDiff as Record<string, unknown>)[k] = current.responseOptions[k];
      hasRespDiff = true;
    }
  }
  if (hasRespDiff) {
    diff.responseOptions = respDiff as JobResponseOptions;
    hasChanges = true;
  }

  // 3. Scheduler Jobs
  const jobsDiff: Partial<JobSchedulerJobs> = {};
  let hasJobsDiff = false;

  const compareSyncTask = (
    orig: SyncTaskConfig,
    curr: SyncTaskConfig
  ): Partial<SyncTaskConfig> | null => {
    const tDiff: Partial<SyncTaskConfig> = {};
    let tChanged = false;
    if (orig.enabled !== curr.enabled) {
      tDiff.enabled = curr.enabled;
      tChanged = true;
    }
    if (orig.cronExpression !== curr.cronExpression) {
      tDiff.cronExpression = curr.cronExpression;
      tChanged = true;
    }
    if (orig.timeFrame !== curr.timeFrame) {
      tDiff.timeFrame = curr.timeFrame;
      tChanged = true;
    }
    return tChanged ? tDiff : null;
  };

  const activeDiff = compareSyncTask(original.jobs.activeSync, current.jobs.activeSync);
  const activeExtra: Partial<ActiveSyncConfig> = {};
  const oa = original.jobs.activeSync;
  const ca = current.jobs.activeSync;
  if (oa?.maxJobs !== ca?.maxJobs) activeExtra.maxJobs = ca?.maxJobs;
  if (oa?.atsSharePercent !== ca?.atsSharePercent) activeExtra.atsSharePercent = ca?.atsSharePercent;
  if (activeDiff || Object.keys(activeExtra).length > 0) {
    const fullActive = { ...activeDiff, ...activeExtra } as ActiveSyncConfig;
    jobsDiff.activeSync = fullActive;
    jobsDiff.activeAts = fullActive;
    jobsDiff.activeJb = fullActive;
    jobsDiff['active-ats'] = fullActive;
    jobsDiff['active-jb'] = fullActive;
    hasJobsDiff = true;
  }

  const modifiedDiff = compareSyncTask(original.jobs.modifiedSync, current.jobs.modifiedSync);
  if (modifiedDiff) {
    jobsDiff.modifiedSync = modifiedDiff as SyncTaskConfig;
    jobsDiff.modifiedAts = modifiedDiff as SyncTaskConfig;
    jobsDiff['modified-ats'] = modifiedDiff as SyncTaskConfig;
    hasJobsDiff = true;
  }

  const expiredDiff = compareSyncTask(original.jobs.expiredSync, current.jobs.expiredSync);
  const expiredExtra: Partial<ExpiredSyncConfig> = {};
  const oe = original.jobs.expiredSync;
  const ce = current.jobs.expiredSync;
  if (oe?.expireAfterDays !== ce?.expireAfterDays) expiredExtra.expireAfterDays = ce?.expireAfterDays;
  if (
    oe?.expireBoardSources?.length !== ce?.expireBoardSources?.length ||
    oe?.expireBoardSources?.some((v, i) => v !== ce?.expireBoardSources?.[i])
  ) {
    expiredExtra.expireBoardSources = ce?.expireBoardSources;
  }
  if (expiredDiff || Object.keys(expiredExtra).length > 0) {
    const fullExpired = { ...expiredDiff, ...expiredExtra } as ExpiredSyncConfig;
    jobsDiff.expiredSync = fullExpired;
    jobsDiff.expiredAts = fullExpired;
    jobsDiff.expiredJb = fullExpired;
    jobsDiff['expired-ats'] = fullExpired;
    jobsDiff['expired-jb'] = fullExpired;
    hasJobsDiff = true;
  }

  const origOrg = original.jobs.organizationsSync;
  const currOrg = current.jobs.organizationsSync;
  const orgDiff: Partial<OrgSyncTaskConfig> = {};
  let orgChanged = false;
  if (origOrg.enabled !== currOrg.enabled) {
    orgDiff.enabled = currOrg.enabled;
    orgChanged = true;
  }
  if (origOrg.cronExpression !== currOrg.cronExpression) {
    orgDiff.cronExpression = currOrg.cronExpression;
    orgChanged = true;
  }
  if (origOrg.timeoutSeconds !== currOrg.timeoutSeconds) {
    orgDiff.timeoutSeconds = currOrg.timeoutSeconds;
    orgChanged = true;
  }
  if (orgChanged) {
    jobsDiff.organizationsSync = orgDiff as OrgSyncTaskConfig;
    jobsDiff['ats-organizations'] = orgDiff as OrgSyncTaskConfig;
    hasJobsDiff = true;
  }

  const catchDiff: Partial<CatchUpConfig> = {};
  if (original.jobs.catchUp.enabled !== current.jobs.catchUp.enabled) {
    catchDiff.enabled = current.jobs.catchUp.enabled;
  }
  if (original.jobs.catchUp.maxAgeDays !== current.jobs.catchUp.maxAgeDays) {
    catchDiff.maxAgeDays = current.jobs.catchUp.maxAgeDays;
  }
  if (Object.keys(catchDiff).length > 0) {
    jobsDiff.catchUp = catchDiff as CatchUpConfig;
    hasJobsDiff = true;
  }

  if (hasJobsDiff) {
    diff.jobs = jobsDiff as JobSchedulerJobs;
    hasChanges = true;
  }

  // 4. Filters
  const filtersDiff: Partial<JobFilters> = {};
  let hasFilterDiff = false;
  const filterKeys = Object.keys(current.filters) as (keyof JobFilters)[];

  for (const fk of filterKeys) {
    const origVal = original.filters[fk];
    const currVal = current.filters[fk];

    if (Array.isArray(currVal)) {
      const origArr = Array.isArray(origVal) ? origVal : [];
      const arraysEqual =
        origArr.length === currVal.length &&
        origArr.every((v, i) => v === currVal[i]);
      if (!arraysEqual) {
        (filtersDiff as Record<string, unknown>)[fk] = currVal;
        hasFilterDiff = true;
      }
    } else if (origVal !== currVal) {
      (filtersDiff as Record<string, unknown>)[fk] = currVal;
      hasFilterDiff = true;
    }
  }

  if (hasFilterDiff) {
    diff.filters = filtersDiff as JobFilters;
    hasChanges = true;
  }

  return hasChanges ? diff : null;
}

export default function JobSyncSettings() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('filters');

  // Baseline server state and editable form state
  const [canonicalSettings, setCanonicalSettings] = useState<JobSettings | null>(null);
  const [formSettings, setFormSettings] = useState<JobSettings | null>(null);

  // Global filter options
  const [filterOptions, setFilterOptions] = useState<JobFilterOptions>({});

  // Activity stats, usage, logs
  const [stats, setStats] = useState<JobStats | null>(null);
  const [usage, setUsage] = useState<ApiUsage | null>(null);
  const [logs, setLogs] = useState<SyncLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  // Page loading & saving states
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Check dirty state
  const diffPayload = useMemo(() => {
    if (!canonicalSettings || !formSettings) return null;
    return computeSettingsDiff(canonicalSettings, formSettings);
  }, [canonicalSettings, formSettings]);

  const isDirty = diffPayload !== null;

  // Initial data loading
  const loadInitialData = useCallback(async () => {
    setInitialLoading(true);
    setPageError(null);

    try {
      const [settingsRes, optionsRes, statsRes, usageRes, logsRes] = await Promise.all([
        jobsAdminApi.getSettings(),
        jobsAdminApi.getFilterOptions(),
        jobsAdminApi.getJobStats(),
        jobsAdminApi.getApiUsage(),
        jobsAdminApi.getSyncLogs(),
      ]);

      if (settingsRes.success && settingsRes.data) {
        // Normalize loaded settings with defaults to prevent null dereferences
        const raw = settingsRes.data as unknown as Record<string, unknown>;
        const s = ((raw?.settings || raw?.data || raw) as JobSettings) || {};
        const normalized: JobSettings = {
          schedulerEnabled: s.schedulerEnabled ?? true,
          responseOptions: {
            descriptionFormat: s.responseOptions?.descriptionFormat ?? 'text',
            includeBasicOrganizationDetails:
              s.responseOptions?.includeBasicOrganizationDetails ?? false,
            includeBeta: s.responseOptions?.includeBeta ?? false,
          },
          jobs: (() => {
            const rawJobs = ((s.jobs || {}) as unknown as Record<string, unknown>);
            const parseTask = (
              camelKey: string,
              kebabKey: string,
              legacyKey: string,
              defaultCron: string,
              defaultTimeFrame: string,
              defaultEnabled = true
            ): SyncTaskConfig => {
              const val = (rawJobs[camelKey] || rawJobs[kebabKey] || rawJobs[legacyKey] || {}) as Partial<SyncTaskConfig>;
              return {
                enabled: val.enabled ?? defaultEnabled,
                cronExpression: val.cronExpression || defaultCron,
                timeFrame: val.timeFrame || defaultTimeFrame,
              };
            };

            const rawActive = (rawJobs.activeSync || rawJobs.activeAts || rawJobs['active-ats'] || {}) as Partial<ActiveSyncConfig>;
            const activeSync: ActiveSyncConfig = {
              enabled: rawActive.enabled ?? true,
              cronExpression: rawActive.cronExpression || '0 * * * *',
              timeFrame: rawActive.timeFrame || '1h',
              maxJobs: rawActive.maxJobs ?? 0,
              atsSharePercent: rawActive.atsSharePercent ?? 50,
            };

            const rawExpired = (rawJobs.expiredSync || rawJobs.expiredAts || rawJobs['expired-ats'] || {}) as Partial<ExpiredSyncConfig>;
            const expiredSync: ExpiredSyncConfig = {
              enabled: rawExpired.enabled ?? true,
              cronExpression: rawExpired.cronExpression || '0 2 * * *',
              timeFrame: rawExpired.timeFrame || '1d',
              expireAfterDays: rawExpired.expireAfterDays ?? 0,
              expireBoardSources: Array.isArray(rawExpired.expireBoardSources)
                ? rawExpired.expireBoardSources
                : ['wellfound', 'ycombinator'],
            };

            const rawOrg = (rawJobs.organizationsSync || rawJobs['ats-organizations'] || rawJobs.atsOrganizations || {}) as Partial<OrgSyncTaskConfig>;
            const orgTask: OrgSyncTaskConfig = {
              enabled: rawOrg.enabled ?? true,
              cronExpression: rawOrg.cronExpression || '0 0 * * 0',
              timeoutSeconds: rawOrg.timeoutSeconds ?? 300,
            };

            const rawCatchUp = (rawJobs.catchUp || {}) as Partial<CatchUpConfig>;
            const catchUp: CatchUpConfig = {
              enabled: rawCatchUp.enabled ?? false,
              maxAgeDays: rawCatchUp.maxAgeDays ?? 7,
            };

            const activeAts = parseTask('activeAts', 'active-ats', 'activeSync', '0 22 * * 0', '7d');
            const activeJb = parseTask('activeJb', 'active-jb', 'activeSync', '0 22 * * 0', '7d');
            const modifiedAts = parseTask('modifiedAts', 'modified-ats', 'modifiedSync', '0 3 * * *', '24h');
            const expiredAts = parseTask('expiredAts', 'expired-ats', 'expiredSync', '0 2 * * 1', '7d');
            const expiredJb = parseTask('expiredJb', 'expired-jb', 'expiredSync', '0 2 * * 1', '7d');

            return {
              activeSync,
              modifiedSync: parseTask('modifiedSync', 'modified-ats', 'modifiedAts', '0 * * * *', '1h', false),
              expiredSync,
              organizationsSync: orgTask,
              catchUp,

              activeAts,
              activeJb,
              modifiedAts,
              expiredAts,
              expiredJb,

              'active-ats': activeAts,
              'active-jb': activeJb,
              'modified-ats': modifiedAts,
              'expired-ats': expiredAts,
              'expired-jb': expiredJb,
              'ats-organizations': orgTask,
            };
          })(),
          filters: {
            title: s.filters?.title || '',
            titleAdvanced: s.filters?.titleAdvanced || '',
            description: s.filters?.description || '',
            descriptionAdvanced: s.filters?.descriptionAdvanced || '',
            location: Array.isArray(s.filters?.location) ? s.filters.location : [],
            locationAdvanced: s.filters?.locationAdvanced || '',
            organization: Array.isArray(s.filters?.organization) ? s.filters.organization : [],
            excludeOrganization: Array.isArray(s.filters?.excludeOrganization)
              ? s.filters.excludeOrganization
              : [],
            organizationAdvanced: s.filters?.organizationAdvanced || '',
            datePostedGte: s.filters?.datePostedGte || null,
            datePostedLt: s.filters?.datePostedLt || null,
            dateCreatedGte: s.filters?.dateCreatedGte || null,
            dateCreatedLt: s.filters?.dateCreatedLt || null,
            sources: Array.isArray(s.filters?.sources) ? s.filters.sources : [],
            excludeSources: Array.isArray(s.filters?.excludeSources) ? s.filters.excludeSources : [],
            domain: Array.isArray(s.filters?.domain) ? s.filters.domain : [],
            excludeDomain: Array.isArray(s.filters?.excludeDomain) ? s.filters.excludeDomain : [],
            organizationIndustry: Array.isArray(s.filters?.organizationIndustry)
              ? s.filters.organizationIndustry
              : [],
            excludeOrganizationIndustry: Array.isArray(s.filters?.excludeOrganizationIndustry)
              ? s.filters.excludeOrganizationIndustry
              : [],
            organizationSlug: Array.isArray(s.filters?.organizationSlug)
              ? s.filters.organizationSlug
              : [],
            excludeOrganizationSlug: Array.isArray(s.filters?.excludeOrganizationSlug)
              ? s.filters.excludeOrganizationSlug
              : [],
            organizationHeadcountGte: s.filters?.organizationHeadcountGte ?? null,
            organizationHeadcountLt: s.filters?.organizationHeadcountLt ?? null,
            organizationSize: Array.isArray(s.filters?.organizationSize)
              ? s.filters.organizationSize
              : [],
            organizationFundingGte: s.filters?.organizationFundingGte ?? null,
            organizationFundingLt: s.filters?.organizationFundingLt ?? null,
            organizationAgency: s.filters?.organizationAgency ?? null,
            aiExperienceLevel: Array.isArray(s.filters?.aiExperienceLevel)
              ? s.filters.aiExperienceLevel
              : [],
            aiWorkArrangement: Array.isArray(s.filters?.aiWorkArrangement)
              ? s.filters.aiWorkArrangement
              : [],
            aiEmploymentType: Array.isArray(s.filters?.aiEmploymentType)
              ? s.filters.aiEmploymentType
              : [],
            aiLanguage: Array.isArray(s.filters?.aiLanguage) ? s.filters.aiLanguage : [],
            aiEducation: Array.isArray(s.filters?.aiEducation) ? s.filters.aiEducation : [],
            aiTaxonomiesAPrimary: Array.isArray(s.filters?.aiTaxonomiesAPrimary)
              ? s.filters.aiTaxonomiesAPrimary
              : [],
            aiTaxonomiesA: Array.isArray(s.filters?.aiTaxonomiesA) ? s.filters.aiTaxonomiesA : [],
            excludeAiTaxonomiesA: Array.isArray(s.filters?.excludeAiTaxonomiesA)
              ? s.filters.excludeAiTaxonomiesA
              : [],
            aiVisaSponsorship: s.filters?.aiVisaSponsorship ?? null,
            hasSalary: s.filters?.hasSalary ?? false,
            hasNoLocation: s.filters?.hasNoLocation ?? false,
            seniority: Array.isArray(s.filters?.seniority) ? s.filters.seniority : [],
            directApply: s.filters?.directApply ?? null,
            excludeAtsDuplicate: s.filters?.excludeAtsDuplicate ?? false,
          },
        };

        setCanonicalSettings(JSON.parse(JSON.stringify(normalized)));
        setFormSettings(JSON.parse(JSON.stringify(normalized)));
      } else {
        setPageError(settingsRes.message || 'Failed to retrieve job sync settings.');
      }

      if (optionsRes.success && optionsRes.data) {
        const rawOpts = optionsRes.data as unknown as Record<string, unknown>;
        const opts = ((rawOpts?.options || rawOpts?.filterOptions || rawOpts?.data || rawOpts) as JobFilterOptions) || {};
        setFilterOptions(opts);
      }

      if (statsRes.success) setStats(statsRes.data);
      if (usageRes.success) setUsage(usageRes.data);
      if (logsRes.success) setLogs(logsRes.data || []);
    } catch {
      setPageError('Network failure initializing settings.');
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh filter options dynamically (e.g. after adding/mutating in Manage Options)
  const refreshFilterOptions = async () => {
    try {
      const res = await jobsAdminApi.getFilterOptions();
      if (res.success && res.data) {
        const rawOpts = res.data as unknown as Record<string, unknown>;
        const opts = ((rawOpts?.options || rawOpts?.filterOptions || rawOpts?.data || rawOpts) as JobFilterOptions) || {};
        setFilterOptions(opts);
      }
    } catch {
      // Background refresh
    }
  };

  // Refresh activity data
  const refreshActivityData = async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const [statsRes, usageRes, logsRes] = await Promise.all([
        jobsAdminApi.getJobStats(),
        jobsAdminApi.getApiUsage(),
        jobsAdminApi.getSyncLogs(),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (usageRes.success) setUsage(usageRes.data);
      if (logsRes.success) setLogs(logsRes.data || []);
      else setLogsError(logsRes.message || 'Failed to refresh logs');
    } catch {
      setLogsError('Network error refreshing activity');
    } finally {
      setLogsLoading(false);
    }
  };

  // Filter change handler
  const handleFilterChange = <K extends keyof JobFilters>(field: K, value: JobFilters[K]) => {
    if (!formSettings) return;
    setFormSettings({
      ...formSettings,
      filters: {
        ...formSettings.filters,
        [field]: value,
      },
    });
  };

  // Response options change handler
  const handleResponseOptionChange = <K extends keyof JobResponseOptions>(
    field: K,
    value: JobResponseOptions[K]
  ) => {
    if (!formSettings) return;
    setFormSettings({
      ...formSettings,
      responseOptions: {
        ...formSettings.responseOptions,
        [field]: value,
      },
    });
  };

  // Scheduler enabled change handler
  const handleSchedulerEnabledChange = (enabled: boolean) => {
    if (!formSettings) return;
    setFormSettings({
      ...formSettings,
      schedulerEnabled: enabled,
    });
  };

  // Job config change handler
  const handleJobConfigChange = <K extends keyof JobSchedulerJobs>(
    jobKey: K,
    config: JobSchedulerJobs[K]
  ) => {
    if (!formSettings) return;
    const updatedJobs: JobSchedulerJobs = {
      ...formSettings.jobs,
      [jobKey]: config,
    };
    if (jobKey === 'activeAts') updatedJobs['active-ats'] = config as SyncTaskConfig;
    if (jobKey === 'activeJb') updatedJobs['active-jb'] = config as SyncTaskConfig;
    if (jobKey === 'modifiedAts') updatedJobs['modified-ats'] = config as SyncTaskConfig;
    if (jobKey === 'expiredAts') updatedJobs['expired-ats'] = config as SyncTaskConfig;
    if (jobKey === 'expiredJb') updatedJobs['expired-jb'] = config as SyncTaskConfig;
    if (jobKey === 'organizationsSync') updatedJobs['ats-organizations'] = config as OrgSyncTaskConfig;

    setFormSettings({
      ...formSettings,
      jobs: updatedJobs,
    });
  };

  // Reset unsaved changes to canonical state
  const handleResetForm = () => {
    if (!canonicalSettings) return;
    setFormSettings(JSON.parse(JSON.stringify(canonicalSettings)));
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  // Save Settings with partial update
  const handleSaveSettings = async () => {
    if (!diffPayload || !formSettings) return;

    // Validate cron expressions in changed jobs before sending
    if (diffPayload.jobs) {
      const jobEntries = Object.entries(diffPayload.jobs) as [
        keyof JobSchedulerJobs,
        Partial<SyncTaskConfig | OrgSyncTaskConfig>
      ][];
      const j = formSettings.jobs;
      const numErr =
        j.activeSync.maxJobs < 0 || !Number.isFinite(j.activeSync.maxJobs)
          ? 'Max jobs per run must be 0 or greater'
          : j.activeSync.atsSharePercent < 0 || j.activeSync.atsSharePercent > 100
          ? 'ATS share must be between 0 and 100'
          : j.expiredSync.expireAfterDays < 0
          ? 'Expire-after days must be 0 or greater'
          : j.organizationsSync.timeoutSeconds < 30
          ? 'Organizations sync timeout must be at least 30 seconds'
          : j.catchUp.maxAgeDays < 1
          ? 'Catch-up max age must be at least 1 day'
          : !['1h', '24h', '7d', '6m'].includes(j.activeSync.timeFrame)
          ? 'Active Jobs Sync time frame must be one of 1h, 24h, 7d, 6m'
          : !['1h', '1d', '1m', '6m'].includes(j.expiredSync.timeFrame)
          ? 'Expired Jobs Sync time frame must be one of 1h, 1d, 1m, 6m'
          : null;
      if (numErr) {
        setSaveErrorMsg(`Cannot save: ${numErr}`);
        return;
      }
      for (const [taskName, taskConfig] of jobEntries) {
        if (taskConfig?.cronExpression) {
          const check = validateCronExpression(taskConfig.cronExpression);
          if (!check.isValid) {
            setSaveErrorMsg(
              `Cannot save: ${taskName} has an invalid cron expression (${check.error})`
            );
            return;
          }
        }
      }
    }

    try {
      setIsSaving(true);
      setSaveSuccessMsg(null);
      setSaveErrorMsg(null);

      const res = await jobsAdminApi.updateSettings(diffPayload);

      if (res.success && res.data) {
        // Backend returns the full updated settings object as canonical state
        const rawUpdated = res.data as unknown as Record<string, unknown>;
        const updatedSettings = ((rawUpdated?.settings || rawUpdated?.data || rawUpdated) as JobSettings) || res.data;
        setCanonicalSettings(JSON.parse(JSON.stringify(updatedSettings)));
        setFormSettings(JSON.parse(JSON.stringify(updatedSettings)));
        setSaveSuccessMsg('Settings updated successfully in database.');
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      } else {
        setSaveErrorMsg(res.message || 'Failed to update settings in database.');
      }
    } catch {
      setSaveErrorMsg('Network error occurred while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="w-full max-w-6xl py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-700">Loading Job Sync Settings...</p>
        <p className="text-xs text-gray-400 mt-1">
          Synchronizing configuration from backend database
        </p>
      </div>
    );
  }

  if (pageError || !formSettings) {
    return (
      <div className="w-full max-w-6xl py-12">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Settings</h2>
          <p className="text-sm text-gray-600 mb-6">{pageError || 'Backend error'}</p>
          <button
            type="button"
            onClick={loadInitialData}
            className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'filters', label: 'Filters', icon: SlidersHorizontal },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'activity', label: 'Sync Activity', icon: Activity },
    { id: 'options', label: 'Manage Options', icon: FolderOpen },
  ];

  return (
    <div className="w-full max-w-6xl pb-20">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
            <SlidersHorizontal className="w-8 h-8 text-blue-600" />
            Job Sync Settings
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm max-w-2xl">
            Configure Fantastic.jobs search criteria, automated sync intervals, manual triggers, and manageable option taxonomy.
          </p>
        </div>

        {/* Action Controls (Save / Reset) */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {isDirty && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleResetForm}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-600 transition-all shadow-sm disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Changes</span>
            </button>
          )}

          <button
            type="button"
            disabled={!isDirty || isSaving}
            onClick={handleSaveSettings}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white shadow-lg transition-all ${
              !isDirty
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : isSaving
                ? 'bg-gray-800 opacity-80 cursor-wait'
                : 'bg-black hover:bg-gray-800 hover:shadow-black/20'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* ── Alert Notifications ─────────────────────────────────────────── */}
      {saveSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2 shadow-sm animate-in fade-in duration-150">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* ── Tabs Navigation ─────────────────────────────────────────────── */}
      <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-max max-w-full overflow-x-auto mb-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white shadow-sm text-gray-900 border border-gray-100'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'filters' && isDirty && (
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ──────────────────────────────────────────────────── */}
      {activeTab === 'filters' && (
        <JobsFiltersSection
          filters={formSettings.filters}
          responseOptions={formSettings.responseOptions}
          onFilterChange={handleFilterChange}
          onResponseOptionChange={handleResponseOptionChange}
          filterOptions={filterOptions}
          onOptionCreated={refreshFilterOptions}
        />
      )}

      {activeTab === 'schedule' && (
        <SchedulerSection
          schedulerEnabled={formSettings.schedulerEnabled}
          onSchedulerEnabledChange={handleSchedulerEnabledChange}
          jobs={formSettings.jobs}
          onJobConfigChange={handleJobConfigChange}
        />
      )}

      {activeTab === 'activity' && (
        <SyncActivitySection
          stats={stats}
          usage={usage}
          logs={logs}
          logsLoading={logsLoading}
          logsError={logsError}
          onRefreshAll={refreshActivityData}
          currentSettings={formSettings}
          currentFilters={formSettings.filters}
        />
      )}

      {activeTab === 'options' && (
        <ManageOptionsSection onOptionMutated={refreshFilterOptions} />
      )}
    </div>
  );
}
