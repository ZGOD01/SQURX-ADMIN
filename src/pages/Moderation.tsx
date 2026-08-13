import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Search, AlertCircle,
  AlertTriangle, XCircle, Loader2, RefreshCw, GraduationCap, School, BookOpen, Sparkles
} from 'lucide-react';
import { API_BASE_URL as BASE_URL } from '../config/api';

function getHeaders() {
  return {
    Authorization: `Bearer ${sessionStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  };
}

type EntityType = 'educations' | 'universities' | 'courses' | 'specializations';
type StatusType = 'pending' | 'approved' | 'rejected';

interface SubmissionItem {
  _id: string;
  name: string;
  status: StatusType;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const ENTITIES: { key: EntityType; label: string; icon: React.ElementType }[] = [
  { key: 'educations', label: 'Educations', icon: GraduationCap },
  { key: 'universities', label: 'Universities', icon: School },
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'specializations', label: 'Specializations', icon: Sparkles },
];

export default function Moderation() {
  // Submission review state
  const [activeEntity, setActiveEntity] = useState<EntityType>('educations');
  const [activeStatus, setActiveStatus] = useState<StatusType>('pending');
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/admin/${activeEntity}?status=${activeStatus}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setItems(Array.isArray(data.data) ? data.data : []);
      } else {
        setError(data.message || `Failed to load ${activeEntity}`);
      }
    } catch {
      setError('Network error while fetching submissions');
    } finally {
      setLoading(false);
    }
  }, [activeEntity, activeStatus]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleUpdateStatus = async (item: SubmissionItem, newStatus: 'approved' | 'rejected') => {
    setActionLoading(item._id);
    try {
      const res = await fetch(`${BASE_URL}/admin/${activeEntity}/${item._id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Item ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);
        fetchSubmissions();
      } else {
        showToast(data.message || `Failed to update ${activeEntity} item`, 'error');
      }
    } catch {
      showToast('Network error while updating submission', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-500 pt-6 px-4">

      {/* Toast Banner */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-[13px] font-bold ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Compliance & Submissions Review</h1>
          <p className="text-[14px] font-medium text-gray-500 mt-2">Approve or reject user-submitted entries for Educations, Universities, Courses, and Specializations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Entity Selector Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {ENTITIES.map(entity => {
          const Icon = entity.icon;
          const isActive = activeEntity === entity.key;
          return (
            <button
              key={entity.key}
              onClick={() => setActiveEntity(entity.key)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{entity.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Review Card */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 sm:p-8">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {(['pending', 'approved', 'rejected'] as StatusType[]).map(status => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  activeStatus === status
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeEntity}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
            />
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-bold text-gray-800">No {activeStatus} submissions found</p>
            <p className="text-xs text-gray-400 mt-1">There are currently no {activeStatus} records under {activeEntity}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">#</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Submitted Title</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                    <td className="px-4 py-4">
                      <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                        {item._id}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        item.status === 'rejected' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === item._id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : (
                          <>
                            {item.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(item, 'approved')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}
                            {item.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(item, 'rejected')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
