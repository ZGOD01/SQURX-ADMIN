import { useState, useEffect } from 'react';
import {
    Users, Briefcase, CheckCircle,
    Shield, Activity, ArrowUpRight, ArrowDownRight,
    FileCheck, RefreshCw, Database,
    MoreHorizontal
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const INITIAL_LOGIN_DATA = [
    { time: '08:00', login: 120, logout: 10 },
    { time: '10:00', login: 350, logout: 50 },
    { time: '12:00', login: 200, logout: 100 },
    { time: '14:00', login: 400, logout: 120 },
    { time: '16:00', login: 250, logout: 180 },
    { time: '18:00', login: 150, logout: 300 },
    { time: '20:00', login: 80, logout: 150 },
];

const INITIAL_ACTIVITY_STREAM = [
    { id: 1, action: "Approved Student: Alex M.", time: "2m ago", type: "success" },
    { id: 2, action: "New Job: Sr. UX Designer", time: "15m ago", type: "info" },
    { id: 3, action: "Flagged Profile: John D.", time: "1h ago", type: "warning" },
    { id: 4, action: "Updated Auth Policies", time: "3h ago", type: "info" },
    { id: 5, action: "Mass Email: System Maintenance", time: "5h ago", type: "info" }
];

const INITIAL_MODERATION_QUEUE = [
    { id: 'MQ-101', entity: 'TechNova', type: 'Recruiter', status: 'Pending Review', risk: 'Low' },
    { id: 'MQ-102', entity: 'John D.', type: 'Student', status: 'Flagged CV', risk: 'High' },
    { id: 'MQ-103', entity: 'Global Solutions', type: 'Job Post', status: 'Keyword Match', risk: 'Med' },
    { id: 'MQ-104', entity: 'Nexus Inc', type: 'Recruiter', status: 'Pending Review', risk: 'Low' },
];

const StatCard = ({ title, value, icon: Icon, trend, positive }: any) => (
    <div className="bg-white rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-[13px] font-bold text-gray-500">{title}</h3>
            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Icon className="w-[18px] h-[18px] text-gray-700" />
            </div>
        </div>
        <div className="flex items-end justify-between">
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</p>
            {trend && (
                <div className={`flex items-center gap-1 text-[12px] font-bold ${positive ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-50'} px-2 py-1 rounded-xl`}>
                    {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {trend}
                </div>
            )}
        </div>
    </div>
);

export default function DashboardOverview() {
    const [loginData, setLoginData] = useState(INITIAL_LOGIN_DATA);
    const [activityStream] = useState(INITIAL_ACTIVITY_STREAM);
    const [stats, setStats] = useState({
        students: 24192,
        cvs: 1842,
        recruiters: 849,
        jobs: 3214
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSynced, setLastSynced] = useState('Just now');

    useEffect(() => {
        const statsInterval = setInterval(() => {
            setStats(prev => ({
                students: prev.students + Math.floor(Math.random() * 3),
                cvs: prev.cvs + Math.floor(Math.random() * 5),
                recruiters: prev.recruiters + (Math.random() > 0.8 ? 1 : 0),
                jobs: prev.jobs + Math.floor(Math.random() * 2) - Math.floor(Math.random() * 2)
            }));
        }, 3000);

        const chartInterval = setInterval(() => {
            setLoginData(prev => {
                const newData = [...prev];
                const last = newData[newData.length - 1];
                newData[newData.length - 1] = {
                    ...last,
                    login: last.login + Math.floor(Math.random() * 10) - 2,
                    logout: last.logout + Math.floor(Math.random() * 5)
                };
                return newData;
            });
        }, 5000);

        const syncInterval = setInterval(() => {
            const now = new Date();
            setLastSynced(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
        }, 10000);

        return () => {
            clearInterval(statsInterval);
            clearInterval(chartInterval);
            clearInterval(syncInterval);
        };
    }, []);

    const manualRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
        const now = new Date();
        setLastSynced(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    };

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
                        onClick={manualRefresh}
                        className={`p-3 bg-white border border-gray-100 text-gray-600 hover:text-black shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.08)] transition-all focus:outline-none rounded-2xl ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <RefreshCw className={`w-[18px] h-[18px] ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-tr from-gray-900 to-gray-800 text-white text-[13px] font-bold hover:opacity-90 transition-opacity shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl">
                        <Shield className="w-4 h-4" />
                        Review Pending
                        <span className="ml-1 px-2 py-0.5 bg-white/20 text-white text-[11px] rounded-xl font-bold">3</span>
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Registered Students" value={stats.students.toLocaleString()} icon={Users} trend="12% YoY" positive={true} />
                <StatCard title="Updated CVs Today" value={stats.cvs.toLocaleString()} icon={FileCheck} trend="4.2% DoD" positive={true} />
                <StatCard title="Active Recruiters" value={stats.recruiters.toLocaleString()} icon={Briefcase} trend="1.2% MoM" positive={false} />
                <StatCard title="Live Job Openings" value={stats.jobs.toLocaleString()} icon={CheckCircle} trend="18% MoM" positive={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Main Content Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Activity Chart */}
                    <div className="bg-white rounded-3xl p-8 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-[16px] font-extrabold text-gray-900">Platform Traffic</h2>
                                <p className="text-[13px] font-medium text-gray-500 mt-1">Real-time login and logout events</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                                    <span className="text-[12px] font-bold text-gray-600">Logins</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                    <span className="text-[12px] font-bold text-gray-600">Logouts</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={loginData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorLogin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#111827" stopOpacity={0.06} />
                                            <stop offset="95%" stopColor="#111827" stopOpacity={0} />
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
                                    <Area type="monotone" dataKey="logout" stroke="#e5e7eb" fillOpacity={0} strokeWidth={2} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="login" stroke="#111827" fillOpacity={1} fill="url(#colorLogin)" strokeWidth={2} activeDot={{ r: 4, fill: '#111827', strokeWidth: 0 }} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Access Table */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-[16px] font-extrabold text-gray-900">Active Moderation Queue</h2>
                            <button className="text-[13px] font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors">View All</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400">Entity</th>
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400">Type</th>
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400">Status</th>
                                        <th className="px-8 py-4 text-[12px] font-bold text-gray-400 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {INITIAL_MODERATION_QUEUE.map((item, idx) => (
                                        <tr key={item.id} className={`group hover:bg-gray-50/80 transition-colors ${idx !== INITIAL_MODERATION_QUEUE.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                            <td className="px-8 py-4">
                                                <div className="text-[14px] font-bold text-gray-900">{item.entity}</div>
                                                <div className="text-[11px] font-medium text-gray-400 mt-0.5">{item.id}</div>
                                            </td>
                                            <td className="px-8 py-4 text-[13px] font-semibold text-gray-600">{item.type}</td>
                                            <td className="px-8 py-4">
                                                <span className={`inline-flex px-3 py-1 text-[11px] font-bold rounded-xl ${item.risk === 'High' ? 'bg-red-50 text-red-600' : item.risk === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-600'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <button className="text-[13px] font-bold text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-100 px-4 py-2 rounded-xl transition-all shadow-sm">Review</button>
                                            </td>
                                        </tr>
                                    ))}
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
                            <button className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <Users className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">Verify Users</span>
                            </button>
                            <button className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <Database className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">Run Report</span>
                            </button>
                            <button className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <FileCheck className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">Review CVs</span>
                            </button>
                            <button className="p-4 bg-white/5 hover:bg-white/10 transition-colors border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 text-center group">
                                <MoreHorizontal className="w-5 h-5 text-gray-300 group-hover:text-white" />
                                <span className="text-[12px] font-bold text-gray-300 group-hover:text-white">More</span>
                            </button>
                        </div>
                    </div>

                    {/* Minimal Activity Feed */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
                            <h2 className="text-[16px] font-extrabold text-gray-900 flex items-center gap-2">
                                <Activity className="w-[18px] h-[18px] text-gray-400" /> System Log
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {activityStream.map((log) => (
                                <div key={log.id} className="flex items-start gap-4">
                                    <div className="mt-1 relative flex items-center justify-center shrink-0">
                                        <div className={`w-2.5 h-2.5 rounded-full ${log.type === 'success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : log.type === 'warning' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-gray-300'}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-gray-900 truncate">{log.action}</p>
                                        <p className="text-[11px] font-medium text-gray-400 mt-1">{log.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-8 w-full text-center text-[13px] font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 py-3 rounded-2xl transition-all">
                            View Full History
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
