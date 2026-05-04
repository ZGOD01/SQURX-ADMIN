import {
    Search,
    Bell,
    ChevronDown,
    Command,
    LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    
    const userStr = localStorage.getItem('adminUser');
    const user = userStr ? JSON.parse(userStr) : { fullName: 'Admin', role: 'admin' };
    const initials = user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AD';

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <header className="h-20 bg-white/80 backdrop-blur-3xl sticky top-4 mx-4 lg:mx-10 z-40 flex items-center justify-between px-6 transition-all rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">

            {/* Left section: Search */}
            <div className="flex-1 flex items-center">
                <div className="relative w-full max-w-sm hidden sm:block group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-[18px] w-[18px] text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-12 py-3 bg-gray-50 text-gray-900 placeholder-gray-400 rounded-2xl focus:outline-none focus:bg-gray-100 focus:ring-2 focus:ring-black/5 text-sm font-medium transition-all"
                        placeholder="Search resources... "
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400 border border-gray-200 bg-white rounded-lg px-2 py-1 shadow-sm"><Command className="inline w-3 h-3" /> K</span>
                    </div>
                </div>
            </div>

            {/* Right section: Actions & Profile */}
            <div className="flex items-center gap-5">

                {/* Real-time status indicator */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full bg-green-500 rounded-full opacity-40"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[12px] font-semibold text-gray-600">Syncing</span>
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 text-gray-400 hover:text-gray-900 transition-colors focus:outline-none bg-gray-50 hover:bg-gray-100 rounded-2xl">
                    <Bell className="w-[20px] h-[20px]" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-black border border-white"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-3 focus:outline-none group hover:opacity-80 transition-opacity pl-2"
                    >
                        <div className="flex flex-col items-end hidden sm:flex">
                            <span className="text-sm font-bold text-gray-900 leading-none mb-1">{user.fullName || 'Admin'}</span>
                            <span className="text-[11px] font-medium text-gray-500 leading-none capitalize">{user.role || 'Admin'}</span>
                        </div>
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-700 flex items-center justify-center text-white text-[15px] font-bold shadow-md shadow-black/10 uppercase">
                            {initials}
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}
