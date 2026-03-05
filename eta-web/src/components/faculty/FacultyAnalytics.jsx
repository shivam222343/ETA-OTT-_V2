import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    PieChart, Pie, Cell, ResponsiveContainer,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Scatter, Funnel, FunnelChart, LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import {
    Users, BookOpen, Clock, Activity,
    TrendingUp, Award, BarChart3, PieChart as PieIcon,
    Filter, Brain, Loader2
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

export default function FacultyAnalytics() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchFacultyAnalytics = async () => {
            const userId = user?._id || user?.id;
            if (!userId) {
                setLoading(false);
                return;
            }
            try {
                const response = await apiClient.get(`/analytics/faculty/${userId}`);
                setData(response.data.data);
            } catch (error) {
                console.error('Faculty Analytics fetch error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFacultyAnalytics();
    }, [user?._id, user?.id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium animate-pulse">Aggregating academic insights...</p>
            </div>
        );
    }

    if (!data) return null;

    // Defensive destructuring with defaults
    const {
        engagementTrend = [],
        coursePerformance = [],
        avgResolutionTime = 0
    } = data;

    // Transform Engagement data
    const engagementChartData = engagementTrend.map(t => ({
        month: t.month,
        active: t.activeStudents,
        doubts: t.doubts
    }));

    // Transform Course velocity data
    const courseVelocityData = coursePerformance.map(cp => ({
        name: cp.name?.length > 15 ? cp.name.substring(0, 15) + '...' : (cp.name || 'Unknown Course'),
        students: cp.load || 0,
        health: Math.round(cp.health || 0)
    }));

    // Resolution stats
    const resolutionHours = (avgResolutionTime / (1000 * 60 * 60)).toFixed(1);

    // Empty state check
    if (coursePerformance.length === 0 && engagementTrend.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-card rounded-2xl border border-dashed border-border/50">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                    <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Analytics Data Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                    Once students start asking doubts and engaging with your courses,
                    deep academic insights and trends will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Faculty Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 border-l-4 border-blue-500 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Impact</p>
                            <h3 className="text-3xl font-black">{coursePerformance.reduce((acc, curr) => acc + curr.load, 0)}</h3>
                            <p className="text-xs text-emerald-500 font-bold mt-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Based on resolving doubts
                            </p>
                        </div>
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl"><Users className="w-6 h-6" /></div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6 border-l-4 border-purple-500 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Active Courses</p>
                            <h3 className="text-3xl font-black">{coursePerformance.length}</h3>
                            <p className="text-xs text-emerald-500 font-bold mt-2 flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Under monitoring
                            </p>
                        </div>
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl"><BookOpen className="w-6 h-6" /></div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6 border-l-4 border-emerald-500 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Avg Resolution</p>
                            <h3 className="text-3xl font-black">{resolutionHours}h</h3>
                            <p className="text-xs text-emerald-500 font-bold mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Turnaround time
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl"><Clock className="w-6 h-6" /></div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6 border-l-4 border-orange-500 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Overall Health</p>
                            <h3 className="text-3xl font-black">
                                {coursePerformance.length > 0
                                    ? Math.round(coursePerformance.reduce((acc, curr) => acc + curr.health, 0) / coursePerformance.length)
                                    : 0}%
                            </h3>
                            <p className="text-xs text-orange-500 font-bold mt-2 flex items-center gap-1">
                                <Award className="w-3 h-3" /> Avg resolution rate
                            </p>
                        </div>
                        <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Student Engagement Composite */}
                <ChartCard title="Engagement Multiplier" icon={Activity} description="Active Students vs Doubts Created">
                    <ComposedChart data={engagementChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                        <Tooltip />
                        <Area type="monotone" dataKey="doubts" fill="#3b82f622" stroke="#3b82f6" strokeWidth={2} name="Total Doubts" />
                        <Bar dataKey="active" barSize={20} fill="#10b981" radius={[10, 10, 0, 0]} name="Active Students" />
                    </ComposedChart>
                </ChartCard>

                {/* 2. Top Performing Courses */}
                <ChartCard title="Course Load Analysis" icon={BookOpen} description="Doubt Volume & Resolution Health">
                    <BarChart data={courseVelocityData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={10} width={100} />
                        <Tooltip />
                        <Bar dataKey="students" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Total Doubts" animationDuration={1500} />
                        <Bar dataKey="health" fill="#10b981" radius={[0, 4, 4, 0]} name="Health %" animationDuration={1500} />
                    </BarChart>
                </ChartCard>

                {/* 3. Doubt Resolution Speed Trend */}
                <ChartCard title="Success Metric" icon={TrendingUp} description="Subject resolution rate trajectory">
                    <LineChart data={courseVelocityData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="health" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, fill: '#ef4444' }} name="Health Index" />
                    </LineChart>
                </ChartCard>

                {/* 4. Pie Distribution */}
                <ChartCard title="Sentiment & Resolution" icon={Brain} description="Overall course health distribution">
                    <PieChart>
                        <Pie
                            data={courseVelocityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="health"
                            nameKey="name"
                        >
                            {courseVelocityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ChartCard>
            </div>
        </div>
    );
}

