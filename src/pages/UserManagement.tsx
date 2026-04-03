import { useState } from 'react';
import {
    Search, Filter, MoreVertical,
    UserCheck, UserX,
    User, Calendar, CheckCircle, XCircle
} from 'lucide-react';

const MOCK_USERS = [
    { id: 1, name: "Alex Mercer", email: "alex.m@univ.edu", role: "Student", status: "Active", completion: "92%", submitted: "2023-11-15", approval: "Approved", lastActive: "10 mins ago" },
    { id: 2, name: "Sarah Chen", email: "schen@techcorp.com", role: "Recruiter", status: "Active", completion: "100%", submitted: "2023-11-10", approval: "Approved", lastActive: "1 hr ago" },
    { id: 3, name: "Marcus Johnson", email: "mjohnson@state.edu", role: "Student", status: "Inactive", completion: "45%", submitted: "2023-11-20", approval: "Pending", lastActive: "2 days ago" },
    { id: 4, name: "Elena Rodriguez", email: "elena.r@design.co", role: "Recruiter", status: "Active", completion: "88%", submitted: "2023-11-21", approval: "Pending", lastActive: "5 mins ago" },
    { id: 5, name: "David Kim", email: "dkim@startup.io", role: "Recruiter", status: "Active", completion: "100%", submitted: "2023-11-05", approval: "Approved", lastActive: "3 hrs ago" },
    { id: 6, name: "Jessica Smith", email: "jsmith@univ.edu", role: "Student", status: "Inactive", completion: "60%", submitted: "2023-11-18", approval: "Rejected", lastActive: "1 week ago" },
];

export default function UserManagement() {
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = MOCK_USERS.filter(user => {
        if (activeTab !== 'All' && user.role !== activeTab) return false;
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500 pt-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Members & Access</h1>
                    <p className="text-[14px] font-medium text-gray-500 mt-2">Manage profiles, permissions, and moderation holds.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                        Export CSV
                    </button>
                    <button className="px-6 py-3 bg-gray-900 text-white text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:opacity-90 transition-opacity">
                        Invite User
                    </button>
                </div>
            </div>

            {/* Utility Bar */}
            <div className="bg-white rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

                {/* Tabs */}
                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-max">
                    {['All', 'Student', 'Recruiter'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all ${activeTab === tab ? 'bg-white shadow-sm text-gray-900 border border-gray-100' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-3 pr-2">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
                        />
                    </div>
                    <button className="p-3 bg-gray-50 border border-transparent hover:border-gray-200 rounded-2xl text-gray-500 hover:text-gray-900 transition-all">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Member Details</th>
                                <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Approval State</th>
                                <th className="px-6 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Profile Score</th>
                                <th className="px-8 py-5 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 text-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-[15px] font-bold text-gray-700 shrink-0">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight mb-1">{user.name}</p>
                                                <p className="text-[13px] font-medium text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold ${user.role === 'Student' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            {user.approval === 'Approved' ? <CheckCircle className="w-4 h-4 text-green-500" /> :
                                                user.approval === 'Pending' ? <Calendar className="w-4 h-4 text-yellow-500" /> :
                                                    <XCircle className="w-4 h-4 text-red-500" />}
                                            <span className={`text-[13px] font-bold ${user.approval === 'Approved' ? 'text-gray-900' : user.approval === 'Pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {user.approval}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[13px] font-bold text-gray-900">{user.completion}</span>
                                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-gray-900 rounded-full" style={{ width: user.completion }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors tooltip-trigger relative">
                                                <UserCheck className="w-4 h-4" />
                                            </button>
                                            <button className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                                <UserX className="w-4 h-4" />
                                            </button>
                                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                                            <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="py-24 text-center">
                            <User className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-[15px] font-bold text-gray-900 mb-1">No users found</h3>
                            <p className="text-[13px] font-medium text-gray-500">Try adjusting your filters or search term.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <p className="text-[13px] font-medium text-gray-500">
                        Showing <span className="font-bold text-gray-900">{filteredUsers.length}</span> results
                    </p>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm">Previous</button>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[12px] font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm">Next</button>
                    </div>
                </div>
            </div>

        </div>
    );
}
