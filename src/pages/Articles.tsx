import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, Edit3, ToggleLeft, ToggleRight,
  X, Save, Eye, Tag as TagIcon, ChevronLeft, ChevronRight,
  AlertCircle, Loader2, FileText, CheckCircle, XCircle,
  ArrowLeft, Clock, User, Newspaper, MoreVertical, Filter,
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://squrx-backend.onrender.com/api/v1';
const LIMIT = 9; // 3-column grid looks best at multiples of 3
// The 3 real categories — each maps to a specific audience card on the live frontend
const CATEGORIES = [
  { value: 'student',   label: 'Students & Grads', emoji: '🎓', desc: 'Shows on the Students & Grads card' },
  { value: 'recruiter', label: 'Companies',          emoji: '🏢', desc: 'Shows on the Companies card' },
  { value: 'mentor',    label: 'Mentors',            emoji: '🌟', desc: 'Shows on the Mentors card' },
];

// Colour + label helpers for consistent display across the page
const CATEGORY_META: Record<string, { label: string; emoji: string; colour: string }> = {
  student:   { label: 'Students & Grads', emoji: '🎓', colour: 'bg-blue-50 text-blue-700 border-blue-100' },
  recruiter: { label: 'Companies',        emoji: '🏢', colour: 'bg-violet-50 text-violet-700 border-violet-100' },
  mentor:    { label: 'Mentors',          emoji: '🌟', colour: 'bg-amber-50 text-amber-700 border-amber-100' },
};
function CategoryBadge({ category, size = 'sm' }: { category?: string; size?: 'sm' | 'md' }) {
  if (!category) return null;
  const m = CATEGORY_META[category];
  if (!m) return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg capitalize">{category}</span>;
  return (
    <span className={`inline-flex items-center gap-1 border font-bold rounded-lg ${
      size === 'md' ? 'px-3 py-1 text-[12px]' : 'px-2.5 py-1 text-[10px]'
    } ${m.colour}`}>
      <span>{m.emoji}</span>{m.label}
    </span>
  );
}

function getHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
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

interface Meta { total: number; page: number; limit: number; totalPages: number; }

interface ArticleFormData {
  title: string; description: string; content: string;
  icon: string; category: string; tags: string[];
  author: string; isActive: boolean; publishedAt: string;
}

const BLANK: ArticleFormData = {
  title: '', description: '', content: '',
  icon: '', category: '', tags: [], author: '',
  isActive: true, publishedAt: '',
};

