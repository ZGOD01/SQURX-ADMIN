import { useState, useEffect, useCallback } from 'react';
import {
    Users, Briefcase, CheckCircle,
    Shield, Activity, ArrowUpRight, ArrowDownRight,
    FileCheck, RefreshCw,
    MoreHorizontal
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { API_BASE_URL } from '../config/api';
import { Link } from 'react-router-dom';
import type { SyncLogItem } from '../types/jobsAdmin';

interface UserRecord {
    _id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    createdAt?: string;
}

interface ActivityDataPoint {
    time: string;
    jobs: number;
    events: number;
}

interface ModerationItem {
    id: string;
    entity: string;
    type: string;
    status: string;
    risk: 'Low' | 'Med' | 'High';
}

interface ActivityItem {
    id: string | number;
    action: string;
    time: string;
    type: 'success' | 'warning' | 'info' | 'failed';
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    positive?: boolean;
    subtitle?: string;
}

const StatCard = ({ title, value, icon: Icon, trend, positive, subtitle }: StatCardProps) => (
    <div className="bg-white rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-bold text-gray-500">{title}</h3>
            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Icon className="w-[18px] h-[18px] text-gray-700" />
            </div>
        </div>
        <div className="flex items-end justify-between">
            <div>
                <p className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</p>
                {subtitle && <p className="text-[11px] font-medium text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[12px] font-bold ${positive ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'} px-2 py-1 rounded-xl`}>
                    {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {trend}
                </div>
            )}
        </div>
    </div>
);

function getHeaders(): HeadersInit {
    return {
        'Authorization': `Bearer ${sessionStorage.getItem('adminToken') || ''}`,
        'Content-Type': 'application/json'
    };
}

export default function DashboardOverview() {
    const [activityChartData, setActivityChartData] = useState<ActivityDataPoint[]>([]);
    const [stats, setStats] = useState({
        students: 0,
        recruiters: 0,
        liveJobs: 0,
        expiredJobs: 0,
        pendingReviewCount: 0
    });
    const [activityStream, setActivityStream] = useState<ActivityItem[]>([]);
    const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSynced, setLastSynced] = useState('Loading...');

    const fetchLiveData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            // 1. Fetch live jobs stats
            const jobsPromise = fetch(`${API_BASE_URL}/admin/jobs/stats`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            // 2. Fetch live students count
            const studentsPromise = fetch(`${API_BASE_URL}/admin/users?role=student&limit=50`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            // 3. Fetch live recruiters count
            const recruitersPromise = fetch(`${API_BASE_URL}/admin/users?role=recruiter&limit=1`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            // 4. Fetch live unverified/pending users
            const pendingUsersPromise = fetch(`${API_BASE_URL}/admin/users?isVerified=false&limit=5`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            // 5. Fetch live sync logs
            const syncLogsPromise = fetch(`${API_BASE_URL}/admin/jobs/sync-logs?limit=30`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const [jobsRes, studentsRes, recruitersRes, pendingRes, logsRes] = await Promise.all([
                jobsPromise,
                studentsPromise,
                recruitersPromise,
                pendingUsersPromise,
                syncLogsPromise
            ]);

            let liveStudents = 0;
            let studentDocs: UserRecord[] = [];
            if (studentsRes?.success) {
                studentDocs = Array.isArray(studentsRes.data)
                    ? studentsRes.data
                    : (studentsRes.data?.docs || studentsRes.data?.users || []);
                liveStudents = studentsRes.data?.total ?? studentDocs.length;
            }

            let liveRecruiters = 0;
            if (recruitersRes?.success) {
                liveRecruiters = recruitersRes.data?.total ?? (Array.isArray(recruitersRes.data) ? recruitersRes.data.length : 0);
            }

            let liveJobs = 0;
            let expiredJobs = 0;
            if (jobsRes?.success && jobsRes.data) {
                liveJobs = jobsRes.data.active ?? 0;
                expiredJobs = jobsRes.data.expired ?? 0;
            }

            let pendingCount = 0;
            if (pendingRes?.success) {
                const pendingDocs: UserRecord[] = Array.isArray(pendingRes.data) 
                    ? pendingRes.data 
                    : (pendingRes.data?.docs || pendingRes.data?.users || []);
                pendingCount = pendingRes.data?.total ?? pendingDocs.length;

                if (pendingDocs.length > 0) {
                    const queueItems: ModerationItem[] = pendingDocs.slice(0, 4).map((u: UserRecord, idx: number) => ({
                        id: u._id ? `USR-${u._id.slice(-4).toUpperCase()}` : `MQ-${idx + 1}`,
                        entity: u.fullName || u.email || 'Unverified User',
                        type: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Student',
                        status: 'Pending Verification',
                        risk: 'Med' as const
                    }));
                    setModerationQueue(queueItems);
                }
            }

            setStats({
                students: liveStudents,
                recruiters: liveRecruiters,
                liveJobs,
                expiredJobs,
                pendingReviewCount: pendingCount
            });

            // Compute dynamic 24-hour activity distribution from live sync logs and user registrations
            const logsList: SyncLogItem[] = (logsRes?.success && Array.isArray(logsRes.data)) ? logsRes.data : [];
            const timeBuckets = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
            const bucketData: ActivityDataPoint[] = timeBuckets.map((t, idx) => {
                const startHour = idx * 4;
                const endHour = startHour + 4;

                // Sum jobs fetched/upserted in this 4-hour window
                let jobsCount = 0;
                let eventCount = 0;

                logsList.forEach(log => {
                    if (log.startedAt) {
                        const date = new Date(log.startedAt);
                        const h = date.getHours();
                        if (h >= startHour && h < endHour) {
                            jobsCount += (log.jobsFetched || 0) + (log.jobsUpserted || 0);
                            eventCount += 1;
                        }
                    }
                });

                studentDocs.forEach(user => {
                    if (user.createdAt) {
                        const date = new Date(user.createdAt);
                        const h = date.getHours();
                        if (h >= startHour && h < endHour) {
                            eventCount += 1;
                        }
                    }
                });

                return {
                    time: t,
                    jobs: jobsCount,
                    events: eventCount
                };
            });

            setActivityChartData(bucketData);

            // Populate real activity stream from sync logs
            if (logsRes?.success && Array.isArray(logsRes.data) && logsRes.data.length > 0) {
                const logs: ActivityItem[] = logsRes.data.slice(0, 5).map((log: SyncLogItem) => {
                    const timeStr = log.startedAt 
                        ? new Date(log.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                        : 'Recent';
                    const isSuccess = log.status === 'success';
                    const isFailed = log.status === 'failed';
                    return {
                        id: log._id || Math.random(),
                        action: `Sync (${log.jobType}): ${log.jobsFetched != null ? `${log.jobsFetched} fetched` : log.status}`,
                        time: timeStr,
                        type: isSuccess ? 'success' : isFailed ? 'failed' : 'info'
                    };
                });
                setActivityStream(logs);
            } else {
                setActivityStream([
                    { id: 1, action: "Live sync connected", time: "Active", type: "success" },
                    { id: 2, action: "API services initialized", time: "Ready", type: "info" }
                ]);
            }

            const now = new Date();
            setLastSynced(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
        } catch {
            // Keep existing values on error
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchLiveData();
        // Background live refresh every 30 seconds
        const interval = setInterval(fetchLiveData, 30000);
        return () => clearInterval(interval);
    }, [fetchLiveData]);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500 pt-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full bg-green-500 rounded-full opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-[13px] text-gray-500 font-semibold">
                            Live System Status <span className="mx-1 text-gray-300">•</span> Last synced: {lastSynced}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchLiveData}
                        title="Refresh Live Data"
                        className={`p-3 bg-white border border-gray-100 text-gray-600 hover:text-black shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all focus:outline-none rounded-2xl ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <Link
                        to="/users"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-tr from-gray-900 to-gray-800 text-white text-[13px] font-bold hover:opacity-90 transition-opacity shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl"
                    >
                        <Shield className="w-4 h-4" />
                        Pending Users
                        <span className="ml-1 px-2 py-0.5 bg-white/20 text-white text-[11px] rounded-xl font-bold">
                            {stats.pendingReviewCount}
                        </span>
                    </Link>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Registered Students"
                    value={stats.students.toLocaleString()}
                    icon={Users}
                    subtitle="Live DB Count"
                />
                <StatCard
                    title="Active Recruiters"
                    value={stats.recruiters.toLocaleString()}
                    icon={Briefcase}
                    subtitle="Live DB Count"
                />
                <StatCard
                    title="Live Job Openings"
                    value={stats.liveJobs.toLocaleString()}
                    icon={CheckCircle}
                    subtitle="Active Fantastic.jobs"
                />
                <StatCard
                    title="Expired / Archived Jobs"
                    value={stats.expiredJobs.toLocaleString()}
                    icon={FileCheck}
                    subtitle="Historical ingestions"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Main Content Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Activity Chart */}
                    <div className="bg-white rounded-3xl p-8 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-[16px] font-extrabold text-gray-900">Platform Activity & Ingestion Throughput</h2>
                                <p className="text-[13px] font-medium text-gray-500 mt-1">Live Fantastic.jobs sync batches and system operations (24-hour cycle)</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                    <span className="text-[12px] font-bold text-gray-600">Jobs Synced</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span className="text-[12px] font-bold text-gray-600">System Events</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={activityChartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#111827" stopOpacity={0.08} />
                                            <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.08} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} dy={12} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} />
                                    <Tooltip
                                        cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                        itemStyle={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}
                                        labelStyle={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" name="Jobs Synced" dataKey="jobs" stroke="#111827" fillOpacity={1} fill="url(#colorJobs)" strokeWidth={2} activeDot={{ r: 4, fill: '#111827', strokeWidth: 0 }} isAnimationActive={false} />
                                    <Area type="monotone" name="System Events" dataKey="events" stroke="#3B82F6" fillOpacity={1} fill="url(#colorEvents)" strokeWidth={2} activeDot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pending Verification / Moderation Table */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-[16px] font-extrabold text-gray-900">Pending Review Queue</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Unverified accounts requiring admin attention</p>
                            </div>
                            <Link to="/users" className="text-[13px] font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors">
                                View All Users
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400">Entity</th>
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400">Role</th>
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400">Status</th>
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {moderationQueue.length > 0 ? (
                                        moderationQueue.map((item, _idx) => (
                                            <tr key={item.id} className={`group hover:bg-gray-50/80 transition-colors ${_idx !== moderationQueue.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                                <td className="px-8 py-4">
                                                    <div className="text-[14px] font-bold text-gray-900">{item.entity}</div>
                                                    <div className="text-[11px] font-medium text-gray-400 mt-0.5">{item.id}</div>
                                                </td>
                                                <td className="px-8 py-4 text-[13px] font-semibold text-gray-600">{item.type}</td>
                                                <td className="px-8 py-4">
                                                    <span className="inline-flex px-3 py-1 text-[11px] font-bold rounded-xl bg-yellow-50 text-yellow-700">
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <Link to="/users" className="text-[13px] font-bold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-100 px-4 py-2 rounded-xl transition-all shadow-sm">
                                                        Review
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-8 text-center text-xs text-gray-400">
                                                No pending accounts awaiting verification
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Side Column: Feed & Shortcuts */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Action Panel */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                        <h2 className="text-[16px] font-extrabold text-white mb-1">Quick Actions</h2>
                        <p className="text-[13px] font-medium text-gray-400 mb-6">Common administrative tasks</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/users" className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <Users className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">Verify Users</span>
                            </Link>
                            <Link to="/jobs/settings" className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <RefreshCw className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">Job Sync</span>
                            </Link>
                            <Link to="/jobs" className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <Briefcase className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">Browse Jobs</span>
                            </Link>
                            <Link to="/site-settings" className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <MoreHorizontal className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">Site Config</span>
                            </Link>
                        </div>
                    </div>

                    {/* Live Activity Feed */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-[16px] font-extrabold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-[18px] h-[18px] text-gray-700" /> Live System Log
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">Real-time sync and platform events</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {activityStream.map((log) => (
                                <div key={log.id} className="flex items-start gap-4">
                                    <div className="mt-1 relative flex items-center justify-center shrink-0">
                                        {log.type === 'success' ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                        ) : log.type === 'failed' ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-gray-900 truncate">{log.action}</p>
                                        <p className="text-[11px] font-medium text-gray-400 mt-1">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/jobs/settings" className="mt-8 w-full text-center text-[13px] font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 py-3 rounded-2xl transition-all block">
                            View Full Sync Activity
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
