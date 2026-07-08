import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Edit3, ToggleLeft, ToggleRight,
  X, Save, Eye, Tag, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, FileText, CheckCircle, XCircle,
  ArrowLeft, Clock, User
} from 'lucide-react';

const BASE_URL = 'https://squrx-backend.onrender.com/api/v1';

const CATEGORIES = ['career', 'guide', 'news', 'onboarding', 'tips', 'announcement', 'other'];

interface Article {
  _id: string;
  title: string;
  description: string;
  content: string;
  icon?: string;
  category?: string;
  tags?: string[];
  author?: string;
  isActive: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const emptyForm = {
  title: '',
  description: '',
  content: '',
  icon: '',
  category: '',
  tags: [] as string[],
  author: '',
  isActive: true,
  publishedAt: '',
};

function getHeaders() {
  return {
    'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  };
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-gray-100 rounded-lg animate-pulse" style={{ width: `${60 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Tag input ─────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="w-full bg-gray-50/50 border border-gray-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-black focus-within:border-transparent transition-all">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg">
          #{tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-300 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
        placeholder="Type tag + Enter"
        className="flex-1 min-w-[120px] bg-transparent text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none px-1"
      />
    </div>
  );
}

// ── Article Form ──────────────────────────────────────────────────────────────
function ArticleForm({
  initial,
  onSave,
  onCancel,
  isSaving,
  mode,
}: {
  initial: typeof emptyForm;
  onSave: (data: typeof emptyForm) => void;
  onCancel: () => void;
  isSaving: boolean;
  mode: 'create' | 'edit';
}) {
  const [form, setForm] = useState(initial);

  const set = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Row 1: Icon + Title */}
      <div className="flex gap-4">
        <div className="w-20 shrink-0">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Icon</label>
          <input
            type="text"
            value={form.icon}
            onChange={e => set('icon', e.target.value)}
            placeholder="🚀"
            className="w-full text-center text-2xl bg-gray-50/50 px-2 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Getting Started with Squrx"
            className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-[14px] font-medium transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description <span className="text-red-500">*</span></label>
        <input
          type="text"
          required
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="A short summary shown in listings"
          className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-[13px] font-medium transition-all"
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Content <span className="text-red-500">*</span></label>
        <textarea
          required
          value={form.content}
          onChange={e => set('content', e.target.value)}
          rows={8}
          placeholder="Full article content — supports HTML markup"
          className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-[13px] font-medium transition-all resize-y"
        />
      </div>

