import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, RefreshCw, X, Save, AlertCircle, Loader2, CheckCircle,
  ChevronLeft, ChevronRight, CalendarDays, Clock, Trash, Settings, UserPlus, User,
  Pencil, Calendar, LayoutGrid, List as ListIcon
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

interface TimeSlotSettings {
  windowDays: number;
  blackoutDays: number[]; // 0=Sun ... 6=Sat
  timezone: string;
}

interface Consultation {
  _id: string;
  user?: {
    _id?: string;
    fullName?: string;
    email?: string;
    mobile?: string;
  };
  fullName?: string;
  name?: string;
  candidateName?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  country?: string;
  countryCode?: string;
  appointment?: {
    date?: string;
    time?: string;
    dateId?: string;
    timeId?: string;
  };
  date?: string | { date?: string; _id?: string };
  time?: string | { time?: string; _id?: string };
  dateId?: string;
  timeId?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}

interface Meta { total: number; page: number; limit: number; totalPages: number; }

interface CalendarDay {
  date: string;
  dateId?: string;
  totalSlots?: number;
  availableSlots?: number;
  isActive?: boolean;
}

type TabMode = 'slots' | 'settings' | 'consultations';
type ViewMode = 'list' | 'create' | 'edit';

const WEEKDAYS = [
  { id: 0, label: 'Sunday' },
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
];

/**
 * Safely parse date and slot time into a local Date object.
 * Handles ISO strings ("2026-08-30T00:00:00.000Z"), plain dates ("2026-08-30"),
 * and various time formats ("09:00 AM", "9:00 AM", "02:30 PM", "14:00", "09:00").
 */
