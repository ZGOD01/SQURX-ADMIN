import { useState } from 'react';
import {
    Briefcase, MapPin, GraduationCap,
    Search, Filter, FileText, CheckSquare, Square,
    Star, LayoutList, ChevronRight, UserCheck, ShieldCheck, Clock
} from 'lucide-react';

interface Candidate {
    id: string;
    name: string;
    role: string;
    skills: string[];
    experience: string;
    university: string;
    location: string;
    score: number;
    updatedAt: string;
    verified: boolean;
}

const activeRequirement = {
    role: "Senior React Engineer",
    company: "InnovateInc",
    skills: ["React", "TypeScript", "Next.js"],
    experience: "4-6 Years",
    location: "Remote",
    matches: 24
};

const DUMMY_CANDIDATES: Candidate[] = [
    { id: 'CAND-001', name: 'Alexander Wright', role: 'Frontend Engineer', skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'], experience: '5 Years', university: 'MIT', location: 'Remote (EST)', score: 98, updatedAt: '2 hours ago', verified: true },
    { id: 'CAND-002', name: 'Sarah Jenkins', role: 'React Developer', skills: ['React', 'Next.js', 'Tailwind', 'Redux'], experience: '4 Years', university: 'Stanford Univ.', location: 'San Francisco, CA', score: 94, updatedAt: '1 day ago', verified: true },
    { id: 'CAND-003', name: 'Michael Chen', role: 'Full Stack Engineer', skills: ['React', 'Python', 'AWS', 'Docker'], experience: '6 Years', university: 'UC Berkeley', location: 'Remote (PST)', score: 88, updatedAt: '3 days ago', verified: false },
    { id: 'CAND-004', name: 'Emily Rodriguez', role: 'UI Engineer', skills: ['React', 'Vue', 'CSS/SCSS', 'Figma'], experience: '3 Years', university: 'Carnegie Mellon', location: 'New York, NY', score: 85, updatedAt: '5 hours ago', verified: true },
    { id: 'CAND-005', name: 'David Kim', role: 'Software Engineer', skills: ['React', 'TypeScript', 'Go', 'Kubernetes'], experience: '7 Years', university: 'Harvard Univ.', location: 'Remote (CST)', score: 82, updatedAt: '1 week ago', verified: true },
];

export default function Curation() {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [previewId, setPreviewId] = useState<string>(DUMMY_CANDIDATES[0].id);
    const [searchTerm, setSearchTerm] = useState('');

    const activeCandidate = DUMMY_CANDIDATES.find(c => c.id === previewId);
    const shortlistLimit = 10;

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        } else if (selectedIds.length < shortlistLimit) {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <div className="max-w-[1500px] mx-auto pb-16 animate-in fade-in duration-500 pt-6 flex flex-col">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Resume Curation</h1>
                    <p className="text-[14px] font-medium text-gray-500 mt-2">Filter, analyze, and shortlist top talent actively matching requirements.</p>
                </div>
                <div className="bg-white rounded-2xl flex items-center justify-between px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 min-w-[280px]">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-1">Target Shortlist</p>
                        <p className="text-xl font-extrabold text-gray-900 leading-none">
                            {selectedIds.length} <span className="text-[14px] text-gray-400 font-bold">/ {shortlistLimit} max</span>
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                        <UserCheck className="w-[20px] h-[20px] text-gray-900" />
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Left Column: List Viewer */}
                <div className="w-full lg:w-[55%] flex flex-col gap-6">

                    {/* Filter Strip */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-4 shrink-0 flex flex-wrap gap-4 items-center justify-between">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search skills, names, or universities..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-[13px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-200 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl text-[12px] font-bold hover:bg-gray-100 hover:text-gray-900 transition-all">
                                <Filter className="w-4 h-4" /> Filters
                            </button>
                            <button className="flex items-center gap-2 px-5 py-3 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl text-[12px] font-bold hover:bg-gray-100 hover:text-gray-900 transition-all">
                                <LayoutList className="w-4 h-4" /> Sort: Score
                            </button>
                        </div>
                    </div>

                    {/* Requirement Context Banner */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] shrink-0 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-[11px] font-bold text-white uppercase tracking-widest">{activeRequirement.company} • Active Request</span>
                            </div>
                            <h2 className="text-lg font-extrabold text-white mb-4">{activeRequirement.role}</h2>
                            <div className="flex flex-wrap gap-2">
                                {activeRequirement.skills.map(skill => (
                                    <span key={skill} className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-xl text-[11px] font-bold">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="text-right hidden sm:block relative z-10">
                            <p className="text-3xl font-extrabold text-white">{activeRequirement.matches}</p>
                            <p className="text-[12px] font-bold text-gray-400">Total Matches</p>
                        </div>
                    </div>

                    {/* Candidate List Flow */}
                    <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-3">
                        {DUMMY_CANDIDATES.map((candidate) => {
                            const isSelected = selectedIds.includes(candidate.id);
                            const isPreviewed = previewId === candidate.id;

                            return (
                                <div
                                    key={candidate.id}
                                    onClick={() => setPreviewId(candidate.id)}
                                    className={`p-5 mb-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isPreviewed
                                        ? 'bg-gray-50 border-gray-200 shadow-sm'
                                        : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-5 flex-1">
                                        <button
                                            onClick={(e) => toggleSelection(candidate.id, e)}
                                            className="focus:outline-none transition-transform hover:scale-110 shrink-0"
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-[20px] h-[20px] text-gray-900" />
                                            ) : (
                                                <Square className="w-[20px] h-[20px] text-gray-300 group-hover:text-gray-400" />
                                            )}
                                        </button>

                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-[15px] font-bold text-gray-900 truncate">{candidate.name}</h3>
                                                    {candidate.verified && <ShieldCheck className="w-[14px] h-[14px] text-green-500 shrink-0" />}
                                                </div>
                                                <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-sm ${candidate.score >= 90 ? 'bg-green-50 text-green-700 border border-green-100' :
                                                    candidate.score >= 85 ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                                                        'bg-gray-100 text-gray-700 border border-gray-200'
                                                    }`}>
                                                    <Star className="w-3 h-3 fill-current" /> {candidate.score}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-[12px] font-medium text-gray-500 truncate mb-3">
                                                <span className="flex items-center gap-1.5 shrink-0"><Briefcase className="w-3.5 h-3.5" /> {candidate.role}</span>
                                                <span className="flex items-center gap-1.5 shrink-0"><GraduationCap className="w-3.5 h-3.5" /> {candidate.university}</span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {candidate.skills.slice(0, 4).map(skill => (
                                                    <span key={skill} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {candidate.skills.length > 4 && (
                                                    <span className="px-2.5 py-1 text-gray-400 bg-transparent rounded-lg text-[10px] font-bold border border-gray-100">+{candidate.skills.length - 4}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${isPreviewed ? 'text-gray-900 translate-x-1' : 'text-gray-300 group-hover:text-gray-400'}`} />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Deep Preview Sticky Card */}
                <div className="w-full lg:w-[45%] sticky top-6 max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col overflow-hidden">
                    {activeCandidate ? (
                        <>
                            {/* Sticky Preview Header */}
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50 shrink-0">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center text-white text-xl font-extrabold shadow-md">
                                            {activeCandidate.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-1">
                                                {activeCandidate.name}
                                                {activeCandidate.verified && <ShieldCheck className="w-5 h-5 text-green-500" />}
                                            </h2>
                                            <p className="text-[13px] font-bold text-gray-500">{activeCandidate.role}</p>
                                        </div>
                                    </div>
                                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 shadow-sm ${activeCandidate.score >= 90 ? 'bg-green-50 border-green-200 text-green-700' :
                                        activeCandidate.score >= 85 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                            'bg-gray-50 border-gray-200 text-gray-900'
                                        }`}>
                                        <span className="text-[20px] font-extrabold leading-none">{activeCandidate.score}</span>
                                        <span className="text-[9px] font-bold uppercase mt-1">Match</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                                        <Briefcase className="w-[14px] h-[14px] text-gray-400" /> {activeCandidate.experience} Exp
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                                        <MapPin className="w-[14px] h-[14px] text-gray-400" /> {activeCandidate.location}
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                                        <GraduationCap className="w-[14px] h-[14px] text-gray-400" /> {activeCandidate.university}
                                    </div>
                                    <div className="flex items-center gap-2 text-[12px] font-medium text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm">
                                        <Clock className="w-[14px] h-[14px] text-gray-400" /> Updated {activeCandidate.updatedAt}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Body scrollable */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                                <h3 className="text-[13px] font-extrabold text-gray-900 mb-4 uppercase tracking-wider">System Match Analysis</h3>
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                                    <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                                        <strong className="text-gray-900">Extremely High Match.</strong> Candidate possesses 100% of required core skills ({activeRequirement.skills.join(', ')}). Experience level ({activeCandidate.experience}) aligns tightly with the {activeRequirement.experience} requirement. Remote location matches operational parameters.
                                    </p>
                                </div>

                                <h3 className="text-[13px] font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Verified Skill Map</h3>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {activeCandidate.skills.map(skill => (
                                        <span key={skill} className={`px-4 py-2 rounded-xl text-[12px] font-bold border ${activeRequirement.skills.includes(skill) ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}>
                                            {skill} {activeRequirement.skills.includes(skill) && '✓'}
                                        </span>
                                    ))}
                                </div>

                                <h3 className="text-[13px] font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Reviewer Notes Space</h3>
                                <textarea
                                    className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-100 focus:border-gray-300 focus:bg-white transition-all resize-none shadow-sm placeholder-gray-400"
                                    placeholder={`Add curation remarks for ${activeCandidate.name}...`}
                                ></textarea>

                            </div>

                            {/* Sticky Actions */}
                            <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex gap-4">
                                <button className="flex-1 py-3.5 bg-gray-50 text-gray-900 border border-gray-200 font-bold text-[13px] rounded-2xl hover:bg-gray-100 transition-colors shadow-sm">
                                    Download Full CV
                                </button>
                                <button className="py-3.5 px-8 bg-gray-900 text-white font-bold text-[13px] rounded-2xl hover:opacity-90 transition-opacity shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                                    Finalize Shortlist
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                            <div className="w-16 h-16 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center mb-4">
                                <FileText className="w-6 h-6 text-gray-300" />
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Select a Candidate</h3>
                            <p className="text-[13px] font-medium text-gray-500">Click on any candidate profile to view detailed match analytics here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