      {/* Row 3: Author + Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Author</label>
          <input
            type="text"
            value={form.author}
            onChange={e => set('author', e.target.value)}
            placeholder="Squrx Team"
            className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-[13px] font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-[13px] font-medium transition-all appearance-none cursor-pointer"
          >
            <option value="">— Select —</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tags</label>
        <TagInput tags={form.tags} onChange={t => set('tags', t)} />
        <p className="text-[11px] text-gray-400 mt-1.5">Press Enter or comma to add a tag</p>
      </div>

      {/* Published At + isActive */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Publish Date</label>
          <input
            type="datetime-local"
            value={form.publishedAt}
            onChange={e => set('publishedAt', e.target.value)}
            className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-[13px] font-medium transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
          <button
            type="button"
            onClick={() => set('isActive', !form.isActive)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all border ${
              form.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {form.isActive ? <><CheckCircle className="w-4 h-4" /> Active</> : <><XCircle className="w-4 h-4" /> Inactive</>}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-[13px] transition-all shadow-lg ${
            isSaving ? 'bg-gray-700 opacity-80 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-black/20'
          }`}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> {mode === 'create' ? 'Publish Article' : 'Save Changes'}</>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Article Detail View ───────────────────────────────────────────────────────
function ArticleDetail({
  article,
  onEdit,
  onBack,
  onToggle,
  isTogglingId,
}: {
  article: Article;
  onEdit: () => void;
  onBack: () => void;
  onToggle: (id: string, current: boolean) => void;
  isTogglingId: string | null;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Articles
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(article._id, article.isActive)}
            disabled={isTogglingId === article._id}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-bold transition-all border ${
              article.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {isTogglingId === article._id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : article.isActive ? (
              <><ToggleRight className="w-4 h-4" /> Active</>
            ) : (
              <><ToggleLeft className="w-4 h-4" /> Inactive</>
            )}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-2xl text-[12px] font-bold hover:bg-gray-800 transition-all shadow-lg"
          >
            <Edit3 className="w-4 h-4" /> Edit Article
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 md:p-10">
        <div className="flex items-start gap-5 mb-8 pb-8 border-b border-gray-100">
          {article.icon && (
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              {article.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {article.category && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                  {article.category}
                </span>
              )}
              <span className={`px-3 py-1 text-[11px] font-bold rounded-lg ${article.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {article.isActive ? '● Active' : '● Inactive'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{article.title}</h1>
            <p className="text-[14px] font-medium text-gray-500 mt-2">{article.description}</p>

            <div className="flex items-center gap-5 mt-4 text-[12px] font-medium text-gray-400 flex-wrap">
              {article.author && (
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {article.author}</span>
              )}
              {article.publishedAt && (
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
              {article.createdAt && (
                <span className="flex items-center gap-1.5">Created: {new Date(article.createdAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-bold rounded-xl">
                <Tag className="w-3 h-3" /> #{tag}
              </span>
            ))}
          </div>
        )}

        <div>
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Content</h3>
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-[14px] font-medium bg-gray-50/50 rounded-2xl p-6 border border-gray-100"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main CMS Component ────────────────────────────────────────────────────────
export default function CMS() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const LIMIT = 10;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── FETCH ALL ARTICLES ──────────────────────────────────────────────────────
  const fetchArticles = useCallback(async (p = page, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/articles?page=${p}&limit=${LIMIT}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        // Handle varied response shapes
        const docs: Article[] = Array.isArray(data.data)
          ? data.data
          : (data.data?.docs || data.data?.articles || data.data?.data || []);
        setArticles(docs);
        setMeta({
          total: data.data?.total ?? docs.length,
          page: data.data?.page ?? p,
          limit: data.data?.limit ?? LIMIT,
          totalPages: (data.data?.totalPages ?? Math.ceil((data.data?.total ?? docs.length) / LIMIT)) || 1,
        });
      } else {
        setError(data.message || 'Failed to fetch articles');
      }
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page]);

  useEffect(() => { fetchArticles(page); }, [page]);

  // ── FETCH SINGLE ARTICLE ────────────────────────────────────────────────────
  const fetchArticleById = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/articles/${id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const art: Article = data.data?.article ?? data.data;
        setSelectedArticle(art);
        return art;
      } else {
        showToast(data.message || 'Could not load article', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    return null;
  };

  // ── CREATE ARTICLE ──────────────────────────────────────────────────────────
  const handleCreate = async (formData: typeof emptyForm) => {
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        isActive: formData.isActive,
      };
      if (formData.icon) payload.icon = formData.icon;
      if (formData.category) payload.category = formData.category;
      if (formData.tags.length) payload.tags = formData.tags;
      if (formData.author) payload.author = formData.author;
      if (formData.publishedAt) payload.publishedAt = new Date(formData.publishedAt).toISOString();

      const res = await fetch(`${BASE_URL}/admin/articles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Article published successfully!');
        setViewMode('list');
        fetchArticles(1, true);
        setPage(1);
      } else {
        showToast(data.message || 'Failed to create article', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── UPDATE ARTICLE ──────────────────────────────────────────────────────────
  const handleUpdate = async (formData: typeof emptyForm) => {
    if (!selectedArticle) return;
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        isActive: formData.isActive,
        icon: formData.icon,
        category: formData.category,
        tags: formData.tags,
        author: formData.author,
      };
      if (formData.publishedAt) payload.publishedAt = new Date(formData.publishedAt).toISOString();

      const res = await fetch(`${BASE_URL}/admin/articles/${selectedArticle._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Article updated successfully!');
        // Refresh the selected article and go back to view
        const updated = await fetchArticleById(selectedArticle._id);
        if (updated) setViewMode('view');
        fetchArticles(page, true);
      } else {
        showToast(data.message || 'Failed to update article', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── TOGGLE ACTIVE STATUS ────────────────────────────────────────────────────
  const handleToggle = async (id: string, current: boolean) => {
    setIsTogglingId(id);
    try {
      const res = await fetch(`${BASE_URL}/admin/articles/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: !current }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Article ${!current ? 'activated' : 'deactivated'} successfully`);
        // Optimistic update in list
        setArticles(prev => prev.map(a => a._id === id ? { ...a, isActive: !current } : a));
        // Update selected if viewing
        if (selectedArticle?._id === id) {
          setSelectedArticle(prev => prev ? { ...prev, isActive: !current } : prev);
        }
      } else {
        showToast(data.message || 'Failed to update status', 'error');
        fetchArticles(page, true); // revert
      }
    } catch {
      showToast('Network error', 'error');
      fetchArticles(page, true);
    } finally {
      setIsTogglingId(null);
    }
  };

  // ── Open View ───────────────────────────────────────────────────────────────
  const openViewArticle = async (id: string) => {
    const art = await fetchArticleById(id);
    if (art) setViewMode('view');
  };

  const openEdit = () => {
    if (!selectedArticle) return;
    setViewMode('edit');
  };

  // ── Filtered articles ───────────────────────────────────────────────────────
  const filtered = articles.filter(a => {
    const matchSearch = !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && a.isActive) ||
      (filterStatus === 'inactive' && !a.isActive);
    return matchSearch && matchStatus;
  });

  // ── Edit form initial values ────────────────────────────────────────────────
  const editInitial = selectedArticle ? {
    title: selectedArticle.title,
    description: selectedArticle.description,
    content: selectedArticle.content,
    icon: selectedArticle.icon || '',
    category: selectedArticle.category || '',
    tags: selectedArticle.tags || [],
    author: selectedArticle.author || '',
    isActive: selectedArticle.isActive,
    publishedAt: selectedArticle.publishedAt
      ? new Date(selectedArticle.publishedAt).toISOString().slice(0, 16)
      : '',
  } : emptyForm;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-500 pt-6 relative">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-[13px] font-bold animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-gray-900 text-white'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ════════════ LIST VIEW ════════════ */}
      {viewMode === 'list' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Articles & Content</h1>
              <p className="text-[14px] font-medium text-gray-500 mt-2">
                Manage all platform articles — create, edit, and toggle visibility.
                <span className="ml-2 font-bold text-gray-900">{meta.total} total</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setIsRefreshing(true); fetchArticles(page); }}
                disabled={isRefreshing}
                className="p-3 bg-white border border-gray-100 text-gray-600 hover:text-black shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all rounded-2xl"
              >
                <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setViewMode('create')}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:bg-gray-800 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" /> New Article
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-bold mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
              <button onClick={() => fetchArticles(page)} className="ml-auto underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Search + Filter */}
          <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or category…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
              />
            </div>
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-max shrink-0">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all capitalize ${filterStatus === s ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Article</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Author</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                        <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-[15px] font-bold text-gray-900 mb-1">No articles found</p>
                        <p className="text-[13px] font-medium text-gray-500">
                          {searchTerm || filterStatus !== 'all' ? 'Try adjusting your filters.' : 'Create your first article to get started.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(article => (
                      <tr
                        key={article._id}
                        className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => openViewArticle(article._id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {article.icon ? (
                              <div className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                                {article.icon}
                              </div>
                            ) : (
                              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-gray-900 truncate max-w-[220px]">{article.title}</p>
                              <p className="text-[11px] font-medium text-gray-400 truncate max-w-[220px]">{article.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {article.category ? (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-lg capitalize">
                              {article.category}
                            </span>
                          ) : <span className="text-gray-300 text-[12px]">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-semibold text-gray-600">{article.author || <span className="text-gray-300">—</span>}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {(article.tags || []).slice(0, 2).map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 text-[10px] font-bold rounded-md">
                                #{tag}
                              </span>
                            ))}
                            {(article.tags || []).length > 2 && (
                              <span className="text-[10px] font-bold text-gray-400">+{(article.tags || []).length - 2}</span>
                            )}
                            {!(article.tags || []).length && <span className="text-gray-300 text-[12px]">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={e => { e.stopPropagation(); handleToggle(article._id, article.isActive); }}
                            disabled={isTogglingId === article._id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                              article.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {isTogglingId === article._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : article.isActive ? (
                              <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                            ) : (
                              <><ToggleLeft className="w-3.5 h-3.5" /> Inactive</>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); openViewArticle(article._id); }}
                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async e => {
                                e.stopPropagation();
                                const art = await fetchArticleById(article._id);
                                if (art) setViewMode('edit');
                              }}
                              className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && meta.totalPages > 1 && (
              <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <p className="text-[13px] font-medium text-gray-500">
                  Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPages}</span>
                  <span className="ml-2 text-gray-400">({meta.total} articles)</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════ CREATE VIEW ════════════ */}
      {viewMode === 'create' && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">New Article</h1>
              <p className="text-[13px] font-medium text-gray-500 mt-1">Fill in the details and publish to the platform.</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
            <ArticleForm
              initial={emptyForm}
              onSave={handleCreate}
              onCancel={() => setViewMode('list')}
              isSaving={isSaving}
              mode="create"
            />
          </div>
        </div>
      )}

      {/* ════════════ EDIT VIEW ════════════ */}
      {viewMode === 'edit' && selectedArticle && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setViewMode('view')}
              className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Edit Article</h1>
              <p className="text-[13px] font-medium text-gray-500 mt-1 truncate max-w-xs">{selectedArticle.title}</p>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
            <ArticleForm
              initial={editInitial}
              onSave={handleUpdate}
              onCancel={() => setViewMode('view')}
              isSaving={isSaving}
              mode="edit"
            />
          </div>
        </div>
      )}

      {/* ════════════ VIEW / DETAIL VIEW ════════════ */}
      {viewMode === 'view' && selectedArticle && (
        <ArticleDetail
          article={selectedArticle}
          onEdit={openEdit}
          onBack={() => setViewMode('list')}
          onToggle={handleToggle}
          isTogglingId={isTogglingId}
        />
      )}

    </div>
  );
}
