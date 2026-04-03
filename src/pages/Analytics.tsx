import {
    Users, TrendingUp, Download,
    Calendar, ChevronDown, Database, Activity
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const STUDENT_LOGIN_DATA = [
    { time: '00:00', active: 15 },
    { time: '04:00', active: 8 },
    { time: '08:00', active: 120 },
    { time: '12:00', active: 310 },
    { time: '16:00', active: 280 },
    { time: '20:00', active: 180 },
    { time: '23:59', active: 45 },
];

const SKILL_DATA = [
    { name: 'React', value: 850 },
    { name: 'Python', value: 620 },
    { name: 'Node.js', value: 480 },
    { name: 'UX Design', value: 320 },
    { name: 'Data', value: 210 },
];

const UNIV_DATA = [
    { name: 'Stanford', value: 400 },
    { name: 'MIT', value: 300 },
    { name: 'Harvard', value: 300 },
    { name: 'UCB', value: 200 },
];

const COLORS = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];

const STAT_CARD_CLASSES = "bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300";

export default function Analytics() {
    return (
        <div className="max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-500 pt-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Growth & Analytics</h1>
                    <p className="text-[14px] font-medium text-gray-500 mt-2">Comprehensive demographic and behavioral data.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl hover:bg-gray-50 transition-all group">
                        <Calendar className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" /> Last 30 Days <ChevronDown className="w-4 h-4 ml-2" />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:opacity-90 transition-opacity">
                        <Download className="w-4 h-4" /> Export Document
                    </button>
                </div>
            </div>

            {/* Segment Controls */}
            <div className="flex bg-gray-100/50 p-1.5 rounded-2xl w-max mb-8 border border-gray-100">
                <button className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-white shadow-sm border border-gray-100 text-gray-900">
                    Student Intel
                </button>
                <button className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                    Recruiter Heatmap
                </button>
            </div>

            {/* --- STUDENT ANALYTICS --- */}
            <div className="space-y-6">

                {/* Top KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className={STAT_CARD_CLASSES}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[13px] font-bold text-gray-500">Registered Students</h3>
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center"><Users className="w-[18px] h-[18px] text-gray-700" /></div>
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900">24,192</p>
                    </div>
                    <div className={STAT_CARD_CLASSES}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[13px] font-bold text-gray-500">Current Sessions</h3>
                            <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center"><Activity className="w-[18px] h-[18px] text-green-600" /></div>
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900">1,204</p>
                    </div>
                    <div className={STAT_CARD_CLASSES}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[13px] font-bold text-gray-500">Profile Updates (24h)</h3>
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center"><Database className="w-[18px] h-[18px] text-gray-700" /></div>
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900">842</p>
                    </div>
                    <div className={STAT_CARD_CLASSES}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[13px] font-bold text-gray-500">Monthly Growth</h3>
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center"><TrendingUp className="w-[18px] h-[18px] text-gray-700" /></div>
                        </div>
                        <p className="text-3xl font-extrabold text-gray-900">+12.4%</p>
                    </div>
                </div>

                {/* Main Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Session Activity Curve */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-[16px] font-extrabold text-gray-900">Global Session Traffic</h2>
                                <p className="text-[13px] font-medium text-gray-500 mt-1">Average user volume by hour (UTC)</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={STUDENT_LOGIN_DATA} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#111827" stopOpacity={0.08} />
                                            <stop offset="95%" stopColor="#111827" stopOpacity={0} />
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
                                    <Area type="monotone" dataKey="active" stroke="#111827" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Skill Distribution */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col">
                        <h2 className="text-[16px] font-extrabold text-gray-900">Top Technical Skills</h2>
                        <p className="text-[13px] font-medium text-gray-500 mt-1 mb-8">Aggregated from verified resumes</p>

                        <div className="flex-1 w-full min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={SKILL_DATA} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} width={70} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgb(0,0,0,0.08)' }}
                                    />
                                    <Bar dataKey="value" fill="#111827" radius={[0, 8, 8, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: University & Demographics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex items-center justify-between">
                        <div className="w-1/2">
                            <h2 className="text-[16px] font-extrabold text-gray-900">University Origins</h2>
                            <p className="text-[13px] font-medium text-gray-500 mt-1 mb-6">Top tier institutions</p>
                            <div className="space-y-4">
                                {UNIV_DATA.map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <div className="flex-1 flex justify-between">
                                            <span className="text-[13px] font-bold text-gray-900">{item.name}</span>
                                            <span className="text-[13px] font-semibold text-gray-500">{item.value.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-1/2 h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={UNIV_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                        {UNIV_DATA.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-6 justify-center">
                            <div className="text-center">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Avg. CV Score</p>
                                <p className="text-4xl font-extrabold text-gray-900">84<span className="text-2xl text-gray-400">/100</span></p>
                            </div>
                            <div className="w-px h-16 bg-gray-100"></div>
                            <div className="text-center">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Avg. Session Time</p>
                                <p className="text-4xl font-extrabold text-gray-900">14<span className="text-2xl text-gray-400">m</span></p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
