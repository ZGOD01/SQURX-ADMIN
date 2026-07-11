import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus, Search, RefreshCw, Edit3, ToggleLeft, ToggleRight,
  X, Save, Eye, Tag as TagIcon, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, FileText, CheckCircle, XCircle,
  ArrowLeft, Clock, User, Newspaper, Filter, LayoutGrid,
  List, Globe, EyeOff, ChevronDown,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────
import { API_BASE_URL as BASE_URL } from '../config/api';
const LIMIT = 12;

function getHeaders() {
  return {
    Authorization: `Bearer ${sessionStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ArticleFormData {
  title: string;
  description: string;
  content: string;
  icon: string;
  category: string;
  tags: string[];
  author: string;
  isActive: boolean;
  publishedAt: string;
}

const BLANK: ArticleFormData = {
  title: '', description: '', content: '',
  icon: '', category: '', tags: [],
  author: '', isActive: true, publishedAt: '',
};

type ViewMode = 'list' | 'create' | 'edit' | 'view';
type DisplayMode = 'grid' | 'table';

// ─── Category colour palette (auto-assigned by hash) ────────────────────────
const PALETTE = [
  'bg-blue-50 text-blue-700 border-blue-100',
  'bg-violet-50 text-violet-700 border-violet-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-emerald-50 text-emerald-700 border-emerald-100',
  'bg-rose-50 text-rose-700 border-rose-100',
  'bg-cyan-50 text-cyan-700 border-cyan-100',
  'bg-orange-50 text-orange-700 border-orange-100',
  'bg-pink-50 text-pink-700 border-pink-100',
  'bg-indigo-50 text-indigo-700 border-indigo-100',
  'bg-teal-50 text-teal-700 border-teal-100',
];

function categoryColour(cat?: string) {
  if (!cat) return 'bg-gray-100 text-gray-600 border-gray-100';
  let h = 0;
  for (let i = 0; i < cat.length; i++) h = ((h << 5) - h + cat.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category, size = 'sm' }: { category?: string; size?: 'sm' | 'md' }) {
  if (!category) return null;
  const colour = categoryColour(category);
  return (
    <span className={`inline-flex items-center border font-bold rounded-lg capitalize ${
      size === 'md' ? 'px-3 py-1 text-[12px]' : 'px-2.5 py-1 text-[10px]'
    } ${colour}`}>
      {category}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-[13px] font-bold ${
      type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
        <div className="w-16 h-6 bg-gray-100 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
        <div className="h-3.5 bg-gray-100 rounded-lg w-full" />
        <div className="h-3.5 bg-gray-100 rounded-lg w-5/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-6 w-16 bg-gray-100 rounded-lg" />
        <div className="h-6 w-14 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };
  return (
    <div className="flex flex-wrap gap-2 bg-gray-50/50 border border-gray-200 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-black transition-all min-h-[46px]">
      {tags.map(t => (
        <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg">
          #{t}
          <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="hover:text-red-300 ml-0.5">
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
        placeholder={tags.length === 0 ? 'Type tag then press Enter…' : 'Add more…'}
        className="flex-1 min-w-[120px] bg-transparent text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
      />
    </div>
  );
}

// ─── Category Input with autocomplete ────────────────────────────────────────
function CategoryInput({
  value, onChange, suggestions,
}: { value: string; onChange: (v: string) => void; suggestions: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. students, companies, mentors, career…"
        className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-[13px] font-medium transition-all"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Existing categories</p>
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors capitalize"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const inputClass = 'w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-[13px] font-medium transition-all';

// ─── Article Form ─────────────────────────────────────────────────────────────
function ArticleForm({
  initial, onSave, onCancel, isSaving, mode, categorySuggestions,
}: {
  initial: ArticleFormData;
  onSave: (d: ArticleFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
  mode: 'create' | 'edit';
  categorySuggestions: string[];
}) {
  const [f, setF] = useState<ArticleFormData>(initial);
  const set = (k: keyof ArticleFormData, v: unknown) => setF(p => ({ ...p, [k]: v }));

  const validate = () => {
    if (!f.title.trim()) return 'Title is required.';
    if (!f.description.trim()) return 'Description is required.';
    if (!f.content.trim()) return 'Content is required.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { alert(err); return; }
    onSave(f);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Icon + Title */}
      <div className="flex gap-4 items-start">
        <div className="shrink-0">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Icon / Emoji</label>
          <input
            value={f.icon} onChange={e => set('icon', e.target.value)}
            placeholder="🚀" maxLength={4}
            className="w-16 text-center text-2xl bg-gray-50/50 px-2 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            required value={f.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Getting Started with Squrx" className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <input
          required value={f.description} onChange={e => set('description', e.target.value)}
          placeholder="Short summary shown on the article card" className={inputClass}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Content <span className="text-red-500">*</span>{' '}
          <span className="normal-case text-gray-400 font-medium">(supports HTML)</span>
        </label>
        <textarea
          required value={f.content} onChange={e => set('content', e.target.value)}
          rows={9} placeholder="<h1>Welcome</h1><p>Full article body…</p>"
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Category — free text with autocomplete */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          Category
        </label>
        <p className="text-[11px] font-medium text-gray-400 mb-2">
          Enter any category name. Admin can freely add new categories — no restrictions.
          Existing categories are suggested as you type.
        </p>
        <CategoryInput
          value={f.category}
          onChange={v => set('category', v)}
          suggestions={categorySuggestions}
        />
        {f.category && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] font-medium text-gray-400">Preview:</span>
            <CategoryBadge category={f.category} />
          </div>
        )}
      </div>

      {/* Author */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Author</label>
        <input
          value={f.author} onChange={e => set('author', e.target.value)}
          placeholder="Squrx Team" className={inputClass}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Tags</label>
        <TagInput tags={f.tags} onChange={t => set('tags', t)} />
        <p className="text-[11px] text-gray-400 mt-1.5">Press Enter or comma after each tag</p>
      </div>

      {/* Publish Date + Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Publish Date</label>
          <input
            type="datetime-local" value={f.publishedAt}
            onChange={e => set('publishedAt', e.target.value)} className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Visibility</label>
          <button
            type="button" onClick={() => set('isActive', !f.isActive)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all border ${
              f.isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            {f.isActive
              ? <><CheckCircle className="w-4 h-4" />Published — visible on frontend</>
              : <><XCircle className="w-4 h-4" />Draft — hidden from public</>}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel}
          className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button type="submit" disabled={isSaving}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-[13px] shadow-lg transition-all ${
            isSaving ? 'bg-gray-700 opacity-75 cursor-not-allowed' : 'bg-black hover:bg-gray-800 hover:-translate-y-0.5'
          }`}>
          {isSaving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : <><Save className="w-4 h-4" />{mode === 'create' ? 'Publish Article' : 'Save Changes'}</>}
        </button>
      </div>
    </form>
  );
}

