import { useState, useEffect } from 'react';
import {
    Brain, Users, BarChart3, TrendingUp,
    Search, Filter, Target, Award,
    MessageSquare, ChevronRight, Zap,
    Activity, ArrowUpRight, SearchX,
    TrendingDown, Minus, Info, RefreshCw
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import apiClient from '../../api/axios.config';
import Loader from '../Loader';
import StudentDeepAnalysis from './StudentDeepAnalysis';

export default function FacultyIntelligenceHub() {
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLearnerType, setActiveLearnerType] = useState('all');
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // grid, analysis

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/intelligence/class-overview');
            setStudents(data.data);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeLearnerType === 'all' || s.learnerType === activeLearnerType;
        return matchesSearch && matchesFilter;
    });

    const categories = [
        { id: 'all', label: 'All Students', icon: Users, color: 'text-primary' },
        { id: 'Quick Learner', label: 'Quick Learners', icon: Zap, color: 'text-amber-500' },
        { id: 'Deep Diver', label: 'Deep Divers', icon: Target, color: 'text-blue-500' },
        { id: 'Steady Progressor', label: 'Steady Progressors', icon: Activity, color: 'text-emerald-500' },
        { id: 'Surface Learner', label: 'Needs Support', icon: TrendingDown, color: 'text-red-500' }
    ];

    const stats = [
        { label: 'Avg Class Score', value: `${Math.round(students.reduce((acc, s) => acc + s.avgScore, 0) / (students.length || 1))}%`, icon: BarChart3, trend: '+2.5%' },
        { label: 'Top Learner Type', value: 'Steady Progressor', icon: Brain, trend: 'Stable' },
        { label: 'Engagement', value: 'High', icon: Award, trend: 'Increasing' }
    ];

    if (loading) return <Loader fullScreen={false} />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Brain className="w-8 h-8 text-primary" />
                        </div>
                        Student Intelligence Monitor
                    </h2>
                    <p className="text-muted-foreground mt-2 font-medium">AI-driven learning analysis & pedagogy tracking.</p>
                </div>

                <div className="flex bg-secondary/30 p-1.5 rounded-[20px] border border-border">
                    {['grid', 'analysis'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-background shadow-lg text-primary scale-[1.02]' : 'text-muted-foreground'}`}
                        >
                            {mode} View
                        </button>
                    ))}
                </div>
            </div>

            {/* Top Stats Cards - Only in Analysis View */}
            {viewMode === 'analysis' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-card border border-border p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-secondary/50 rounded-2xl group-hover:scale-110 transition-transform">
                                    <stat.icon className="w-6 h-6 text-primary" />
                                </div>
                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-tighter">
                                    <TrendingUp className="w-3 h-3" />
                                    {stat.trend}
                                </span>
                            </div>
                            <p className="text-3xl font-black mb-1">{stat.value}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Comparison Analysis - Only in Analysis View */}
            {viewMode === 'analysis' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Performance Chart */}
                    <div className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Perfromance Comparison</h3>
                                <p className="text-xs text-muted-foreground font-medium">Quiz Scores vs. Knowledge Engagement</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-[10px] font-black uppercase tracking-tighter">Engagement</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={students.slice(0, 8)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="avgScore" radius={[12, 12, 12, 12]} barSize={24}>
                                        {students.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.avgScore > 75 ? 'rgb(var(--primary))' : 'rgb(var(--primary) / 0.4)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Engagement Scatter */}
                    <div className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Learner Segregation</h3>
                                <p className="text-xs text-muted-foreground font-medium">Knowledge Credits vs. Quiz Mastery</p>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis type="number" dataKey="avgScore" name="avgScore" unit="%" axisLine={false} tickLine={false} />
                                    <YAxis type="number" dataKey="credits" name="credits" axisLine={false} tickLine={false} />
                                    <ZAxis type="number" range={[100, 1000]} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Students" data={students} fill="rgb(var(--primary))" shape="circle" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Student List & Filters - Only in Grid View */}
            {viewMode === 'grid' && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search learner profile..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-card border border-border focus:border-primary rounded-[24px] pl-14 pr-6 py-4.5 font-bold outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex bg-secondary/30 p-1.5 rounded-[24px] border border-border overflow-x-auto no-scrollbar w-full md:w-auto">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveLearnerType(cat.id)}
                                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${activeLearnerType === cat.id ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <cat.icon className={`w-3.5 h-3.5 ${activeLearnerType === cat.id ? cat.color : ''}`} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Intelligence Table */}
                    <div className="bg-card border border-border rounded-[40px] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/20 border-b border-border">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Learner</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Persona Tag</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Quiz Mastery</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Credits</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-secondary/20 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-bold text-lg text-primary overflow-hidden border border-border shadow-inner">
                                                            {student.avatar ? <img src={student.avatar} alt="" className="w-full h-full object-cover" /> : student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <span className="text-base font-black tracking-tight block">{student.name}</span>
                                                            <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-tighter">{student.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${student.learnerType === 'Quick Learner' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                        student.learnerType === 'Deep Diver' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                            student.learnerType === 'Surface Learner' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                                'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                        }`}>
                                                        <Zap className="w-3.5 h-3.5" />
                                                        {student.learnerType}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-2 w-32">
                                                        <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground/60 uppercase">
                                                            <span>Mastery</span>
                                                            <span>{student.avgScore}%</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/50 p-[1px]">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-1000 ${student.avgScore > 75 ? 'bg-emerald-500' : student.avgScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                style={{ width: `${student.avgScore}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[13px] font-black">
                                                    <div className="flex items-center gap-2">
                                                        <Award className="w-4 h-4 text-primary" />
                                                        {student.credits}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button
                                                        onClick={() => setSelectedStudentId(student.id)}
                                                        className="inline-flex items-center justify-center p-3 rounded-2xl bg-background border border-border text-primary hover:bg-primary hover:text-white hover:scale-110 transition-all shadow-sm"
                                                    >
                                                        <Wand2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-24 text-center">
                                                <div className="max-w-xs mx-auto">
                                                    <SearchX className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                                                    <p className="text-xl font-black mb-2">No Profiles Found</p>
                                                    <p className="text-sm text-muted-foreground font-medium italic">Try adjusting your filters to discover student data.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Deep Analysis Modal */}
            {selectedStudentId && (
                <StudentDeepAnalysis
                    studentId={selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                    onRefresh={fetchData}
                />
            )}
        </div>
    );
}

// Sub-component constants for icons
const Wand2 = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wand-2"><path d="m15 4 5 2" /><path d="m17.7 3.7-5.3 5.3" /><path d="m19 8-5 2" /><path d="M22.7 2.7 11 14.4" /><path d="M7 22H4a2 2 0 0 1-2-2v-3" /><path d="M14 6V3" /><path d="M22 6h-3" /><path d="M20 2v3" /><path d="M22 4h-3" /><path d="M15 11l-3 3" /><path d="m10 16-5.3 5.3" /><path d="m4.3 15.7 6.1-6.1" /></svg>
);
