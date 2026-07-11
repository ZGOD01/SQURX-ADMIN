import { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Search, ExternalLink, X, Plus, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, Settings2, ListChecks,
  CheckCircle2, XCircle, Clock, Zap
} from 'lucide-react';
import { API_BASE_URL as API_BASE } from '../config/api';

const LIMIT = 20;

const SOURCES = ['ats', 'linkedin', 'wellfound', 'ycombinator'] as const;
const SYNC_TYPES = ['active-ats', 'active-jb', 'modified-ats', 'expired-ats', 'expired-jb', 'ats-organizations'] as const;

interface Job {
  _id: string;
  externalId: string;
  source: string;
  title: string;
  url?: string;
  organization?: string;
  organizationSlug?: string;
  datePosted?: string;
  dateValidThrough?: string;
  locationsDerived?: string[];
  workArrangement?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  experienceLevel?: string;
  employmentType?: string[];
  taxonomiesA?: string[];
  keySkills?: string[];
  visaSponsorship?: boolean;
  description?: string;
  status: 'active' | 'expired';
  expiredAt?: string;
}

interface AdminSettings {
  sources: string[];
  industries: string[];
  taxonomies: string[];
  timeFrames: {
    activeAts?: string;
    activeJb?: string;
    modifiedAts?: string;
    expired?: string;
  };
  active: boolean;
}

interface SyncLog {
  _id: string;
  jobType: string;
  timeFrame?: string;
  status: 'running' | 'success' | 'failed';
  jobsFetched?: number;
  jobsUpserted?: number;
  jobsExpired?: number;
  creditsUsed?: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  triggeredBy?: 'cron' | 'admin-manual';
}

interface ApiUsage {
  jobsRemaining?: number;
  jobsLimit?: number;
  requestsRemaining?: number;
  requestsLimit?: number;
  nextBillingDate?: string;
  recordedAt?: string;
}

interface JobStats {
  active: number;
  expired: number;
}

const getHeaders = () => ({
  'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`,
  'Content-Type': 'application/json'
});

