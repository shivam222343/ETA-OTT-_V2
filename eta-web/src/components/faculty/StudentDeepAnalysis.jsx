import { useState, useEffect } from 'react';
import {
    X, Brain, Zap, Target, Activity,
    Award, TrendingUp, Sparkles, RefreshCw,
    CheckCircle2, AlertCircle, Quote,
    BarChart3, LineChart, ChevronRight, Globe
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer, LineChart as ReLineChart,
    Line, XAxis, YAxis, Tooltip, AreaChart, Area,
    CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../api/axios.config';
import Loader from '../Loader';

export default function StudentDeepAnalysis({ studentId, onClose, onRefresh }) {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);
    const [language, setLanguage] = useState(localStorage.getItem('ai_tutor_lang') || 'english');

    const fetchDetail = async (refreshAI = false) => {
        if (refreshAI) setRefreshing(true);
        try {
            const { data } = await apiClient.get(`/intelligence/student/${studentId}?language=${language}${refreshAI ? '&refreshAI=true' : ''}`);
            setData(data.data);
        } catch (error) {
            console.error('Fetch detail error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [studentId]);

    if (loading) return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center">
            <Loader />
        </div>
    );

    const masteryData = [
        { subject: 'Visual', A: 80, fullMark: 100 },
        { subject: 'Theory', A: 65, fullMark: 100 },
        { subject: 'Active', A: 90, fullMark: 100 },
        { subject: 'Logic', A: 75, fullMark: 100 },
        { subject: 'Recall', A: 85, fullMark: 100 },
    ];

    const trendData = [
        { name: 'Week 1', score: 65 },
        { name: 'Week 2', score: 72 },
        { name: 'Week 3', score: 68 },
        { name: 'Week 4', score: 85 },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/40 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-card border border-border w-full max-w-6xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative"
                >
                    {/* Header */}
                    <div className="p-10 border-b border-border bg-gradient-to-r from-secondary/30 to-background flex flex-col md:flex-row items-start justify-between gap-8 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center text-3xl font-black text-primary border border-primary/20 shadow-inner">
                                {data.studentId?.profile?.avatar ? <img src={data.studentId.profile.avatar} alt="" className="w-full h-full object-cover" /> : data.studentId?.profile?.name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-1">{data.studentId?.profile?.name}</h2>
                                <p className="text-muted-foreground font-medium flex items-center gap-2">
                                    {data.studentId?.email}
                                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                    Student ID: {studentId.substring(18).toUpperCase()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl shadow-sm">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:outline-none cursor-pointer"
                                >
                                    <option value="english">English</option>
                                    <option value="hindi">Hindi/Hinglish</option>
                                </select>
                            </div>
                            <button
                                onClick={() => fetchDetail(true)}
                                disabled={refreshing}
                                className="inline-flex items-center gap-2 px-6 py-3.5 bg-background border border-border rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 text-primary ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? 'Syncing Intelligence...' : 'Refresh AI Analysis'}
                            </button>
                            <button onClick={onClose} className="p-4 bg-secondary/50 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">

                        {/* AI Summary Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">AI Pedagogy Insight</h3>
                                </div>
                                <div className="bg-secondary/20 border border-border/50 p-8 rounded-[40px] relative overflow-hidden group">
                                    <Quote className="absolute -top-4 -left-4 w-24 h-24 text-primary/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                                    <p className="text-xl font-bold leading-relaxed text-foreground/90 italic relative z-10">
                                        "{data.analysis?.narrativeSummary || "Analysis in progress... Click refresh to generate a deep learning narrative for this student."}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] space-y-2">
                                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Key Strength</span>
                                        </div>
                                        <p className="text-sm font-bold">{data.analysis?.strengths?.[0] || 'Identifying...'}</p>
                                    </div>
                                    <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[32px] space-y-2">
                                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                                            <Target className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Growth Area</span>
                                        </div>
                                        <p className="text-sm font-bold">{data.analysis?.weaknesses?.[0] || 'Identifying...'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Persona Card */}
                            <div className="bg-primary/5 border border-primary/10 p-8 rounded-[40px] flex flex-col items-center justify-center text-center space-y-6">
                                <div className="relative">
                                    <div className="p-6 bg-primary/10 rounded-full animate-pulse blur-2xl absolute inset-0" />
                                    <div className="w-24 h-24 bg-background rounded-full border-4 border-primary flex items-center justify-center shadow-xl relative z-10">
                                        <Brain className="w-12 h-12 text-primary" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mb-2 block">Learning Persona</span>
                                    <h4 className="text-2xl font-black tracking-tight text-primary">{data.persona?.learnerType}</h4>
                                </div>
                                <div className="w-full space-y-4 pt-4 border-t border-primary/10">
                                    <div className="flex justify-between items-center text-xs font-bold">
                                        <span className="text-muted-foreground">Consistency Score</span>
                                        <span className="text-primary">{Math.round(data.metrics?.avgQuizScore * 0.8)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-primary/20 rounded-full">
                                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${data.metrics?.avgQuizScore * 0.8}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Master Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* mastery radar */}
                            <div className="bg-card border border-border p-10 rounded-[40px] shadow-sm">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">Cognitive Mapping</h3>
                                    <Activity className="w-5 h-5 text-muted-foreground/30" />
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                                            <PolarGrid stroke="#E2E8F0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                                            <Radar
                                                name="Ability"
                                                dataKey="A"
                                                stroke="rgb(var(--primary))"
                                                fill="rgb(var(--primary))"
                                                fillOpacity={0.2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* performance trend */}
                            <div className="bg-card border border-border p-10 rounded-[40px] shadow-sm">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-lg font-black tracking-tight uppercase tracking-[0.1em]">Score Trajectory</h3>
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} domain={[0, 100]} />
                                            <Tooltip contentStyle={{ borderRadius: '20px' }} />
                                            <Area type="monotone" dataKey="score" stroke="rgb(var(--primary))" fillOpacity={1} fill="url(#colorScore)" strokeWidth={4} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Actionable Plan */}
                        <div className="bg-secondary/10 border border-border p-10 rounded-[48px] flex flex-col md:flex-row items-center gap-10">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                                <RefreshCw className="w-10 h-10 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <h4 className="text-xl font-black">AI Recommended Path</h4>
                                <p className="text-muted-foreground font-medium italic">
                                    "{data.analysis?.recommendedTopics?.[0] || 'Analyzing learning curve to suggest next steps...'}"
                                </p>
                            </div>
                            <button className="px-8 py-4 bg-primary text-white rounded-[24px] font-black text-sm hover:scale-105 transition-all shadow-xl flex items-center gap-3">
                                Assign Focused Content
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
