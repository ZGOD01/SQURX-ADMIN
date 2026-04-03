import { useState } from 'react';
import {
    FileText, Layout, Image as ImageIcon,
    Save, Eye, Globe, Anchor, Bold, Italic, Link as LinkIcon,
    List, Type, AlertCircle, ChevronRight, Share, CheckCircle
} from 'lucide-react';

const CMS_CATEGORIES = [
    { id: 'home', name: 'Homepage', icon: Layout },
    { id: 'about', name: 'About Page', icon: FileText },
    { id: 'blog', name: 'Articles & News', icon: Anchor },
    { id: 'legal', name: 'Legal Copy', icon: AlertCircle },
    { id: 'media', name: 'Media Gallery', icon: ImageIcon },
];

const RECENT_CHANGES = [
    { id: 1, title: 'Hero Banner Copy Update', category: 'Homepage', author: 'Jane Admin', time: '10 mins ago', status: 'Published' },
    { id: 2, name: 'Privacy Policy 2024 revised', category: 'Legal', author: 'Legal Team', time: '2 hours ago', status: 'Draft' },
    { id: 3, name: 'New Feature Announcement', category: 'Blog', author: 'Marketing', time: '1 day ago', status: 'Published' },
];

export default function CMS() {
    const [activeCat, setActiveCat] = useState('home');

    return (
        <div className="max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-500 pt-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b border-gray-100 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Content Management</h1>
                    <p className="text-[14px] font-medium text-gray-500 mt-2">Edit platform copy, imagery, and structural layouts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-700 text-[13px] font-bold shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all">
                        <Eye className="w-4 h-4" /> Live Preview
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-[13px] font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl hover:opacity-90 transition-opacity">
                        <Globe className="w-4 h-4" /> Publish Content
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Left Side Navigation */}
                <div className="md:col-span-3 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                        <h2 className="px-4 text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-3 mt-2">Sections</h2>
                        <div className="space-y-1">
                            {CMS_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCat(cat.id)}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-bold transition-all ${activeCat === cat.id
                                        ? 'bg-gray-100 text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <cat.icon className={`w-[18px] h-[18px] ${activeCat === cat.id ? 'text-gray-900' : 'text-gray-400'}`} />
                                    <span>{cat.name}</span>
                                    {activeCat === cat.id && <ChevronRight className="w-4 h-4 ml-auto text-gray-400" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats Box */}
                    <div className="bg-gray-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        <h2 className="text-[13px] font-bold text-gray-300 mb-6">Environment Sync</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[12px] font-bold">
                                <span className="text-gray-400 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> Production</span>
                                <span className="text-green-400">Live</span>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            <div className="flex justify-between items-center text-[12px] font-bold">
                                <span className="text-gray-400 flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full border border-gray-400" /> Staging</span>
                                <span className="text-white">Drafting</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Editing Area */}
                <div className="md:col-span-9 flex flex-col gap-6">

                    {/* Editor Surface */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col min-h-[500px]">

                        <div className="flex justify-between flex-wrap gap-4 items-center mb-8 border-b border-gray-100 pb-6">
                            <div className="flex-1 w-full sm:w-auto">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Block Title</label>
                                <input
                                    type="text"
                                    defaultValue="Hero Section Headline"
                                    className="w-full text-2xl font-extrabold text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-0 border-none px-0 tracking-tight"
                                />
                            </div>
                            <span className="inline-flex px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-green-50 text-green-600 self-start sm:self-auto border border-green-100">
                                Published
                            </span>
                        </div>

                        {/* Editor Toolbar */}
                        <div className="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-100 p-2 rounded-2xl w-max shadow-sm">
                            <button className="p-2.5 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100 rounded-xl transition-colors"><Type className="w-[18px] h-[18px]" /></button>
                            <button className="p-2.5 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100 rounded-xl transition-colors"><Bold className="w-[18px] h-[18px]" /></button>
                            <button className="p-2.5 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100 rounded-xl transition-colors"><Italic className="w-[18px] h-[18px]" /></button>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <button className="p-2.5 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100 rounded-xl transition-colors"><LinkIcon className="w-[18px] h-[18px]" /></button>
                            <button className="p-2.5 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100 rounded-xl transition-colors"><List className="w-[18px] h-[18px]" /></button>
                            <button className="p-2.5 text-gray-500 hover:text-gray-900 bg-transparent hover:bg-gray-100 rounded-xl transition-colors"><ImageIcon className="w-[18px] h-[18px]" /></button>
                        </div>

                        {/* Text Area */}
                        <textarea
                            className="w-full flex-1 border border-gray-100 rounded-2xl p-6 text-[15px] text-gray-700 leading-relaxed font-medium bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-200 transition-all resize-none shadow-sm"
                            defaultValue="Connecting top-tier university talent with elite tech companies. Discover your next engineering opportunity today."
                        ></textarea>

                        {/* Bottom Editor Actions */}
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-[12px] font-bold text-gray-400">
                                <Share className="w-4 h-4" /> Auto-saved just now
                            </div>
                            <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 text-[13px] font-bold hover:bg-gray-200 rounded-2xl transition-colors shadow-sm">
                                <Save className="w-4 h-4" /> Save as Draft
                            </button>
                        </div>
                    </div>

                    {/* Change Log Table */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col">
                        <h2 className="text-[15px] font-extrabold text-gray-900 mb-6">Recent Edits</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                        <th className="pb-3 px-2">Content Block</th>
                                        <th className="pb-3 px-2">Category</th>
                                        <th className="pb-3 px-2">Author</th>
                                        <th className="pb-3 px-2">Time</th>
                                        <th className="pb-3 px-2 text-right">State</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {RECENT_CHANGES.map((change, _i) => (
                                        <tr key={change.id} className={`group hover:bg-gray-50/80 transition-colors ${_i !== RECENT_CHANGES.length - 1 ? 'border-b border-gray-50' : ''}`}>
                                            <td className="py-4 px-2 text-[14px] font-bold text-gray-900 truncate max-w-[200px]">{change.title || change.name}</td>
                                            <td className="py-4 px-2 text-[13px] font-semibold text-gray-600">{change.category}</td>
                                            <td className="py-4 px-2 text-[13px] font-semibold text-gray-500">{change.author}</td>
                                            <td className="py-4 px-2 text-[12px] font-medium text-gray-400">{change.time}</td>
                                            <td className="py-4 px-2 text-right">
                                                <span className={`inline-flex px-3 py-1 text-[11px] font-bold rounded-xl ${change.status === 'Published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                    {change.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
