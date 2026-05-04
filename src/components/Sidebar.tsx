import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Home, Users, FileText, BarChart2,
    ShieldCheck, BookOpen, Settings, LogOut, Calendar, Globe
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const navItems = [
    { name: 'Overview', path: '/dashboard', icon: Home },
    { name: 'Members', path: '/users', icon: Users },
    { name: 'Content', path: '/cms', icon: FileText },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'Moderation', path: '/moderation', icon: ShieldCheck },
    { name: 'Curation', path: '/curation', icon: BookOpen },
    { name: 'Quizzes', path: '/quizzes', icon: Calendar },
    { name: 'Domains', path: '/domains', icon: Globe },
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <aside className="w-64 lg:w-72 bg-white flex flex-col h-[calc(100vh-32px)] fixed top-4 left-4 bottom-4 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-50 transition-all overflow-hidden">

            {/* Logo area */}
            <div className="h-24 flex items-center px-8 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-md shadow-black/10">
                        <span className="text-white font-bold text-sm tracking-widest">SQ</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">
                        Squrx.
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-4 px-4 flex flex-col gap-1 overflow-y-auto">
                <p className="px-4 text-[11px] font-semibold text-gray-400 tracking-wider mb-2">MENU</p>

                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-semibold transition-all group",
                                isActive
                                    ? "bg-gray-100 text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent"
                            )}
                        >
                            <item.icon className={cn(
                                "w-[18px] h-[18px] transition-transform duration-300",
                                isActive ? "text-gray-900 scale-110" : "text-gray-400 group-hover:text-gray-900 group-hover:scale-110"
                            )} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 flex flex-col gap-1 mt-auto shrink-0 mb-2">
                <Link
                    to="/settings"
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all group"
                >
                    <Settings className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-transform duration-300 group-hover:rotate-45" />
                    <span>Settings</span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all group"
                >
                    <LogOut className="w-[18px] h-[18px] text-gray-400 group-hover:text-gray-900 transition-transform duration-300 group-hover:-translate-x-1" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
