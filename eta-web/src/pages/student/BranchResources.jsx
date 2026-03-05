import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BookOpen, GraduationCap, ArrowLeft,
    Search, Filter, Grid, List, ChevronRight,
    SearchX, Clock, Trophy
} from 'lucide-react';
import apiClient from '../../api/axios.config';
import Loader from '../../components/Loader';
import ThemeToggle from '../../components/ThemeToggle';

export default function BranchResources() {
    const { branchId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [branch, setBranch] = useState(null);
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchBranchData();
    }, [branchId]);

    const fetchBranchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [branchRes, coursesRes] = await Promise.all([
                apiClient.get(`/branches/${branchId}`),
                apiClient.get(`/courses/branch/${branchId}`)
            ]);
            setBranch(branchRes.data.data.branch);
            setCourses((coursesRes.data.data.courses || []).filter(c => c.code !== 'YT_DISCOVERY'));
        } catch (error) {
            console.error('Fetch branch resources error:', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <SearchX className="w-16 h-16 text-red-500/20 mb-6" />
                <h2 className="text-2xl font-bold mb-2">Could not load branch</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    We had trouble fetching the courses for this branch. Please try again.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={fetchBranchData}
                        className="btn-primary px-8"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 header-responsive">
                    <div className="header-title-group">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-secondary rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{branch?.name}</h1>
                            <p className="text-xs text-muted-foreground">
                                {branch?.institutionId?.name} • {courses.length} Courses Available
                            </p>
                        </div>
                    </div>
                    <div className="header-actions-group">
                        <ThemeToggle />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Search and Filters */}
                <div className="header-responsive">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search your courses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 w-full bg-secondary/30 border-none focus:ring-1 focus:ring-primary/40"
                        />
                    </div>
                    <div className="header-actions-group">
                        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
                            <Filter className="w-4 h-4" />
                            <span className="btn-text">Filter</span>
                        </button>
                    </div>
                </div>

                {/* Courses Grid */}
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border mt-8">
                        <SearchX className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold">No courses found</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search query.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course, idx) => (
                            <motion.div
                                key={course._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 group cursor-pointer"
                                onClick={() => navigate(`/student/course/${course._id}`)}
                            >
                                <div className="h-32 bg-gradient-to-br from-primary/10 to-blue-600/10 p-6 flex flex-col justify-end relative">
                                    <div className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase bg-background/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                                        {course.code || 'CRS'}
                                    </div>
                                    <h3 className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                        {course.name}
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4 text-foreground">
                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                                        {course.description || 'Access all learning materials, exercises, and assessments for this course.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            <div className="p-2 rounded-lg bg-secondary/50">
                                                <BookOpen className="w-3 h-3 text-primary" />
                                            </div>
                                            {course.stats?.totalContent || 0} Contents
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            <div className="p-2 rounded-lg bg-secondary/50">
                                                <Clock className="w-3 h-3 text-primary" />
                                            </div>
                                            Self-Paced
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-secondary/80 flex items-center justify-center text-[8px] font-bold">
                                                    {i}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="btn-primary py-2 px-4 rounded-xl text-xs flex items-center gap-2">
                                            Access Course
                                            <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
