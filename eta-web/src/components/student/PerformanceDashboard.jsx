import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, Target, Clock, Brain, TrendingUp, BookOpen,
    BarChart3, AlertTriangle, CheckCircle2, XCircle,
    Sparkles, RefreshCw, ChevronRight, Zap, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import Loader from '../Loader';
import { renderMarkdown } from '../../utils/markdown';

export default function PerformanceDashboard({ user }) {
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [language, setLanguage] = useState(localStorage.getItem('ai_tutor_lang') || 'english');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchPerformance();
        fetchHistory();
    }, []);

    const fetchPerformance = async () => {
        try {
            const response = await apiClient.get('/quiz/performance/me');
            if (response.data.success) {
                setPerformance(response.data.data);
            }
        } catch (error) {
            console.error('Performance fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get('/quiz/history/me?limit=20');
            if (response.data.success) {
                setHistory(response.data.data.quizzes);
            }
        } catch (error) {
            console.error('History fetch error:', error);
        }
    };

    const fetchAiAnalysis = async () => {
        setAnalysisLoading(true);
        try {
            const response = await apiClient.get(`/quiz/ai-analysis/me?language=${language}`);
            if (response.data.success) {
                setAiAnalysis(response.data.data.analysis);
            }
        } catch (error) {
            toast.error('Failed to generate AI analysis');
        } finally {
            setAnalysisLoading(false);
        }
    };

    if (loading) return <Loader fullScreen={false} />;

    const stats = performance?.stats || {};
    const scoreTrend = performance?.scoreTrend || [];
    const coursePerf = performance?.coursePerformance || [];
    const weakTopics = performance?.weakTopics || [];
    const strongTopics = performance?.strongTopics || [];

    // Calculate max score for chart scaling
    const maxScore = Math.max(...scoreTrend.map(s => s.percentage), 100);

    const statCards = [
        { label: 'Total Quizzes', value: stats.totalQuizzes || 0, icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Avg Score', value: `${stats.avgPercentage || 0}%`, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Questions Answered', value: stats.totalQuestions || 0, icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Avg Time', value: `${Math.floor((stats.avgTimeTaken || 0) / 60)}m`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' }
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card p-5 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {stats.totalQuizzes === 0 ? (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-card border border-dashed border-border rounded-3xl p-16 text-center space-y-4"
                >
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                        <Trophy className="w-10 h-10 text-primary/30" />
                    </div>
                    <h3 className="text-xl font-bold">No Quiz Data Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Start learning any course content and click <strong>"Test Your Knowledge"</strong> to take your first quiz.
                        Your performance data will appear here!
                    </p>
                </motion.div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Score Trend Chart */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card border border-border rounded-2xl p-6 space-y-4"
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                Score Trend
                            </h3>
                            {scoreTrend.length > 0 ? (
                                <div className="flex items-end gap-2 h-40">
                                    {scoreTrend.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className="flex-1 flex flex-col items-center gap-1 group"
                                            title={`${entry.contentId?.title || 'Quiz'}: ${entry.percentage}%`}
                                        >
                                            <span className="text-[9px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                {entry.percentage}%
                                            </span>
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(entry.percentage / maxScore) * 100}%` }}
                                                transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
                                                className={`w-full rounded-t-lg ${entry.percentage >= 70
                                                    ? 'bg-green-500/60'
                                                    : entry.percentage >= 50
                                                        ? 'bg-yellow-500/60'
                                                        : 'bg-red-500/60'
                                                    } group-hover:opacity-80 transition-opacity`}
                                            />
                                            <span className="text-[8px] text-muted-foreground font-bold truncate max-w-full">
                                                {new Date(entry.createdAt).toLocaleDateString('en', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                                    No data yet
                                </div>
                            )}
                        </motion.div>

                        {/* Course-wise Performance */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card border border-border rounded-2xl p-6 space-y-4"
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                Course Performance
                            </h3>
                            {coursePerf.length > 0 ? (
                                <div className="space-y-4">
                                    {coursePerf.map((cp, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold truncate mr-2">{cp.courseName}</span>
                                                <span className="font-bold text-primary">{Math.round(cp.avgPercentage)}%</span>
                                            </div>
                                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${cp.avgPercentage}%` }}
                                                    transition={{ delay: 0.4 + idx * 0.1, duration: 0.6 }}
                                                    className={`h-full rounded-full ${cp.avgPercentage >= 70 ? 'bg-green-500' : cp.avgPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                                <span>{cp.quizCount} quizzes</span>
                                                <span>Best: {Math.round(cp.bestScore)}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                                    No course data yet
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Strong Topics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-card border border-border rounded-2xl p-6 space-y-4"
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Strong Topics
                            </h3>
                            {strongTopics.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {strongTopics.map((t, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold"
                                        >
                                            {t._id} ({t.correctCount})
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No data yet. Complete more quizzes!</p>
                            )}
                        </motion.div>

                        {/* Weak Topics */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-card border border-border rounded-2xl p-6 space-y-4"
                        >
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                Topics to Improve
                            </h3>
                            {weakTopics.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {weakTopics.map((t, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold"
                                        >
                                            {t._id} ({t.wrongCount})
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Great job! No weak areas identified.</p>
                            )}
                        </motion.div>
                    </div>

                    {/* AI Study Analysis */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10 rounded-2xl p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                AI Tutor Analysis
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-xl shadow-sm">
                                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
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
                                    onClick={fetchAiAnalysis}
                                    disabled={analysisLoading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
                                >
                                    {analysisLoading ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Zap className="w-3 h-3" />
                                    )}
                                    {aiAnalysis ? 'Regenerate' : 'Generate Analysis'}
                                </button>
                            </div>
                        </div>

                        {analysisLoading ? (
                            <div className="flex items-center gap-3 py-8 justify-center">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                <span className="text-sm text-muted-foreground">AI is analyzing your journey...</span>
                            </div>
                        ) : aiAnalysis ? (
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: renderMarkdown(aiAnalysis)
                                }}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                Click "Generate Analysis" to get personalized study tips from your AI tutor! 🎓
                            </p>
                        )}
                    </motion.div>

                    {/* Quiz History */}
                    {history.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="bg-card border border-border rounded-2xl overflow-hidden"
                        >
                            <div className="p-5 border-b border-border">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-primary" />
                                    Quiz History
                                </h3>
                            </div>
                            <div className="divide-y divide-border/50">
                                {history.map((q, idx) => (
                                    <div key={q._id || idx} className="flex items-center gap-4 p-4 hover:bg-secondary/10 transition-colors">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${q.percentage >= 70
                                            ? 'bg-green-500/10 text-green-500'
                                            : q.percentage >= 50
                                                ? 'bg-yellow-500/10 text-yellow-500'
                                                : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {q.percentage}%
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{q.contentId?.title || 'Quiz'}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                {q.courseId?.name || 'Course'} • {q.score}/{q.config?.totalQuestions} correct
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-medium">{new Date(q.createdAt).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {Math.floor((q.timeTaken || 0) / 60)}m {(q.timeTaken || 0) % 60}s
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
}
