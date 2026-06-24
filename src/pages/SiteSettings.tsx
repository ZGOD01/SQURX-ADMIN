import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Wrench, Briefcase, MapPin, TrendingUp,
  Search, RefreshCw, AlertCircle, Loader2, CheckCircle,
  XCircle, Database, Info
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://squrx-backend.onrender.com/api/v1';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LookupItem {
  _id: string;
  name: string;
  isActive: boolean;
}

interface ApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: LookupItem[];
}

type SectionKey = 'educations' | 'skills' | 'job-types' | 'locations' | 'experience-levels';

interface SectionState {
  data: LookupItem[];
  loading: boolean;
  error: string | null;
}

type SectionsState = Record<SectionKey, SectionState>;

// ─── Section Config ───────────────────────────────────────────────────────────
const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
  description: string;
  endpoint: string;
  accentColor: string;
  badgeColor: string;
}[] = [
  {
    key: 'educations',
    label: 'Education Degrees',
    icon: GraduationCap,
    description: 'Active academic qualifications used in student onboarding and profile forms.',
    endpoint: '/educations',
    accentColor: 'bg-blue-50 text-blue-600 border-blue-100',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'skills',
    label: 'Skills',
    icon: Wrench,
    description: 'Professional and technical skills selectable during profile creation.',
    endpoint: '/skills',
    accentColor: 'bg-violet-50 text-violet-600 border-violet-100',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
  {
    key: 'job-types',
    label: 'Job Types',
    icon: Briefcase,
    description: 'Employment categories used to classify job postings and recruiter preferences.',
    endpoint: '/job-types',
    accentColor: 'bg-amber-50 text-amber-600 border-amber-100',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'locations',
    label: 'Locations',
    icon: MapPin,
    description: 'Geographic locations used for job listings and candidate location preferences.',
    endpoint: '/locations',
    accentColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'experience-levels',
    label: 'Experience Levels',
    icon: TrendingUp,
    description: 'Career stages used to match candidates with appropriate job opportunities.',
    endpoint: '/experience-levels',
    accentColor: 'bg-rose-50 text-rose-600 border-rose-100',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
];

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Database className="w-6 h-6 text-gray-300" />
      </div>
      <h3 className="text-[14px] font-bold text-gray-900 mb-1">No records found</h3>
      <p className="text-[13px] font-medium text-gray-400 max-w-xs">
        No active {label.toLowerCase()} are returned from the backend.
      </p>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <h3 className="text-[14px] font-bold text-gray-900 mb-1">Failed to load</h3>
      <p className="text-[13px] font-medium text-gray-400 max-w-xs mb-5">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[12px] font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3 py-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <div className="h-9 w-9 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded-full w-2/5" />
          </div>
          <div className="h-5 w-14 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ─── Lookup Table ─────────────────────────────────────────────────────────────
function LookupTable({
  items,
  searchQuery,
  badgeColor,
}: {
  items: LookupItem[];
  searchQuery: string;
  badgeColor: string;
}) {
  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0 && searchQuery) {
    return (
      <div className="py-12 text-center">
        <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
        <p className="text-[13px] font-bold text-gray-900 mb-1">No results for "{searchQuery}"</p>
        <p className="text-[12px] font-medium text-gray-400">Try a different keyword.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-10">#</th>
            <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
            <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
            <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtered.map((item, index) => (
            <tr key={item._id} className="group hover:bg-gray-50/60 transition-colors">
              <td className="px-6 py-4 text-[12px] font-bold text-gray-300">{index + 1}</td>
              <td className="px-4 py-4">
                <span className="text-[14px] font-bold text-gray-900">{item.name || '—'}</span>
              </td>
              <td className="px-4 py-4">
                <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  {item._id}
                </code>
              </td>
              <td className="px-4 py-4 text-right">
                {item.isActive ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold ${badgeColor}`}>
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-gray-100 text-gray-500">
                    <XCircle className="w-3 h-3" />
                    Inactive
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
        <p className="text-[12px] font-medium text-gray-400">
          Showing <span className="font-bold text-gray-700">{filtered.length}</span> of{' '}
          <span className="font-bold text-gray-700">{items.length}</span> records
        </p>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  section,
  state,
  onRefresh,
}: {
  section: (typeof SECTIONS)[number];
  state: SectionState;
  onRefresh: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const Icon = section.icon;

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${section.accentColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-extrabold text-gray-900">{section.label}</h2>
            <p className="text-[12px] font-medium text-gray-400 mt-0.5 truncate">{section.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!state.loading && !state.error && (
            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${section.badgeColor}`}>
              {state.data.length} records
            </span>
          )}
          {!state.loading && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl text-[12px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all w-44"
              />
            </div>
          )}
          <button
            onClick={onRefresh}
            disabled={state.loading}
            className={`p-2.5 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm ${state.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div>
        {state.loading && <LoadingSkeleton />}
        {!state.loading && state.error && (
          <ErrorState message={state.error} onRetry={onRefresh} />
        )}
        {!state.loading && !state.error && state.data.length === 0 && (
          <EmptyState label={section.label} />
        )}
        {!state.loading && !state.error && state.data.length > 0 && (
          <LookupTable items={state.data} searchQuery={searchQuery} badgeColor={section.badgeColor} />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SiteSettings() {
  const [sections, setSections] = useState<SectionsState>(() => {
    const initial: Partial<SectionsState> = {};
    SECTIONS.forEach((s) => {
      initial[s.key] = { data: [], loading: true, error: null };
    });
    return initial as SectionsState;
  });
  const [activeTab, setActiveTab] = useState<SectionKey>('educations');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchSection = useCallback(async (section: (typeof SECTIONS)[number]) => {
    setSections((prev) => ({
      ...prev,
      [section.key]: { ...prev[section.key], loading: true, error: null },
    }));
    try {
      const res = await fetch(`${BASE_URL}${section.endpoint}`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error(json.message || 'API returned failure');
      const data: LookupItem[] = Array.isArray(json.data) ? json.data : [];
      setSections((prev) => ({
        ...prev,
        [section.key]: { data, loading: false, error: null },
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setSections((prev) => ({
        ...prev,
        [section.key]: { data: [], loading: false, error: message },
      }));
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all(SECTIONS.map((s) => fetchSection(s)));
    setLastRefreshed(new Date());
  }, [fetchSection]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    await fetchAll();
    setIsRefreshingAll(false);
  };

  const handleRefreshSection = (section: (typeof SECTIONS)[number]) => {
    fetchSection(section);
    setLastRefreshed(new Date());
  };

  const activeSection = SECTIONS.find((s) => s.key === activeTab)!;
  const activeSectionState = sections[activeTab];

  const totalRecords = SECTIONS.reduce((sum, s) => sum + sections[s.key].data.length, 0);
  const hasAnyError = SECTIONS.some((s) => sections[s.key].error !== null);
  const allLoaded = SECTIONS.every((s) => !sections[s.key].loading);

  return (
    <div className="max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-500 pt-6">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Site Settings</h1>
          <p className="text-[14px] font-medium text-gray-500 mt-2">
            Lookup &amp; master data used across onboarding, profile forms, and job listings — fetched live from the backend.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            {allLoaded && (
              <p className="text-[11px] font-semibold text-gray-400">
                Last refreshed {lastRefreshed.toLocaleTimeString()}
              </p>
            )}
            {!hasAnyError && allLoaded && (
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                {totalRecords} total records loaded
              </p>
            )}
          </div>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshingAll}
            className={`flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all ${isRefreshingAll ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </div>
      </div>

      {/* ── Read-Only Notice ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-blue-50/60 border border-blue-100 rounded-2xl mb-8">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-bold text-blue-800">Read-Only View</p>
          <p className="text-[12px] font-medium text-blue-600 mt-0.5">
            This page displays live lookup data from the backend. Admin CRUD endpoints (add/edit/delete/activate/deactivate)
            are not yet available in the API. Contact the backend team to expose those endpoints.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Left Sidebar Navigation ──────────────────────────────────── */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-28">
            <h2 className="px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 mt-2">
              Lookup Tables
            </h2>
            <nav className="flex flex-col gap-1">
              {SECTIONS.map((section) => {
                const isActive = activeTab === section.key;
                const sectionState = sections[section.key];
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveTab(section.key)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[13px] font-bold transition-all text-left ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${isActive ? section.accentColor : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{section.label}</span>
                    </div>
                    <div className="shrink-0">
                      {sectionState.loading ? (
                        <Loader2 className="w-3.5 h-3.5 text-gray-300 animate-spin" />
                      ) : sectionState.error ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${isActive ? section.badgeColor : 'bg-gray-100 text-gray-400'}`}>
                          {sectionState.data.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 px-4">
              <p className="text-[11px] font-semibold text-gray-400 mb-1">API Source</p>
              <code className="text-[10px] font-mono text-gray-400 break-all leading-relaxed">
                {BASE_URL}
              </code>
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div className="flex-1 animate-in slide-in-from-right-4 duration-300" key={activeTab}>
          <SectionCard
            section={activeSection}
            state={activeSectionState}
            onRefresh={() => handleRefreshSection(activeSection)}
          />
        </div>
      </div>
    </div>
  );
}