const formatDate = (d?: string) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (d?: string) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function Jobs() {
  const [activeTab, setActiveTab] = useState<'browse' | 'settings' | 'logs'>('browse');

  const [stats, setStats] = useState<JobStats | null>(null);
  const [usage, setUsage] = useState<ApiUsage | null>(null);

  // Browse tab
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobLoading, setSelectedJobLoading] = useState(false);

  // Settings tab
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState('');
  const [taxonomies, setTaxonomies] = useState<string[]>([]);
  const [taxonomyInput, setTaxonomyInput] = useState('');
  const [timeFrames, setTimeFrames] = useState({ activeAts: '', activeJb: '', modifiedAts: '', expired: '' });
  const [settingsActive, setSettingsActive] = useState(true);

  // Logs tab
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  const [logsFilter, setLogsFilter] = useState('');

  // Trigger sync
  const [triggerType, setTriggerType] = useState<typeof SYNC_TYPES[number]>('active-ats');
  const [triggerTimeFrame, setTriggerTimeFrame] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');
  const [triggerError, setTriggerError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/stats`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      // stats are supplementary; ignore failures
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/usage/latest`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setUsage(data.data);
    } catch {
      // usage is supplementary; ignore failures
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (orgFilter) params.set('organizationSlug', orgFilter);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', String(LIMIT));

      const res = await fetch(`${API_BASE}/admin/jobs?${params.toString()}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data?.jobs || []);
        setTotal(data.data?.total || 0);
      } else {
        setJobsError(data.message || 'Failed to fetch jobs');
      }
    } catch {
      setJobsError('Network error');
    } finally {
      setJobsLoading(false);
    }
  }, [statusFilter, sourceFilter, orgFilter, search, page]);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/settings`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const s: AdminSettings = data.data;
        setSettings(s);
        setSelectedSources(s.sources || []);
        setIndustries(s.industries || []);
        setTaxonomies(s.taxonomies || []);
        setTimeFrames({
          activeAts: s.timeFrames?.activeAts || '',
          activeJb: s.timeFrames?.activeJb || '',
          modifiedAts: s.timeFrames?.modifiedAts || '',
          expired: s.timeFrames?.expired || ''
        });
        setSettingsActive(s.active ?? true);
      } else {
        setSettingsError(data.message || 'Failed to fetch settings');
      }
    } catch {
      setSettingsError('Network error');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError('');
    try {
      const params = new URLSearchParams();
      if (logsFilter) params.set('jobType', logsFilter);
      const res = await fetch(`${API_BASE}/admin/jobs/sync-logs?${params.toString()}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      } else {
        setLogsError(data.message || 'Failed to fetch sync logs');
      }
    } catch {
      setLogsError('Network error');
    } finally {
      setLogsLoading(false);
    }
  }, [logsFilter]);

  useEffect(() => {
    fetchStats();
    fetchUsage();
  }, [fetchStats, fetchUsage]);

  useEffect(() => {
    if (activeTab === 'browse') fetchJobs();
  }, [activeTab, fetchJobs]);

  useEffect(() => {
    if (activeTab === 'settings' && !settings) fetchSettings();
  }, [activeTab, settings, fetchSettings]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const openJob = async (id: string) => {
    setSelectedJobLoading(true);
    setSelectedJob(null);
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/${id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setSelectedJob(data.data);
    } catch {
      // silently ignore; user can retry by clicking the row again
    } finally {
      setSelectedJobLoading(false);
    }
  };

  const toggleSource = (src: string) => {
    setSelectedSources(prev => prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]);
  };

  const addIndustry = () => {
    const v = industryInput.trim();
    if (v && !industries.includes(v)) setIndustries([...industries, v]);
    setIndustryInput('');
  };

  const addTaxonomy = () => {
    const v = taxonomyInput.trim();
    if (v && !taxonomies.includes(v)) setTaxonomies([...taxonomies, v]);
    setTaxonomyInput('');
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError('');
    setSettingsSaved(false);
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          sources: selectedSources,
          industries,
          taxonomies,
          timeFrames,
          active: settingsActive
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } else {
        setSettingsError(data.message || 'Failed to update settings');
      }
    } catch {
      setSettingsError('Network error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const triggerSync = async () => {
    setTriggering(true);
    setTriggerMessage('');
    setTriggerError('');
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/sync/trigger`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: triggerType,
          ...(triggerTimeFrame.trim() ? { timeFrame: triggerTimeFrame.trim() } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setTriggerMessage(data.message || 'Sync completed successfully');
        fetchStats();
        fetchUsage();
        if (activeTab === 'logs') fetchLogs();
      } else {
        setTriggerError(data.message || 'Failed to trigger sync');
      }
    } catch {
      setTriggerError('Network error');
    } finally {
      setTriggering(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      expired: 'bg-gray-200 text-gray-600',
      running: 'bg-blue-100 text-blue-700',
      success: 'bg-emerald-100 text-emerald-700',
      failed: 'bg-red-100 text-red-700'
    };
    return map[status] || 'bg-gray-200 text-gray-600';
  };

  return (
    <div className="w-full max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-500" />
            Jobs Management
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl">
            Browse synced job listings, manage Fantastic.jobs sync settings, and monitor sync activity.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Active Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{stats ? stats.active.toLocaleString() : '—'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Expired Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{stats ? stats.expired.toLocaleString() : '—'}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Credits Remaining</p>
          <p className="text-2xl font-bold text-gray-900">
            {usage?.jobsRemaining != null ? usage.jobsRemaining.toLocaleString() : '—'}
            {usage?.jobsLimit != null && <span className="text-sm text-gray-400 font-medium"> / {usage.jobsLimit.toLocaleString()}</span>}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Requests Remaining</p>
          <p className="text-2xl font-bold text-gray-900">
            {usage?.requestsRemaining != null ? usage.requestsRemaining.toLocaleString() : '—'}
            {usage?.requestsLimit != null && <span className="text-sm text-gray-400 font-medium"> / {usage.requestsLimit.toLocaleString()}</span>}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-max mb-6">
        {([
          { id: 'browse', label: 'Browse Jobs', icon: Briefcase },
          { id: 'settings', label: 'Sync Settings', icon: Settings2 },
          { id: 'logs', label: 'Sync Logs', icon: ListChecks }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Jobs Tab */}
      {activeTab === 'browse' && (
        <>
          <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by job title or description..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
              />
            </form>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
            >
              <option value="">All Sources</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="Organization slug"
              value={orgFilter}
              onChange={e => { setOrgFilter(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 w-48"
            />
          </div>

          {jobsError && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {jobsError}
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Job</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Posted</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map(job => (
                    <tr key={job._id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => openJob(job._id)}>
                      <td className="px-8 py-5 text-sm">
                        <p className="font-bold text-gray-900 leading-tight mb-1">{job.title}</p>
                        <p className="text-[13px] font-medium text-gray-500">{job.organization || '—'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700">
                          {job.source}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[13px] font-medium text-gray-600">
                        {job.locationsDerived?.length ? job.locationsDerived.join(', ') : (job.workArrangement || '—')}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[13px] font-medium text-gray-600">{formatDate(job.datePosted)}</td>
                      <td className="px-8 py-5 text-right">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {jobsLoading && (
                <div className="flex justify-center p-12">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                </div>
              )}

              {!jobsLoading && jobs.length === 0 && (
                <div className="py-24 text-center">
                  <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1">No jobs found</h3>
                  <p className="text-[13px] font-medium text-gray-500">Try adjusting your filters or search term.</p>
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <p className="text-[13px] font-medium text-gray-500">
                Showing <span className="font-bold text-gray-900">{jobs.length}</span> of <span className="font-bold text-gray-900">{total.toLocaleString()}</span> results
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[12px] font-bold text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sync Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          {settingsLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={saveSettings} className="space-y-8">
              {settingsError && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {settingsError}
                </div>
              )}
              {settingsSaved && (
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Settings saved
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Sources</label>
                <div className="flex flex-wrap gap-3">
                  {SOURCES.map(src => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => toggleSource(src)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        selectedSources.includes(src)
                          ? 'bg-black text-white border-black'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Industries</label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={industryInput}
                    onChange={e => setIndustryInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIndustry(); } }}
                    placeholder="e.g. software-development"
                    className="flex-1 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                  <button type="button" onClick={addIndustry} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {industries.map(ind => (
                    <span key={ind} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      {ind}
                      <button type="button" onClick={() => setIndustries(industries.filter(i => i !== ind))} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Taxonomies</label>
                <div className="flex gap-3 mb-3">
                  <input
                    type="text"
                    value={taxonomyInput}
                    onChange={e => setTaxonomyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTaxonomy(); } }}
                    placeholder="e.g. engineering"
                    className="flex-1 bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                  <button type="button" onClick={addTaxonomy} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {taxonomies.map(tax => (
                    <span key={tax} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                      {tax}
                      <button type="button" onClick={() => setTaxonomies(taxonomies.filter(t => t !== tax))} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Time Frames</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    ['activeAts', 'Active ATS'],
                    ['activeJb', 'Active JB'],
                    ['modifiedAts', 'Modified ATS'],
                    ['expired', 'Expired']
                  ] as const).map(([key, label]) => (
                    <div key={key}>
                      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
                      <input
                        type="text"
                        placeholder="e.g. 1h"
                        value={timeFrames[key]}
                        onChange={e => setTimeFrames({ ...timeFrames, [key]: e.target.value })}
                        className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-5 rounded-2xl bg-gray-50/80 border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Sync Enabled</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle automatic Fantastic.jobs syncing on or off</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsActive(!settingsActive)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${settingsActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-300 shadow-sm ${settingsActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className={`px-8 py-3.5 rounded-xl text-white font-semibold flex justify-center items-center gap-2 transition-all duration-300 shadow-lg ${
                    settingsSaving ? 'bg-gray-800 opacity-80 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:shadow-black/20'
                  }`}
                >
                  {settingsSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Sync Logs Tab */}
      {activeTab === 'logs' && (
        <>
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Trigger Manual Sync
            </h2>
            <p className="text-sm text-gray-500 mb-5">Runs synchronously against Fantastic.jobs and may take a moment to complete.</p>

            {triggerMessage && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {triggerMessage}
              </div>
            )}
            {triggerError && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {triggerError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={triggerType}
                onChange={e => setTriggerType(e.target.value as typeof SYNC_TYPES[number])}
                className="px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
              >
                {SYNC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="text"
                placeholder="Time frame (optional, e.g. 1h)"
                value={triggerTimeFrame}
                onChange={e => setTriggerTimeFrame(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100"
              />
              <button
                onClick={triggerSync}
                disabled={triggering}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 ${
                  triggering ? 'bg-gray-500 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:shadow-black/20'
                }`}
              >
                {triggering ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Run Sync</>}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-3 mb-6">
            <select
              value={logsFilter}
              onChange={e => setLogsFilter(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100"
            >
              <option value="">All Sync Types</option>
              {SYNC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {logsError && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {logsError}
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Fetched</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Upserted</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Expired</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Started</th>
                    <th className="px-8 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Triggered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5 text-sm font-semibold text-gray-900">
                        {log.jobType}
                        {log.timeFrame && <span className="text-gray-400 font-medium"> · {log.timeFrame}</span>}
                        {log.status === 'failed' && log.errorMessage && (
                          <p className="text-xs text-red-500 font-medium mt-1 max-w-xs truncate" title={log.errorMessage}>{log.errorMessage}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${statusBadge(log.status)}`}>
                          {log.status === 'running' && <Clock className="w-3 h-3" />}
                          {log.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                          {log.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[13px] font-medium text-gray-600">{log.jobsFetched ?? '—'}</td>
                      <td className="px-6 py-5 text-[13px] font-medium text-gray-600">{log.jobsUpserted ?? '—'}</td>
                      <td className="px-6 py-5 text-[13px] font-medium text-gray-600">{log.jobsExpired ?? '—'}</td>
                      <td className="px-6 py-5 text-[13px] font-medium text-gray-600">{log.creditsUsed ?? '—'}</td>
                      <td className="px-6 py-5 text-[13px] font-medium text-gray-600">{formatDateTime(log.startedAt)}</td>
                      <td className="px-8 py-5 text-[13px] font-medium text-gray-600">{log.triggeredBy || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logsLoading && (
                <div className="flex justify-center p-12">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                </div>
              )}

              {!logsLoading && logs.length === 0 && (
                <div className="py-24 text-center">
                  <ListChecks className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-[15px] font-bold text-gray-900 mb-1">No sync logs found</h3>
                  <p className="text-[13px] font-medium text-gray-500">Trigger a manual sync above or wait for the next scheduled run.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Job Detail Modal */}
      {(selectedJob || selectedJobLoading) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => { setSelectedJob(null); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {selectedJobLoading ? (
              <div className="flex justify-center p-16">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              </div>
            ) : selectedJob && (
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedJob.organization || '—'}</p>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge(selectedJob.status)}`}>{selectedJob.status}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">{selectedJob.source}</span>
                  {selectedJob.workArrangement && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{selectedJob.workArrangement}</span>}
                  {selectedJob.experienceLevel && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{selectedJob.experienceLevel}</span>}
                  {selectedJob.visaSponsorship && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-50 text-purple-700">Visa Sponsorship</span>}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-gray-900 font-medium">{selectedJob.locationsDerived?.join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Posted</p>
                    <p className="text-gray-900 font-medium">{formatDate(selectedJob.datePosted)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Salary</p>
                    <p className="text-gray-900 font-medium">
                      {selectedJob.salaryMin || selectedJob.salaryMax
                        ? `${selectedJob.salaryCurrency || ''} ${selectedJob.salaryMin ?? '?'} - ${selectedJob.salaryMax ?? '?'}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Employment Type</p>
                    <p className="text-gray-900 font-medium">{selectedJob.employmentType?.join(', ') || '—'}</p>
                  </div>
                </div>

                {selectedJob.keySkills && selectedJob.keySkills.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.keySkills.map(skill => (
                        <span key={skill} className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.description && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.url && (
                  <a
                    href={selectedJob.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> View Original Posting
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
