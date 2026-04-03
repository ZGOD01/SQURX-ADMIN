import { useState } from 'react';
import {
    ShieldAlert, CheckCircle, Search, Filter,
    AlertTriangle, CheckSquare, XCircle
} from 'lucide-react';

const policySettings = [
    { id: '1', name: 'Strict Keyword Filtering', status: 'Enabled', type: 'System' },
    { id: '2', name: 'Manual CV Assessment', status: 'Enabled', type: 'Workflow' },
    { id: '3', name: 'Auto-Reject 0% Profiles', status: 'Disabled', type: 'Automation' },
    { id: '4', name: 'Enforce T&C Checkbox', status: 'Enabled', type: 'Compliance' },
];

const MODERATION_QUEUE = [
    { id: 'MOD-092', user: 'Alex Mercer', type: 'Resume', issue: 'Failed Keyword Filter', severity: 'High', date: '10m ago', flag: 'Manual Review Needed' },
    { id: 'MOD-093', user: 'TechNova', type: 'Job Post', issue: 'Suspicious Salary Format', severity: 'Medium', date: '45m ago', flag: 'AI Flagged' },
    { id: 'MOD-094', user: 'Sarah Chen', type: 'Profile', issue: 'Incomplete Required Fields', severity: 'Low', date: '2h ago', flag: 'System Warning' },
];

export default function Moderation() {
    const [searchTerm, setSearchTerm] = useState('');
    const [policies, setPolicies] = useState(policySettings);

    const togglePolicy = (id: string) => {
        setPolicies(policies.map(p =>
            p.id === id ? { ...p, status: p.status === 'Enabled' ? 'Disabled' : 'Enabled' } : p
        ));
    };

    return (
        <div className="max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-500 pt-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Compliance & Moderation</h1>
                    <p className="text-[14px] font-medium text-gray-500 mt-2">Manage terms of service, policies, and flagged content.</p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative group cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                    <ShieldAlert className="w-[20px] h-[20px] text-gray-700 group-hover:text-red-500 transition-colors" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold border-2 border-white ring-2 ring-transparent group-hover:ring-red-100 transition-all">3</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Metrics & Policies */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Compliance KPI */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white relative overflow-hidden">
                        <div className="absolute -right-4 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                        <h2 className="text-[15px] font-bold text-gray-300 mb-1">Total T&C Accepted</h2>
                        <div className="flex items-end gap-3 mb-6">
                            <span className="text-4xl font-extrabold tracking-tight">98.2%</span>
                            <span className="text-[12px] font-bold text-green-400 mb-1">+0.5% M/M</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                            <div>
                                <p className="text-[11px] font-medium text-gray-400">Missing Terms</p>
                                <p className="text-[18px] font-bold mt-1">124 users</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-gray-400">Pending Review</p>
                                <p className="text-[18px] font-bold mt-1">12 items</p>
                            </div>
                        </div>
                    </div>

                    {/* Operational Policies List */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col">
                        <h2 className="text-[16px] font-extrabold text-gray-900 mb-6 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-gray-400" /> Active Policies
                        </h2>

                        <div className="space-y-4">
                            {policies.map(policy => (
                                <div key={policy.id} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-2xl transition-all">
                                    <div className="pr-4">
                                        <h3 className="text-[13px] font-bold text-gray-900 leading-tight">{policy.name}</h3>
                                        <p className="text-[11px] font-medium text-gray-500 mt-1">{policy.type}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={policy.status === 'Enabled'}
                                            onChange={() => togglePolicy(policy.id)}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 border border-transparent shadow-sm"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Moderation Action Board */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col min-h-[500px]">

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <h2 className="text-[16px] font-extrabold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-gray-400" /> Review Queue
                            </h2>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search cases..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 text-gray-900 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all placeholder-gray-400"
                                    />
                                </div>
                                <button className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors shrink-0">
                                    <Filter className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            {MODERATION_QUEUE.map((item) => (
                                <div key={item.id} className="p-5 border border-gray-100 bg-white rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all group flex flex-col sm:flex-row gap-5">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg ${item.severity === 'High' ? 'bg-red-50 text-red-600' :
                                                item.severity === 'Medium' ? 'bg-yellow-50 text-yellow-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {item.severity} Risk
                                            </span>
                                            <span className="text-[12px] font-medium text-gray-400">{item.id} • {item.date}</span>
                                        </div>
                                        <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{item.issue}</h3>
                                        <div className="flex items-center gap-2 text-[13px] font-medium text-gray-500">
                                            <span className="text-gray-900 font-bold">{item.user}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            {item.type}
                                        </div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col justify-end gap-2 shrink-0">
                                        <button className="px-5 py-2 bg-gray-900 text-white text-[12px] font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap">
                                            Assess Case
                                        </button>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-2 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors text-[12px] font-bold flex items-center justify-center">
                                                <XCircle className="w-[14px] h-[14px]" />
                                            </button>
                                            <button className="flex-1 py-2 bg-gray-50 border border-gray-100 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors text-[12px] font-bold flex items-center justify-center">
                                                <CheckCircle className="w-[14px] h-[14px]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {MODERATION_QUEUE.length === 0 && (
                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="text-[15px] font-bold text-gray-900">Queue is empty</p>
                                    <p className="text-[13px] font-medium text-gray-500">All flagged content has been reviewed.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
