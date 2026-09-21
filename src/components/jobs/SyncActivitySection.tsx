import { useState } from 'react';
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
} from 'lucide-react';
import type { SyncLogItem, ApiUsage, JobStats } from '../../types/jobsAdmin';
import { jobsAdminApi } from '../../services/jobsAdminApi';

const SYNC_TYPES = [
  'active-ats',
  'active-jb',
  'modified-ats',
  'expired-ats',
  'expired-jb',
  'ats-organizations',
] as const;

interface SyncActivitySectionProps {
  stats: JobStats | null;
  usage: ApiUsage | null;
  logs: SyncLogItem[];
  logsLoading: boolean;
  logsError: string;
  onRefreshAll: () => Promise<void>;
}

export default function SyncActivitySection({
  stats,
  usage,
  logs,
  logsLoading,
  logsError,
  onRefreshAll,
}: SyncActivitySectionProps) {
  // Manual sync state
  const [triggerType, setTriggerType] = useState<string>('active-ats');
  const [triggerTimeFrame, setTriggerTimeFrame] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerSuccessMsg, setTriggerSuccessMsg] = useState<string | null>(null);
  const [triggerErrorMsg, setTriggerErrorMsg] = useState<string | null>(null);

  // Logs filter
  const [selectedFilterType, setSelectedFilterType] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

    try {
      const res = await jobsAdminApi.triggerSync(
        triggerType,
        triggerTimeFrame.trim() || undefined
      );

      if (res.success) {
        setTriggerSuccessMsg(
          res.message || `Successfully executed ${triggerType} synchronization.`
        );
        // Refresh stats, usage, and logs
        await onRefreshAll();
        setTimeout(() => setTriggerSuccessMsg(null), 6000);
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

        <form onSubmit={handleManualSync} className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-56">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Sync Target Type
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {SYNC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Time Frame (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 1h, 24h, 7d (leave blank for default)"
              value={triggerTimeFrame}
              onChange={(e) => setTriggerTimeFrame(e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isTriggering}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
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
                  <span>Run Now</span>
                </>
              )}
            </button>
          </div>
        </form>
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
