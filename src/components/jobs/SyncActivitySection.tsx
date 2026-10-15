import { useState, useMemo } from 'react';
import {
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Coins,
  Briefcase,
  ListChecks,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import type { SyncLogItem, ApiUsage, JobStats, JobFilters, JobSettings } from '../../types/jobsAdmin';
import { jobsAdminApi } from '../../services/jobsAdminApi';

const SYNC_TYPES = [
  'active-ats',
  'active-jb',
  'modified-ats',
  'expired-ats',
  'expired-jb',
  'ats-organizations',
  'expired-boards',
] as const;

const SYNC_TYPE_META: Record<
  typeof SYNC_TYPES[number],
  { label: string; badge: string; defaultTf: string; hasTf: boolean; desc: string }
> = {
  'active-ats': {
    label: 'Active ATS Jobs',
    badge: 'ATS',
    defaultTf: '7d',
    hasTf: true,
    desc: 'Fetch new and open jobs from Applicant Tracking Systems',
  },
  'active-jb': {
    label: 'Active Job Boards',
    badge: 'Job Boards',
    defaultTf: '7d',
    hasTf: true,
    desc: 'Fetch new and open jobs from external job boards',
  },
  'modified-ats': {
    label: 'Modified ATS Jobs',
    badge: 'ATS',
    defaultTf: '24h',
    hasTf: true,
    desc: 'Update altered jobs and descriptions from ATS',
  },
  'expired-ats': {
    label: 'Expired ATS Jobs',
    badge: 'ATS',
    defaultTf: '1d',
    hasTf: true,
    desc: 'Detect and mark closed or expired ATS jobs',
  },
  'expired-jb': {
    label: 'Expired Job Boards',
    badge: 'Job Boards',
    defaultTf: '1d',
    hasTf: true,
    desc: 'Detect and mark closed or expired job board postings',
  },
  'ats-organizations': {
    label: 'Organizations Directory',
    badge: 'Directory',
    defaultTf: '',
    hasTf: false,
    desc: 'Ingest company metadata and directories',
  },
  'expired-boards': {
    label: 'Expired Job Boards (By Age)',
    badge: 'Job Boards',
    defaultTf: '7d',
    hasTf: true,
    desc: 'Expire job-board postings older than configured days',
  },
};

/** Keep only meaningful filter values (non-empty arrays/strings, booleans, numbers). */
function buildFilterOverrides(filters: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') {
      if (v.trim() !== '') out[k] = v;
    } else if (Array.isArray(v)) {
      if (v.length > 0) out[k] = v;
    } else if (typeof v === 'boolean' || (typeof v === 'number' && !Number.isNaN(v))) {
      out[k] = v;
    }
  }
  return out;
}

interface SyncActivitySectionProps {
  stats: JobStats | null;
  usage: ApiUsage | null;
  logs: SyncLogItem[];
  logsLoading: boolean;
  logsError: string;
  onRefreshAll: () => Promise<void>;
  currentSettings?: JobSettings | null;
  currentFilters?: JobFilters;
}

