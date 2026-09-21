import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users, TrendingUp, Download,
    Calendar, ChevronDown, Database, Activity,
    Briefcase, CheckCircle, Clock, RefreshCw, AlertCircle,
    Building2, Globe, Award
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { API_BASE_URL } from '../config/api';
import type { SyncLogItem, JobStats } from '../types/jobsAdmin';

interface EducationItem {
    university?: string | { name?: string };
    education?: string | { name?: string };
    course?: string | { name?: string };
    specialization?: string | { name?: string };
    startYear?: number;
    endYear?: number;
}

interface UserProfile {
    _id: string;
    fullName?: string;
    email?: string;
    role: 'student' | 'recruiter' | 'consultation' | string;
    isVerified?: boolean;
    isActive?: boolean;
    educationHistory?: EducationItem[];
    expectedSalary?: {
        amount?: number | string;
        currency?: string | { code?: string; symbol?: string; name?: string };
    };
    currentSalary?: {
        amount?: number | string;
    };
    skills?: unknown[];
    createdAt?: string;
    updatedAt?: string;
}

interface JobRecord {
    _id: string;
    title: string;
    organization?: string;
    workArrangement?: unknown;
    experienceLevel?: unknown;
    keySkills?: unknown[];
    taxonomiesA?: unknown[];
    datePosted?: string;
    status: 'active' | 'expired' | string;
}

interface LookupItem {
    _id: string;
    name: string;
    isActive?: boolean;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';
type SegmentTab = 'student' | 'recruiter';

const COLORS = ['#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB'];

function safeString(val: unknown): string {
    if (val == null) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
        const obj = val as Record<string, unknown>;
        if (typeof obj.name === 'string') return obj.name.trim();
        if (typeof obj.skill === 'string') return obj.skill.trim();
        if (typeof obj.title === 'string') return obj.title.trim();
        if (typeof obj.label === 'string') return obj.label.trim();
        if (typeof obj.code === 'string') return obj.code.trim();
    }
    return '';
}

function getHeaders(): HeadersInit {
    return {
        'Authorization': `Bearer ${sessionStorage.getItem('adminToken') || ''}`,
        'Content-Type': 'application/json'
    };
}

