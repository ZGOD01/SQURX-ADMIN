import { useState } from 'react';
import {
    FileText, User, Target, PenTool, Flag,
    Download, Save, FileCheck2, ArrowRight, BookOpen,
    History, Eye, Clock, FilePlus2, CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: (string | undefined | null | false)[]) => twMerge(clsx(inputs));

const previousReports = [
    { id: 'gmi_429', student: 'Sarah Jenkins', target: 'MS Computer Science', date: '2 days ago', status: 'Finalized' },
    { id: 'gmi_428', student: 'David Chen', target: 'MBA', date: '4 days ago', status: 'Draft' },
    { id: 'gmi_427', student: 'Emma Wilson', target: 'MS Data Science', date: '1 week ago', status: 'Finalized' },
    { id: 'gmi_426', student: 'Michael Rodriguez', target: 'MEng Robotics', date: '2 weeks ago', status: 'Finalized' },
];

export default function GMI() {
    const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
    const [activeStep, setActiveStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form State
    const [bgInfo, setBgInfo] = useState({ name: 'Alexander Thompson', degree: 'BS Computer Science', gpa: '3.6/4.0', target: 'MS Software Engineering' });
    const [uniTargets, setUniTargets] = useState({ reach: 'Stanford, MIT', target: 'CMU, Berkeley', safe: 'Georgia Tech, UT Austin' });
    const [sopStrategy, setSopStrategy] = useState('Focus heavily on the FinTech project lead experience. Highlight problem-solving skills and overcoming WebSocket latency issues. Play down the minor dip in Sophomore year grades by emphasizing major-specific GPA.');
    const [improvementPlan, setImprovementPlan] = useState('Needs to take the GRE again to boost Quant score past 165. Recommend contributing to one major open-source React project before November deadlines.');
    const [consultantNotes, setConsultantNotes] = useState('A-tier candidate. Strong technicals but needs help weaving a narrative structure for the SOP so it doesn\'t just read like a resume.');

    return (
        <div className="max-w-[1400px] mx-auto pb-24 relative">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                        <BookOpen className="w-8 h-8" />
                        GMI Roadmap Generation
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Consultant workspace for Guided Mentoring & Interview reports.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-2", activeTab === 'create' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                    >
                        <FilePlus2 className="w-4 h-4" /> New Roadmap
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-2", activeTab === 'history' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
                    >
                        <History className="w-4 h-4" /> Previous Reports
                    </button>
                </div>
            </div>

            {activeTab === 'history' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in max-w-4xl mx-auto">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Report Archive</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Access previously generated documents for students.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-white">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Report ID</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Profile</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-4 text-right"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {previousReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">{report.id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{report.student}</span>
                                                <span className="text-xs text-gray-500 font-medium">{report.target}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                            {report.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md border uppercase tracking-wider",
                                                report.status === 'Finalized' ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-300 border-dashed"
                                            )}>
                                                {report.status === 'Finalized' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm focus:outline-none opacity-0 group-hover:opacity-100">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in">

                    {/* Form Area */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">

                        {/* Steps Nav */}
                        <div className="flex justify-between relative mb-2">
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 -z-10 -translate-y-1/2"></div>
                            {[1, 2, 3].map((step) => (
                                <button
                                    key={step}
                                    onClick={() => setActiveStep(step)}
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                                        activeStep === step ? "bg-gray-900 border-gray-900 text-white" :
                                            activeStep > step ? "bg-white border-gray-900 text-gray-900" : "bg-white border-gray-300 text-gray-400"
                                    )}
                                >
                                    {step}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Step 1: Foundation */}
                            {activeStep === 1 && (
                                <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="pb-4 border-b border-gray-100 flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                                            <User className="w-5 h-5 stroke-[1.5]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Academic Foundation</h2>
                                            <p className="text-xs text-gray-500 font-medium">Student profile and baseline metrics.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Student Name</label>
                                            <input type="text" value={bgInfo.name} onChange={e => setBgInfo({ ...bgInfo, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm font-medium bg-gray-50 focus:bg-white transition-colors" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Degree</label>
                                                <input type="text" value={bgInfo.degree} onChange={e => setBgInfo({ ...bgInfo, degree: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm font-medium bg-gray-50 focus:bg-white transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cumulative GPA</label>
                                                <input type="text" value={bgInfo.gpa} onChange={e => setBgInfo({ ...bgInfo, gpa: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm font-medium bg-gray-50 focus:bg-white transition-colors" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Target Program Focus</label>
                                            <input type="text" value={bgInfo.target} onChange={e => setBgInfo({ ...bgInfo, target: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm font-medium bg-gray-50 focus:bg-white transition-colors" />
                                        </div>
                                    </div>

                                    <button onClick={() => setActiveStep(2)} className="mt-4 w-full py-2.5 bg-white border border-gray-300 text-gray-900 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors focus:outline-none flex items-center justify-center gap-2">
                                        Continue <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Targeting */}
                            {activeStep === 2 && (
                                <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="pb-4 border-b border-gray-100 flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                                            <Target className="w-5 h-5 stroke-[1.5]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">University Targets</h2>
                                            <p className="text-xs text-gray-500 font-medium">Define application tiers.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                                                <span className="w-2.5 h-2.5 rounded-sm bg-black"></span> Reach / Ambitious
                                            </label>
                                            <input type="text" value={uniTargets.reach} onChange={e => setUniTargets({ ...uniTargets, reach: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm font-medium bg-white transition-colors" />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                                <span className="w-2.5 h-2.5 rounded-sm bg-gray-400"></span> Target / Competitive
                                            </label>
                                            <input type="text" value={uniTargets.target} onChange={e => setUniTargets({ ...uniTargets, target: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm font-medium bg-white transition-colors" />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                                <span className="w-2.5 h-2.5 rounded-sm bg-gray-200"></span> Safe / Foundation
                                            </label>
                                            <input type="text" value={uniTargets.safe} onChange={e => setUniTargets({ ...uniTargets, safe: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm font-medium bg-white transition-colors" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => setActiveStep(1)} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-600 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors focus:outline-none">
                                            Back
                                        </button>
                                        <button onClick={() => setActiveStep(3)} className="flex-1 py-2.5 bg-gray-900 border border-gray-900 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-gray-800 transition-colors focus:outline-none flex items-center justify-center gap-2">
                                            Continue <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Strategy */}
                            {activeStep === 3 && (
                                <div className="p-6 flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                                    <div className="pb-4 border-b border-gray-100 flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                                            <PenTool className="w-5 h-5 stroke-[1.5]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Application Strategy</h2>
                                            <p className="text-xs text-gray-500 font-medium">SOP direction and core improvements.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> SOP Direction</label>
                                            <textarea rows={4} value={sopStrategy} onChange={e => setSopStrategy(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm leading-relaxed bg-gray-50 focus:bg-white transition-colors resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Improvement Protocol</label>
                                            <textarea rows={3} value={improvementPlan} onChange={e => setImprovementPlan(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-900 text-sm leading-relaxed bg-gray-50 focus:bg-white transition-colors resize-none" />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => setActiveStep(2)} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-600 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors focus:outline-none">
                                            Back
                                        </button>
                                        <button className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors focus:outline-none flex items-center justify-center gap-2">
                                            <Save className="w-4 h-4" /> Save Draft
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Consultant Internal Notes */}
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 shadow-inner">
                            <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Private Consultant Notes</label>
                            <textarea rows={3} value={consultantNotes} onChange={e => setConsultantNotes(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-gray-700 text-sm leading-relaxed bg-white/50 focus:bg-white transition-colors resize-none placeholder-gray-400" placeholder="Internal remarks not visible to student..." />
                        </div>

                    </div>

                    {/* Document Live Preview */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">

                        <div className="flex justify-between items-center px-2">
                            <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Live Document Preview
                            </span>
                            <div className="flex items-center gap-3">
                                <button className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-gray-800 transition-colors focus:outline-none flex items-center gap-2" onClick={() => {
                                    setIsGenerating(true);
                                    setTimeout(() => setIsGenerating(false), 1500);
                                }}>
                                    {isGenerating ? (
                                        <span className="flex items-center gap-2 opacity-80"><Clock className="w-4 h-4 animate-spin" /> Compiling...</span>
                                    ) : (
                                        <><FileCheck2 className="w-4 h-4" /> Generate Full Report</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* A4 Document styling */}
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200 min-h-[842px] w-full p-8 sm:p-12 font-sans relative overflow-hidden group">

                            {/* Subtle Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-gray-50 opacity-50 select-none rotate-[-45deg] pointer-events-none">
                                SQURX
                            </div>

                            <div className={cn("relative z-10 transition-opacity duration-500", isGenerating ? "opacity-30 blur-sm" : "opacity-100")}>
                                {/* Doc Header */}
                                <div className="border-b-2 border-gray-900 pb-6 mb-8 flex justify-between items-end">
                                    <div>
                                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">GMI Strategic Roadmap</h1>
                                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Confidential Preparation Plan</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-900">{bgInfo.name}</p>
                                        <p className="text-sm text-gray-600 mt-1">{bgInfo.target}</p>
                                        <p className="text-xs text-gray-400 mt-1.5 font-mono">ID: SQX-GMI-{new Date().getFullYear()}</p>
                                    </div>
                                </div>

                                {/* Section: Academic Baseline */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 bg-gray-100 px-3 py-1.5 inline-block">01. Academic Baseline</h3>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500">Degree Focus</span>
                                            <span className="font-bold text-gray-900">{bgInfo.degree}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-100 pb-2">
                                            <span className="font-semibold text-gray-500">Current GPA</span>
                                            <span className="font-bold text-gray-900">{bgInfo.gpa}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: University Targeting */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 bg-gray-100 px-3 py-1.5 inline-block">02. Tiered Matrix Goals</h3>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 border-l-2 border-gray-900 pl-4">
                                            <span className="w-24 font-bold text-gray-900 uppercase tracking-wider text-xs">Reach</span>
                                            <span className="text-gray-700 font-medium">{uniTargets.reach || 'Pending Evaluation'}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 border-l-2 border-gray-400 pl-4">
                                            <span className="w-24 font-bold text-gray-500 uppercase tracking-wider text-xs">Target</span>
                                            <span className="text-gray-700 font-medium">{uniTargets.target || 'Pending Evaluation'}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 border-l-2 border-gray-200 pl-4">
                                            <span className="w-24 font-bold text-gray-400 uppercase tracking-wider text-xs">Safe</span>
                                            <span className="text-gray-700 font-medium">{uniTargets.safe || 'Pending Evaluation'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: App Strategy */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 bg-gray-100 px-3 py-1.5 inline-block">03. Narrative Focus (SOP)</h3>
                                    <p className="text-sm text-gray-700 leading-relaxed max-w-2xl text-justify">
                                        {sopStrategy || 'No narrative strategy recorded yet.'}
                                    </p>
                                </div>

                                {/* Section: Improvement Protocol */}
                                <div className="mb-8">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 bg-gray-100 px-3 py-1.5 inline-block">04. Action Items</h3>
                                    <div className="bg-gray-50 border border-gray-200 p-4 rounded text-sm text-gray-800 font-medium leading-relaxed">
                                        {improvementPlan || 'No action items defined.'}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="absolute bottom-12 left-12 right-12 border-t border-gray-200 pt-6 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Generated via Squrx Curation Engine</span>
                                    <span>Page 1 of 1</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}
