import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, X, Save, AlertCircle, Loader2, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Trash2, CalendarDays, Clock, Trash
} from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────
import { API_BASE_URL as BASE_URL } from '../config/api';
const LIMIT = 9;

function getHeaders() {
  return {
    Authorization: `Bearer ${sessionStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimeSlot {
  _id?: string;
  time: string;
  isAvailable: boolean;
}

interface DateGroup {
  _id: string;
  date: string;
  slots: TimeSlot[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Meta { total: number; page: number; limit: number; totalPages: number; }

type ViewMode = 'list' | 'create' | 'edit';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-[13px] font-bold animate-in slide-in-from-top-4 duration-300 ${type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="w-24 h-6 bg-gray-100 rounded-lg" />
        <div className="w-16 h-6 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-px bg-gray-50 my-1" />
      <div className="grid grid-cols-2 gap-2">
        {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="flex gap-2 border-t border-gray-50 pt-3 mt-1">
        <div className="flex-1 h-9 bg-gray-100 rounded-xl" />
        <div className="w-16 h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Slot Quick Suggestions ────────────────────────────────────────────────────
const QUICK_TIMES = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

// ─── Slots Builder ────────────────────────────────────────────────────────────
function SlotsBuilder({
  slots, onChange,
}: {
  slots: TimeSlot[];
  onChange: (s: TimeSlot[]) => void;
}) {
  const [newTime, setNewTime] = useState('');

  const addSlot = (timeStr: string) => {
    const trimmed = timeStr.trim();
    if (!trimmed) return;
    if (slots.some(s => s.time.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...slots, { time: trimmed, isAvailable: true }]);
    setNewTime('');
  };

  const removeSlot = (idx: number) => {
    onChange(slots.filter((_, i) => i !== idx));
  };

  const toggleSlotAvailability = (idx: number) => {
    onChange(slots.map((s, i) => i === idx ? { ...s, isAvailable: !s.isAvailable } : s));
  };

  return (
    <div className="space-y-4">
      {/* List of slots currently added */}
      <div className="space-y-2">
        {slots.length === 0 ? (
          <p className="text-[12px] text-gray-400 text-center py-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No time slots added yet. Use suggestions or type one below.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {slots.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => toggleSlotAvailability(idx)}
                  className={`text-[12px] font-bold flex items-center gap-1.5 transition-colors ${s.isAvailable ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  {s.time}
                </button>
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Add Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTime}
          onChange={e => setNewTime(e.target.value)}
          placeholder="e.g. 09:30 AM or 02:00 PM"
          className="flex-1 bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black text-[13px] font-medium transition-all"
        />
        <button
          type="button"
          onClick={() => addSlot(newTime)}
          className="px-4 py-2.5 bg-black text-white rounded-xl text-[12px] font-bold hover:bg-gray-800 transition-all"
        >
          Add
        </button>
      </div>

      {/* Quick suggestions */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Add Suggestions</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TIMES.map(t => {
            const added = slots.some(s => s.time.toLowerCase() === t.toLowerCase());
            return (
              <button
                key={t}
                type="button"
                disabled={added}
                onClick={() => addSlot(t)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                  added 
                    ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Time Slot Form / Modal ────────────────────────────────────────────────────
function TimeSlotModal({
  mode, initial, onSave, onClose, isSaving,
}: {
  mode: 'create' | 'edit';
  initial: { date: string; slots: TimeSlot[]; isActive: boolean };
  onSave: (data: { date: string; slots: TimeSlot[]; isActive: boolean }) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [slots, setSlots] = useState<TimeSlot[]>(initial.slots);
  const [isActive, setIsActive] = useState(initial.isActive);

  // Format to standard HTML date string (YYYY-MM-DD)
  const getHtmlDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toISOString().split('T')[0];
    } catch {
      return dStr;
    }
  };

  const [dateVal, setDateVal] = useState(getHtmlDate(initial.date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-2xl flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-extrabold text-gray-900">{mode === 'create' ? 'Add Time Slots' : 'Edit Time Slots'}</h2>
              <p className="text-[11px] font-medium text-gray-500">{mode === 'create' ? 'Create time slots for a specific date.' : 'Update slot timings and availability.'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form 
          onSubmit={e => {
            e.preventDefault();
            if (!dateVal) return;
            onSave({ date: dateVal, slots, isActive });
          }} 
          className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar"
        >
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Select Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              disabled={mode === 'edit'} // Date usually should not change for existing slot groups
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-[14px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Time Slots List Builder */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Time Slots <span className="text-red-500">*</span>
            </label>
            <SlotsBuilder slots={slots} onChange={setSlots} />
          </div>

          {/* Visibility Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setIsActive(true)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                <CheckCircle className="w-4 h-4" /> Active
              </button>
              <button 
                type="button" 
                onClick={() => setIsActive(false)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all border ${!isActive ? 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                <XCircle className="w-4 h-4" /> Inactive
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving || slots.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-[13px] shadow-lg transition-all ${
                isSaving || slots.length === 0 
                  ? 'bg-gray-700 opacity-75 cursor-not-allowed' 
                  : 'bg-black hover:bg-gray-800'
              }`}
            >
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />{mode === 'create' ? 'Create Slots' : 'Save Changes'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Time Slot Card ────────────────────────────────────────────────────────────
function DateSlotCard({
  group, onEdit, onDelete, onToggleSlotAvailability, isTogglingSlot, isDeleting
}: {
  group: DateGroup;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSlotAvailability: (slotId: string, currentVal: boolean) => void;
  isTogglingSlot: string | null;
  isDeleting: boolean;
}) {
  const formattedDate = new Date(group.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col gap-4">
      {/* Card Top Row */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block mb-1">Date Group</span>
          <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight">{formattedDate}</h3>
        </div>
        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md shrink-0 ${group.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
          {group.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="h-px bg-gray-50 my-1" />

      {/* Grid of Slots */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Availability slots (Click to Toggle)</p>
        <div className="grid grid-cols-2 gap-2">
          {group.slots.map((s, idx) => {
            const isToggling = isTogglingSlot === s._id;
            return (
              <button
                key={s._id || idx}
                disabled={isToggling}
                onClick={() => onToggleSlotAvailability(s._id || '', s.isAvailable)}
                className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
                  isToggling
                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-wait'
                    : s.isAvailable
                      ? 'bg-emerald-50/40 border-emerald-100 text-emerald-700 hover:bg-emerald-50'
                      : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {isToggling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${s.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                )}
                {s.time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
        <button 
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold rounded-2xl hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm"
        >
          <Clock className="w-3.5 h-3.5 text-gray-400" /> Edit Slots
        </button>
        <button 
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2.5 border border-transparent text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TimeSlots() {
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [view, setView] = useState<ViewMode>('list');
  const [selectedGroup, setSelectedGroup] = useState<DateGroup | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingSlot, setIsTogglingSlot] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: LIMIT, totalPages: 1 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── GET all ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (p = page, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots?page=${p}&limit=${LIMIT}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const list: DateGroup[] = data.data?.timeSlots || data.data || [];
        setGroups(list);
        
        const total = data.data?.pagination?.total ?? list.length;
        const totalPages = (data.data?.pagination?.totalPages ?? Math.ceil(total / LIMIT)) || 1;
        setMeta({
          total,
          page: data.data?.pagination?.page ?? p,
          limit: data.data?.pagination?.limit ?? LIMIT,
          totalPages
        });
      } else {
        setError(data.message || 'Failed to fetch time slots');
      }
    } catch {
      setError('Network error — could not reach the server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [page]);

  useEffect(() => { fetchAll(page); }, [page]);

  // ── POST Create ──────────────────────────────────────────────────────────────
  const handleCreate = async (fd: { date: string; slots: TimeSlot[]; isActive: boolean }) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          date: fd.date,
          slots: fd.slots.map(s => ({ time: s.time, isAvailable: s.isAvailable })),
          isActive: fd.isActive
        }),
      });
      const data = await res.json();
      if (data.success || res.status === 201) {
        showToast('Time slots group created successfully! 🎉');
        setView('list');
        setPage(1);
        fetchAll(1, true);
      } else {
        showToast(data.message || 'Failed to create time slots', 'error');
      }
    } catch {
      showToast('Network error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── PUT Update ───────────────────────────────────────────────────────────────
  const handleUpdate = async (fd: { date: string; slots: TimeSlot[]; isActive: boolean }) => {
    if (!selectedGroup) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots/${selectedGroup._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          date: fd.date,
          slots: fd.slots.map(s => ({ time: s.time, isAvailable: s.isAvailable })),
          isActive: fd.isActive
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Time slots group updated successfully!');
        setView('list');
        fetchAll(page, true);
      } else {
        showToast(data.message || 'Failed to update time slots', 'error');
      }
    } catch {
      showToast('Network error occurred', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── PUT Toggle Individual Slot Availability ──────────────────────────────
  const handleToggleSlotAvailability = async (groupId: string, slotId: string, currentVal: boolean) => {
    setIsTogglingSlot(slotId);
    
    // Find the group and modify the slot availability in-place locally first for optimism
    const group = groups.find(g => g._id === groupId);
    if (!group) {
      setIsTogglingSlot(null);
      return;
    }

    const updatedSlots = group.slots.map(s => 
      s._id === slotId ? { ...s, isAvailable: !currentVal } : s
    );

    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots/${groupId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          slots: updatedSlots.map(s => ({ time: s.time, isAvailable: s.isAvailable }))
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Slot status updated successfully!`);
        // Refresh local state
        setGroups(prev => prev.map(g => {
          if (g._id === groupId) {
            return {
              ...g,
              slots: g.slots.map(s => s._id === slotId ? { ...s, isAvailable: !currentVal } : s)
            };
          }
          return g;
        }));
      } else {
        showToast(data.message || 'Failed to update slot availability', 'error');
      }
    } catch {
      showToast('Network error occurred', 'error');
    } finally {
      setIsTogglingSlot(null);
    }
  };

  // ── DELETE Slots Group ────────────────────────────────────────────────────────
  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this date and all of its consultation slots?')) return;
    setIsDeletingId(id);
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success || res.status === 200) {
        showToast('Time slots date group deleted.');
        setGroups(prev => prev.filter(g => g._id !== id));
        fetchAll(page, true);
      } else {
        showToast(data.message || 'Failed to delete time slots group', 'error');
      }
    } catch {
      showToast('Network error occurred', 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  const openEdit = (group: DateGroup) => {
    setSelectedGroup(group);
    setView('edit');
  };

  // Filter list
  const filtered = groups.filter(g => {
    const formattedDate = new Date(g.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toLowerCase();
    
    const mQ = !search || formattedDate.includes(search.toLowerCase());
    const mS = statusFilter === 'all' || (statusFilter === 'active' && g.isActive) || (statusFilter === 'inactive' && !g.isActive);
    return mQ && mS;
  });

  const editInitial = selectedGroup ? {
    date: selectedGroup.date,
    slots: selectedGroup.slots,
    isActive: selectedGroup.isActive,
  } : { date: '', slots: [], isActive: true };

  return (
    <div className="max-w-[1400px] mx-auto pb-16 pt-6 animate-in fade-in duration-500 relative">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ═══════════ LIST VIEW ═══════════ */}
      {view === 'list' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-md shadow-black/10">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Time Slots Manager</h1>
              </div>
              <p className="text-[14px] font-medium text-gray-500 ml-[52px]">
                Create and manage date availability slots for candidate consultations.
                {!loading && <span className="ml-1.5 font-bold text-gray-900">{meta.total} total dates</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setIsRefreshing(true); fetchAll(page); }} 
                disabled={isRefreshing}
                className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-black rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all"
              >
                <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => { setSelectedGroup(null); setView('create'); }}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[13px] font-bold rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-gray-800 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Date slots
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-bold mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
              <button onClick={() => fetchAll(page)} className="ml-auto underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Search & Filter bar */}
          <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search dates (e.g. Wednesday, April)..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all" 
              />
            </div>
            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold capitalize transition-all ${statusFilter === s ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {s === 'active' ? '● Active' : s === 'inactive' ? '○ Inactive' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Slots Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-3xl flex items-center justify-center shadow-sm">
                <CalendarDays className="w-9 h-9 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-[17px] font-extrabold text-gray-900 mb-2">No time slots found</p>
                <p className="text-[14px] font-medium text-gray-500">
                  {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first consultation date group to start taking bookings.'}
                </p>
              </div>
              {!search && statusFilter === 'all' && (
                <button 
                  onClick={() => { setSelectedGroup(null); setView('create'); }}
                  className="flex items-center gap-2 mt-2 px-6 py-3 bg-black text-white text-[13px] font-bold rounded-2xl shadow-lg hover:bg-gray-800 transition-all"
                >
                  <Plus className="w-4 h-4" /> Create First Time slots
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(group => (
                <DateSlotCard 
                  key={group._id} 
                  group={group}
                  onEdit={() => openEdit(group)}
                  onDelete={() => handleDeleteGroup(group._id)}
                  onToggleSlotAvailability={(slotId, curVal) => handleToggleSlotAvailability(group._id, slotId, curVal)}
                  isTogglingSlot={isTogglingSlot}
                  isDeleting={isDeletingId === group._id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <p className="text-[13px] font-medium text-gray-500">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPages}</span>
                <span className="text-gray-400 ml-2">({meta.total} dates total)</span>
              </p>
              <div className="flex gap-2">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button 
                  disabled={page >= meta.totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════ CREATE MODAL ═══════════ */}
      {view === 'create' && (
        <TimeSlotModal 
          mode="create" 
          initial={{ date: '', slots: [], isActive: true }} 
          onSave={handleCreate} 
          onClose={() => setView('list')} 
          isSaving={isSaving} 
        />
      )}

      {/* ═══════════ EDIT MODAL ═══════════ */}
      {view === 'edit' && selectedGroup && (
        <TimeSlotModal 
          mode="edit" 
          initial={editInitial} 
          onSave={handleUpdate} 
          onClose={() => setView('list')} 
          isSaving={isSaving} 
        />
      )}
    </div>
  );
}