function parseSlotDateTime(dateStr: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    let year: number;
    let month: number; // 0-indexed
    let day: number;

    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.slice(0, 10).split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }

    if (!timeStr || !timeStr.trim()) {
      // Return end of that day when only date is evaluated
      return new Date(year, month, day, 23, 59, 59, 999);
    }

    const cleanedTime = timeStr.trim();
    const match12 = cleanedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const match24 = cleanedTime.match(/^(\d{1,2}):(\d{2})$/);

    let hours = 0;
    let minutes = 0;

    if (match12) {
      hours = parseInt(match12[1], 10);
      minutes = parseInt(match12[2], 10);
      const meridiem = match12[3].toUpperCase();
      if (meridiem === 'PM' && hours < 12) {
        hours += 12;
      } else if (meridiem === 'AM' && hours === 12) {
        hours = 0;
      }
    } else if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);
    } else {
      const fallback = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} ${cleanedTime}`);
      if (!isNaN(fallback.getTime())) return fallback;
      return new Date(year, month, day, 23, 59, 59, 999);
    }

    return new Date(year, month, day, hours, minutes, 0, 0);
  } catch {
    return null;
  }
}

function isSlotInFuture(dateStr: string, timeStr?: string): boolean {
  const dt = parseSlotDateTime(dateStr, timeStr);
  if (!dt) return false;
  return dt.getTime() > Date.now();
}

/**
 * Filter groups to only future active dates that have at least one upcoming available slot.
 * Slots inside each group are also filtered to only future available ones and sorted chronologically.
 */
function getFutureBookableGroups(allGroups: DateGroup[]): DateGroup[] {
  return allGroups
    .filter(g => g.isActive !== false)
    .map(g => {
      const futureSlots = (g.slots || []).filter(s => s.isAvailable && isSlotInFuture(g.date, s.time));
      futureSlots.sort((a, b) => {
        const timeA = parseSlotDateTime(g.date, a.time)?.getTime() || 0;
        const timeB = parseSlotDateTime(g.date, b.time)?.getTime() || 0;
        return timeA - timeB;
      });
      return {
        ...g,
        slots: futureSlots
      };
    })
    .filter(g => g.slots.length > 0)
    .sort((a, b) => {
      const timeA = parseSlotDateTime(a.date)?.getTime() || 0;
      const timeB = parseSlotDateTime(b.date)?.getTime() || 0;
      return timeA - timeB;
    });
}

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
    </div>
  );
}

const QUICK_TIMES = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

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
                  className={`text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${s.isAvailable ? 'text-emerald-600 hover:text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                  {s.time}
                </button>
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
          className="px-4 py-2.5 bg-black text-white rounded-xl text-[12px] font-bold hover:bg-gray-800 transition-all cursor-pointer"
        >
          Add
        </button>
      </div>

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
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
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

// ─── Time Slot Modal ─────────────────────────────────────────────────────────
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
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form 
          onSubmit={e => {
            e.preventDefault();
            if (!dateVal) return;
            onSave({ date: dateVal, slots, isActive });
          }} 
          className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Select Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              disabled={mode === 'edit'}
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-[14px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Time Slots <span className="text-red-500">*</span>
            </label>
            <SlotsBuilder slots={slots} onChange={setSlots} />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setIsActive(true)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all border cursor-pointer ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                <CheckCircle className="w-4 h-4" /> Active
              </button>
              <button 
                type="button" 
                onClick={() => setIsActive(false)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-[13px] transition-all border cursor-pointer ${!isActive ? 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                <X className="w-4 h-4" /> Inactive
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving || slots.length === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-[13px] shadow-lg transition-all cursor-pointer ${
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

// ─── Date Slot Card ──────────────────────────────────────────────────────────
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
      <div className="flex justify-between items-start gap-4">
        <div>
          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block mb-1">Date Group</span>
          <h3 className="text-[15px] font-extrabold text-gray-900 leading-tight">{formattedDate}</h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md ${group.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {group.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-[10px] font-bold text-gray-400">
            {group.slots.filter(s => s.isAvailable).length}/{group.slots.length} available
          </span>
        </div>
      </div>

      <div className="h-px bg-gray-50 my-1" />

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
                className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
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

      <div className="flex items-center gap-2 pt-2 border-t border-gray-50 mt-auto">
        <button 
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-bold rounded-2xl hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-gray-400" /> Edit Slots
        </button>
        <button 
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2.5 border border-transparent text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all cursor-pointer"
        >
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TimeSlots() {
  const [tab, setTab] = useState<TabMode>('slots');
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

  // Settings State
  const [settings, setSettings] = useState<TimeSlotSettings>({
    windowDays: 30,
    blackoutDays: [],
    timezone: 'Asia/Kolkata'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Consultations State
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [consultationPage, setConsultationPage] = useState(1);
  const [consultationMeta, setConsultationMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [consultationSearch, setConsultationSearch] = useState('');
  const [consultationStatusFilter, setConsultationStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // Dedicated Bookable Groups for walk-in & reschedule modals
  const [bookableGroups, setBookableGroups] = useState<DateGroup[]>([]);
  const [bookableLoading, setBookableLoading] = useState(false);

  // Edit Consultation State
  const [showEditConsultationModal, setShowEditConsultationModal] = useState<Consultation | null>(null);
  const [editConsultationForm, setEditConsultationForm] = useState({
    status: 'pending',
    notes: '',
    enableReschedule: false,
    dateId: '',
    timeId: ''
  });
  const [editConsultationAvailableSlots, setEditConsultationAvailableSlots] = useState<TimeSlot[]>([]);
  const [isUpdatingConsultation, setIsUpdatingConsultation] = useState(false);
  const [isDeletingConsultationId, setIsDeletingConsultationId] = useState<string | null>(null);

  // Show History, View Style & Calendar
  const [showHistory, setShowHistory] = useState(false);
  const [viewStyle, setViewStyle] = useState<'list' | 'calendar'>('list');
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [consultationsError, setConsultationsError] = useState('');

  // Walk-in booking modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookData, setBookData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    countryCode: '+91',
    country: 'India',
    dateId: '',
    timeId: ''
  });
  const [availableSlotsForDate, setAvailableSlotsForDate] = useState<TimeSlot[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper extraction methods for flexible API payload formats
  const getCandidateName = (c: Consultation) => {
    return c.user?.fullName || c.fullName || c.name || c.candidateName || (typeof c.user === 'string' ? c.user : '') || '—';
  };

  const getCandidateEmail = (c: Consultation) => {
    return c.user?.email || c.email || '—';
  };

  const getCandidateMobile = (c: Consultation) => {
    return c.user?.mobile || c.mobile || c.phone || (c.countryCode && c.mobile ? `${c.countryCode} ${c.mobile}` : '') || '—';
  };

  const getCountryDisplay = (c: Consultation) => {
    const country = c.country || (c.user as { country?: string })?.country;
    const countryCode = c.countryCode || (c.user as { countryCode?: string })?.countryCode;

    if (country && countryCode) {
      return `${country} (${countryCode})`;
    }
    if (country) {
      return country;
    }
    if (countryCode) {
      return countryCode;
    }
    return '—';
  };

  const formatCleanDate = (rawDate: string) => {
    if (!rawDate || rawDate === '—') return '—';
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return rawDate;
    }
  };

  const getAppointmentDate = (c: Consultation) => {
    if (c.appointment?.date) return c.appointment.date;
    if (typeof c.date === 'string') return c.date;
    if (c.date && typeof c.date === 'object' && 'date' in c.date) return (c.date as { date?: string }).date || '—';
    return '—';
  };

  const getAppointmentTime = (c: Consultation) => {
    if (c.appointment?.time) return c.appointment.time;
    if (typeof c.time === 'string') return c.time;
    if (c.time && typeof c.time === 'object' && 'time' in c.time) return (c.time as { time?: string }).time || '';
    return '';
  };

  // ── GET All Bookable Time Slots (for Modals) ───────────────────────────────
  const fetchBookableGroups = useCallback(async () => {
    setBookableLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots?all=true&limit=100`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const list: DateGroup[] = data.data?.timeSlots || data.data || [];
        setBookableGroups(list);
        return list;
      }
    } catch {
      // fallback
    } finally {
      setBookableLoading(false);
    }
    return [];
  }, []);

  // ── GET Time Slots ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (p = page, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const allParam = showHistory ? '&all=true' : '';
      const res = await fetch(`${BASE_URL}/admin/time-slots?page=${p}&limit=${LIMIT}${allParam}`, { headers: getHeaders() });
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
  }, [page, showHistory]);

  // ── GET Settings ─────────────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots/settings`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          windowDays: data.data.windowDays ?? 30,
          blackoutDays: Array.isArray(data.data.blackoutDays) ? data.data.blackoutDays : [],
          timezone: data.data.timezone || 'Asia/Kolkata'
        });
      }
    } catch {
      // Fallback
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // ── GET Calendar ─────────────────────────────────────────────────────────────
  const fetchCalendar = useCallback(async (y = calendarYear, m = calendarMonth) => {
    setCalendarLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots/calendar?year=${y}&month=${m}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const days: CalendarDay[] = data.data?.days || data.data || [];
        setCalendarData(days);
      }
    } catch {
      // fallback
    } finally {
      setCalendarLoading(false);
      setIsRefreshing(false);
    }
  }, [calendarYear, calendarMonth]);

  // ── PUT Settings ─────────────────────────────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/time-slots/settings`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Booking window & blackout settings saved successfully! ⚙️');
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch {
      showToast('Network error while saving settings', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── GET Consultations ────────────────────────────────────────────────────────
  // ─── Consultation Update & Delete APIs ──────────────────────────────────
  const handleUpdateConsultation = async (
    id: string,
    payload: {
      status?: string;
      reschedule?: {
        dateId: string;
        timeId: string;
      };
      notes?: string;
    }
  ) => {
    const res = await fetch(`${BASE_URL}/admin/consultations/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update consultation');
    }

    return data.data;
  };

  const handleDeleteConsultation = async (id: string) => {
    const res = await fetch(`${BASE_URL}/admin/consultations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to delete consultation');
    }

    return data.data;
  };

  const fetchConsultations = useCallback(async (p = consultationPage) => {
    setConsultationsLoading(true);
    setConsultationsError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/consultations?page=${p}&limit=10`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        const list = data.data?.consultations || data.data || [];
        setConsultations(list);
        const total = data.data?.pagination?.total ?? list.length;
        const totalPages = data.data?.pagination?.totalPages ?? Math.ceil(total / 10);
        setConsultationMeta({
          total,
          page: p,
          limit: 10,
          totalPages
        });
      } else {
        setConsultationsError(data.message || 'Failed to fetch consultations');
      }
    } catch {
      setConsultationsError('Network error — could not reach the server');
    } finally {
      setConsultationsLoading(false);
    }
  }, [consultationPage]);

  useEffect(() => {
    if (tab === 'slots') {
      if (viewStyle === 'calendar') fetchCalendar(calendarYear, calendarMonth);
      else fetchAll(page);
    } else if (tab === 'settings') {
      fetchSettings();
    } else if (tab === 'consultations') {
      fetchConsultations(consultationPage);
    }
  }, [tab, page, consultationPage, showHistory, viewStyle, calendarYear, calendarMonth, fetchAll, fetchSettings, fetchConsultations, fetchCalendar]);

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

      if (res.status === 422) {
        showToast(data.message || 'Selected date falls on a blacked-out weekday!', 'error');
        return;
      }

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

      if (res.status === 422) {
        showToast(data.message || 'Selected date falls on a blacked-out weekday!', 'error');
        return;
      }

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

  // ── POST Walk-in Consultation Book ─────────────────────────────────────────
  const handleWalkInBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookData.fullName.trim()) return showToast('Full Name is required', 'error');
    if (!bookData.email.trim()) return showToast('Email is required', 'error');
    if (!bookData.mobile.trim()) return showToast('Mobile is required', 'error');
    if (!bookData.dateId || !bookData.timeId) return showToast('Please select date and slot timing', 'error');

    setIsSaving(true);
    try {
      // ── #51: Admin walk-in booking does NOT require a JWT ──────────────────
      // This is an admin-initiated booking (walk-in / phone), NOT a self-login
      // flow — no candidate Bearer token is expected by the backend contract.
      const payload: Record<string, unknown> = {
        fullName: bookData.fullName.trim(),
        email: bookData.email.trim(),
        mobile: bookData.mobile.trim(),
        appointment: {
          dateId: bookData.dateId,
          timeId: bookData.timeId,
        },
      };
      // ── #42 / #43: countryCode and country are optional — only include when
      // the admin has actually provided a value (non-empty string). ───────────
      if (bookData.countryCode.trim()) payload.countryCode = bookData.countryCode.trim();
      if (bookData.country.trim()) payload.country = bookData.country.trim();

      const res = await fetch(`${BASE_URL}/admin/consultations/book`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success || res.status === 201) {
        // ── #50: Consume response {user, consultation} ─────────────────────
        // Show the confirmed user's name in the success message so the
        // admin gets immediate acknowledgement of who was booked.
        const bookedName =
          data.data?.user?.fullName ||
          data.data?.consultation?.fullName ||
          data.data?.fullName ||
          bookData.fullName.trim();
        showToast(`Consultation booked for ${bookedName}! 📅`);
        setShowBookModal(false);
        setBookData({ fullName: '', email: '', mobile: '', countryCode: '+91', country: 'India', dateId: '', timeId: '' });
        fetchConsultations(1);
      } else {
        showToast(data.message || 'Failed to book consultation', 'error');
      }
    } catch {
      showToast('Network error while booking consultation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Slot Availability
  const handleToggleSlotAvailability = async (groupId: string, slotId: string, currentVal: boolean) => {
    setIsTogglingSlot(slotId);
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

  // DELETE Group
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

  // ─── Edit & Delete Consultation Handlers ────────────────────────────────
  const openEditConsultation = (c: Consultation) => {
    setShowEditConsultationModal(c);
    const curStatus = (c.status || 'pending').toLowerCase();
    setEditConsultationForm({
      status: curStatus,
      notes: c.notes || '',
      enableReschedule: false,
      dateId: '',
      timeId: ''
    });
    setEditConsultationAvailableSlots([]);
    fetchBookableGroups();
  };

  const handleEditConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditConsultationModal) return;

    const original = showEditConsultationModal;
    const originalStatus = (original.status || 'pending').toLowerCase();
    const originalNotes = original.notes || '';

    const payload: {
      status?: string;
      notes?: string;
      reschedule?: {
        dateId: string;
        timeId: string;
      };
    } = {};

    // Compare and send changed fields only
    if (editConsultationForm.status && editConsultationForm.status !== originalStatus) {
      payload.status = editConsultationForm.status;
    }

    const trimmedNotes = editConsultationForm.notes.trim();
    if (trimmedNotes !== originalNotes.trim()) {
      payload.notes = trimmedNotes;
    }

    if (editConsultationForm.enableReschedule) {
      if (!editConsultationForm.dateId || !editConsultationForm.timeId) {
        showToast('Please select both a date and an available time slot to reschedule', 'error');
        return;
      }
      payload.reschedule = {
        dateId: editConsultationForm.dateId,
        timeId: editConsultationForm.timeId,
      };
    }

    // Do NOT submit empty payload
    if (Object.keys(payload).length === 0) {
      showToast('No changes detected to update', 'error');
      return;
    }

    setIsUpdatingConsultation(true);
    try {
      await handleUpdateConsultation(original._id, payload);
      showToast('Consultation updated successfully! 🎉');
      setShowEditConsultationModal(null);
      await fetchConsultations(consultationPage);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update consultation';
      showToast(message, 'error');
    } finally {
      setIsUpdatingConsultation(false);
    }
  };

  const onDeleteConsultation = async (c: Consultation) => {
    const candidateName = getCandidateName(c);
    if (!confirm(`Are you sure you want to delete the consultation for ${candidateName}?`)) return;

    setIsDeletingConsultationId(c._id);
    try {
      await handleDeleteConsultation(c._id);
      showToast('Consultation deleted successfully.');
      await fetchConsultations(consultationPage);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete consultation';
      showToast(message, 'error');
    } finally {
      setIsDeletingConsultationId(null);
    }
  };

  const openEdit = (group: DateGroup) => {
    setSelectedGroup(group);
    setView('edit');
  };

  const filtered = groups.filter(g => {
    const formattedDate = new Date(g.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toLowerCase();
    
    const mQ = !search || formattedDate.includes(search.toLowerCase());
    const mS = statusFilter === 'all' || (statusFilter === 'active' && g.isActive) || (statusFilter === 'inactive' && !g.isActive);
    
    if (!showHistory) {
      const dt = parseSlotDateTime(g.date);
      const isPast = dt ? dt.getTime() < new Date().setHours(0, 0, 0, 0) : false;
      if (isPast) return false;
    }
    
    return mQ && mS;
  });

  const editInitial = selectedGroup ? {
    date: selectedGroup.date,
    slots: selectedGroup.slots,
    isActive: selectedGroup.isActive,
  } : { date: '', slots: [], isActive: true };

  return (
    <div className="max-w-[1400px] mx-auto pb-16 pt-6 animate-in fade-in duration-500 relative px-4">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-md shadow-black/10">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Time Slots & Consultations</h1>
          </div>
          <p className="text-[14px] font-medium text-gray-500 ml-[52px]">
            Manage booking windows, date availability slots, and walk-in consultation bookings.
          </p>
        </div>
      </div>

      {/* Tab Selector Bar */}
      <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-max mb-8">
        {[
          { id: 'slots', label: 'Time Slots Manager', icon: CalendarDays },
          { id: 'settings', label: 'Booking Settings', icon: Settings },
          { id: 'consultations', label: 'Consultations & Walk-in', icon: UserPlus },
        ].map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as TabMode)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SLOTS MANAGER */}
      {tab === 'slots' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm font-bold text-gray-700">
                {meta.total} Date Groups Configured
              </p>
              <button
                onClick={() => { setShowHistory(h => !h); setPage(1); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showHistory
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {showHistory ? 'Showing All (incl. past)' : 'Current & Future Only'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  onClick={() => setViewStyle('list')}
                  title="List View"
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewStyle === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setViewStyle('calendar'); fetchCalendar(calendarYear, calendarMonth); }}
                  title="Calendar View"
                  className={`p-2 rounded-lg transition-all cursor-pointer ${
                    viewStyle === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => { setIsRefreshing(true); if (viewStyle === 'calendar') fetchCalendar(calendarYear, calendarMonth); else fetchAll(page); }}
                disabled={isRefreshing}
                className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-black rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {viewStyle === 'list' && (
                <button
                  onClick={() => { setSelectedGroup(null); setView('create'); }}
                  className="flex items-center gap-2 px-6 py-3 bg-black text-white text-[13px] font-bold rounded-2xl shadow-md hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Date slots
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-bold mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
              <button onClick={() => fetchAll(page)} className="ml-auto underline hover:no-underline">Retry</button>
            </div>
          )}

          {viewStyle === 'list' && (
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
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold capitalize transition-all cursor-pointer ${statusFilter === s ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {s === 'active' ? '● Active' : s === 'inactive' ? '○ Inactive' : 'All'}
                </button>
              ))}
            </div>
          </div>
          )}

          {viewStyle === 'calendar' ? (
            /* ── Calendar Grid View ── */
            <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    const d = new Date(calendarYear, calendarMonth - 2);
                    setCalendarYear(d.getFullYear());
                    setCalendarMonth(d.getMonth() + 1);
                  }}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <h3 className="text-[15px] font-extrabold text-gray-900">
                  {new Date(calendarYear, calendarMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => {
                    const d = new Date(calendarYear, calendarMonth);
                    setCalendarYear(d.getFullYear());
                    setCalendarMonth(d.getMonth() + 1);
                  }}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {calendarLoading ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-300" />
                  <p className="text-xs font-medium text-gray-400 mt-2">Loading calendar…</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 mb-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const firstDayOfWeek = new Date(calendarYear, calendarMonth - 1, 1).getDay();
                      const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
                      const today = new Date().toISOString().split('T')[0];
                      const cells = [];
                      for (let i = 0; i < firstDayOfWeek; i++) {
                        cells.push(<div key={`blank-${i}`} />);
                      }
                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const dayData = calendarData.find(cd => (cd.date || '').startsWith(dateStr));
                        const isToday = dateStr === today;
                        cells.push(
                          <div
                            key={d}
                            onClick={() => {
                              if (dayData) {
                                setSearch(new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                                setViewStyle('list');
                              }
                            }}
                            title={dayData ? `Click to view slots for ${dateStr}` : undefined}
                            className={`relative p-2 rounded-xl text-center min-h-[58px] flex flex-col items-center justify-start gap-1 transition-all ${
                              dayData
                                ? dayData.isActive !== false
                                  ? 'bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:scale-105 cursor-pointer shadow-sm'
                                  : 'bg-gray-50 border border-gray-100 opacity-60 hover:opacity-100 cursor-pointer'
                                : isToday
                                ? 'bg-blue-50 border border-blue-100'
                                : 'border border-transparent'
                            }`}
                          >
                            <span className={`text-[12px] font-bold ${
                              isToday ? 'text-blue-600' : dayData ? 'text-emerald-700' : 'text-gray-400'
                            }`}>
                              {d}
                            </span>
                            {dayData && (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full leading-tight">
                                {dayData.availableSlots ?? dayData.totalSlots ?? '?'} slots
                              </span>
                            )}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                  <div className="flex items-center gap-5 mt-5 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200" />
                      <span className="text-[11px] font-medium text-gray-500">Has active slots</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200" />
                      <span className="text-[11px] font-medium text-gray-500">Today</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200" />
                      <span className="text-[11px] font-medium text-gray-500">Inactive</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : loading ? (
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

          {!loading && viewStyle === 'list' && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <p className="text-[13px] font-medium text-gray-500">
                Page <span className="font-bold text-gray-900">{meta.page}</span> of <span className="font-bold text-gray-900">{meta.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[12px] font-bold text-gray-600 hover:text-gray-900 transition-all shadow-sm disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button 
                  disabled={page >= meta.totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-[12px] font-bold text-gray-600 hover:text-gray-900 transition-all shadow-sm disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: BOOKING SETTINGS */}
      {tab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900 mb-2">Booking Window & Blackout Configuration</h2>
          <p className="text-xs font-medium text-gray-500 mb-6">
            Configure how many rolling days candidates can book into the future, blackout specific weekdays, and set business timezone.
          </p>

          {settingsLoading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading settings...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Rolling Window Length (Days)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="365"
                  value={settings.windowDays}
                  onChange={e => setSettings(s => ({ ...s, windowDays: Number(e.target.value) }))}
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Business Timezone
                </label>
                <input
                  type="text"
                  required
                  value={settings.timezone}
                  onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}
                  placeholder="e.g. Asia/Kolkata or UTC"
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Blacked-out Weekdays (No slots allowed)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEEKDAYS.map(w => {
                    const isBlackedOut = settings.blackoutDays.includes(w.id);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setSettings(s => ({
                            ...s,
                            blackoutDays: isBlackedOut
                              ? s.blackoutDays.filter(id => id !== w.id)
                              : [...s.blackoutDays, w.id]
                          }));
                        }}
                        className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isBlackedOut
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                        }`}
                      >
                        {w.label} {isBlackedOut ? '(Blackout)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="px-6 py-3 bg-black text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: CONSULTATIONS & WALK-IN */}
      {tab === 'consultations' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <p className="text-sm font-bold text-gray-700">
              {consultationMeta.total} Total Consultations Booked
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchConsultations(consultationPage)}
                disabled={consultationsLoading}
                className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-black rounded-2xl shadow-sm transition-all cursor-pointer"
                title="Refresh Consultations"
              >
                <RefreshCw className={`w-[18px] h-[18px] ${consultationsLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  fetchBookableGroups();
                  setShowBookModal(true);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-black text-white text-xs font-bold rounded-2xl shadow-md hover:bg-gray-800 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Book Walk-in / Phone Consultation
              </button>
            </div>
          </div>

          {/* Consultations Search & Filter Bar */}
          <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by candidate name, email, phone, or appointment date..."
                value={consultationSearch}
                onChange={e => setConsultationSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
              />
            </div>
            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0 flex-wrap">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setConsultationStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-[12px] font-bold capitalize transition-all cursor-pointer ${
                    consultationStatusFilter === s
                      ? 'bg-white shadow-sm text-gray-900 border border-gray-100'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          {consultationsError && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-[13px] font-bold mb-6">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {consultationsError}
              <button onClick={() => fetchConsultations(consultationPage)} className="ml-auto underline hover:no-underline text-xs cursor-pointer">Retry</button>
            </div>
          )}
          {consultationsLoading ? (
            <div className="py-16 text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-300" />
              <p className="text-xs font-semibold">Loading consultations...</p>
            </div>
          ) : consultations.length === 0 ? (
            <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
              <User className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-bold text-gray-800">No consultations booked yet</p>
            </div>
          ) : (() => {
            const displayConsultations = consultations.filter(c => {
              const name = getCandidateName(c).toLowerCase();
              const email = getCandidateEmail(c).toLowerCase();
              const mobile = getCandidateMobile(c).toLowerCase();
              const date = getAppointmentDate(c).toLowerCase();
              const status = (c.status || 'pending').toLowerCase();

              const matchesSearch = !consultationSearch ||
                name.includes(consultationSearch.toLowerCase()) ||
                email.includes(consultationSearch.toLowerCase()) ||
                mobile.includes(consultationSearch.toLowerCase()) ||
                date.includes(consultationSearch.toLowerCase());

              const matchesStatus = consultationStatusFilter === 'all' || status === consultationStatusFilter;

              return matchesSearch && matchesStatus;
            });

            if (displayConsultations.length === 0) {
              return (
                <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
                  <User className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm font-bold text-gray-800">No consultations match your filter</p>
                  <p className="text-xs text-gray-500 mt-1">Try searching with a different term or status.</p>
                </div>
              );
            }

            return (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Candidate / User</th>
                        <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Contact Details</th>
                        <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Country</th>
                        <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Appointment Date & Time</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {displayConsultations.map(c => (
                        <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-gray-900">{getCandidateName(c)}</p>
                            {c.createdAt && (
                              <span className="text-[10.5px] font-medium text-gray-400 block mt-0.5">
                                Booked {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-600">
                            <p className="font-medium text-gray-900">{getCandidateEmail(c)}</p>
                            <p className="text-gray-400 mt-0.5">{getCandidateMobile(c)}</p>
                          </td>
                          <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                            {getCountryDisplay(c)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                                <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{formatCleanDate(getAppointmentDate(c))}</span>
                              </div>
                              {getAppointmentTime(c) ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                                    <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                                    {getAppointmentTime(c)}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
                              c.status?.toLowerCase() === 'completed'
                                ? 'bg-blue-50 text-blue-700'
                                : c.status?.toLowerCase() === 'cancelled'
                                ? 'bg-red-50 text-red-700'
                                : c.status?.toLowerCase() === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {c.status || 'Pending'}
                            </span>
                            {c.notes && (
                              <p className="text-[11px] text-gray-400 mt-1 max-w-xs truncate" title={c.notes}>
                                <span className="font-medium text-gray-600">Notes:</span> {c.notes}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditConsultation(c)}
                                title="Edit Consultation"
                                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-all shadow-sm cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteConsultation(c)}
                                disabled={isDeletingConsultationId === c._id}
                                title="Delete Consultation"
                                className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                              >
                                {isDeletingConsultationId === c._id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {consultationMeta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs font-medium text-gray-500">
                Page <span className="font-bold text-gray-900">{consultationMeta.page}</span> of <span className="font-bold text-gray-900">{consultationMeta.totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={consultationPage <= 1}
                  onClick={() => setConsultationPage(p => p - 1)}
                  className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                >
                  Prev
                </button>
                <button
                  disabled={consultationPage >= consultationMeta.totalPages}
                  onClick={() => setConsultationPage(p => p + 1)}
                  className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* WALK-IN BOOKING MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowBookModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 flex gap-3.5 items-center">
              <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-gray-900">Walk-in / Phone Booking</h2>
                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">Book consultation appointment for candidate.</p>
              </div>
            </div>

            <form onSubmit={handleWalkInBookSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={bookData.fullName}
                  onChange={e => setBookData(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={bookData.email}
                  onChange={e => setBookData(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="+91"
                    value={bookData.countryCode}
                    onChange={e => setBookData(p => ({ ...p, countryCode: e.target.value }))}
                    className="w-20 bg-gray-50/50 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black text-center"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Mobile number"
                    value={bookData.mobile}
                    onChange={e => setBookData(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className="flex-1 bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Country</label>
                <input
                  type="text"
                  placeholder="India"
                  value={bookData.country}
                  onChange={e => setBookData(p => ({ ...p, country: e.target.value }))}
                  className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Select Appointment Date {bookableLoading && <span className="text-[10px] lowercase text-gray-400 font-normal">(loading live dates...)</span>}
                </label>
                {(() => {
                  const futureGroups = getFutureBookableGroups(bookableGroups.length > 0 ? bookableGroups : groups);
                  return (
                    <>
                      <select
                        required
                        value={bookData.dateId}
                        onChange={e => {
                          const dateId = e.target.value;
                          const group = futureGroups.find(g => g._id === dateId);
                          const avail = group ? group.slots : [];
                          setAvailableSlotsForDate(avail);
                          setBookData(p => ({ ...p, dateId, timeId: '' }));
                        }}
                        className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Choose Date...</option>
                        {futureGroups.map(g => (
                          <option key={g._id} value={g._id}>
                            {new Date(g.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({g.slots.length} {g.slots.length === 1 ? 'slot' : 'slots'} available)
                          </option>
                        ))}
                      </select>
                      {futureGroups.length === 0 && !bookableLoading && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg font-medium mt-2">
                          No upcoming dates with available time slots found.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              {bookData.dateId && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Time Slot</label>
                  <select
                    required
                    value={bookData.timeId}
                    onChange={e => setBookData(p => ({ ...p, timeId: e.target.value }))}
                    className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Choose Slot Timing...</option>
                    {availableSlotsForDate.map((s, idx) => (
                      <option key={s._id || idx} value={s._id || ''}>
                        {s.time}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[13px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Booking</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {view === 'create' && (
        <TimeSlotModal 
          mode="create" 
          initial={{ date: '', slots: [], isActive: true }} 
          onSave={handleCreate} 
          onClose={() => setView('list')} 
          isSaving={isSaving} 
        />
      )}

      {/* EDIT MODAL */}
      {view === 'edit' && selectedGroup && (
        <TimeSlotModal 
          mode="edit" 
          initial={editInitial} 
          onSave={handleUpdate} 
          onClose={() => setView('list')} 
          isSaving={isSaving} 
        />
      )}

      {/* EDIT CONSULTATION MODAL */}
      {showEditConsultationModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setShowEditConsultationModal(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5 flex gap-3.5 items-center shrink-0">
              <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[17px] font-extrabold text-gray-900">Edit Consultation</h2>
                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">
                  {getCandidateName(showEditConsultationModal)}
                </p>
              </div>
            </div>

            {/* Candidate & Appointment summary */}
            <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 mb-4 text-xs shrink-0">
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Email</span>
                  <span className="font-semibold text-gray-900 truncate block">{getCandidateEmail(showEditConsultationModal)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mobile</span>
                  <span className="font-semibold text-gray-900 truncate block">{getCandidateMobile(showEditConsultationModal)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Country</span>
                  <span className="font-semibold text-gray-900 truncate block">
                    {getCountryDisplay(showEditConsultationModal)}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200/50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Appointment</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 shadow-sm">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                      {formatCleanDate(getAppointmentDate(showEditConsultationModal))}
                    </span>
                    {getAppointmentTime(showEditConsultationModal) ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-700 shadow-sm">
                        <Clock className="w-3 h-3 text-blue-500" />
                        {getAppointmentTime(showEditConsultationModal)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleEditConsultationSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* 1. Status Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Consultation Status
                </label>
                <select
                  value={editConsultationForm.status}
                  onChange={e => setEditConsultationForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black capitalize"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* 2. Notes */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Notes / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Add notes (e.g. called to confirm, candidate requested reschedule)..."
                  value={editConsultationForm.notes}
                  onChange={e => setEditConsultationForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* 3. Optional Reschedule Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editConsultationForm.enableReschedule}
                    onChange={e => {
                      const checked = e.target.checked;
                      setEditConsultationForm(p => ({
                        ...p,
                        enableReschedule: checked,
                        dateId: checked ? p.dateId : '',
                        timeId: checked ? p.timeId : ''
                      }));
                      if (!checked) {
                        setEditConsultationAvailableSlots([]);
                      }
                    }}
                    className="w-4 h-4 rounded text-black focus:ring-black border-gray-300"
                  />
                  <span className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" /> Reschedule Appointment
                  </span>
                </label>

                {editConsultationForm.enableReschedule && (
                  <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Select New Date <span className="text-red-500">*</span> {bookableLoading && <span className="lowercase font-normal">(loading...)</span>}
                      </label>
                      {(() => {
                        const futureGroups = getFutureBookableGroups(bookableGroups.length > 0 ? bookableGroups : groups);
                        return (
                          <>
                            <select
                              required={editConsultationForm.enableReschedule}
                              value={editConsultationForm.dateId}
                              onChange={e => {
                                const dateId = e.target.value;
                                const group = futureGroups.find(g => g._id === dateId);
                                const avail = group ? group.slots : [];
                                setEditConsultationAvailableSlots(avail);
                                setEditConsultationForm(p => ({ ...p, dateId, timeId: '' }));
                              }}
                              className="w-full bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                            >
                              <option value="">Choose Date...</option>
                              {futureGroups.map(g => (
                                <option key={g._id} value={g._id}>
                                  {new Date(g.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({g.slots.length} {g.slots.length === 1 ? 'slot' : 'slots'} available)
                                </option>
                              ))}
                            </select>
                            {futureGroups.length === 0 && !bookableLoading && (
                              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg font-medium mt-2">
                                No upcoming dates with available time slots found.
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {editConsultationForm.dateId && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Select New Time Slot <span className="text-red-500">*</span>
                        </label>
                        {editConsultationAvailableSlots.length === 0 ? (
                          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                            No available time slots on this date.
                          </p>
                        ) : (
                          <select
                            required={editConsultationForm.enableReschedule}
                            value={editConsultationForm.timeId}
                            onChange={e => setEditConsultationForm(p => ({ ...p, timeId: e.target.value }))}
                            className="w-full bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                          >
                            <option value="">Choose Available Slot Timing...</option>
                            {editConsultationAvailableSlots.map((s, idx) => (
                              <option key={s._id || idx} value={s._id || ''}>
                                {s.time}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditConsultationModal(null)}
                  className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingConsultation}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[13px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUpdatingConsultation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Consultation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