export default function SyncActivitySection({
  stats,
  usage,
  logs,
  logsLoading,
  logsError,
  onRefreshAll,
  currentSettings,
  currentFilters: propFilters,
}: SyncActivitySectionProps) {
  const currentFilters = currentSettings?.filters || propFilters;
  // Manual sync state
  const [triggerType, setTriggerType] = useState<typeof SYNC_TYPES[number]>('active-ats');
  const [triggerTimeFrame, setTriggerTimeFrame] = useState('');
  const [applyFilters, setApplyFilters] = useState<boolean>(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerSuccessMsg, setTriggerSuccessMsg] = useState<string | null>(null);
  const [triggerErrorMsg, setTriggerErrorMsg] = useState<string | null>(null);

  // Logs filter
  const [selectedFilterType, setSelectedFilterType] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active filters count calculation
  const activeFiltersCount = useMemo(() => {
    if (!currentFilters) return 0;
    let count = 0;
    if (currentFilters.title?.trim()) count++;
    if (currentFilters.description?.trim()) count++;
    if (currentFilters.location?.length) count += currentFilters.location.length;
    if (currentFilters.organization?.length) count += currentFilters.organization.length;
    if (currentFilters.sources?.length) count += currentFilters.sources.length;
    if (currentFilters.domain?.length) count += currentFilters.domain.length;
    if (currentFilters.organizationIndustry?.length) count += currentFilters.organizationIndustry.length;
    if (currentFilters.organizationSize?.length) count += currentFilters.organizationSize.length;
    if (currentFilters.aiExperienceLevel?.length) count += currentFilters.aiExperienceLevel.length;
    if (currentFilters.aiWorkArrangement?.length) count += currentFilters.aiWorkArrangement.length;
    if (currentFilters.aiEmploymentType?.length) count += currentFilters.aiEmploymentType.length;
    if (currentFilters.aiLanguage?.length) count += currentFilters.aiLanguage.length;
    if (currentFilters.aiEducation?.length) count += currentFilters.aiEducation.length;
    if (currentFilters.aiTaxonomiesA?.length) count += currentFilters.aiTaxonomiesA.length;
    if (currentFilters.aiVisaSponsorship !== null) count++;
    if (currentFilters.hasSalary) count++;
    if (currentFilters.seniority?.length) count += currentFilters.seniority.length;
    return count;
  }, [currentFilters]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTriggering) return;

    setIsTriggering(true);
    setTriggerSuccessMsg(null);
    setTriggerErrorMsg(null);

    const typeMeta = SYNC_TYPE_META[triggerType];
    const effectiveTimeFrame = typeMeta.hasTf
      ? (triggerTimeFrame.trim() || typeMeta.defaultTf)
      : undefined;

    try {
      let filters: Record<string, unknown> | undefined;
      if (applyFilters && currentFilters) {
        const overrides = buildFilterOverrides(currentFilters);
        if (Object.keys(overrides).length > 0) filters = overrides;
      }

      let maxJobs: number | undefined;
      const isActive = triggerType === 'active-ats' || triggerType === 'active-jb';
      const mj = currentSettings?.jobs?.activeSync?.maxJobs;
      if (isActive && typeof mj === 'number' && mj > 0) {
        maxJobs = mj;
      }

      const res = await jobsAdminApi.triggerSync(
        triggerType,
        effectiveTimeFrame,
        filters,
        maxJobs
      );

      if (res.success) {
        const filterNote = applyFilters && activeFiltersCount > 0
          ? ` (with ${activeFiltersCount} active API filter rules)`
          : '';
        setTriggerSuccessMsg(
          res.message || `Successfully executed ${triggerType} synchronization${filterNote}.`
        );
        // Refresh stats, usage, and logs
        await onRefreshAll();
        setTimeout(() => setTriggerSuccessMsg(null), 7000);
      } else {
        setTriggerErrorMsg(res.message || 'Manual synchronization failed');
      }
    } catch {
      setTriggerErrorMsg('Network error while triggering synchronization');
    } finally {
      setIsTriggering(false);
    }
  };

  const formatDateTime = (d?: string) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'running') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 animate-spin" /> Running
        </span>
      );
    }
    if (s === 'success' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" /> Success
        </span>
      );
    }
    if (s === 'failed' || s === 'error') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  const filteredLogs = selectedFilterType
    ? logs.filter((l) => l.jobType === selectedFilterType)
    : logs;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Top Header & Refresh ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sync Activity & Analytics</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor API credit balances, database totals, and recent synchronization logs
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Active Jobs
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {stats?.active != null ? stats.active.toLocaleString() : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Currently queryable in DB</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Expired Jobs
            </span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {stats?.expired != null ? stats.expired.toLocaleString() : '—'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Archived or closed postings</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Credits Remaining
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {usage?.jobsRemaining != null ? usage.jobsRemaining.toLocaleString() : '—'}
            {usage?.jobsLimit != null && (
              <span className="text-xs text-gray-400 font-normal">
                {' '}
                / {usage.jobsLimit.toLocaleString()}
              </span>
            )}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">Fantastic.jobs job credits</p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Requests Remaining
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {usage?.requestsRemaining != null
              ? usage.requestsRemaining.toLocaleString()
              : '—'}
            {usage?.requestsLimit != null && (
              <span className="text-xs text-gray-400 font-normal">
                {' '}
                / {usage.requestsLimit.toLocaleString()}
              </span>
            )}
          </p>
          {usage?.nextBillingDate ? (
            <p className="text-[11px] text-gray-400 mt-1">
              Renews: {formatDateTime(usage.nextBillingDate).split(',')[0]}
            </p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1">API rate allowance</p>
          )}
        </div>
      </div>

      {/* ── Manual Sync Trigger Widget ───────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Trigger Manual Sync</h3>
            <p className="text-xs text-gray-500">
              Execute on-demand ingestion against Fantastic.jobs. Runs synchronously and records in logs.
            </p>
          </div>
        </div>

        {triggerSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-xs font-medium mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{triggerSuccessMsg}</span>
          </div>
        )}

        {triggerErrorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-xs font-medium mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{triggerErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleManualSync} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Sync Target Type
              </label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value as typeof SYNC_TYPES[number])}
                className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              >
                {SYNC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SYNC_TYPE_META[t].label} ({t})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                {SYNC_TYPE_META[triggerType].desc}
              </p>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Time Frame
              </label>
              <input
                type="text"
                disabled={!SYNC_TYPE_META[triggerType].hasTf}
                placeholder={
                  SYNC_TYPE_META[triggerType].hasTf
                    ? `Default: ${SYNC_TYPE_META[triggerType].defaultTf}`
                    : 'N/A for directory'
                }
                value={triggerTimeFrame}
                onChange={(e) => setTriggerTimeFrame(e.target.value)}
                className={`w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black ${
                  !SYNC_TYPE_META[triggerType].hasTf ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''
                }`}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {SYNC_TYPE_META[triggerType].hasTf
                  ? `Leave empty to use ${SYNC_TYPE_META[triggerType].defaultTf}${
                      triggerType === 'expired-ats' || triggerType === 'expired-jb'
                        ? ' (valid: 1h, 1d, 1m)'
                        : ''
                    }`
                  : 'Organization sync does not query by timeframe'}
              </p>
            </div>

            <div className="md:col-span-3 flex items-start md:items-end">
              <button
                type="submit"
                disabled={isTriggering}
                className={`w-full px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                  isTriggering
                    ? 'bg-gray-500 cursor-not-allowed opacity-80'
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                {isTriggering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Run Sync Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── API Filters Integration Bar ──────────────────────────────── */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60 p-3.5 rounded-2xl border">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={applyFilters}
                onClick={() => setApplyFilters(!applyFilters)}
                className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center shrink-0 ${
                  applyFilters ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 bg-white rounded-full mx-1 transition-transform duration-200 shadow-sm ${
                    applyFilters ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div>
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
                  Apply Configured API Filters to Manual Sync
                </span>
                <p className="text-[11px] text-gray-500">
                  {applyFilters ? (
                    activeFiltersCount > 0 ? (
                      <span className="text-emerald-700 font-medium">
                        Active: Sending {activeFiltersCount} filter criteria (keywords, taxonomy, locations, sources)
                      </span>
                    ) : (
                      <span>All configured filters are currently open (no restrictive filters set)</span>
                    )
                  ) : (
                    <span className="text-amber-700 font-medium">
                      Bypassing API filters: Backend will query without custom restrictions
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  applyFilters && activeFiltersCount > 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : applyFilters
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {applyFilters
                  ? `${activeFiltersCount} Filter Rules Linked`
                  : 'Filters Disabled for Trigger'}
              </span>
            </div>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-3">
          Manual runs use the filters and time frame currently shown on screen (even if not saved). Scheduled runs use saved settings.
        </p>
      </div>

      {/* ── Sync History Logs Table ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-800 flex items-center justify-center">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent Sync Logs</h3>
              <p className="text-xs text-gray-500">
                Audit trail of automated cron and manual administrator executions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedFilterType}
              onChange={(e) => setSelectedFilterType(e.target.value)}
              className="bg-gray-50/70 border border-gray-200 text-xs font-medium text-gray-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Types ({logs.length})</option>
              {SYNC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {logsError && (
          <div className="p-4 mx-6 mt-4 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{logsError}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Type / Target
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Fetched
                </th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Upserted
                </th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Expired
                </th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-5 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Started At
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Triggered By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <span>{log.jobType}</span>
                      {log.timeFrame && (
                        <span className="text-gray-400 font-normal">
                          ({log.timeFrame})
                        </span>
                      )}
                    </div>
                    {log.status === 'failed' && log.errorMessage && (
                      <p
                        className="text-[11px] text-red-500 font-medium mt-1 max-w-xs truncate"
                        title={log.errorMessage}
                      >
                        {log.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">{statusBadge(log.status)}</td>
                  <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                    {log.jobsFetched != null ? log.jobsFetched.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                    {log.jobsUpserted != null ? log.jobsUpserted.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                    {log.jobsExpired != null ? log.jobsExpired.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                    {log.creditsUsed != null ? log.creditsUsed.toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-600 font-medium whitespace-nowrap">
                    {formatDateTime(log.startedAt)}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium capitalize">
                    {log.triggeredBy || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {logsLoading && (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
          )}

          {!logsLoading && filteredLogs.length === 0 && (
            <div className="py-20 text-center">
              <ListChecks className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-800">No sync logs recorded</p>
              <p className="text-xs text-gray-400 mt-1">
                Run a manual sync above or wait for scheduled cron triggers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