export default function Analytics() {
    // ── State ─────────────────────────────────────────────────────────────
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [recruiters, setRecruiters] = useState<UserProfile[]>([]);
    const [jobs, setJobs] = useState<JobRecord[]>([]);
    const [jobStats, setJobStats] = useState<JobStats>({ active: 0, expired: 0 });
    const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
    const [skillsLookup, setSkillsLookup] = useState<LookupItem[]>([]);
    const [universitiesLookup, setUniversitiesLookup] = useState<LookupItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('Syncing...');

    const [activeSegment, setActiveSegment] = useState<SegmentTab>('student');
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [showRangeDropdown, setShowRangeDropdown] = useState(false);

    // ── Live Fetching ────────────────────────────────────────────────────
    const fetchAnalyticsData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);
        setError(null);

        try {
            const studentsPromise = fetch(`${API_BASE_URL}/admin/users?role=student&limit=1000`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const recruitersPromise = fetch(`${API_BASE_URL}/admin/users?role=recruiter&limit=1000`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const jobsPromise = fetch(`${API_BASE_URL}/admin/jobs?limit=500`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const statsPromise = fetch(`${API_BASE_URL}/admin/jobs/stats`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const syncLogsPromise = fetch(`${API_BASE_URL}/admin/jobs/sync-logs?limit=50`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const skillsPromise = fetch(`${API_BASE_URL}/admin/skills`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const univPromise = fetch(`${API_BASE_URL}/admin/universities`, { headers: getHeaders() })
                .then(r => r.json())
                .catch(() => null);

            const [studentsRes, recruitersRes, jobsRes, statsRes, logsRes, skillsRes, univRes] = await Promise.all([
                studentsPromise,
                recruitersPromise,
                jobsPromise,
                statsPromise,
                syncLogsPromise,
                skillsPromise,
                univPromise
            ]);

            // Parse Students
            if (studentsRes?.success) {
                const list = Array.isArray(studentsRes.data)
                    ? studentsRes.data
                    : (studentsRes.data?.docs || studentsRes.data?.users || studentsRes.data?.data || []);
                setStudents(list);
            }

            // Parse Recruiters
            if (recruitersRes?.success) {
                const list = Array.isArray(recruitersRes.data)
                    ? recruitersRes.data
                    : (recruitersRes.data?.docs || recruitersRes.data?.users || recruitersRes.data?.data || []);
                setRecruiters(list);
            }

            // Parse Jobs
            if (jobsRes?.success && jobsRes.data) {
                const jobList = Array.isArray(jobsRes.data?.jobs)
                    ? jobsRes.data.jobs
                    : (Array.isArray(jobsRes.data) ? jobsRes.data : []);
                setJobs(jobList);
            }

            // Parse Job Stats
            if (statsRes?.success && statsRes.data) {
                setJobStats({
                    active: statsRes.data.active ?? 0,
                    expired: statsRes.data.expired ?? 0
                });
            }

            // Parse Sync Logs
            if (logsRes?.success && Array.isArray(logsRes.data)) {
                setSyncLogs(logsRes.data);
            }

            // Parse Skills Lookup
            if (skillsRes?.success && Array.isArray(skillsRes.data)) {
                setSkillsLookup(skillsRes.data);
            }

            // Parse Universities Lookup
            if (univRes?.success && Array.isArray(univRes.data)) {
                setUniversitiesLookup(univRes.data);
            }

            const now = new Date();
            setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch {
            setError('Failed to fetch real-time analytics data. Please verify your connection.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
        const timer = setInterval(() => fetchAnalyticsData(), 45000);
        return () => clearInterval(timer);
    }, [fetchAnalyticsData]);

    // ── Time Cutoff Computation ──────────────────────────────────────────
    const cutoffDate = useMemo(() => {
        const now = new Date();
        if (timeRange === '7d') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (timeRange === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (timeRange === '90d') return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return new Date(0);
    }, [timeRange]);

    // ── Dynamic Student Metrics ─────────────────────────────────────────
    const filteredStudents = useMemo(() => {
        if (timeRange === 'all') return students;
        return students.filter(s => {
            if (!s.createdAt) return true;
            return new Date(s.createdAt) >= cutoffDate;
        });
    }, [students, cutoffDate, timeRange]);

    const totalStudents = students.length;
    const periodStudentsCount = filteredStudents.length;
    const verifiedStudentsCount = students.filter(s => s.isVerified).length;
    const activeStudentsCount = students.filter(s => s.isActive !== false).length;
    const verificationRate = totalStudents > 0 ? ((verifiedStudentsCount / totalStudents) * 100).toFixed(1) : '0';
    const activeCandidateRate = totalStudents > 0 ? ((activeStudentsCount / totalStudents) * 100).toFixed(1) : '0';

    const recentUpdatesCount = useMemo(() => {
        return students.filter(s => {
            const ts = s.updatedAt || s.createdAt;
            return ts ? new Date(ts) >= cutoffDate : false;
        }).length;
    }, [students, cutoffDate]);

    const completenessStats = useMemo(() => {
        if (totalStudents === 0) return { withEduRate: 0, withSalaryRate: 0, avgEduEntries: 0 };
        const withEdu = students.filter(s => s.educationHistory && s.educationHistory.length > 0).length;
        const withSalary = students.filter(s => s.expectedSalary?.amount != null && String(s.expectedSalary.amount).trim() !== '').length;
        const totalEduEntries = students.reduce((acc, s) => acc + (s.educationHistory?.length || 0), 0);

        return {
            withEduRate: Math.round((withEdu / totalStudents) * 100),
            withSalaryRate: Math.round((withSalary / totalStudents) * 100),
            avgEduEntries: (totalEduEntries / totalStudents).toFixed(1)
        };
    }, [students, totalStudents]);

    // ── Dynamic Activity Curve ──────────────────────────────────────────
    const studentTrendData = useMemo(() => {
        const numBuckets = timeRange === '7d' ? 7 : timeRange === '30d' ? 6 : 8;
        const now = Date.now();
        const durationMs = timeRange === '7d'
            ? 7 * 86400000
            : timeRange === '30d'
                ? 30 * 86400000
                : timeRange === '90d'
                    ? 90 * 86400000
                    : Math.max(now - new Date(students[0]?.createdAt || now - 30 * 86400000).getTime(), 30 * 86400000);

        const bucketSize = durationMs / numBuckets;
        const buckets: { time: string; registrations: number; updates: number }[] = [];

        for (let i = 0; i < numBuckets; i++) {
            const bucketStart = new Date(now - durationMs + (i * bucketSize));
            const bucketEnd = new Date(now - durationMs + ((i + 1) * bucketSize));

            let dateLabel = '';
            if (timeRange === '7d') {
                dateLabel = bucketStart.toLocaleDateString(undefined, { weekday: 'short' });
            } else {
                dateLabel = bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }

            let regCount = 0;
            let updateCount = 0;

            students.forEach(s => {
                if (s.createdAt) {
                    const ct = new Date(s.createdAt).getTime();
                    if (ct >= bucketStart.getTime() && ct < bucketEnd.getTime()) {
                        regCount++;
                    }
                }
                if (s.updatedAt) {
                    const ut = new Date(s.updatedAt).getTime();
                    if (ut >= bucketStart.getTime() && ut < bucketEnd.getTime()) {
                        updateCount++;
                    }
                }
            });

            buckets.push({
                time: dateLabel,
                registrations: regCount,
                updates: updateCount
            });
        }

        return buckets;
    }, [students, timeRange]);

    // ── Dynamic Skills Demand ───────────────────────────────────────────
    const skillsChartData = useMemo(() => {
        const freq: Record<string, number> = {};

        jobs.forEach(job => {
            if (Array.isArray(job.keySkills)) {
                job.keySkills.forEach(skill => {
                    const cleaned = safeString(skill);
                    if (cleaned) {
                        freq[cleaned] = (freq[cleaned] || 0) + 1;
                    }
                });
            }
        });

        // Also count any skills candidates have explicitly recorded
        students.forEach(s => {
            if (Array.isArray(s.skills)) {
                s.skills.forEach(skill => {
                    const cleaned = safeString(skill);
                    if (cleaned) {
                        freq[cleaned] = (freq[cleaned] || 0) + 1;
                    }
                });
            }
        });

        // If active jobs have keySkills, sort descending
        const sorted = Object.entries(freq)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        if (sorted.length > 0) return sorted;

        // Fallback: If no skills found on jobs, display active skills from database lookup
        return skillsLookup.slice(0, 5).map(item => ({
            name: safeString(item.name) || 'Skill',
            value: 1
        }));
    }, [jobs, students, skillsLookup]);

    // ── Dynamic University Distribution ─────────────────────────────────
    const universityChartData = useMemo(() => {
        const freq: Record<string, number> = {};

        students.forEach(s => {
            if (Array.isArray(s.educationHistory)) {
                s.educationHistory.forEach(edu => {
                    const uName = safeString(edu.university) || safeString(edu.education) || safeString(edu.course);
                    if (uName) {
                        freq[uName] = (freq[uName] || 0) + 1;
                    }
                });
            }
        });

        const sorted = Object.entries(freq)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        if (sorted.length > 0) return sorted;

        // Fallback: Use registered universities from SiteSettings lookup
        return universitiesLookup.slice(0, 4).map(u => ({
            name: safeString(u.name) || 'Institution',
            value: 1
        }));
    }, [students, universitiesLookup]);

    // ── Dynamic Recruiter Metrics ───────────────────────────────────────
    const totalRecruiters = recruiters.length;
    const activeRecruitersCount = recruiters.filter(r => r.isActive !== false).length;
    const verifiedRecruitersCount = recruiters.filter(r => r.isVerified).length;
    const successfulSyncs = syncLogs.filter(l => l.status === 'success').length;
    const syncSuccessRate = syncLogs.length > 0 ? Math.round((successfulSyncs / syncLogs.length) * 100) : 100;

    // Work arrangement breakdown from live jobs
    const workArrangementData = useMemo(() => {
        const counts: Record<string, number> = { Remote: 0, Hybrid: 0, 'On-site': 0 };
        jobs.forEach(j => {
            const arr = safeString(j.workArrangement).toLowerCase();
            if (arr.includes('remote')) counts.Remote++;
            else if (arr.includes('hybrid')) counts.Hybrid++;
            else if (arr.includes('site') || arr.includes('office') || arr.includes('in-person')) counts['On-site']++;
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [jobs]);

    // Experience level breakdown from live jobs
    const experienceData = useMemo(() => {
        const counts: Record<string, number> = {};
        jobs.forEach(j => {
            const lvl = safeString(j.experienceLevel) || 'Unspecified';
            counts[lvl] = (counts[lvl] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return sorted.length > 0 ? sorted : [{ name: 'Standard Openings', value: jobStats.active || 1 }];
    }, [jobs, jobStats.active]);

    // Job Sync Volume Timeline
    const syncTrendData = useMemo(() => {
        return syncLogs.slice(0, 7).reverse().map((log, idx) => {
            const timeStr = log.startedAt
                ? new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : `Batch ${idx + 1}`;
            return {
                time: timeStr,
                fetched: log.jobsFetched || 0,
                upserted: log.jobsUpserted || 0
            };
        });
    }, [syncLogs]);

    // ── Export CSV Handler ───────────────────────────────────────────────
    const handleExportCSV = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        let csvContent = 'data:text/csv;charset=utf-8,';

        csvContent += `Squrx Analytics Report - ${timestamp}\n\n`;
        csvContent += `Metric,Value\n`;
        csvContent += `Total Students,${totalStudents}\n`;
        csvContent += `Verified Students,${verifiedStudentsCount} (${verificationRate}%)\n`;
        csvContent += `Active Candidate Accounts,${activeStudentsCount} (${activeCandidateRate}%)\n`;
        csvContent += `Recent Profile Activity (${timeRange}),${recentUpdatesCount}\n`;
        csvContent += `Total Recruiters,${totalRecruiters}\n`;
        csvContent += `Active Recruiters,${activeRecruitersCount}\n`;
        csvContent += `Live Job Openings,${jobStats.active}\n`;
        csvContent += `Expired Job Openings,${jobStats.expired}\n`;
        csvContent += `Sync Batch Success Rate,${syncSuccessRate}%\n\n`;

        csvContent += `Top Skills Demand\nSkill,Job Requirements Count\n`;
        skillsChartData.forEach(item => {
            csvContent += `"${item.name}",${item.value}\n`;
        });

        csvContent += `\nUniversity / Academic Distribution\nInstitution,Candidates Count\n`;
        universityChartData.forEach(item => {
            csvContent += `"${item.name}",${item.value}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `squrx-analytics-${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const timeRangeLabels: Record<TimeRange, string> = {
        '7d': 'Last 7 Days',
        '30d': 'Last 30 Days',
        '90d': 'Last 90 Days',
        all: 'All Time'
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-500 pt-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Growth & Analytics</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full bg-green-500 rounded-full opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <p className="text-[13px] text-gray-500 font-semibold">
                            Live Database Engine <span className="mx-1 text-gray-300">•</span> Last updated: {lastUpdated}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Live Refresh Button */}
                    <button
                        onClick={() => fetchAnalyticsData(true)}
                        disabled={isRefreshing}
                        title="Refresh live metrics"
                        className={`p-3 bg-white border border-gray-100 text-gray-600 hover:text-black shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all rounded-2xl cursor-pointer ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Time Range Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowRangeDropdown(!showRangeDropdown)}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                        >
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {timeRangeLabels[timeRange]}
                            <ChevronDown className="w-4 h-4 ml-1 text-gray-400" />
                        </button>

                        {showRangeDropdown && (
                            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-gray-100 py-1.5 z-20">
                                {(['7d', '30d', '90d', 'all'] as TimeRange[]).map(key => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setTimeRange(key);
                                            setShowRangeDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-[13px] font-bold transition-colors cursor-pointer ${timeRange === key ? 'bg-gray-50 text-gray-900 font-extrabold' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {timeRangeLabels[key]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Export Document Button */}
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        <Download className="w-4 h-4" /> Export CSV Report
                    </button>
                </div>
            </div>

            {/* Error Notification Banner */}
            {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-700 text-[13px] font-semibold">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Segment Controls */}
            <div className="flex bg-gray-100/70 p-1.5 rounded-2xl w-max mb-8 border border-gray-100">
                <button
                    onClick={() => setActiveSegment('student')}
                    className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${activeSegment === 'student' ? 'bg-white shadow-sm border border-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Student Intel
                </button>
                <button
                    onClick={() => setActiveSegment('recruiter')}
                    className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${activeSegment === 'recruiter' ? 'bg-white shadow-sm border border-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Recruiter Heatmap
                </button>
            </div>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW 1: STUDENT INTEL                                          */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeSegment === 'student' && (
                <div className="space-y-6">

                    {/* Top 4 Live KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Registered Students</h3>
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Users className="w-[18px] h-[18px] text-gray-700" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-gray-900 leading-none">{totalStudents.toLocaleString()}</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2">
                                    {periodStudentsCount} joined in {timeRangeLabels[timeRange]}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Verified Profiles</h3>
                                <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                                    <CheckCircle className="w-[18px] h-[18px] text-green-600" />
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-extrabold text-gray-900 leading-none">{verifiedStudentsCount.toLocaleString()}</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-2">{verificationRate}% verification rate</p>
                                </div>
                                <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-xl">
                                    Active
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Recent Profile Updates</h3>
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Database className="w-[18px] h-[18px] text-gray-700" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-gray-900 leading-none">{recentUpdatesCount.toLocaleString()}</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2">Active in {timeRangeLabels[timeRange]}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Active Account Ratio</h3>
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <TrendingUp className="w-[18px] h-[18px] text-gray-700" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-gray-900 leading-none">{activeCandidateRate}%</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2">{activeStudentsCount} enabled student accounts</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Charts Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Dynamic Activity Curve */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-[16px] font-extrabold text-gray-900">Student Onboarding & Activity Trend</h2>
                                    <p className="text-[13px] font-medium text-gray-500 mt-1">
                                        Chronological registrations and updates ({timeRangeLabels[timeRange]})
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                        <span className="text-[12px] font-bold text-gray-600">Registrations</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-[12px] font-bold text-gray-600">Updates</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={studentTrendData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#111827" stopOpacity={0.08} />
                                                <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorUpd" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.08} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                            itemStyle={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}
                                            labelStyle={{ fontSize: '11px', color: '#6B7280', fontWeight: 600 }}
                                        />
                                        <Area type="monotone" name="Registrations" dataKey="registrations" stroke="#111827" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReg)" />
                                        <Area type="monotone" name="Profile Updates" dataKey="updates" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUpd)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Dynamic Skills BarChart */}
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-[16px] font-extrabold text-gray-900">Top Technical Skills</h2>
                                    <p className="text-[13px] font-medium text-gray-500 mt-1">Aggregated from active job openings</p>
                                </div>
                                <Award className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="flex-1 w-full min-h-[250px] relative">
                                {skillsChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={skillsChartData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} width={80} />
                                            <Tooltip
                                                cursor={{ fill: '#f9fafb' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                            />
                                            <Bar dataKey="value" name="Job Demands" fill="#111827" radius={[0, 8, 8, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center text-gray-400 text-[13px]">
                                        No skill occurrences recorded in active jobs yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: University Origins & Profile Quality */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* University Origins */}
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="w-full sm:w-1/2">
                                <h2 className="text-[16px] font-extrabold text-gray-900">University Origins</h2>
                                <p className="text-[13px] font-medium text-gray-500 mt-1 mb-6">Candidate academic institutions</p>
                                <div className="space-y-3.5">
                                    {universityChartData.map((item, _idx) => (
                                        <div key={item.name} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[_idx % COLORS.length] }}></div>
                                            <div className="flex-1 flex justify-between">
                                                <span className="text-[13px] font-bold text-gray-900 truncate max-w-[150px]" title={item.name}>{item.name}</span>
                                                <span className="text-[13px] font-semibold text-gray-500">{item.value} students</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full sm:w-1/2 h-[220px]">
                                {universityChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={universityChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                                {universityChartData.map((_, _idx) => (
                                                    <Cell key={`cell-${_idx}`} fill={COLORS[_idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center text-gray-400 text-[13px]">
                                        Pending candidate education entries
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Quality & Completeness Ratios */}
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col justify-center">
                            <h2 className="text-[16px] font-extrabold text-gray-900 mb-2">Profile Completeness Ratios</h2>
                            <p className="text-[13px] font-medium text-gray-500 mb-8">Direct metrics computed from candidate profile database records</p>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Education Added</p>
                                    <p className="text-3xl font-extrabold text-gray-900">{completenessStats.withEduRate}%</p>
                                    <p className="text-[11px] text-gray-400 mt-1">CV records</p>
                                </div>
                                <div className="border-x border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Salary Intent</p>
                                    <p className="text-3xl font-extrabold text-gray-900">{completenessStats.withSalaryRate}%</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Expectation set</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Avg Academic Logs</p>
                                    <p className="text-3xl font-extrabold text-gray-900">{completenessStats.avgEduEntries}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Entries / user</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* VIEW 2: RECRUITER & MARKET HEATMAP                            */}
            {/* ───────────────────────────────────────────────────────────── */}
            {activeSegment === 'recruiter' && (
                <div className="space-y-6">

                    {/* Top 4 Live Recruiter KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Registered Recruiters</h3>
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Building2 className="w-[18px] h-[18px] text-gray-700" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-gray-900 leading-none">{totalRecruiters.toLocaleString()}</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2">{activeRecruitersCount} active recruiter accounts</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Live Fantastic.jobs</h3>
                                <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center">
                                    <Briefcase className="w-[18px] h-[18px] text-green-600" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-gray-900 leading-none">{jobStats.active.toLocaleString()}</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2">Currently available to candidates</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Historical / Expired Jobs</h3>
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Clock className="w-[18px] h-[18px] text-gray-700" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-gray-900 leading-none">{jobStats.expired.toLocaleString()}</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2">Archived sync ingestions</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[13px] font-bold text-gray-500">Sync Pipeline Health</h3>
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Activity className="w-[18px] h-[18px] text-gray-700" />
                                </div>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-gray-900 leading-none">{syncSuccessRate}%</p>
                                <p className="text-[11px] font-medium text-gray-400 mt-2">Batch success reliability</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Sync Ingestion Chart & Work Arrangements */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Job Ingestion Volume */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-[16px] font-extrabold text-gray-900">Sync Batch Throughput</h2>
                                    <p className="text-[13px] font-medium text-gray-500 mt-1">Jobs fetched & stored per sync execution</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                        <span className="text-[12px] font-bold text-gray-600">Fetched</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-[12px] font-bold text-gray-600">Stored</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {syncTrendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={syncTrendData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorFetched" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#111827" stopOpacity={0.08} />
                                                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorUpserted" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.08} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: '1px solid #f3f4f6', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                            />
                                            <Area type="monotone" name="Fetched" dataKey="fetched" stroke="#111827" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFetched)" />
                                            <Area type="monotone" name="Stored / Updated" dataKey="upserted" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUpserted)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-center text-gray-400 text-[13px]">
                                        No sync batches executed yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Work Arrangement Distribution */}
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-[16px] font-extrabold text-gray-900">Work Arrangements</h2>
                                    <p className="text-[13px] font-medium text-gray-500 mt-1">Distribution across live postings</p>
                                </div>
                                <Globe className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1 w-full min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={workArrangementData} layout="vertical" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} width={80} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                        />
                                        <Bar dataKey="value" name="Openings" fill="#111827" radius={[0, 8, 8, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Row: Experience Breakdown & Pipeline Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Experience Level Breakdown */}
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="w-full sm:w-1/2">
                                <h2 className="text-[16px] font-extrabold text-gray-900">Experience Levels</h2>
                                <p className="text-[13px] font-medium text-gray-500 mt-1 mb-6">Candidate seniority requirements</p>
                                <div className="space-y-3.5">
                                    {experienceData.map((item, _idx) => (
                                        <div key={item.name} className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[_idx % COLORS.length] }}></div>
                                            <div className="flex-1 flex justify-between">
                                                <span className="text-[13px] font-bold text-gray-900">{item.name}</span>
                                                <span className="text-[13px] font-semibold text-gray-500">{item.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-full sm:w-1/2 h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={experienceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                                            {experienceData.map((_, _idx) => (
                                                <Cell key={`cell-exp-${_idx}`} fill={COLORS[_idx % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recruiter & Job Sync Performance Card */}
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col justify-center">
                            <h2 className="text-[16px] font-extrabold text-gray-900 mb-2">Market & Ingestion Efficiency</h2>
                            <p className="text-[13px] font-medium text-gray-500 mb-8">Performance metrics from live sync logs and recruiter profiles</p>

                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Verified Recruiters</p>
                                    <p className="text-3xl font-extrabold text-gray-900">{verifiedRecruitersCount}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Confirmed companies</p>
                                </div>
                                <div className="border-x border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sync Batches</p>
                                    <p className="text-3xl font-extrabold text-gray-900">{syncLogs.length}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Logged executions</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Live / Total Jobs</p>
                                    <p className="text-3xl font-extrabold text-gray-900">
                                        {jobStats.active + jobStats.expired > 0 ? Math.round((jobStats.active / (jobStats.active + jobStats.expired)) * 100) : 0}%
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-1">Active ratio</p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* Subtle Loading Spinner Overlay on first load */}
            {loading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-gray-900" />
                        <p className="text-[13px] font-bold text-gray-700">Connecting to live analytics engine...</p>
                    </div>
                </div>
            )}

        </div>
    );
}
