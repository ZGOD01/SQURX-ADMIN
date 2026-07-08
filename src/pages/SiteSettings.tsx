import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Wrench, Briefcase, MapPin, TrendingUp,
  Search, RefreshCw, AlertCircle, Loader2, CheckCircle,
  XCircle, Database, Plus, Edit3, Trash2, X
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
    description: 'Academic qualifications used in onboarding and profile forms.',
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
    description: 'Employment categories used to classify job postings and preferences.',
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
        No {label.toLowerCase()} are returned from the backend.
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
                    title="Edit name/status"
                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    title="Delete item"
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
}: {
  section: (typeof SECTIONS)[number];
  state: SectionState;
  actionLoading: string | null;
  onRefresh: () => void;
  onAddItem: () => void;
  onEditItem: (item: LookupItem) => void;
  onDeleteItem: (item: LookupItem) => void;
  onToggleStatus: (item: LookupItem) => void;
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
          {!state.loading && !state.error && (
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Entry</span>
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
            searchQuery={searchQuery} 
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
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<LookupItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<LookupItem | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
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

  // Reset main main-panel scroll on tab change
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  const fetchSection = useCallback(async (section: (typeof SECTIONS)[number]) => {
    setSections((prev) => ({
      ...prev,
      [section.key]: { ...prev[section.key], loading: true, error: null },
    }));
    try {
      const res = await fetch(`${BASE_URL}/admin/${section.key}`, {
        headers: getHeaders()
      });
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

  // Add Item Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return showToast('Name field is required', 'error');

    setIsSaving(true);
    const activeSection = SECTIONS.find((s) => s.key === activeTab)!;

    try {
      const res = await fetch(`${BASE_URL}/admin/${activeSection.key}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: formName.trim(),
          isActive: formIsActive
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Lookup entry created successfully! 🎉');
        setShowAddModal(false);
        setFormName('');
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

  // Populate form and open Edit modal
  const openEditModal = (item: LookupItem) => {
    setShowEditModal(item);
    setFormName(item.name);
    setFormIsActive(item.isActive);
  };

  // Save Edit Item Changes
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (!formName.trim()) return showToast('Name field is required', 'error');

    setIsSaving(true);
    const activeSection = SECTIONS.find((s) => s.key === activeTab)!;

    try {
      const res = await fetch(`${BASE_URL}/admin/${activeSection.key}/${showEditModal._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: formName.trim(),
          isActive: formIsActive
        })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Lookup entry updated successfully!');
        setShowEditModal(null);
        setFormName('');
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

  // Quick Status Toggle directly from Table row
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

  const totalRecords = SECTIONS.reduce((sum, s) => sum + sections[s.key].data.length, 0);
  const hasAnyError = SECTIONS.some((s) => sections[s.key].error !== null);
  const allLoaded = SECTIONS.every((s) => !sections[s.key].loading);

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
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Site Settings</h1>
          <p className="text-[14px] font-medium text-gray-500 mt-2">
            Manage lookups &amp; master lists used across onboarding, profile forms, and jobs — fetched live.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right hidden sm:block">
            {allLoaded && (
              <p className="text-[11px] font-semibold text-gray-400">
                Last refreshed {lastRefreshed.toLocaleTimeString()}
              </p>
            )}
            {!hasAnyError && allLoaded && (
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                {totalRecords} total entries loaded
              </p>
            )}
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

      <div className="flex flex-col gap-8">
        {/* ── Lookup Categories Selector (Above Content) ─────────────────── */}
        <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex items-center justify-between px-4 mb-3 mt-1">
            <h2 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase select-none">
              Lookup Categories
            </h2>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-gray-400">API Source:</span>
              <code className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg select-all">
                /api/v1/admin/{activeSection.key}
              </code>
            </div>
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
                  className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all cursor-pointer select-none ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${isActive ? section.accentColor : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    <Icon className="w-4 h-4" />
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

        {/* ── Main Content Table (Below Selector) ────────────────────────── */}
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
          />
        </div>
      </div>

      {/* Add Modal */}
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
                  placeholder="e.g. Master of Business Administration"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-semibold transition-all"
                />
              </div>

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

      {/* Edit Modal */}
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

      {/* Delete Confirmation Modal */}
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
