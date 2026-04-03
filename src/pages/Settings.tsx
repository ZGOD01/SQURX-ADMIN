import { useState } from 'react';
import {
    Shield, Bell, Key, Sliders,
    User, Mail, Smartphone, Globe, Lock, Cpu
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const SETTINGS_CATEGORIES = [
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'preferences', name: 'Preferences', icon: Sliders },
    { id: 'security', name: 'Security & Access', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'roles', name: 'Admin Roles', icon: Key },
    { id: 'api', name: 'API Keys (Dev)', icon: Cpu },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');

    return (
        <div className="max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-500 pt-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Platform Settings</h1>
                    <p className="text-[14px] font-medium text-gray-500 mt-2">Configure admin preferences, security, and global variables.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all">
                        Discard Changes
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:opacity-90 transition-opacity">
                        Save Configuration
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">

                {/* Left Navigation */}
                <div className="w-full md:w-72 shrink-0">
                    <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 sticky top-28">
                        <h2 className="px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 mt-2">Configuration</h2>
                        <nav className="flex flex-col gap-1">
                            {SETTINGS_CATEGORIES.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveTab(category.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all",
                                        activeTab === category.id
                                            ? "bg-gray-100 text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 bg-transparent"
                                    )}
                                >
                                    <category.icon className={cn(
                                        "w-[18px] h-[18px]",
                                        activeTab === category.id ? "text-gray-900" : "text-gray-400"
                                    )} />
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Settings Content */}
                <div className="flex-1">

                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-[18px] font-extrabold text-gray-900">Personal Information</h2>
                                <p className="text-[13px] font-medium text-gray-500 mt-1">Manage your administrator identity visually across the platform.</p>
                            </div>

                            <div className="flex items-center gap-6 pb-8 border-b border-gray-100">
                                <div className="w-24 h-24 rounded-3xl bg-gray-900 text-white flex items-center justify-center text-3xl font-extrabold shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                                    JA
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-900 text-[12px] font-bold border border-gray-200 rounded-xl transition-colors shadow-sm w-max">
                                        Upload new avatar
                                    </button>
                                    <p className="text-[11px] font-medium text-gray-400 max-w-xs leading-relaxed">Recommended 400x400px. JPG, JPEG, and PNG supported.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-900">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" defaultValue="Jane Admin" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 focus:bg-white focus:border-gray-300 transition-all shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-900">Email Address (Read-Only)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="email" defaultValue="jane@squrx.com" disabled className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium text-gray-500 cursor-not-allowed opacity-70" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-900">Phone Number (Optional)</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" placeholder="+1 (555) 000-0000" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 focus:bg-white focus:border-gray-300 transition-all shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-gray-900">Timezone Preferences</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 focus:bg-white focus:border-gray-300 transition-all shadow-sm appearance-none cursor-pointer">
                                            <option>Eastern Time (EST, UTC-5)</option>
                                            <option>Pacific Time (PST, UTC-8)</option>
                                            <option>Central European Time (CET, UTC+1)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <h2 className="text-[18px] font-extrabold text-gray-900">Platform Preferences</h2>
                                <p className="text-[13px] font-medium text-gray-500 mt-1">Configure your personal admin dashboard experience.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all">
                                    <div>
                                        <h3 className="text-[14px] font-bold text-gray-900">Compact Table View</h3>
                                        <p className="text-[12px] font-medium text-gray-500 mt-1">Reduces padding inside data grids for higher density.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 border border-transparent shadow-sm"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all">
                                    <div>
                                        <h3 className="text-[14px] font-bold text-gray-900">High Contrast Rendering</h3>
                                        <p className="text-[12px] font-medium text-gray-500 mt-1">Force maximum legibility in text fields and buttons.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 border border-transparent shadow-sm"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all">
                                    <div>
                                        <h3 className="text-[14px] font-bold text-gray-900">Auto-save Analytics Drafts</h3>
                                        <p className="text-[12px] font-medium text-gray-500 mt-1">Keep copies of unsaved configurations in local storage.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 border border-transparent shadow-sm"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {!['profile', 'preferences'].includes(activeTab) && (
                        <div className="bg-white rounded-3xl p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col items-center justify-center text-center animate-in slide-in-from-right-4 duration-300">
                            <div className="w-16 h-16 bg-gray-50 border border-gray-100 shadow-sm rounded-3xl flex items-center justify-center mb-6">
                                <Lock className="w-6 h-6 text-gray-300" />
                            </div>
                            <h2 className="text-[16px] font-extrabold text-gray-900 mb-2">Module locked or in-development</h2>
                            <p className="text-[14px] font-medium text-gray-500 max-w-sm mx-auto">
                                The {SETTINGS_CATEGORIES.find(c => c.id === activeTab)?.name} section is currently locked. A super-admin can provision these rights.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
