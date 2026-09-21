import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  FolderOpen,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { ManageableCategory, JobOptionItem } from '../../types/jobsAdmin';
import { MANAGEABLE_CATEGORIES } from '../../types/jobsAdmin';
import { jobsAdminApi } from '../../services/jobsAdminApi';

interface ManageOptionsSectionProps {
  onOptionMutated: () => void;
}

export default function ManageOptionsSection({ onOptionMutated }: ManageOptionsSectionProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ManageableCategory>('aiWorkArrangement');
  const [items, setItems] = useState<JobOptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add modal/state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Edit / Rename modal/state
  const [editingItem, setEditingItem] = useState<JobOptionItem | null>(null);
  const [editName, setEditName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete modal/state
  const [deletingItem, setDeletingItem] = useState<JobOptionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toggle active in flight ID
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchItems = useCallback(async (cat: ManageableCategory) => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobsAdminApi.getCategoryOptions(cat);
      if (res.success) {
        setItems(res.data || []);
      } else {
        setError(res.message || 'Failed to load options for category');
      }
    } catch {
      setError('Network error loading options');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(selectedCategory);
    setSearchQuery('');
  }, [selectedCategory, fetchItems]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Add Option
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOptionName.trim();
    if (!trimmed) {
      setAddError('Please enter an option name.');
      return;
    }

    try {
      setIsAdding(true);
      setAddError(null);

      const res = await jobsAdminApi.createCategoryOption(selectedCategory, trimmed);
      if (res.success) {
        setShowAddModal(false);
        setNewOptionName('');
        showToast(`Created option "${trimmed}" successfully.`);
        fetchItems(selectedCategory);
        onOptionMutated();
      } else {
        setAddError(res.message || 'Failed to create option');
      }
    } catch {
      setAddError('Network error while creating option');
    } finally {
      setIsAdding(false);
    }
  };

  // Rename Option
  const handleRenameOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Option name cannot be empty.');
      return;
    }
    if (trimmed === editingItem.name) {
      setEditingItem(null);
      return;
    }

    try {
      setIsEditing(true);
      setEditError(null);

      const res = await jobsAdminApi.updateCategoryOption(selectedCategory, editingItem._id, {
        name: trimmed,
      });

      if (res.success) {
        setEditingItem(null);
        showToast(`Updated option to "${trimmed}".`);
        fetchItems(selectedCategory);
        onOptionMutated();
      } else {
        setEditError(res.message || 'Failed to rename option');
      }
    } catch {
      setEditError('Network error while renaming option');
    } finally {
      setIsEditing(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleActive = async (item: JobOptionItem) => {
    const newStatus = !(item.isActive ?? true);
    setTogglingId(item._id);

    try {
      const res = await jobsAdminApi.updateCategoryOption(selectedCategory, item._id, {
        isActive: newStatus,
      });

      if (res.success) {
        showToast(
          `Option "${item.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`
        );
        fetchItems(selectedCategory);
        onOptionMutated();
      } else {
        setError(res.message || 'Failed to update option status');
      }
    } catch {
      setError('Network error while toggling option status');
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Option
  const handleDeleteOption = async () => {
    if (!deletingItem) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const res = await jobsAdminApi.deleteCategoryOption(selectedCategory, deletingItem._id);
      if (res.success) {
        setDeletingItem(null);
        showToast(`Option "${deletingItem.name}" deleted.`);
        fetchItems(selectedCategory);
        onOptionMutated();
      } else {
        setDeleteError(res.message || 'Failed to delete option');
      }
    } catch {
      setDeleteError('Network error while deleting option');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentCategoryMeta = MANAGEABLE_CATEGORIES.find(
    (c) => c.key === selectedCategory
  );

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (d?: string) => {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Category Tabs / Selector ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Filter Options</h2>
            <p className="text-xs text-gray-500 mt-1">
              Configure active values stored in the database for AI classifications, sources, and company attributes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewOptionName('');
              setAddError(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 text-xs font-semibold shadow-md transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add to {currentCategoryMeta?.label || selectedCategory}</span>
          </button>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {MANAGEABLE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.key
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Options Table & Search ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                {currentCategoryMeta?.label}
              </h3>
              <span className="text-xs text-gray-400 font-medium">
                ({items.length} total)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {currentCategoryMeta?.description}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search options..."
              className="w-full bg-gray-50/70 pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black placeholder-gray-400"
            />
          </div>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-medium flex items-center gap-2 border border-red-100">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Option Name
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Created / Updated
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredItems.map((item) => {
                const isActive = item.isActive ?? true;
                const isToggling = togglingId === item._id;

                return (
                  <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-900">
                      <span className={!isActive ? 'text-gray-400 line-through' : ''}>
                        {item.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                        title="Click to toggle Active/Inactive"
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isActive ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {formatDate(item.updatedAt || item.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setEditName(item.name);
                            setEditError(null);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Rename option"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingItem(item);
                            setDeleteError(null);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete option permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="py-20 text-center">
              <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-800">
                {searchQuery ? 'No matching options' : 'No options in this category'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Use the "Add" button above to insert the first value.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Add Option ────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Option</h3>
                <p className="text-xs text-gray-500">
                  Category: {currentCategoryMeta?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddOption} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Option Value / Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  placeholder="e.g. Contract, Hybrid, Mid-Level..."
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Add Option</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Rename Option ─────────────────────────────────────────── */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Rename Option</h3>
                <p className="text-xs text-gray-500">
                  Category: {currentCategoryMeta?.label}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleRenameOption} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  New Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ───────────────────────────────────── */}
      {deletingItem && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setDeletingItem(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Option?</h3>
                <p className="text-xs text-gray-500">Destructive action</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Are you sure you want to permanently delete{' '}
              <strong className="text-gray-900 font-bold">
                "{deletingItem.name}"
              </strong>{' '}
              from <span className="font-semibold">{currentCategoryMeta?.label}</span>?
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-5">
              <p className="text-xs text-amber-800">
                <strong>Recommended:</strong> Consider <strong>Deactivating</strong>{' '}
                this option instead. Deactivating preserves historical sync references while preventing new jobs from selecting it.
              </p>
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteOption}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