type ViewMode = 'list' | 'create' | 'edit' | 'view';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-[13px] font-bold animate-in slide-in-from-top-4 duration-300 ${
      type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-700 border border-red-200'
    }`}>
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

// ─── Skeleton Cards ───────────────────────────────────────────────────────────
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
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="h-3.5 w-24 bg-gray-100 rounded-lg" />
        <div className="h-8 w-20 bg-gray-100 rounded-xl" />
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

const inputClass = 'w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-[13px] font-medium transition-all';

// ─── Article Form ─────────────────────────────────────────────────────────────
function ArticleForm({
  initial, onSave, onCancel, isSaving, mode,
}: {
  initial: ArticleFormData;
  onSave: (d: ArticleFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
  mode: 'create' | 'edit';
}) {
  const [f, setF] = useState<ArticleFormData>(initial);
  const set = (k: keyof ArticleFormData, v: unknown) => setF(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(f); }} className="space-y-5">
      {/* Icon + Title */}
      <div className="flex gap-4 items-start">
        <div className="shrink-0">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Icon</label>
          <input value={f.icon} onChange={e => set('icon', e.target.value)}
            placeholder="🚀" className="w-16 text-center text-2xl bg-gray-50/50 px-2 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all" />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Title <span className="text-red-500">*</span></label>
          <input required value={f.title} onChange={e => set('title', e.target.value)}
            placeholder="e.g. Getting Started with Squrx" className={inputClass} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description <span className="text-red-500">*</span></label>
        <input required value={f.description} onChange={e => set('description', e.target.value)}
          placeholder="Short summary shown on the article card" className={inputClass} />
      </div>

      {/* Content */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Content <span className="text-red-500">*</span> <span className="normal-case text-gray-400 font-medium">(supports HTML)</span></label>
        <textarea required value={f.content} onChange={e => set('content', e.target.value)}
          rows={9} placeholder="<h1>Welcome</h1><p>Full article body…</p>"
          className={`${inputClass} resize-y`} />
      </div>

      {/* Author */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Author</label>
        <input value={f.author} onChange={e => set('author', e.target.value)}
          placeholder="Squrx Team" className={inputClass} />
      </div>

      {/* Category — visual card picker */}
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Audience Category <span className="text-red-500">*</span></label>
        <p className="text-[11px] font-medium text-gray-400 mb-3">Choose who this article is for — it will appear on that audience card in the live app.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => set('category', f.category === c.value ? '' : c.value)}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 text-left transition-all ${
                f.category === c.value
                  ? 'border-gray-900 bg-gray-900 text-white shadow-lg shadow-black/10'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className={`text-[13px] font-extrabold ${f.category === c.value ? 'text-white' : 'text-gray-900'}`}>{c.label}</span>
              <span className={`text-[11px] font-medium ${f.category === c.value ? 'text-gray-300' : 'text-gray-400'}`}>{c.desc}</span>
            </button>
          ))}
        </div>
        {!f.category && <p className="text-[11px] text-amber-600 font-medium mt-2">⚠ Select a category — article won't appear on the app without one.</p>}
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
          <input type="datetime-local" value={f.publishedAt} onChange={e => set('publishedAt', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Visibility</label>
          <button type="button" onClick={() => set('isActive', !f.isActive)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all border ${
              f.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}>
            {f.isActive ? <><CheckCircle className="w-4 h-4" />Published</> : <><XCircle className="w-4 h-4" />Draft / Hidden</>}
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

// ─── Article Card ─────────────────────────────────────────────────────────────
function ArticleCard({
  article, onView, onEdit, onToggle, isToggling,
}: {
  article: Article;
  onView: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onToggle: (e: React.MouseEvent) => void;
  isToggling: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

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
      {/* Card Top: Icon + Status + Menu */}
      <div className="p-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${article.icon ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200'}`}>
            {article.icon || <FileText className="w-5 h-5 text-gray-400" />}
          </div>
          <CategoryBadge category={article.category} />
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Status pill */}
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ${
            article.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {article.isActive ? '● Live' : '○ Draft'}
          </span>

          {/* Kebab menu */}
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-1.5 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 w-40 animate-in fade-in duration-150">
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onView(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Eye className="w-4 h-4 text-gray-400" /> View
                </button>
                <button
                  onClick={e => { setMenuOpen(false); onEdit(e); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-gray-400" /> Edit
                </button>
                <div className="h-px bg-gray-100 mx-3 my-1" />
                <button
                  onClick={e => { setMenuOpen(false); onToggle(e); }}
                  disabled={isToggling}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    article.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {isToggling
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : article.isActive ? <><ToggleLeft className="w-4 h-4" />Unpublish</> : <><ToggleRight className="w-4 h-4" />Publish</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Body: Title + Description */}
      <div className="px-6 pb-4 flex-1">
        <h3 className="text-[16px] font-extrabold text-gray-900 leading-snug mb-2 group-hover:text-black line-clamp-2">
          {article.title}
        </h3>
        <p className="text-[13px] font-medium text-gray-500 leading-relaxed line-clamp-2">
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
      <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
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
        <button
          onClick={e => { e.stopPropagation(); onView(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold rounded-xl hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Eye className="w-3.5 h-3.5" /> Read
        </button>
      </div>
    </div>
  );
}

// ─── Article Detail ───────────────────────────────────────────────────────────
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
        {/* Header */}
        <div className="p-8 md:p-10">
          <div className="flex items-start gap-5 mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border ${article.icon ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200'}`}>
              {article.icon || <FileText className="w-7 h-7 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <CategoryBadge category={article.category} size="md" />
                <span className={`px-3 py-1 text-[11px] font-bold rounded-lg ${article.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {article.isActive ? '● Published' : '○ Draft'}
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
              </div>
            </div>
          </div>

          {(article.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags!.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-bold rounded-xl">
                  <TagIcon className="w-3 h-3" />#{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* Content */}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<Article | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
        title: fd.title, description: fd.description,
        content: fd.content, isActive: fd.isActive,
      };
      if (fd.icon) body.icon = fd.icon;
      if (fd.category) body.category = fd.category;
      if (fd.tags.length) body.tags = fd.tags;
      if (fd.author) body.author = fd.author;
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
        title: fd.title, description: fd.description, content: fd.content,
        isActive: fd.isActive, icon: fd.icon, category: fd.category,
        tags: fd.tags, author: fd.author,
      };
      if (fd.publishedAt) body.publishedAt = new Date(fd.publishedAt).toISOString();

      const res = await fetch(`${BASE_URL}/admin/articles/${selected._id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Article updated!');
        const updated = await fetchOne(selected._id);
        if (updated) setView('view');
        fetchAll(page, true);
      } else {
        showToast(data.message || 'Failed to update article', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── PUT toggle ─────────────────────────────────────────────────────────────
  const handleToggle = async (id: string, cur: boolean) => {
    setIsTogglingId(id);
    try {
      const res = await fetch(`${BASE_URL}/admin/articles/${id}`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ isActive: !cur }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Article ${!cur ? 'published' : 'unpublished'}`);
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

  const filtered = articles.filter(a => {
    const q = search.toLowerCase();
    const mQ = !search || a.title.toLowerCase().includes(q) || (a.author || '').toLowerCase().includes(q) || (a.category || '').toLowerCase().includes(q);
    const mS = statusFilter === 'all' || (statusFilter === 'active' && a.isActive) || (statusFilter === 'inactive' && !a.isActive);
    return mQ && mS;
  });

  const editInitial: ArticleFormData = selected ? {
    title: selected.title, description: selected.description, content: selected.content,
    icon: selected.icon || '', category: selected.category || '',
    tags: selected.tags || [], author: selected.author || '',
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-md shadow-black/10">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Articles</h1>
              </div>
              <p className="text-[14px] font-medium text-gray-500 ml-[52px]">
                Create and manage platform articles. Changes reflect instantly on the app.
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

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-bold mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
              <button onClick={() => fetchAll(page)} className="ml-auto underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Search + Filter */}
          <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text" placeholder="Search by title, author, or category…"
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-4 h-4 text-gray-400 ml-1" />
              <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                {(['all', 'active', 'inactive'] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-xl text-[12px] font-bold capitalize transition-all ${
                      statusFilter === s ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'
                    }`}>
                    {s === 'active' ? '● Active' : s === 'inactive' ? '○ Draft' : 'All'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
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
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter.'
                    : 'Create your first article — it will appear on the platform instantly.'}
                </p>
              </div>
              {!search && statusFilter === 'all' && (
                <button onClick={() => setView('create')}
                  className="flex items-center gap-2 mt-2 px-6 py-3 bg-black text-white text-[13px] font-bold rounded-2xl shadow-lg hover:bg-gray-800 transition-all">
                  <Plus className="w-4 h-4" /> Create First Article
                </button>
              )}
            </div>
          ) : (
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
          )}

          {/* Pagination */}
          {!loading && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <p className="text-[13px] font-medium text-gray-500">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPages}</span>
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
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <div className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-gray-900">New Article</h2>
                <p className="text-[12px] font-medium text-gray-500">Publish a new article — it appears on the platform instantly.</p>
              </div>
            </div>
            <div className="p-8">
              <ArticleForm initial={BLANK} onSave={handleCreate} onCancel={() => setView('list')} isSaving={isSaving} mode="create" />
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
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <div className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] font-extrabold text-gray-900">Edit Article</h2>
                <p className="text-[12px] font-medium text-gray-500 truncate max-w-sm">{selected.title}</p>
              </div>
            </div>
            <div className="p-8">
              <ArticleForm initial={editInitial} onSave={handleUpdate} onCancel={() => setView('view')} isSaving={isSaving} mode="edit" />
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
