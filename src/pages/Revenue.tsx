import { useState } from 'react';
import {
    DollarSign, TrendingUp, CreditCard, Anchor,
    Download, Filter, ChevronRight, Activity, XCircle,
    CheckCircle, Clock, AlertCircle, ArrowUpRight
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const revenueData = [
    { name: 'Jan', total: 32000, subscriptions: 20000, jobFees: 8000, premium: 4000 },
    { name: 'Feb', total: 38000, subscriptions: 22000, jobFees: 10000, premium: 6000 },
    { name: 'Mar', total: 42000, subscriptions: 25000, jobFees: 9000, premium: 8000 },
    { name: 'Apr', total: 51000, subscriptions: 28000, jobFees: 12000, premium: 11000 },
    { name: 'May', total: 48000, subscriptions: 26000, jobFees: 11000, premium: 11000 },
    { name: 'Jun', total: 59000, subscriptions: 30000, jobFees: 14000, premium: 15000 },
    { name: 'Jul', total: 68000, subscriptions: 35000, jobFees: 15000, premium: 18000 },
];

const subscriptionsList = [
    { id: 'sub_1', plan: 'Enterprise Recruiter', price: '$999/mo', users: 124, renewal: 'Oct 15, 2026', status: 'Active' },
    { id: 'sub_2', plan: 'Pro Recruiter', price: '$499/mo', users: 342, renewal: 'Oct 12, 2026', status: 'Active' },
    { id: 'sub_3', plan: 'Basic Recruiter', price: '$199/mo', users: 890, renewal: 'Oct 10, 2026', status: 'Pending' },
    { id: 'sub_4', plan: 'Enterprise Recruiter', price: '$999/mo', users: 1, renewal: 'Oct 08, 2026', status: 'Canceled' },
    { id: 'sub_5', plan: 'Student Premium (GMI Hook)', price: '$30/mo', users: 1450, renewal: 'Oct 05, 2026', status: 'Active' },
    { id: 'sub_6', plan: 'Pro Recruiter', price: '$499/mo', users: 1, renewal: 'Sep 28, 2026', status: 'Expired' },
];

const paymentHistory = [
    { id: 'inv_1024', client: 'TechCorp Solutions', amount: '$999.00', date: 'Today, 2:45 PM', status: 'Completed' },
    { id: 'inv_1023', client: 'InnovateInc', amount: '$499.00', date: 'Today, 11:20 AM', status: 'Completed' },
    { id: 'inv_1022', client: 'Global Systems', amount: '$199.00', date: 'Yesterday', status: 'Failed' },
    { id: 'inv_1021', client: 'Emma Watson', amount: '$30.00', date: 'Yesterday', status: 'Completed' },
    { id: 'inv_1020', client: 'Nexus Enterprises', amount: '$999.00', date: 'Oct 02, 2026', status: 'Completed' },
];

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Active: 'bg-gray-900 text-white border-transparent',
        Completed: 'bg-gray-900 text-white border-transparent',
        Pending: 'bg-gray-100 text-gray-700 border-gray-200',
        Expired: 'bg-white text-gray-500 border-gray-300 border-dashed',
        Canceled: 'bg-white text-gray-900 border-gray-900 border-dashed',
        Failed: 'bg-white text-gray-900 border-gray-900 border-dashed',
    };

    const icons: Record<string, React.ReactNode> = {
        Active: <CheckCircle className="w-3 h-3 mr-1" />,
        Completed: <CheckCircle className="w-3 h-3 mr-1" />,
        Pending: <Clock className="w-3 h-3 mr-1" />,
        Expired: <Activity className="w-3 h-3 mr-1" />,
        Canceled: <XCircle className="w-3 h-3 mr-1" />,
        Failed: <AlertCircle className="w-3 h-3 mr-1" />,
    };

    return (
        <span className={cn("inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded border", styles[status] || styles.Pending)}>
            {icons[status]}
            {status}
        </span>
    );
};

