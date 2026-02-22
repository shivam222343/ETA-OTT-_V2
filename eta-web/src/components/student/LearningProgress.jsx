import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, ResponsiveContainer,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import { motion } from 'framer-motion';
import {
    Clock, BookOpen, MessageSquare, Trophy,
    Target, Zap, Flame, Calendar, MousePointer2,
    Users, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/axios.config';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ChartCard = ({ title, children, icon: Icon, description }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card p-6 bg-card border border-border/50 hover:shadow-xl transition-all group"
    >
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">{description}</p>
                </div>
            </div>
        </div>
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    </motion.div>
);

export default function LearningProgress({ overrideUserId, isCompact = false }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const userId = overrideUserId || user?._id || user?.id;
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const response = await apiClient.get(`/analytics/student/${userId}`);
                setAnalytics(response.data.data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user?._id, user?.id, overrideUserId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">Analyzing your learning journey...</p>
            </div>
        );
    }

    if (!analytics) return null;

    // Defensive destructuring with defaults
    const {
        activityTrend = [],
        subjectMastery = [],
        stats = { totalDoubts: 0, resolvedDoubts: 0, coursesEnrolled: 0, completionRate: 0 },
        engagement = []
    } = analytics;

    // Transform activityTrend for chart
    const activityData = activityTrend.map(t => ({
        day: t._id ? new Date(t._id).toLocaleDateString('en-US', { weekday: 'short' }) : '---',
        doubts: t.count || 0
    }));

    // Transform engagement for pie chart
    const engagementData = engagement.map(e => ({
        name: e._id === 'KNOWLEDGE_GRAPH' ? 'AI Knowledge Graph' : 'Direct AI Chat',
        value: e.count || 0
    }));

    // Topic Mastery transformation
    const masteryData = subjectMastery.map(s => ({
        subject: s.name?.length > 10 ? s.name.substring(0, 10) + '...' : (s.name || 'Topic'),
        A: Math.round(s.proficiency || 0),
        fullMark: 100
    }));

    // Empty state check
    if (activityTrend.length === 0 && subjectMastery.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card rounded-2xl border border-dashed border-border/50">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Learning Data Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                    Start exploring your courses and asking doubts to see your progress
                    visualized in beautiful real-time analytics.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Summary Stats */}
            {!isCompact && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500 rounded-2xl text-white block shadow-lg shadow-blue-500/20">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats.totalDoubts}</p>
                                <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Total Doubts Asked</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{Math.round(stats.completionRate)}%</p>
                                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Course Completion</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats.coursesEnrolled}</p>
                                <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Courses Enrolled</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card p-6 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{stats.resolvedDoubts}</p>
                                <p className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400">Doubt Resolved</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Weekly Activity */}
                <ChartCard title="Doubt Creation Trend" icon={Clock} description="Questions asked per day (last 7 days)">
                    <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="doubts" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                    </BarChart>
                </ChartCard>

                {/* 2. Topic Mastery */}
                <ChartCard title="Subject Proficiency" icon={Target} description="Resolution rate across domains">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                        <PolarGrid strokeOpacity={0.1} />
                        <PolarAngleAxis dataKey="subject" fontSize={10} />
                        <Radar name="Proficiency" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                        <Tooltip />
                    </RadarChart>
                </ChartCard>

                {/* 3. Doubt Source Engagement */}
                <ChartCard title="Doubt Source Distribution" icon={Zap} description="AI Knowledge Graph vs Direct Chat">
                    <PieChart>
                        <Pie
                            data={engagementData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {engagementData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconType="circle" />
                    </PieChart>
                </ChartCard>

                {/* 4. Assessment Placeholder */}
                <ChartCard title="Mastery Progress" icon={Trophy} description="Overall course performance track">
                    <AreaChart data={masteryData}>
                        <defs>
                            <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="subject" axisLine={false} tickLine={false} fontSize={10} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                        <Tooltip />
                        <Area type="monotone" dataKey="A" stroke="#10b981" fillOpacity={1} fill="url(#colorMastery)" strokeWidth={3} />
                    </AreaChart>
                </ChartCard>
            </div>
        </div>
    );
}

