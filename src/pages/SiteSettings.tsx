import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Wrench, Briefcase, MapPin, TrendingUp, Coins,
  Search, RefreshCw, AlertCircle, Loader2, CheckCircle,
  XCircle, Database, Plus, Edit3, Trash2, X, Sparkles,
  Globe, Award, School, BookOpen, UserCheck, Layers,
  Layout
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────
import { API_BASE_URL as BASE_URL } from '../config/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LookupItem {
  _id: string;
  name: string;
  code?: string;
  symbol?: string;
  isActive: boolean;
}

interface HeroSectionItem {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

type SectionKey =
  | 'educations'
  | 'languages'
  | 'language-proficiencies'
  | 'roles'
  | 'universities'
  | 'courses'
  | 'specializations'
  | 'skills'
  | 'job-types'
  | 'locations'
  | 'experience-levels'
  | 'currencies';

interface SectionState {
  data: LookupItem[];
  loading: boolean;
  error: string | null;
}

type SectionsState = Record<SectionKey, SectionState>;

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

function getHeaders() {
  return {
    Authorization: `Bearer ${sessionStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  };
}

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
    description: 'Academic qualifications used in candidate onboarding and profile forms.',
    endpoint: '/educations',
    accentColor: 'bg-blue-50 text-blue-600 border-blue-100',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    key: 'languages',
    label: 'Languages',
    icon: Globe,
    description: 'Languages selectable for candidate profiles and job requirements.',
    endpoint: '/languages',
    accentColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    key: 'language-proficiencies',
    label: 'Language Proficiencies',
    icon: Award,
    description: 'Fluency levels for candidate language evaluations.',
    endpoint: '/language-proficiencies',
    accentColor: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    badgeColor: 'bg-cyan-100 text-cyan-700',
  },
  {
    key: 'roles',
    label: 'Job Roles & Titles',
    icon: UserCheck,
    description: 'Standardized job roles for candidates and recruiters.',
    endpoint: '/roles',
    accentColor: 'bg-orange-50 text-orange-600 border-orange-100',
    badgeColor: 'bg-orange-100 text-orange-700',
  },
  {
    key: 'universities',
    label: 'Universities',
    icon: School,
    description: 'Master lookup list of higher education institutions.',
    endpoint: '/universities',
    accentColor: 'bg-purple-50 text-purple-600 border-purple-100',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    key: 'courses',
    label: 'Courses',
    icon: BookOpen,
    description: 'Degree programs and field of study options.',
    endpoint: '/courses',
    accentColor: 'bg-sky-50 text-sky-600 border-sky-100',
    badgeColor: 'bg-sky-100 text-sky-700',
  },
  {
    key: 'specializations',
    label: 'Specializations',
    icon: Sparkles,
    description: 'Academic fields of study and major specializations.',
    endpoint: '/specializations',
    accentColor: 'bg-pink-50 text-pink-600 border-pink-100',
    badgeColor: 'bg-pink-100 text-pink-700',
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
    description: 'Employment categories used to classify job postings.',
    endpoint: '/job-types',
    accentColor: 'bg-amber-50 text-amber-600 border-amber-100',
    badgeColor: 'bg-amber-100 text-amber-700',
  },
  {
    key: 'locations',
    label: 'Locations',
    icon: MapPin,
    description: 'Geographic locations used for job listings and preferences.',
    endpoint: '/locations',
    accentColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    badgeColor: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'experience-levels',
    label: 'Experience Levels',
    icon: TrendingUp,
    description: 'Career stages used to match candidates with job opportunities.',
    endpoint: '/experience-levels',
    accentColor: 'bg-rose-50 text-rose-600 border-rose-100',
    badgeColor: 'bg-rose-100 text-rose-700',
  },
  {
    key: 'currencies',
    label: 'Currencies',
    icon: Coins,
    description: 'System currencies available for user salaries and job listings.',
    endpoint: '/currencies',
    accentColor: 'bg-teal-50 text-teal-600 border-teal-100',
    badgeColor: 'bg-teal-100 text-teal-700',
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
        No {label.toLowerCase()} returned from backend.
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
        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[12px] font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
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
        <div key={i} className="flex items-center gap-4 px-6 py-2.5">
          <div className="h-5 w-6 bg-gray-100 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-2/5" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="h-6 w-16 bg-gray-100 rounded-xl" />
          <div className="h-8 w-16 bg-gray-100 rounded-xl" />
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
  actionLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  items: LookupItem[];
  searchQuery: string;
  badgeColor: string;
  actionLoading: string | null;
  onEdit: (item: LookupItem) => void;
  onDelete: (item: LookupItem) => void;
  onToggleStatus: (item: LookupItem) => void;
}) {
  const filtered = items.filter((item) =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
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

  const isCurrencySection = items.some(item => item.code !== undefined || item.symbol !== undefined);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-10">#</th>
            <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Name</th>
            {isCurrencySection && (
              <>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Code</th>
                <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Symbol</th>
              </>
            )}
            <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
            <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filtered.map((item, index) => (
            <tr key={item._id} className="group hover:bg-gray-50/60 transition-colors">
              <td className="px-6 py-4 text-[12px] font-bold text-gray-300">{index + 1}</td>
              <td className="px-4 py-4">
                <span className="text-[14px] font-bold text-gray-900">{item.name || '—'}</span>
              </td>
              {isCurrencySection && (
                <>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-gray-100 text-gray-900 font-mono">
                      {item.code || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-bold text-gray-700">
                      {item.symbol || '—'}
                    </span>
                  </td>
                </>
              )}
              <td className="px-4 py-4">
                <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                  {item._id}
                </code>
              </td>
              <td className="px-4 py-4">
                <button
                  disabled={actionLoading === item._id}
                  onClick={() => onToggleStatus(item)}
                  title={item.isActive ? 'Deactivate item' : 'Activate item'}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer hover:opacity-85 select-none ${
                    item.isActive 
                      ? `${badgeColor} border-transparent` 
                      : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {actionLoading === item._id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : item.isActive ? (
                    <CheckCircle className="w-3 h-3 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 shrink-0" />
                  )}
                  <span>{item.isActive ? 'Active' : 'Inactive'}</span>
                </button>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(item)}
                    title="Edit entry"
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    title="Delete entry"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
  actionLoading,
  onRefresh,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleStatus,
  // ── Server-side filter props (currencies only) ──────────────────────────────
  serverSearch,
  onServerSearch,
  isActiveFilter,
  onIsActiveFilterChange,
}: {
  section: (typeof SECTIONS)[number];
  state: SectionState;
  actionLoading: string | null;
  onRefresh: () => void;
  onAddItem: () => void;
  onEditItem: (item: LookupItem) => void;
  onDeleteItem: (item: LookupItem) => void;
  onToggleStatus: (item: LookupItem) => void;
  /** Controlled search value (server-side) — provided for currencies only */
  serverSearch?: string;
  /** Called when the admin types in the search box for server-side sections */
  onServerSearch?: (q: string) => void;
  /** Current isActive filter value: '' | 'true' | 'false' — currencies only */
  isActiveFilter?: string;
  /** Called when the admin toggles the Active / Inactive / All filter */
  onIsActiveFilterChange?: (v: string) => void;
}) {
  // For non-currency sections the search remains client-side; for currencies
  // the parent drives it via serverSearch / onServerSearch.
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const isCurrencySection = section.key === 'currencies';
  // LookupTable receives an empty query for currencies (server already filtered)
  const tableSearchQuery = isCurrencySection ? '' : localSearchQuery;
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

        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          {!state.loading && !state.error && (
            <span className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${section.badgeColor}`}>
              {state.data.length} records
            </span>
          )}

          {/* ── isActive filter — currencies only (server-side) ─────────────── */}
          {isCurrencySection && onIsActiveFilterChange && !state.loading && (
            <div className="flex gap-1">
              {([{ label: 'All', value: '' }, { label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onIsActiveFilterChange(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    (isActiveFilter ?? '') === opt.value
                      ? 'bg-gray-900 text-white border-transparent'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Search input (server-side for currencies, client-side otherwise) */}
          {!state.loading && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={isCurrencySection ? 'Search currencies...' : 'Search...'}
                value={isCurrencySection ? (serverSearch ?? '') : localSearchQuery}
                onChange={(e) => {
                  if (isCurrencySection && onServerSearch) {
                    onServerSearch(e.target.value);
                  } else {
                    setLocalSearchQuery(e.target.value);
                  }
                }}
                className="pl-9 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl text-[12px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all w-44"
              />
            </div>
          )}
          {!state.loading && !state.error && (
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry</span>
            </button>
          )}
          {section.key === 'currencies' && !state.loading && !state.error && (
            <button
              onClick={() => {
                const event = new CustomEvent('seed-currencies');
                window.dispatchEvent(event);
              }}
              title="Seed INR, USD, GBP, CAD defaults"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Defaults</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={state.loading}
            className={`p-2.5 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm ${state.loading ? 'opacity-50 cursor-not-allowed' : ''} shrink-0 cursor-pointer`}
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
          <LookupTable
            items={state.data}
            searchQuery={tableSearchQuery}
            badgeColor={section.badgeColor}
            actionLoading={actionLoading}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onToggleStatus={onToggleStatus}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SiteSettings() {
  // Navigation mode: 'lookups' or 'hero-sections'
  const [mainView, setMainView] = useState<'lookups' | 'hero-sections'>('hero-sections');

  // Lookup state
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

  // ── Currency server-side filters (#2 server search, #3 isActive filter) ─────
  const [currencySearch, setCurrencySearch] = useState('');
  const [currencyIsActive, setCurrencyIsActive] = useState('');
  
  // Hero Sections State
  const [heroSections, setHeroSections] = useState<HeroSectionItem[]>([]);
  const [heroLoading, setHeroLoading] = useState<boolean>(true);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [showHeroAddModal, setShowHeroAddModal] = useState<boolean>(false);
  const [showHeroEditModal, setShowHeroEditModal] = useState<HeroSectionItem | null>(null);
  const [showHeroDeleteModal, setShowHeroDeleteModal] = useState<HeroSectionItem | null>(null);
  
  // Form states for Hero Section
  const [heroFormTitle, setHeroFormTitle] = useState('');
  const [heroFormDescription, setHeroFormDescription] = useState('');
  const [heroFormIsActive, setHeroFormIsActive] = useState(true);
  const [heroFormDisplayOrder, setHeroFormDisplayOrder] = useState<number>(0);

  // Modal states for Lookups
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<LookupItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<LookupItem | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Lookup Form states
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Reset scroll on tab/view change
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, mainView]);

  // ── Hero Section API Calls ─────────────────────────────────────────────────
  const fetchHeroSections = useCallback(async () => {
    setHeroLoading(true);
    setHeroError(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/hero-sections`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json: ApiResponse<HeroSectionItem[]> = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch hero sections');
      const sorted = (Array.isArray(json.data) ? json.data : []).sort((a, b) => a.displayOrder - b.displayOrder);
      setHeroSections(sorted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setHeroError(msg);
    } finally {
      setHeroLoading(false);
    }
  }, []);

  const handleHeroAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroFormTitle.trim()) return showToast('Admin title label is required', 'error');
    if (!heroFormDescription.trim()) return showToast('Homepage punchline text is required', 'error');

    setIsSaving(true);
    try {
      const bodyPayload = {
        title: heroFormTitle.trim(),
        description: heroFormDescription.trim(),
        isActive: heroFormIsActive,
        displayOrder: Number(heroFormDisplayOrder),
      };

      const res = await fetch(`${BASE_URL}/admin/hero-sections`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();

      if (data.success) {
        showToast('Hero section punchline created! 🚀');
        setShowHeroAddModal(false);
        setHeroFormTitle('');
        setHeroFormDescription('');
        setHeroFormIsActive(true);
        setHeroFormDisplayOrder(0);
        fetchHeroSections();
      } else {
        showToast(data.message || 'Failed to create hero section', 'error');
      }
    } catch {
      showToast('Network error while creating hero section', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeroEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showHeroEditModal) return;
    if (!heroFormTitle.trim()) return showToast('Admin title label is required', 'error');
    if (!heroFormDescription.trim()) return showToast('Homepage punchline text is required', 'error');

    setIsSaving(true);
    try {
      const bodyPayload = {
        title: heroFormTitle.trim(),
        description: heroFormDescription.trim(),
        isActive: heroFormIsActive,
        displayOrder: Number(heroFormDisplayOrder),
      };

      const res = await fetch(`${BASE_URL}/admin/hero-sections/${showHeroEditModal._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();

      if (data.success) {
        showToast('Hero section punchline updated!');
        setShowHeroEditModal(null);
        fetchHeroSections();
      } else {
        showToast(data.message || 'Failed to update hero section', 'error');
      }
    } catch {
      showToast('Network error while updating hero section', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeroToggleStatus = async (item: HeroSectionItem) => {
    setActionLoading(item._id);
    try {
      const res = await fetch(`${BASE_URL}/admin/hero-sections/${item._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          isActive: !item.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(item.isActive ? 'Punchline deactivated' : 'Punchline activated');
        fetchHeroSections();
      } else {
        showToast(data.message || 'Failed to toggle status', 'error');
      }
    } catch {
      showToast('Network error while updating status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleHeroDeleteConfirm = async () => {
    if (!showHeroDeleteModal) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/hero-sections/${showHeroDeleteModal._id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Hero section deleted successfully.');
        setShowHeroDeleteModal(null);
        fetchHeroSections();
      } else {
        showToast(data.message || 'Failed to delete hero section', 'error');
      }
    } catch {
      showToast('Network error while deleting hero section', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Lookup API Calls ───────────────────────────────────────────────────────
  const fetchSection = useCallback(async (
    section: (typeof SECTIONS)[number],
    extraParams?: Record<string, string>,
  ) => {
    setSections((prev) => ({
      ...prev,
      [section.key]: { ...prev[section.key], loading: true, error: null },
    }));
    try {
      // Build query string — supports ?search= and ?isActive= for currencies
      const params = new URLSearchParams();
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => { if (v !== '') params.set(k, v); });
      }
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${BASE_URL}/admin/${section.key}${qs}`, {
        headers: getHeaders()
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json: ApiResponse<LookupItem[]> = await res.json();
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
    await Promise.all([
      fetchHeroSections(),
      ...SECTIONS.map((s) => fetchSection(s)),
    ]);
    setLastRefreshed(new Date());
  }, [fetchSection, fetchHeroSections]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Re-fetch currencies when server-side filters change (#2 / #3) ────────────
  useEffect(() => {
    const currSec = SECTIONS.find((s) => s.key === 'currencies');
    if (!currSec) return;
    const params: Record<string, string> = {};
    if (currencySearch) params.search = currencySearch;
    if (currencyIsActive !== '') params.isActive = currencyIsActive;
    fetchSection(currSec, params);
  }, [currencySearch, currencyIsActive, fetchSection]);

  const handleSeedCurrencies = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/currencies/seed`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Default currencies (INR, USD, GBP, CAD) seeded successfully! 💰');
        const currSec = SECTIONS.find((s) => s.key === 'currencies');
        if (currSec) fetchSection(currSec);
      } else {
        showToast(data.message || 'Failed to seed currencies', 'error');
      }
    } catch {
      showToast('Network error while seeding currencies', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [fetchSection]);

  useEffect(() => {
    const listener = () => handleSeedCurrencies();
    window.addEventListener('seed-currencies', listener);
    return () => window.removeEventListener('seed-currencies', listener);
  }, [handleSeedCurrencies]);

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    await fetchAll();
    setIsRefreshingAll(false);
  };

  const handleRefreshSection = (section: (typeof SECTIONS)[number]) => {
    fetchSection(section);
    setLastRefreshed(new Date());
  };

  // Add Item Submit for Lookups
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return showToast('Name field is required', 'error');

    setIsSaving(true);
    const activeSection = SECTIONS.find((s) => s.key === activeTab)!;

    try {
      const bodyPayload: Record<string, unknown> = {
        name: formName.trim(),
        isActive: formIsActive,
      };
      if (activeSection.key === 'currencies') {
        bodyPayload.code = formCode.trim().toUpperCase();
        bodyPayload.symbol = formSymbol.trim();
      }

      const res = await fetch(`${BASE_URL}/admin/${activeSection.key}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Lookup entry created successfully! 🎉');
        setShowAddModal(false);
        setFormName('');
        setFormCode('');
        setFormSymbol('');
        setFormIsActive(true);
        fetchSection(activeSection);
      } else {
        showToast(data.message || 'Failed to create entry', 'error');
      }
    } catch {
      showToast('Network error while creating entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit modal for Lookups
  const openEditModal = (item: LookupItem) => {
    setShowEditModal(item);
    setFormName(item.name);
    setFormCode(item.code || '');
    setFormSymbol(item.symbol || '');
    setFormIsActive(item.isActive);
  };

  // Save Edit Item Changes for Lookups
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!formName.trim()) return showToast('Name field is required', 'error');

    setIsSaving(true);
    const activeSection = SECTIONS.find((s) => s.key === activeTab)!;

    try {
      const bodyPayload: Record<string, unknown> = {
        name: formName.trim(),
        isActive: formIsActive,
      };
      if (activeSection.key === 'currencies') {
        bodyPayload.code = formCode.trim().toUpperCase();
        bodyPayload.symbol = formSymbol.trim();
      }

      const res = await fetch(`${BASE_URL}/admin/${activeSection.key}/${showEditModal._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (data.success) {
        showToast('Lookup entry updated successfully!');
        setShowEditModal(null);
        setFormName('');
        setFormCode('');
        setFormSymbol('');
        fetchSection(activeSection);
      } else {
        showToast(data.message || 'Failed to update entry', 'error');
      }
    } catch {
      showToast('Network error while updating entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Status Toggle for Lookups
  const handleToggleStatus = async (item: LookupItem) => {
    setActionLoading(item._id);
    const activeSection = SECTIONS.find((s) => s.key === activeTab)!;
    
    try {
      const res = await fetch(`${BASE_URL}/admin/${activeSection.key}/${item._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          isActive: !item.isActive
        })
      });
      const data = await res.json();
      
      if (data.success) {
        showToast(item.isActive ? 'Lookup entry deactivated' : 'Lookup entry activated');
        fetchSection(activeSection);
      } else {
        showToast(data.message || 'Failed to toggle status', 'error');
      }
    } catch {
      showToast('Network error occurred', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Soft Delete lookup item
  const handleDeleteConfirm = async () => {
    if (!showDeleteModal) return;
    setIsSaving(true);
    const activeSection = SECTIONS.find((s) => s.key === activeTab)!;

    try {
      const res = await fetch(`${BASE_URL}/admin/${activeSection.key}/${showDeleteModal._id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();

      if (data.success) {
        showToast('Lookup entry deleted successfully.');
        setShowDeleteModal(null);
        fetchSection(activeSection);
      } else {
        showToast(data.message || 'Failed to delete entry', 'error');
      }
    } catch {
      showToast('Network error while deleting entry', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const activeSection = SECTIONS.find((s) => s.key === activeTab)!;
  const activeSectionState = sections[activeTab];

  const totalLookupRecords = SECTIONS.reduce((sum, s) => sum + sections[s.key].data.length, 0);

  return (
    <div className="max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-500 pt-6 px-4">

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-[13px] font-bold border transition-all duration-300 animate-in slide-in-from-right-10 ${
              t.type === 'success' 
                ? 'bg-gray-900 text-white border-transparent' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <span>{t.text}</span>
          </div>
        ))}
      </div>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Site Settings &amp; Master Data</h1>
          <p className="text-[14px] font-medium text-gray-500 mt-2">
            Manage dynamic candidate homepage punchlines and backend master lookups live.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-semibold text-gray-400">
              Refreshed {lastRefreshed.toLocaleTimeString()}
            </p>
            <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
              {heroSections.length} Punchlines &amp; {totalLookupRecords} Lookup Records
            </p>
          </div>
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshingAll}
            className={`flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl hover:bg-gray-50 hover:text-gray-900 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all cursor-pointer ${isRefreshingAll ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* ── Main View Switcher Tabs ────────────────────────────────────── */}
      <div className="flex bg-gray-100/80 p-1.5 rounded-2xl mb-8 w-max border border-gray-200/60 shadow-inner">
        <button
          onClick={() => setMainView('hero-sections')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer ${
            mainView === 'hero-sections'
              ? 'bg-white text-gray-900 shadow-md border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layout className="w-4 h-4 text-violet-600" />
          <span>Hero Punchlines</span>
          <span className="px-2 py-0.5 rounded-md text-[11px] bg-violet-100 text-violet-700 font-bold">
            {heroSections.length}
          </span>
        </button>
        <button
          onClick={() => setMainView('lookups')}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer ${
            mainView === 'lookups'
              ? 'bg-white text-gray-900 shadow-md border border-gray-200/50'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Master Lookups</span>
          <span className="px-2 py-0.5 rounded-md text-[11px] bg-blue-100 text-blue-700 font-bold">
            {SECTIONS.length} categories
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── VIEW 1: HERO SECTIONS MANAGEMENT ───────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mainView === 'hero-sections' && (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-50/40 via-white to-indigo-50/40">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                  <Layout className="w-4 h-4" />
                </div>
                <h2 className="text-[17px] font-extrabold text-gray-900">Homepage Hero Punchlines</h2>
              </div>
              <p className="text-[12.5px] font-medium text-gray-500 mt-1">
                Dynamic punchlines served to candidate homepage via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-violet-700 font-mono">GET /hero-sections</code>. Managed via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] text-violet-700 font-mono">/admin/hero-sections</code>.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setHeroFormTitle('');
                  setHeroFormDescription('');
                  setHeroFormIsActive(true);
                  setHeroFormDisplayOrder(heroSections.length);
                  setShowHeroAddModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer hover:-translate-y-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Punchline</span>
              </button>
              <button
                onClick={fetchHeroSections}
                disabled={heroLoading}
                className="p-2.5 rounded-xl border border-gray-100 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                title="Refresh Punchlines"
              >
                <RefreshCw className={`w-4 h-4 ${heroLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {heroLoading && <LoadingSkeleton />}

          {!heroLoading && heroError && (
            <ErrorState message={heroError} onRetry={fetchHeroSections} />
          )}

          {!heroLoading && !heroError && heroSections.length === 0 && (
            <div className="py-16 text-center">
              <Layout className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">No Hero Section Punchlines</h3>
              <p className="text-[12px] font-medium text-gray-400 max-w-sm mx-auto mb-4">
                Add punchlines to dynamically render on candidate homepage.
              </p>
            </div>
          )}

          {!heroLoading && !heroError && heroSections.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-16">Order</th>
                    <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-56">Admin Title (Label)</th>
                    <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Candidate Punchline (Description)</th>
                    <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-28">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {heroSections.map((item) => (
                    <tr key={item._id} className="group hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-900 text-xs font-mono font-extrabold">
                          #{item.displayOrder}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[13.5px] font-extrabold text-gray-900 block">
                          {item.title}
                        </span>
                        <span className="text-[10.5px] font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded inline-block mt-0.5">
                          Admin Internal Label
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[13.5px] font-medium text-gray-800 leading-snug max-w-xl">
                          "{item.description}"
                        </p>
                        <span className="text-[10.5px] font-medium text-gray-400 block mt-1">
                          Public homepage text
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          disabled={actionLoading === item._id}
                          onClick={() => handleHeroToggleStatus(item)}
                          title={item.isActive ? 'Deactivate punchline' : 'Activate punchline'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer hover:opacity-85 select-none ${
                            item.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          {actionLoading === item._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : item.isActive ? (
                            <CheckCircle className="w-3 h-3 shrink-0" />
                          ) : (
                            <XCircle className="w-3 h-3 shrink-0" />
                          )}
                          <span>{item.isActive ? 'Active Public' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setShowHeroEditModal(item);
                              setHeroFormTitle(item.title);
                              setHeroFormDescription(item.description);
                              setHeroFormIsActive(item.isActive);
                              setHeroFormDisplayOrder(item.displayOrder);
                            }}
                            title="Edit Punchline"
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setShowHeroDeleteModal(item)}
                            title="Delete Punchline"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── VIEW 2: MASTER LOOKUPS MANAGEMENT ────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {mainView === 'lookups' && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          {/* Lookup Categories Selector */}
          <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex items-center justify-between px-4 mb-3 mt-1">
              <h2 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase select-none">
                Master Lookup Categories
              </h2>
            </div>
            <nav className="flex flex-wrap gap-2 p-1">
              {SECTIONS.map((section) => {
                const isActive = activeTab === section.key;
                const sectionState = sections[section.key];
                const Icon = section.icon;
                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveTab(section.key)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-[12.5px] font-bold transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 shadow-sm border border-gray-200/60'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${isActive ? section.accentColor : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{section.label}</span>
                    <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${isActive ? section.badgeColor : 'bg-gray-100 text-gray-400'}`}>
                      {sectionState.loading ? (
                        <Loader2 className="w-3 h-3 text-gray-300 animate-spin" />
                      ) : sectionState.error ? (
                        '!'
                      ) : (
                        sectionState.data.length
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="animate-in slide-in-from-bottom-4 duration-300" key={activeTab}>
            <SectionCard
              section={activeSection}
              state={activeSectionState}
              actionLoading={actionLoading}
              onRefresh={() => handleRefreshSection(activeSection)}
              onAddItem={() => { setFormName(''); setFormIsActive(true); setShowAddModal(true); }}
              onEditItem={openEditModal}
              onDeleteItem={setShowDeleteModal}
              onToggleStatus={handleToggleStatus}
              serverSearch={activeSection.key === 'currencies' ? currencySearch : undefined}
              onServerSearch={activeSection.key === 'currencies' ? setCurrencySearch : undefined}
              isActiveFilter={activeSection.key === 'currencies' ? currencyIsActive : undefined}
              onIsActiveFilterChange={activeSection.key === 'currencies' ? setCurrencyIsActive : undefined}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS FOR HERO SECTIONS ────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Add Hero Section Modal */}
      {showHeroAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowHeroAddModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 flex gap-3.5 items-center">
              <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-gray-900">Add Hero Punchline</h2>
                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">Create a new candidate homepage tagline.</p>
              </div>
            </div>

            <form onSubmit={handleHeroAddSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Admin Title (Internal Label)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Homepage Punchline 5"
                  value={heroFormTitle}
                  onChange={(e) => setHeroFormTitle(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-semibold transition-all"
                />
                <p className="text-[11px] font-medium text-gray-400 mt-1">Admin label only — not visible to candidates.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Candidate Punchline (Description)
                </label>
                <textarea 
                  required
                  rows={3}
                  placeholder="e.g. The goal isn't just to graduate, it's to be employable."
                  value={heroFormDescription}
                  onChange={(e) => setHeroFormDescription(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-medium transition-all"
                />
                <p className="text-[11px] font-medium text-gray-400 mt-1">This is the actual text displayed publicly on homepage.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Display Order
                  </label>
                  <input 
                    type="number"
                    min={0}
                    required
                    value={heroFormDisplayOrder}
                    onChange={(e) => setHeroFormDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Initial Status
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHeroFormIsActive(true)}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                        heroFormIsActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroFormIsActive(false)}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                        !heroFormIsActive 
                          ? 'bg-gray-100 text-gray-700 border-gray-300' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowHeroAddModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[13px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Punchline</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hero Section Modal */}
      {showHeroEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowHeroEditModal(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 flex gap-3.5 items-center">
              <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-gray-900">Edit Hero Punchline</h2>
                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">Modify homepage tagline details.</p>
              </div>
            </div>

            <form onSubmit={handleHeroEditSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Admin Title (Internal Label)
                </label>
                <input 
                  type="text"
                  required
                  value={heroFormTitle}
                  onChange={(e) => setHeroFormTitle(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-semibold transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Candidate Punchline (Description)
                </label>
                <textarea 
                  required
                  rows={3}
                  value={heroFormDescription}
                  onChange={(e) => setHeroFormDescription(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Display Order
                  </label>
                  <input 
                    type="number"
                    min={0}
                    required
                    value={heroFormDisplayOrder}
                    onChange={(e) => setHeroFormDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-bold transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHeroFormIsActive(true)}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                        heroFormIsActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroFormIsActive(false)}
                      className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                        !heroFormIsActive 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowHeroEditModal(null)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[13px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Punchline</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Hero Section Modal */}
      {showHeroDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-100 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-extrabold text-gray-900 mb-2">Delete Hero Punchline?</h3>
            <p className="text-[13px] font-medium text-gray-500 mb-6 leading-relaxed">
              This will remove <strong className="text-gray-900">{showHeroDeleteModal.title}</strong> from homepage rotation.
            </p>

            <div className="flex gap-3">
              <button 
                type="button" 
                disabled={isSaving}
                onClick={() => setShowHeroDeleteModal(null)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-70 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isSaving}
                onClick={handleHeroDeleteConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white text-[13px] font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS FOR LOOKUPS ──────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Add Lookup Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 flex gap-3.5 items-center">
              <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-gray-900">Add Lookup Entry</h2>
                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">Create a new lookup in {activeSection.label}.</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Item Name</label>
                <input 
                  type="text"
                  required
                  placeholder={activeSection.key === 'currencies' ? "e.g. Euro" : "e.g. Master of Business Administration"}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-semibold transition-all"
                />
              </div>

              {activeSection.key === 'currencies' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">ISO Code</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. EUR"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-semibold transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Symbol</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. €"
                      value={formSymbol}
                      onChange={(e) => setFormSymbol(e.target.value)}
                      className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-semibold transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Initial Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsActive(true)}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      formIsActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(false)}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      !formIsActive 
                        ? 'bg-gray-100 text-gray-700 border-gray-300 font-bold' 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[13px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Entry</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lookup Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowEditModal(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 flex gap-3.5 items-center">
              <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-gray-900">Edit Lookup Entry</h2>
                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">Modify master entry inside {activeSection.label}.</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Item Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Master of Business Administration"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-semibold transition-all"
                />
              </div>

              {activeSection.key === 'currencies' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">ISO Code</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. EUR"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-semibold transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Symbol</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. €"
                      value={formSymbol}
                      onChange={(e) => setFormSymbol(e.target.value)}
                      className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-semibold transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Entry Status</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsActive(true)}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      formIsActive 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(false)}
                    className={`flex-1 py-3 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      !formIsActive 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[13px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Entry</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lookup Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-100 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-extrabold text-gray-900 mb-2">Delete Master Entry?</h3>
            <p className="text-[13px] font-medium text-gray-500 mb-6 leading-relaxed">
              This will delete <strong className="text-gray-900">{showDeleteModal.name}</strong> from master lists. If users are currently referencing this entry, it may affect profile integrity. Consider deactivating it instead.
            </p>

            <div className="flex gap-3">
              <button 
                type="button" 
                disabled={isSaving}
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all disabled:opacity-70 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isSaving}
                onClick={handleDeleteConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white text-[13px] font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