export default function Revenue() {
    const [timeframe, setTimeframe] = useState('monthly');

    return (
        <div className="max-w-[1400px] mx-auto pb-12 space-y-8">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Revenue & Subscriptions</h1>
                    <p className="text-gray-500 text-sm mt-1">Financial overview, subscription health, and transaction history.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setTimeframe('monthly')}
                            className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors", timeframe === 'monthly' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setTimeframe('quarterly')}
                            className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors", timeframe === 'quarterly' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                        >
                            Quarterly
                        </button>
                        <button
                            onClick={() => setTimeframe('yearly')}
                            className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors", timeframe === 'yearly' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                        >
                            Yearly
                        </button>
                    </div>
                    <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export Report</span>
                    </button>
                </div>
            </div>

            {/* High-Impact GMI Hook Notice */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-800">
                <div className="flex items-start gap-5">
                    <div className="h-12 w-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                        <Anchor className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-lg font-bold tracking-tight">GMI Hook Offering</h2>
                            <span className="px-2 py-0.5 text-xs font-bold bg-white text-gray-900 rounded uppercase tracking-wider">Premium Student Service</span>
                        </div>
                        <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
                            The flagship <strong className="text-white font-medium">₹2,530 / $30</strong> student tier is driving core engagement. Guided Mentoring & Interview prep tracks are currently contributing to <strong className="text-white font-medium">26%</strong> of total monthly revenue.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                    <p className="text-sm font-medium text-gray-400 mb-1">Monthly GMI Revenue</p>
                    <div className="flex items-end gap-2 text-3xl font-bold tracking-tight">
                        $18,450 <span className="text-sm text-gray-400 font-medium mb-1.5 line-through">₹1,568,250</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col relative group hover:border-gray-300 transition-colors">
                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Monthly Income</h3>
                            <DollarSign className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900 tracking-tight">$68,450</span>
                            <span className="text-sm font-semibold text-gray-900 mb-1 flex items-center"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> 14%</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100">
                        <div className="h-full bg-gray-900 w-[70%]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col relative group hover:border-gray-300 transition-colors">
                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Recruiter Subscriptions</h3>
                            <CreditCard className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900 tracking-tight">$35,000</span>
                            <span className="text-sm font-semibold text-gray-500 mb-1">51% of rev</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100">
                        <div className="h-full bg-gray-400 w-[51%]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col relative group hover:border-gray-300 transition-colors">
                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Job Posting Fees</h3>
                            <TrendingUp className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900 tracking-tight">$15,000</span>
                            <span className="text-sm font-semibold text-gray-500 mb-1 flex items-center"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> 2.4%</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100">
                        <div className="h-full bg-gray-300 w-[23%]"></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col relative group hover:border-gray-300 transition-colors">
                    <div className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Student Premium</h3>
                            <Anchor className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-bold text-gray-900 tracking-tight">$18,450</span>
                            <span className="text-sm font-semibold text-gray-900 mb-1 flex items-center"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> 32%</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100">
                        <div className="h-full bg-gray-900 w-[26%]"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Revenue Trend</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Monthly breakdown by revenue stream.</p>
                        </div>
                        <div className="flex items-center gap-4 border border-gray-200 rounded-lg p-1">
                            <div className="flex items-center gap-2 px-2 py-1">
                                <div className="w-2.5 h-2.5 rounded-sm bg-gray-900"></div>
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Subs</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1">
                                <div className="w-2.5 h-2.5 rounded-sm bg-gray-400"></div>
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Jobs</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1">
                                <div className="w-2.5 h-2.5 rounded-sm bg-gray-200"></div>
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Premium</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    itemStyle={{ color: '#111827', fontWeight: 600, fontSize: '14px' }}
                                    cursor={{ fill: '#f9fafb' }}
                                />
                                <Bar dataKey="subscriptions" stackId="a" fill="#111827" radius={[0, 0, 4, 4]} barSize={32} />
                                <Bar dataKey="premium" stackId="a" fill="#9ca3af" barSize={32} />
                                <Bar dataKey="jobFees" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment History sidebar */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Recent Transactions</h2>
                        </div>
                        <button className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <div className="divide-y divide-gray-100">
                            {paymentHistory.map((payment) => (
                                <div key={payment.id} className="p-5 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-semibold text-gray-900 group-hover:underline decoration-gray-300 underline-offset-2">{payment.client}</p>
                                        <p className="text-sm font-bold text-gray-900">{payment.amount}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center text-xs text-gray-500 font-medium">
                                            <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 mr-2 text-gray-600">{payment.id}</span>
                                            {payment.date}
                                        </div>
                                        <StatusBadge status={payment.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <button className="w-full py-2 flex items-center justify-center text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                            View All Transactions <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Subscription Plans Overview</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Performance of all active billing tiers.</p>
                    </div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-900 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                        Manage Plans
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan Name</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Active Users</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Next Renewal (Avg)</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status Overview</th>
                                <th scope="col" className="relative px-6 py-4 text-right"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {subscriptionsList.map((sub) => (
                                <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center border",
                                                sub.plan.includes('Enterprise') ? "bg-gray-900 border-gray-900 text-white" : "bg-gray-50 border-gray-200 text-gray-700"
                                            )}>
                                                {sub.plan.includes('GMI') ? <Anchor className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 group-hover:underline decoration-gray-300 underline-offset-2">{sub.plan}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-semibold text-gray-700">{sub.price}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-900 font-medium">{sub.users.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                        {sub.renewal}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={sub.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-900 hover:underline font-semibold text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
