import { useState, useEffect, useRef } from 'react';
import {
    Search, Filter, MoreVertical,
    UserCheck, UserX,
    User as UserIcon, Calendar, CheckCircle,
    Plus, Trash2, AlertCircle, Loader2, X,
    ChevronLeft, ChevronRight, Edit3, Mail, Phone,
    Lock, ShieldAlert, Key, RefreshCw, Download
} from 'lucide-react';

import { API_BASE_URL as BASE_URL } from '../config/api';
const LIMIT = 10000;

interface User {
    _id: string;
    fullName: string;
    email: string;
    mobile: string;
    role: 'student' | 'recruiter' | 'consultation';
    isVerified: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ToastMessage {
    id: number;
    text: string;
    type: 'success' | 'error';
}

export default function UserManagement() {
    // Core List State
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter/Search State
    const [activeTab, setActiveTab] = useState<'All' | 'Student' | 'Recruiter' | 'Consultation'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isActiveFilter, setIsActiveFilter] = useState<'all' | 'active' | 'suspended'>('all');
    const [isVerifiedFilter, setIsVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [showFiltersPopover, setShowFiltersPopover] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

    // Modals State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState<User | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
    const [activeDropdownUser, setActiveDropdownUser] = useState<string | null>(null);
    
    // Form States
    const [isSaving, setIsSaving] = useState(false);
    const [inviteData, setInviteData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        password: '',
        role: 'student' as 'student' | 'recruiter' | 'consultation'
    });
    const [editData, setEditData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        role: 'student' as 'student' | 'recruiter' | 'consultation',
        isVerified: false,
        isActive: true
    });

    // Toast Notifications State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    // Refs for popovers
    const filterPopoverRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const DISPLAY_LIMIT = 15;
    const displayedUsers = users.slice((page - 1) * DISPLAY_LIMIT, page * DISPLAY_LIMIT);

    // Toast triggers
    const showToast = (text: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const getHeaders = () => ({
        'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`,
        'Content-Type': 'application/json'
    });

    // Close click-away listeners
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
                setShowFiltersPopover(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdownUser(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset page on new search
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle role tab change
    const handleTabChange = (tab: 'All' | 'Student' | 'Recruiter' | 'Consultation') => {
        setActiveTab(tab);
        setPage(1);
    };

    // Load users from backend
    const fetchUsers = async (silent = false) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            let url = `${BASE_URL}/admin/users?page=1&limit=${LIMIT}`;
            
            if (activeTab !== 'All') {
                url += `&role=${activeTab.toLowerCase()}`;
            }
            if (debouncedSearch.trim()) {
                url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
            }
            if (isActiveFilter !== 'all') {
                url += `&isActive=${isActiveFilter === 'active'}`;
            }
            if (isVerifiedFilter !== 'all') {
                url += `&isVerified=${isVerifiedFilter === 'verified'}`;
            }

            const res = await fetch(url, { headers: getHeaders() });
            const data = await res.json();
            
            if (data.success) {
                const docs: User[] = Array.isArray(data.data)
                    ? data.data
                    : (data.data?.docs || data.data?.users || data.data?.data || []);
                
                setUsers(docs);
                const total = docs.length;
                const calculatedPages = Math.ceil(total / DISPLAY_LIMIT) || 1;
                setTotalPages(calculatedPages);
                setTotalResults(total);
                setPage(prev => Math.min(prev, calculatedPages));
            } else {
                setError(data.message || 'Failed to retrieve users');
                showToast(data.message || 'Failed to retrieve users', 'error');
            }
        } catch (err) {
            setError('Network error — unable to reach the server.');
            showToast('Network error — unable to reach the server.', 'error');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab, debouncedSearch, isActiveFilter, isVerifiedFilter]);

    // Export users to CSV (client-side generation)
    const handleExportCSV = () => {
        if (users.length === 0) {
            showToast('No user data available to export', 'error');
            return;
        }
        const headers = ['ID', 'Full Name', 'Email', 'Mobile', 'Role', 'Verified', 'Status', 'Created At'];
        const rows = users.map(user => [
            user._id,
            user.fullName,
            user.email,
            user.mobile || '—',
            user.role,
            user.isVerified ? 'Verified' : 'Unverified',
            user.isActive ? 'Active' : 'Suspended',
            new Date(user.createdAt).toLocaleDateString()
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `squrx_members_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV export successfully downloaded! 📥');
    };

    // Toggle verification state directly
    const handleToggleVerification = async (user: User) => {
        setActionLoading(user._id);
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${user._id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ isVerified: !user.isVerified })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`User ${!user.isVerified ? 'verified' : 'unverified'} successfully!`);
                fetchUsers(true);
            } else {
                showToast(data.message || 'Failed to update verification status', 'error');
            }
        } catch {
            showToast('Network error — status update failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Toggle suspension state directly
    const handleToggleSuspension = async (user: User) => {
        setActionLoading(user._id);
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${user._id}/status`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ isActive: !user.isActive })
            });
            const data = await res.json();
            if (data.success) {
                showToast(user.isActive ? 'Member suspended successfully 🔒' : 'Member reactivated successfully 🔑');
                fetchUsers(true);
            } else {
                showToast(data.message || 'Failed to update account status', 'error');
            }
        } catch {
            showToast('Network error — status update failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Submit Create/Invite User
    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!inviteData.fullName.trim()) return showToast('Full name is required', 'error');
        if (!inviteData.email.trim()) return showToast('Email is required', 'error');
        if (inviteData.role === 'student' && !inviteData.mobile.trim()) {
            return showToast('Mobile number is required for students', 'error');
        }
        if (!inviteData.password) return showToast('Password is required', 'error');

        setIsSaving(true);
        try {
            // Step 1: Sign up user
            const signupPayload = {
                fullName: inviteData.fullName.trim(),
                email: inviteData.email.trim(),
                mobile: inviteData.mobile.trim() || undefined,
                password: inviteData.password,
                role: inviteData.role,
                gdprConsent: true
            };

            const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(signupPayload)
            });
            const signupData = await signupRes.json();

            if (!signupData.success) {
                showToast(signupData.message || 'Registration failed', 'error');
                setIsSaving(false);
                return;
            }

            const userId = signupData.data?.userId;
            if (!userId) {
                showToast('Registration succeeded but user ID is missing', 'error');
                setIsSaving(false);
                return;
            }

            // Step 2: Auto-verify OTP using deterministic mock values
            const otp = inviteData.role === 'student' 
                ? inviteData.mobile.trim().slice(-4) 
                : '1234';

            const otpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp })
            });
            const otpData = await otpRes.json();

            if (otpData.success) {
                showToast('Member successfully created & verified! 🎉');
                setShowInviteModal(false);
                // Reset form
                setInviteData({
                    fullName: '',
                    email: '',
                    mobile: '',
                    password: '',
                    role: 'student'
                });
                fetchUsers();
                setPage(1);
            } else {
                showToast(`User created but verification failed: ${otpData.message}`, 'error');
                setShowInviteModal(false);
                fetchUsers();
                setPage(1);
            }
        } catch {
            showToast('Network error while inviting user', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Open edit modal and populate state
    const openEditModal = (user: User) => {
        setShowEditModal(user);
        setEditData({
            fullName: user.fullName,
            email: user.email,
            mobile: user.mobile || '',
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive
        });
        setActiveDropdownUser(null);
    };

    // Save Edit User Changes
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEditModal) return;

        if (!editData.fullName.trim()) return showToast('Full name is required', 'error');
        if (!editData.email.trim()) return showToast('Email is required', 'error');

        setIsSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${showEditModal._id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({
                    fullName: editData.fullName.trim(),
                    email: editData.email.trim(),
                    mobile: editData.mobile.trim() || undefined,
                    role: editData.role,
                    isVerified: editData.isVerified,
                    isActive: editData.isActive
                })
            });
            const data = await res.json();

            if (data.success) {
                showToast('Member profile updated successfully!');
                setShowEditModal(null);
                fetchUsers(true);
            } else {
                showToast(data.message || 'Failed to update member profile', 'error');
            }
        } catch {
            showToast('Network error while saving changes', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete User (Soft delete)
    const handleDeleteConfirm = async () => {
        if (!showDeleteModal) return;
        setIsSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${showDeleteModal._id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            const data = await res.json();

            if (data.success) {
                showToast('Member profile deleted successfully.');
                setShowDeleteModal(null);
                fetchUsers();
            } else {
                showToast(data.message || 'Failed to delete member profile', 'error');
            }
        } catch {
            showToast('Network error while deleting user', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRandomPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setInviteData(prev => ({ ...prev, password: pass }));
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500 pt-6 px-4">

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

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Members & Access</h1>
                    <p className="text-[14px] font-medium text-gray-500 mt-2">Manage profiles, permissions, and moderation holds in real-time.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={handleExportCSV}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:bg-gray-800 hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Invite User</span>
                    </button>
                </div>
            </div>

            {/* Utility Bar */}
            <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

                {/* Tabs */}
                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-max overflow-x-auto max-w-full">
                    {(['All', 'Student', 'Recruiter', 'Consultation'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shrink-0 cursor-pointer ${
                                activeTab === tab 
                                    ? 'bg-white shadow-sm text-gray-900 border border-gray-100' 
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-3 w-full md:w-auto pr-2 relative">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
                        />
                    </div>
                    
                    {/* Filters Popover Control */}
                    <div className="relative" ref={filterPopoverRef}>
                        <button 
                            onClick={() => setShowFiltersPopover(!showFiltersPopover)}
                            className={`p-3 rounded-2xl text-gray-500 hover:text-gray-900 hover:border-gray-200 border border-transparent transition-all cursor-pointer ${
                                showFiltersPopover || isActiveFilter !== 'all' || isVerifiedFilter !== 'all'
                                    ? 'bg-gray-100 border-gray-200 text-gray-900'
                                    : 'bg-gray-50'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                        </button>

                        {/* Filters Dropdown */}
                        {showFiltersPopover && (
                            <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 p-6 z-[60] animate-in slide-in-from-top-3 duration-200">
                                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center justify-between">
                                    <span>Query Filters</span>
                                    <button 
                                        onClick={() => {
                                            setIsActiveFilter('all');
                                            setIsVerifiedFilter('all');
                                            setPage(1);
                                        }}
                                        className="text-[11px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-wider"
                                    >
                                        Reset
                                    </button>
                                </h3>

                                <div className="space-y-4">
                                    {/* Verification Status */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Verification</label>
                                        <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                            {(['all', 'verified', 'unverified'] as const).map(f => (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() => { setIsVerifiedFilter(f); setPage(1); }}
                                                    className={`py-1.5 text-[11px] font-bold capitalize rounded-lg transition-all cursor-pointer ${
                                                        isVerifiedFilter === f
                                                            ? 'bg-white shadow-sm text-gray-900 border border-gray-100'
                                                            : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Suspension Status */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Account Status</label>
                                        <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                                            {(['all', 'active', 'suspended'] as const).map(f => (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    onClick={() => { setIsActiveFilter(f); setPage(1); }}
                                                    className={`py-1.5 text-[11px] font-bold capitalize rounded-lg transition-all cursor-pointer ${
                                                        isActiveFilter === f
                                                            ? 'bg-white shadow-sm text-gray-900 border border-gray-100'
                                                            : 'text-gray-500 hover:text-gray-900'
                                                    }`}
                                                >
                                                    {f === 'suspended' ? 'Banned' : f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => {
                            setIsRefreshing(true);
                            fetchUsers();
                        }}
                        disabled={loading}
                        className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 rounded-2xl transition-all cursor-pointer flex items-center justify-center"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading && isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-5 rounded-3xl mb-6 flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-[13px] font-bold">{error}</p>
                </div>
            )}

            {/* Main Table Container */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Member Details</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Verification</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account State</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobile</th>
                                <th className="px-6 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                                <th className="px-8 py-5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-2xl shrink-0" />
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-gray-100 rounded w-28" />
                                                    <div className="h-3 bg-gray-50 rounded w-36" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5"><div className="h-6 bg-gray-100 rounded-xl w-16" /></td>
                                        <td className="px-6 py-5"><div className="h-5 bg-gray-100 rounded w-20" /></td>
                                        <td className="px-6 py-5"><div className="h-5 bg-gray-100 rounded w-16" /></td>
                                        <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                                        <td className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                                        <td className="px-8 py-5 text-right"><div className="w-20 h-8 bg-gray-100 rounded-xl ml-auto" /></td>
                                    </tr>
                                ))
                            ) : displayedUsers.map((user) => (
                                <tr key={user._id} className="group hover:bg-gray-50/40 transition-colors">
                                    <td className="px-8 py-5 text-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-[15px] font-bold text-gray-700 shrink-0 select-none uppercase">
                                                {user.fullName ? user.fullName.charAt(0) : <UserIcon className="w-4 h-4 text-gray-400" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight mb-1">{user.fullName || '—'}</p>
                                                <p className="text-[13px] font-medium text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize select-none ${
                                            user.role === 'student' 
                                                ? 'bg-blue-50 text-blue-700' 
                                                : user.role === 'recruiter' 
                                                    ? 'bg-purple-50 text-purple-700' 
                                                    : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            {user.isVerified ? (
                                                <span className="inline-flex items-center gap-1 text-[13px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-xl">
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                    <span>Verified</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[13px] font-bold text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-xl">
                                                    <Calendar className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                                                    <span>Pending</span>
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[12px] font-bold select-none ${
                                            user.isActive 
                                                ? 'text-emerald-700 bg-emerald-50' 
                                                : 'text-red-700 bg-red-50'
                                        }`}>
                                            {user.isActive ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[13px] font-medium text-gray-600">
                                        {user.mobile || '—'}
                                    </td>
                                    <td className="px-6 py-5 text-[13px] font-medium text-gray-500">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-8 py-5 text-right relative">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Verification Quick Toggle */}
                                            <button 
                                                onClick={() => handleToggleVerification(user)}
                                                disabled={actionLoading === user._id}
                                                title={user.isVerified ? 'Revoke verification' : 'Verify user'}
                                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                                    user.isVerified 
                                                        ? 'bg-gray-50 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 hover:border-yellow-200' 
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-300'
                                                }`}
                                            >
                                                {actionLoading === user._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserCheck className="w-4 h-4" />
                                                )}
                                            </button>

                                            {/* Suspension Quick Toggle */}
                                            <button 
                                                onClick={() => handleToggleSuspension(user)}
                                                disabled={actionLoading === user._id}
                                                title={user.isActive ? 'Suspend account' : 'Reactivate account'}
                                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                                    user.isActive 
                                                        ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-300' 
                                                        : 'bg-gray-900 text-white border-transparent hover:bg-gray-800'
                                                }`}
                                            >
                                                {actionLoading === user._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <UserX className="w-4 h-4" />
                                                )}
                                            </button>

                                            {/* More options menu */}
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setActiveDropdownUser(activeDropdownUser === user._id ? null : user._id)}
                                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                
                                                {activeDropdownUser === user._id && (
                                                    <div 
                                                        ref={dropdownRef} 
                                                        className="absolute right-0 mt-1.5 w-36 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-1.5 animate-in slide-in-from-top-1 duration-150"
                                                    >
                                                        <button 
                                                            onClick={() => openEditModal(user)}
                                                            className="w-full text-left px-3.5 py-2.5 text-[12.5px] font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit Member</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => { setShowDeleteModal(user); setActiveDropdownUser(null); }}
                                                            className="w-full text-left px-3.5 py-2.5 text-[12.5px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {!loading && users.length === 0 && (
                        <div className="py-24 text-center">
                            <UserIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-[15px] font-bold text-gray-900 mb-1">No users found</h3>
                            <p className="text-[13px] font-medium text-gray-500">Try adjusting your filters, page size, or search query.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <p className="text-[13px] font-medium text-gray-500">
                        Showing <span className="font-bold text-gray-900">{displayedUsers.length}</span> of <span className="font-bold text-gray-900">{totalResults}</span> records
                    </p>
                    {totalPages > 1 && (
                        <div className="flex gap-2 select-none">
                            <button 
                                disabled={page <= 1 || loading}
                                onClick={() => setPage(p => Math.max(p - 1, 1))}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Previous</span>
                            </button>
                            <span className="px-4 py-2 text-[12px] font-bold text-gray-600 bg-gray-100 rounded-xl flex items-center justify-center">
                                Page {page} / {totalPages}
                            </span>
                            <button 
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-100 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="mb-6 flex gap-3.5 items-center">
                            <div className="w-11 h-11 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-[17px] font-extrabold text-gray-900">Invite New Member</h2>
                                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">Register & automatically verify user access.</p>
                            </div>
                        </div>

                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Member Role</label>
                                <select 
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as any }))}
                                    className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-semibold transition-all"
                                >
                                    <option value="student">Student</option>
                                    <option value="recruiter">Recruiter</option>
                                    <option value="consultation">Consultation</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Alex Mercer"
                                        value={inviteData.fullName}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, fullName: e.target.value }))}
                                        className="w-full bg-gray-50/50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-medium transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="email"
                                        required
                                        placeholder="alex@univ.edu"
                                        value={inviteData.email}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-gray-50/50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-medium transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Mobile Number {inviteData.role === 'student' && <span className="text-red-500 font-bold">*</span>}
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="tel"
                                        required={inviteData.role === 'student'}
                                        placeholder="9876543210 (10 digits)"
                                        value={inviteData.mobile}
                                        onChange={(e) => setInviteData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                        className="w-full bg-gray-50/50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-medium transition-all"
                                    />
                                </div>
                                {inviteData.role === 'student' && (
                                    <p className="text-[10.5px] font-semibold text-gray-400 mt-1.5">
                                        Mock verification OTP will be the last 4 digits ({inviteData.mobile.length >= 4 ? inviteData.mobile.slice(-4) : '••••'}).
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                                <div className="relative flex gap-2">
                                    <div className="relative flex-1">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input 
                                            type="text"
                                            required
                                            placeholder="••••••••"
                                            value={inviteData.password}
                                            onChange={(e) => setInviteData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full bg-gray-50/50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-400 text-sm font-medium transition-all"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRandomPassword}
                                        title="Generate Password"
                                        className="px-3.5 bg-gray-50 border border-gray-200 hover:border-gray-900 rounded-xl text-gray-600 hover:text-gray-900 transition-all cursor-pointer flex items-center justify-center"
                                    >
                                        <Key className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-[13px] font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Register User</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
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
                                <h2 className="text-[17px] font-extrabold text-gray-900">Edit Member Profile</h2>
                                <p className="text-[12.5px] font-semibold text-gray-400 mt-0.5">Modify profile configuration and access holds.</p>
                            </div>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Member Role</label>
                                <select 
                                    value={editData.role}
                                    onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value as any }))}
                                    className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-semibold transition-all"
                                >
                                    <option value="student">Student</option>
                                    <option value="recruiter">Recruiter</option>
                                    <option value="consultation">Consultation</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text"
                                        required
                                        value={editData.fullName}
                                        onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                                        className="w-full bg-gray-50/50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-medium transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="email"
                                        required
                                        value={editData.email}
                                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full bg-gray-50/50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-medium transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="tel"
                                        value={editData.mobile}
                                        onChange={(e) => setEditData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                        className="w-full bg-gray-50/50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 text-sm font-medium transition-all"
                                        placeholder="Mobile (optional except students)"
                                    />
                                </div>
                            </div>

                            {/* Access Switches */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-gray-50 p-4.5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Verification</span>
                                    <button
                                        type="button"
                                        onClick={() => setEditData(p => ({ ...p, isVerified: !p.isVerified }))}
                                        className={`w-full py-2.5 rounded-xl text-[12.5px] font-bold transition-all border cursor-pointer ${
                                            editData.isVerified 
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}
                                    >
                                        {editData.isVerified ? 'Verified' : 'Pending'}
                                    </button>
                                </div>

                                <div className="bg-gray-50 p-4.5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Account status</span>
                                    <button
                                        type="button"
                                        onClick={() => setEditData(p => ({ ...p, isActive: !p.isActive }))}
                                        className={`w-full py-2.5 rounded-xl text-[12.5px] font-bold transition-all border cursor-pointer ${
                                            editData.isActive 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                        }`}
                                    >
                                        {editData.isActive ? 'Active' : 'Suspended'}
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
                                        <span>Save Profile</span>
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
                        <h3 className="text-[16px] font-extrabold text-gray-900 mb-2">Delete Member Profile?</h3>
                        <p className="text-[13px] font-medium text-gray-500 mb-6 leading-relaxed">
                            This performs a soft delete on <strong className="text-gray-900">{showDeleteModal.fullName}</strong>. The record remains in archives but access holds will block logins.
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
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white text-[13px] font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
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