// ─── Article Card (Grid view) ─────────────────────────────────────────────────
function ArticleCard({
  article, onView, onEdit, onToggle, isToggling,
}: {
  article: Article;
  onView: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onToggle: (e: React.MouseEvent) => void;
  isToggling: boolean;
}) {
  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  return (
    <div
      onClick={onView}
      className="group bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Card Top */}
      <div className="p-6 flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${article.icon ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200'}`}>
            {article.icon || <FileText className="w-5 h-5 text-gray-400" />}
          </div>
          <CategoryBadge category={article.category} />
        </div>
        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ml-2 ${
          article.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {article.isActive ? '● Live' : '○ Draft'}
        </span>
      </div>

      {/* Card Body */}
      <div className="px-6 pb-4 flex-1">
        <h3 className="text-[16px] font-extrabold text-gray-900 leading-snug mb-2 group-hover:text-black line-clamp-2">
          {article.title}
        </h3>
        <p className="text-[13px] font-medium text-gray-500 leading-relaxed line-clamp-3">
          {article.description}
        </p>
      </div>

      {/* Tags */}
      {(article.tags || []).length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-1.5">
          {(article.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-bold rounded-lg">
              <TagIcon className="w-2.5 h-2.5" />#{tag}
            </span>
          ))}
          {(article.tags || []).length > 3 && (
            <span className="px-2 py-1 text-[10px] font-bold text-gray-400 rounded-lg">+{(article.tags || []).length - 3}</span>
          )}
        </div>
      )}

      {/* Card Footer */}
      <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30 gap-2">
        <div className="flex items-center gap-3 text-[11px] font-medium text-gray-400 min-w-0">
          {article.author && (
            <span className="flex items-center gap-1 truncate">
              <User className="w-3 h-3 shrink-0" />{article.author}
            </span>
          )}
          {(article.publishedAt || article.createdAt) && (
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />{timeAgo(article.publishedAt || article.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); onToggle(e); }}
            disabled={isToggling}
            title={article.isActive ? 'Unpublish' : 'Publish'}
            className={`p-1.5 rounded-xl transition-all text-[11px] font-bold border ${
              article.isActive
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isToggling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : article.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEdit(e); }}
            title="Edit"
            className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onView(); }}
            title="View"
            className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Article Table Row (Table view) ──────────────────────────────────────────
function ArticleTableRow({
  article, onView, onEdit, onToggle, isToggling,
}: {
  article: Article;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  isToggling: boolean;
}) {
  const dateStr = article.publishedAt || article.createdAt || article.updatedAt;
  const dateLabel = dateStr
    ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
      <td className="py-4 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border ${article.icon ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200'}`}>
            {article.icon || <FileText className="w-4 h-4 text-gray-400" />}
          </div>
          <div className="min-w-0">
            <button
              onClick={onView}
              className="text-[13px] font-extrabold text-gray-900 hover:text-black text-left line-clamp-1 block"
            >
              {article.title}
            </button>
            <p className="text-[11px] font-medium text-gray-400 line-clamp-1 mt-0.5">{article.description}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-3 hidden md:table-cell">
        <CategoryBadge category={article.category} />
      </td>
      <td className="py-4 px-3 hidden lg:table-cell">
        <div className="flex flex-wrap gap-1">
          {(article.tags || []).slice(0, 2).map(t => (
            <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">#{t}</span>
          ))}
          {(article.tags || []).length > 2 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400">+{(article.tags || []).length - 2}</span>
          )}
          {(article.tags || []).length === 0 && <span className="text-[11px] text-gray-300">—</span>}
        </div>
      </td>
      <td className="py-4 px-3 hidden sm:table-cell">
        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
          article.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {article.isActive ? '● Live' : '○ Draft'}
        </span>
      </td>
      <td className="py-4 px-3 hidden xl:table-cell">
        <span className="text-[12px] font-medium text-gray-400">{dateLabel}</span>
      </td>
      <td className="py-4 pr-6 pl-3">
        <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={onToggle}
            disabled={isToggling}
            title={article.isActive ? 'Unpublish' : 'Publish'}
            className={`p-1.5 rounded-xl border transition-all ${
              article.isActive
                ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isToggling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : article.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onEdit} title="Edit" className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onView} title="View" className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Article Detail View ──────────────────────────────────────────────────────
function ArticleDetail({
  article, onBack, onEdit, onToggle, isTogglingId,
}: {
  article: Article;
  onBack: () => void;
  onEdit: () => void;
  onToggle: (id: string, cur: boolean) => void;
  isTogglingId: string | null;
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={onBack}
          className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Articles
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(article._id, article.isActive)}
            disabled={isTogglingId === article._id}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[12px] font-bold transition-all border ${
              article.isActive
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}>
            {isTogglingId === article._id
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : article.isActive
                ? <><ToggleLeft className="w-4 h-4" />Unpublish</>
                : <><ToggleRight className="w-4 h-4" />Publish</>}
          </button>
          <button onClick={onEdit}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-2xl text-[12px] font-bold hover:bg-gray-800 transition-all shadow-lg">
            <Edit3 className="w-4 h-4" /> Edit Article
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex items-start gap-5 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border ${article.icon ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200'}`}>
              {article.icon || <FileText className="w-7 h-7 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <CategoryBadge category={article.category} size="md" />
                <span className={`px-3 py-1 text-[11px] font-bold rounded-lg ${article.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {article.isActive ? '● Published — visible on frontend' : '○ Draft — hidden from public'}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{article.title}</h1>
              <p className="text-[14px] font-medium text-gray-500 mt-2 leading-relaxed">{article.description}</p>
              <div className="flex flex-wrap items-center gap-5 mt-4 text-[12px] font-medium text-gray-400">
                {article.author && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{article.author}</span>}
                {article.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
                {article.createdAt && !article.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />Created {new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(article.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags!.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-bold rounded-xl">
                  <TagIcon className="w-3 h-3" />#{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        <div className="p-8 md:p-10">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Article Content</p>
          <div
            className="prose prose-sm max-w-none text-[14px] text-gray-700 leading-relaxed font-medium bg-gray-50/60 rounded-2xl p-6 border border-gray-100"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ articles }: { articles: Article[] }) {
  const total = articles.length;
  const active = articles.filter(a => a.isActive).length;
  const draft = total - active;
  const categories = new Set(articles.map(a => a.category).filter(Boolean)).size;

  const stats = [
    { label: 'Total Articles', value: total, colour: 'text-gray-900' },
    { label: 'Live on Frontend', value: active, colour: 'text-emerald-600' },
    { label: 'Draft / Hidden', value: draft, colour: 'text-gray-500' },
    { label: 'Unique Categories', value: categories, colour: 'text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] px-5 py-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
          <p className={`text-2xl font-extrabold ${s.colour}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [selected, setSelected] = useState<Article | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Derive unique categories from loaded articles for autocomplete + filter
  const uniqueCategories = useMemo(
    () => [...new Set(articles.map(a => a.category).filter((c): c is string => !!c))].sort(),
    [articles]
  );

  // ── GET all ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (p = page, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/articles?page=${p}&limit=${LIMIT}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const docs: Article[] = Array.isArray(data.data)
          ? data.data
          : (data.data?.docs || data.data?.articles || data.data?.data || []);
        setArticles(docs);
        const total = data.data?.total ?? docs.length;
        const totalPages = (data.data?.totalPages ?? Math.ceil(total / LIMIT)) || 1;
        setMeta({ total, page: data.data?.page ?? p, limit: data.data?.limit ?? LIMIT, totalPages });
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

  useEffect(() => { fetchAll(page); }, [page]);

  // ── GET one ────────────────────────────────────────────────────────────────
  const fetchOne = async (id: string): Promise<Article | null> => {
    try {
      const res = await fetch(`${BASE_URL}/admin/articles/${id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const art: Article = data.data?.article ?? data.data;
        setSelected(art);
        return art;
      }
      showToast(data.message || 'Could not load article', 'error');
    } catch { showToast('Network error', 'error'); }
    return null;
  };

  // ── POST create ────────────────────────────────────────────────────────────
  const handleCreate = async (fd: ArticleFormData) => {
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: fd.title.trim(),
        description: fd.description.trim(),
        content: fd.content.trim(),
        isActive: fd.isActive,
      };
      if (fd.icon.trim()) body.icon = fd.icon.trim();
      if (fd.category.trim()) body.category = fd.category.trim();
      if (fd.tags.length) body.tags = fd.tags;
      if (fd.author.trim()) body.author = fd.author.trim();
      if (fd.publishedAt) body.publishedAt = new Date(fd.publishedAt).toISOString();

      const res = await fetch(`${BASE_URL}/admin/articles`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Article published! 🎉');
        setView('list'); setPage(1); fetchAll(1, true);
      } else {
        showToast(data.message || 'Failed to create article', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── PUT update ─────────────────────────────────────────────────────────────
  const handleUpdate = async (fd: ArticleFormData) => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {
        title: fd.title.trim(),
        description: fd.description.trim(),
        content: fd.content.trim(),
        isActive: fd.isActive,
        icon: fd.icon.trim(),
        category: fd.category.trim(),
        tags: fd.tags,
        author: fd.author.trim(),
      };
      if (fd.publishedAt) body.publishedAt = new Date(fd.publishedAt).toISOString();

      const res = await fetch(`${BASE_URL}/admin/articles/${selected._id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Article updated! ✓');
        const updated = await fetchOne(selected._id);
        if (updated) setView('view');
        fetchAll(page, true);
      } else {
        showToast(data.message || 'Failed to update article', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── PUT toggle active/inactive ─────────────────────────────────────────────
  const handleToggle = async (id: string, cur: boolean) => {
    setIsTogglingId(id);
    try {
      const res = await fetch(`${BASE_URL}/admin/articles/${id}`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ isActive: !cur }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Article ${!cur ? 'published — now visible on frontend ✓' : 'unpublished — hidden from public ✓'}`);
        setArticles(prev => prev.map(a => a._id === id ? { ...a, isActive: !cur } : a));
        if (selected?._id === id) setSelected(p => p ? { ...p, isActive: !cur } : p);
      } else {
        showToast(data.message || 'Failed to update', 'error');
        fetchAll(page, true);
      }
    } catch { showToast('Network error', 'error'); fetchAll(page, true); }
    finally { setIsTogglingId(null); }
  };

  const openView = async (id: string) => { const a = await fetchOne(id); if (a) setView('view'); };
  const openEdit = async (id: string) => { const a = await fetchOne(id); if (a) setView('edit'); };

  // Client-side filter (since API only supports page/limit, not search)
  const filtered = articles.filter(a => {
    const q = search.toLowerCase();
    const mQ = !search
      || a.title.toLowerCase().includes(q)
      || (a.author || '').toLowerCase().includes(q)
      || (a.category || '').toLowerCase().includes(q)
      || (a.tags || []).some(t => t.toLowerCase().includes(q))
      || a.description.toLowerCase().includes(q);
    const mS = statusFilter === 'all'
      || (statusFilter === 'active' && a.isActive)
      || (statusFilter === 'inactive' && !a.isActive);
    const mC = !categoryFilter || (a.category || '').toLowerCase() === categoryFilter.toLowerCase();
    return mQ && mS && mC;
  });

  const editInitial: ArticleFormData = selected ? {
    title: selected.title,
    description: selected.description,
    content: selected.content,
    icon: selected.icon || '',
    category: selected.category || '',
    tags: selected.tags || [],
    author: selected.author || '',
    isActive: selected.isActive,
    publishedAt: selected.publishedAt ? new Date(selected.publishedAt).toISOString().slice(0, 16) : '',
  } : BLANK;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto pb-16 pt-6 animate-in fade-in duration-500 relative">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ═══════════ LIST ═══════════ */}
      {view === 'list' && (
        <>
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-md shadow-black/10">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Articles</h1>
              </div>
              <p className="text-[14px] font-medium text-gray-500 ml-[52px]">
                Manage articles/cards dynamically — any category, any number.
                {!loading && <span className="ml-1.5 font-bold text-gray-900">{meta.total} total</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setIsRefreshing(true); fetchAll(page); }}
                disabled={isRefreshing}
                className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-black rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[13px] font-bold rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-gray-800 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" /> New Article
              </button>
            </div>
          </div>

          {/* Stats */}
          {!loading && articles.length > 0 && <StatsBar articles={articles} />}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-bold mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
              <button onClick={() => fetchAll(page)} className="ml-auto underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Search + Filter Bar */}
          <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search by title, description, category, tags, author…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-gray-400 ml-1" />
              <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                {(['all', 'active', 'inactive'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2 rounded-xl text-[12px] font-bold capitalize transition-all ${
                      statusFilter === s ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'
                    }`}>
                    {s === 'active' ? '● Live' : s === 'inactive' ? '○ Draft' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            {uniqueCategories.length > 0 && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowCatFilter(v => !v)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-[12px] font-bold transition-all ${
                    categoryFilter ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {categoryFilter ? <><X className="w-3 h-3" onClick={e => { e.stopPropagation(); setCategoryFilter(''); }} />{categoryFilter}</> : <><Filter className="w-3 h-3" />Category<ChevronDown className="w-3 h-3" /></>}
                </button>
                {showCatFilter && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCatFilter(false)} />
                    <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 min-w-[180px]">
                      <button
                        onClick={() => { setCategoryFilter(''); setShowCatFilter(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-gray-50 ${!categoryFilter ? 'text-gray-900' : 'text-gray-500'}`}
                      >
                        All Categories
                      </button>
                      {uniqueCategories.map(c => (
                        <button
                          key={c}
                          onClick={() => { setCategoryFilter(c); setShowCatFilter(false); }}
                          className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold capitalize hover:bg-gray-50 ${
                            categoryFilter === c ? 'text-gray-900 font-extrabold' : 'text-gray-600'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Display mode toggle */}
            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`p-2 rounded-xl transition-all ${displayMode === 'grid' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-700'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`p-2 rounded-xl transition-all ${displayMode === 'table' ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-400 hover:text-gray-700'}`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {(search || statusFilter !== 'all' || categoryFilter) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[12px] font-medium text-gray-400">Filters:</span>
              {search && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg">
                  "{search}"
                  <button onClick={() => setSearch('')}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg capitalize">
                  {statusFilter}
                  <button onClick={() => setStatusFilter('all')}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {categoryFilter && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg capitalize">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter('')}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter(''); }}
                className="text-[11px] font-bold text-gray-400 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid View */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-3xl flex items-center justify-center shadow-sm">
                <Newspaper className="w-9 h-9 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-[17px] font-extrabold text-gray-900 mb-2">No articles found</p>
                <p className="text-[14px] font-medium text-gray-500 max-w-xs">
                  {search || statusFilter !== 'all' || categoryFilter
                    ? 'Try adjusting your search or filters.'
                    : 'Create your first article — it will appear on the platform instantly.'}
                </p>
              </div>
              {!search && statusFilter === 'all' && !categoryFilter && (
                <button onClick={() => setView('create')}
                  className="flex items-center gap-2 mt-2 px-6 py-3 bg-black text-white text-[13px] font-bold rounded-2xl shadow-lg hover:bg-gray-800 transition-all">
                  <Plus className="w-4 h-4" /> Create First Article
                </button>
              )}
            </div>
          ) : displayMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(art => (
                <ArticleCard
                  key={art._id}
                  article={art}
                  onView={() => openView(art._id)}
                  onEdit={e => { e.stopPropagation(); openEdit(art._id); }}
                  onToggle={e => { e.stopPropagation(); handleToggle(art._id, art.isActive); }}
                  isToggling={isTogglingId === art._id}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-4 pl-6 pr-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Article</th>
                      <th className="text-left py-4 px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden md:table-cell">Category</th>
                      <th className="text-left py-4 px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Tags</th>
                      <th className="text-left py-4 px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Status</th>
                      <th className="text-left py-4 px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden xl:table-cell">Date</th>
                      <th className="py-4 pr-6 pl-3 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(art => (
                      <ArticleTableRow
                        key={art._id}
                        article={art}
                        onView={() => openView(art._id)}
                        onEdit={() => openEdit(art._id)}
                        onToggle={() => handleToggle(art._id, art.isActive)}
                        isToggling={isTogglingId === art._id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <p className="text-[13px] font-medium text-gray-500">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of{' '}
                <span className="font-bold text-gray-900">{meta.totalPages}</span>
                <span className="text-gray-400 ml-2">({meta.total} total)</span>
              </p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ CREATE ═══════════ */}
      {view === 'create' && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
          <button onClick={() => setView('list')}
            className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Articles
          </button>
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-[17px] font-extrabold text-gray-900">New Article</h2>
                  <p className="text-[12px] font-medium text-gray-500">
                    Create any article with any category — no restrictions.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <ArticleForm
                initial={BLANK}
                onSave={handleCreate}
                onCancel={() => setView('list')}
                isSaving={isSaving}
                mode="create"
                categorySuggestions={uniqueCategories}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EDIT ═══════════ */}
      {view === 'edit' && selected && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
          <button onClick={() => setView('view')}
            className="flex items-center gap-2 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Article
          </button>
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center shrink-0">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[17px] font-extrabold text-gray-900">Edit Article</h2>
                  <p className="text-[12px] font-medium text-gray-500 truncate max-w-sm">{selected.title}</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <ArticleForm
                initial={editInitial}
                onSave={handleUpdate}
                onCancel={() => setView('view')}
                isSaving={isSaving}
                mode="edit"
                categorySuggestions={uniqueCategories}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ VIEW ═══════════ */}
      {view === 'view' && selected && (
        <ArticleDetail
          article={selected}
          onBack={() => setView('list')}
          onEdit={() => setView('edit')}
          onToggle={handleToggle}
          isTogglingId={isTogglingId}
        />
      )}
    </div>
  );
}
