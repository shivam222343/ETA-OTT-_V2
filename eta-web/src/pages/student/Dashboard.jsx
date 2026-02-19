import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, LayoutDashboard, BookOpen, MessageSquare,
    Bell, LogOut, Menu, X,
    Plus, Search, Trophy, Clock,
    ArrowRight, Star, GraduationCap,
    Grid, List, Filter, FileText, Video,
    Layers, Building2, Users, Play, Youtube
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import Loader from '../../components/Loader';
import ThemeToggle from '../../components/ThemeToggle';

// Lazy Loaded Components
const ProfileSection = lazy(() => import('../../components/ProfileSection'));
const ProfileCompletionModal = lazy(() => import('../../components/ProfileCompletionModal'));
const JoinBranchModal = lazy(() => import('../../components/student/JoinBranchModal'));
const StudentDoubtManager = lazy(() => import('../../components/student/StudentDoubtManager'));
const ContentViewer = lazy(() => import('../../components/faculty/ContentViewer'));
const ExtractedInfoModal = lazy(() => import('../../components/faculty/ExtractedInfoModal'));
const YouTubeFeed = lazy(() => import('../../components/student/YouTubeFeed'));
const LearningProgress = lazy(() => import('../../components/student/LearningProgress'));
export default function StudentDashboard() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [user, setUser] = useState(null);
    const [branches, setBranches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [recentContent, setRecentContent] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoContent, setInfoContent] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [recommendedVideos, setRecommendedVideos] = useState([]);
    const [youtubeLoading, setYoutubeLoading] = useState(false);

    // Profile completion tracking
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [interactionCount, setInteractionCount] = useState(0);
    const [profileSkipped, setProfileSkipped] = useState(false);

    useEffect(() => {
        fetchStudentData();
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchStudentData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [profileRes, branchesRes, coursesRes, contentRes] = await Promise.all([
                apiClient.get('/auth/profile'),
                apiClient.get('/branches/student/my-branches'),
                apiClient.get('/courses/user/my-courses'),
                apiClient.get('/content/recent')
            ]);

            setUser(profileRes.data.data.user);
            setBranches(branchesRes.data.data.branches || []);

            // Filter out YT Discovery course from the dashboard list
            const allCourses = coursesRes.data.data.courses || [];
            setCourses(allCourses.filter(c => c.code !== 'YT_DISCOVERY'));

            setRecentContent(contentRes.data.data.recentContent || []);

            // Fetch YouTube recommendations in background
            fetchYouTubeRecommendations();
        } catch (error) {
            console.error('Fetch student data error:', error);
            setError(true);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Check if profile is incomplete
    const isProfileIncomplete = () => {
        if (!user) return false;
        const profile = user.profile;

        // Basic required fields
        if (!profile.phone || !profile.bio) return true;

        // Role-specific fields
        if (user.role === 'faculty') {
            if (!profile.department || !profile.designation) return true;
        } else if (user.role === 'student') {
            if (!profile.semester || !profile.prnNumber) return true;
        }

        return false;
    };

    // Track interactions and show modal
    const trackInteraction = () => {
        if (isProfileIncomplete() && !profileSkipped && !showProfileModal) {
            const newCount = interactionCount + 1;
            setInteractionCount(newCount);

            // Show modal after 3 interactions
            if (newCount >= 3) {
                setShowProfileModal(true);
                setInteractionCount(0);
            }
        }
    };

    const handleProfileSkip = () => {
        setProfileSkipped(true);
        // Reset skip after 10 more interactions
        setTimeout(() => {
            setProfileSkipped(false);
            setInteractionCount(0);
        }, 60000); // Reset after 1 minute
    };

    // Refresh user data after profile completion
    const handleProfileComplete = async () => {
        await fetchStudentData();
    };

    const fetchYouTubeRecommendations = async () => {
        setYoutubeLoading(true);
        try {
            const response = await apiClient.get('/youtube/recommendations');
            setRecommendedVideos(response.data.data.videos.slice(0, 4));
        } catch (error) {
            console.error('YouTube recommendations error:', error);
        } finally {
            setYoutubeLoading(false);
        }
    };

    const handlePlayYouTube = async (video) => {
        if (youtubeLoading) return;
        setYoutubeLoading(true);
        try {
            const response = await apiClient.post('/youtube/prepare', {
                url: video.url,
                title: video.title,
                thumbnail: video.thumbnail,
                duration: video.duration
            });
            setSelectedContent(response.data.data.content);
        } catch (error) {
            console.error('Play YouTube error:', error);
            toast.error('Failed to prepare AI environment for this video');
        } finally {
            setYoutubeLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'youtube', icon: Video, label: 'YouTube Feed' },
        { id: 'courses', icon: BookOpen, label: 'My Courses' },
        { id: 'content', icon: FileText, label: 'Recent Uploads' },
        { id: 'doubts', icon: MessageSquare, label: 'My Doubts' },
        { id: 'analytics', icon: Trophy, label: 'Learning Progress' },
        { id: 'profile', icon: User, label: 'My Profile' },
    ];

    const stats = [
        { label: 'Enrolled Branches', value: branches.length.toString(), icon: GraduationCap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Courses', value: courses.length.toString(), icon: BookOpen, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Total Content', value: recentContent.length.toString(), icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Certificates', value: '0', icon: Trophy, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    if (loading) return <Loader />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <Bell className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    We couldn't load your dashboard data. Please check your internet connection and try again.
                </p>
                <button onClick={fetchStudentData} className="btn-primary flex items-center gap-2 px-8">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background flex overflow-hidden relative">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-card border-r border-border flex flex-col shadow-xl lg:shadow-none"
                    >
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">E</div>
                                <span className="text-xl font-bold tracking-tight">Eta <span className="text-primary">Student</span></span>
                            </div>
                            {isMobile && (
                                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50">
                                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold border border-primary/20">
                                    {user?.profile?.avatar ? (
                                        <img src={user.profile.avatar} alt={user.profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.profile?.name?.[0] || 'S'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{user?.profile?.name || 'Student Name'}</p>
                                    <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{user?.role || 'Student'}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        trackInteraction();
                                        if (isMobile) setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="p-4 mt-auto border-t border-border/50 space-y-2">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all font-medium">
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="sticky top-0 z-30 bg-background border-b border-border/50 px-6 py-4">
                    <div className="header-dashboard">
                        <div className="header-title-group">
                            {!isSidebarOpen && (
                                <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                                    <Menu className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
                            <div className="hidden sm:flex flex-col items-end min-w-max mr-2">
                                <h2 className="text-sm md:text-base font-black tracking-tight capitalize leading-tight">Good Morning, {user?.profile?.name?.split(' ')[0] || 'Learner'}! 👋</h2>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Beta v2.0</p>
                            </div>

                            <div className="header-actions-group flex items-center gap-2 sm:gap-3">
                                <ThemeToggle />
                                <div className="relative hidden lg:block">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" placeholder="Search courses..." className="input pl-10 w-48 xl:w-64 bg-secondary/50 border-none focus:ring-1 focus:ring-primary/30" />
                                </div>
                                <button className="p-2.5 bg-secondary/50 rounded-xl relative hover:bg-secondary transition-colors group">
                                    <Bell className="w-5 h-5 group-hover:shake transition-opacity" />
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                                </button>
                                <button onClick={() => setShowJoinModal(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Join Branch</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className="w-10 h-10 rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-primary/20 transition-all flex-shrink-0"
                                >
                                    {user?.profile?.avatar ? (
                                        <img src={user.profile.avatar} alt={user.profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user?.profile?.name?.[0] || 'S'}
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="max-w-7xl mx-auto w-full">
                        {/* Stats Grid - Only show on dashboard */}
                        {activeTab === 'dashboard' && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {stats.map((stat, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-card p-4 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                                <stat.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 opacity-20" />
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'dashboard' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column - Enrolled Branches/Courses */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
                                                <GraduationCap className="w-6 h-6 text-primary" />
                                                My Academic Courses
                                            </h3>
                                        </div>

                                        {branches.length === 0 ? (
                                            <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center space-y-4">
                                                <div className="w-20 h-20 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
                                                    <GraduationCap className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold">No Learning Communities yet</h4>
                                                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Join a branch to start your learning journey.</p>
                                                </div>
                                                <button onClick={() => setShowJoinModal(true)} className="btn-primary">Enroll Now</button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {branches.map((branch) => (
                                                    <motion.div
                                                        key={branch._id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                            <GraduationCap className="w-24 h-24" />
                                                        </div>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase">{branch.name[0]}</div>
                                                            <div>
                                                                <h4 className="font-bold">{branch.name}</h4>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{branch.institutionId?.name || 'Institution'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-muted-foreground">Courses</span>
                                                                <span className="font-bold">{branch.stats?.totalCourses || 0}</span>
                                                            </div>
                                                            <button onClick={() => navigate(`/student/branch/${branch._id}`)} className="w-full flex items-center justify-center gap-2 py-3 bg-secondary/50 hover:bg-secondary rounded-xl text-sm font-bold transition-colors">
                                                                Enter Branch
                                                                <ArrowRight className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column - AI Tutoring sidebar */}
                                    <div className="space-y-6">
                                        <div className="bg-secondary/30 rounded-3xl p-6 border border-border space-y-4">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-primary" />
                                                AI Tutoring
                                            </h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Have a doubt? Ask our AI tutor about your course content for instant explanations.
                                            </p>
                                            <button onClick={() => setActiveTab('doubts')} className="w-full py-3 bg-card border border-border rounded-xl text-xs font-bold hover:shadow-md transition-all">Start AI chat</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Faculty Uploaded Content - Full Width Rows */}
                                <div className="space-y-12 pt-8">
                                    {/* Row 01: Faculty Video Lectures (Original Content) */}
                                    {recentContent.filter(c =>
                                        c.type === 'video' &&
                                        c.file?.format !== 'youtube' &&
                                        c.courseId?.code !== 'YT_DISCOVERY'
                                    ).length > 0 && (
                                            <div className="space-y-6">
                                                <div className="header-dashboard">
                                                    <div className="header-title-group min-w-0 flex-1">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner flex-shrink-0">
                                                            <Video className="w-6 h-6" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-xl md:text-2xl font-black tracking-tighter truncate">Faculty Video Lectures</h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></span>
                                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">Row 01 / Original Content</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setActiveTab('content')} className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all text-xs font-bold ring-1 ring-border/50 flex-shrink-0">
                                                        <span className="btn-text">Library</span>
                                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </div>

                                                <div className="relative group/scroll">
                                                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6 snap-x">
                                                        {recentContent.filter(c =>
                                                            c.type === 'video' &&
                                                            c.file?.format !== 'youtube' &&
                                                            c.courseId?.code !== 'YT_DISCOVERY'
                                                        ).map((content) => (
                                                            <motion.div
                                                                key={content._id}
                                                                whileHover={{ y: -10 }}
                                                                className="min-w-[360px] w-[360px] bg-card border border-border/80 rounded-[2rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 transition-all duration-500 snap-start"
                                                                onClick={() => setSelectedContent(content)}
                                                            >
                                                                <div className="relative aspect-video bg-secondary/30">
                                                                    {content.file?.thumbnail?.url ? (
                                                                        <img src={content.file.thumbnail.url} alt={content.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                                                                            <Video className="w-16 h-16 text-primary/20" />
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[1px]">
                                                                        <div className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all duration-300">
                                                                            <Play className="w-7 h-7 fill-current ml-1" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-[10px] font-black text-white uppercase tracking-widest shadow-xl">
                                                                        FACULTY ORIGINAL
                                                                    </div>
                                                                    {content.file?.duration && (
                                                                        <div className="absolute bottom-4 right-4 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-black text-white border border-white/10">
                                                                            {Math.floor(content.file.duration / 60)}:{(content.file.duration % 60).toString().padStart(2, '0')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-6 space-y-4">
                                                                    <div className="space-y-2">
                                                                        <h5 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors tracking-tight">{content.title}</h5>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="w-3.5 h-3.5" /></div>
                                                                            <p className="text-xs text-muted-foreground font-bold truncate tracking-tight">{content.courseId?.name}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="pt-5 border-t border-border/40 flex items-center justify-between">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{new Date(content.createdAt).toLocaleDateString()}</span>
                                                                            <span className="text-[9px] font-bold text-muted-foreground/40">{new Date(content.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                                            Resume Learning <ArrowRight className="w-3 h-3" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {/* Row 02: Course Reference Videos (Academic YouTube Content) */}
                                    {recentContent.filter(c =>
                                        c.type === 'video' &&
                                        c.file?.format === 'youtube' &&
                                        c.courseId?.code !== 'YT_DISCOVERY'
                                    ).length > 0 && (
                                            <div className="space-y-6">
                                                <div className="header-dashboard">
                                                    <div className="header-title-group min-w-0 flex-1">
                                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner flex-shrink-0">
                                                            <Youtube className="w-6 h-6" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-xl md:text-2xl font-black tracking-tighter truncate">Academic YouTube Resources</h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
                                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">Row 02 / Curated Content</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative group/scroll">
                                                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6 snap-x">
                                                        {recentContent.filter(c =>
                                                            c.type === 'video' &&
                                                            c.file?.format === 'youtube' &&
                                                            c.courseId?.code !== 'YT_DISCOVERY'
                                                        ).map((content) => (
                                                            <motion.div
                                                                key={content._id}
                                                                whileHover={{ y: -10 }}
                                                                className="min-w-[320px] w-[320px] bg-card border border-border/80 rounded-[2rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/40 transition-all duration-500 snap-start"
                                                                onClick={() => setSelectedContent(content)}
                                                            >
                                                                <div className="relative aspect-video bg-secondary/30">
                                                                    {content.file?.thumbnail?.url && (
                                                                        <img src={content.file.thumbnail.url} alt={content.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                                                                            <Play className="w-5 h-5 fill-current" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/70 text-[9px] font-bold text-white border border-white/10">
                                                                        YOUTUBE
                                                                    </div>
                                                                </div>
                                                                <div className="p-5 space-y-3">
                                                                    <h5 className="font-bold text-sm leading-tight line-clamp-2 tracking-tight group-hover:text-red-500 transition-colors uppercase italic">{content.title}</h5>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-0.5 rounded-full">{content.courseId?.name}</span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    {/* Faculty Documents Row */}
                                    {recentContent.filter(c =>
                                        c.type === 'pdf' &&
                                        c.courseId?.code !== 'YT_DISCOVERY'
                                    ).length > 0 && (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
                                                            <FileText className="w-6 h-6" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-xl md:text-2xl font-black tracking-tighter truncate">Study Materials & Docs</h3>
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
                                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest truncate">Row 03 / Academic Repository</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative group/scroll">
                                                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6 snap-x">
                                                        {recentContent.filter(c =>
                                                            c.type === 'pdf' &&
                                                            c.courseId?.code !== 'YT_DISCOVERY'
                                                        ).map((content) => (
                                                            <motion.div
                                                                key={content._id}
                                                                whileHover={{ y: -8, scale: 1.02 }}
                                                                className="min-w-[280px] w-[280px] bg-card border border-border/80 rounded-[2rem] overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-orange-500/20 hover:border-orange-500/40 transition-all duration-500 snap-start"
                                                                onClick={() => setSelectedContent(content)}
                                                            >
                                                                <div className="relative aspect-[3/4] bg-secondary/20">
                                                                    {content.file?.thumbnail?.url ? (
                                                                        <img src={content.file.thumbnail.url} alt={content.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center gap-6 bg-gradient-to-b from-orange-500/5 to-transparent">
                                                                            <div className="w-20 h-20 rounded-3xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center shadow-inner">
                                                                                <FileText className="w-10 h-10 text-orange-500/30" />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <span className="text-[10px] font-black text-orange-500/40 uppercase tracking-[0.2em]">Resource</span>
                                                                                <span className="text-xs text-muted-foreground font-bold line-clamp-3 block">{content.title}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end p-8 backdrop-blur-[1px]">
                                                                        <div className="w-full py-4 rounded-[1.25rem] bg-orange-500 text-white text-xs font-black shadow-2xl shadow-orange-500/40 flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                                            Open Study Material
                                                                            <ArrowRight className="w-4 h-4" />
                                                                        </div>
                                                                    </div>
                                                                    {content.file?.pages && (
                                                                        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-[10px] font-black text-white border border-white/10 shadow-lg">
                                                                            {content.file.pages} SHEETS
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-6 space-y-4">
                                                                    <div className="space-y-2">
                                                                        <h5 className="font-bold text-[15px] leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors tracking-tight">{content.title}</h5>
                                                                        <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60 flex items-center gap-2 italic">
                                                                            <div className="w-1 h-3 bg-orange-500/40 rounded-full" />
                                                                            {content.courseId?.name}
                                                                        </p>
                                                                    </div>
                                                                    <div className="pt-4 border-t border-border/30 flex items-center justify-between">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{new Date(content.createdAt).toLocaleDateString()}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 text-[9px] font-black tracking-widest uppercase">
                                                                            {content.file?.size ? (content.file.size / (1024 * 1024)).toFixed(1) + ' MB' : 'PDF DOC'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'youtube' && (
                            <Suspense fallback={<Loader fullScreen={false} />}>
                                <div className="space-y-6">
                                    <YouTubeFeed onPlay={setSelectedContent} />
                                </div>
                            </Suspense>
                        )}

                        {activeTab === 'courses' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><BookOpen className="w-6 h-6 text-primary" />My Enrolled Courses</h3>
                                {courses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {courses.map((course) => (
                                            <motion.div
                                                key={course._id}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all group cursor-pointer"
                                                onClick={() => navigate(`/student/course/${course._id}`)}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="w-6 h-6" /></div>
                                                    <div className="flex flex-col items-end"><span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">{course.code || 'COUR'}</span></div>
                                                </div>
                                                <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">{course.name}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{course.description || 'Access course materials.'}</p>
                                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Building2 className="w-3 h-3" /><span>{course.institutionId?.name}</span></div>
                                                    <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center space-y-4">
                                        <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto" /><p className="text-muted-foreground">No enrolled courses.</p>
                                        <button onClick={() => setActiveTab('dashboard')} className="btn-secondary">Join a Branch</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><FileText className="w-6 h-6 text-primary" />Recent Study Materials</h3>
                                {recentContent.filter(c => c.courseId?.code !== 'YT_DISCOVERY').length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {recentContent.filter(c => c.courseId?.code !== 'YT_DISCOVERY').map((item) => (
                                            <motion.div
                                                key={item._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-all group cursor-pointer"
                                                onClick={() => navigate(`/student/course/${item.courseId?._id}`)}
                                            >
                                                <div className={`aspect-video rounded-xl mb-3 flex items-center justify-center relative overflow-hidden ${item.type === 'video' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                    {item.type === 'video' ? <Video className="w-10 h-10" /> : <FileText className="w-10 h-10" />}
                                                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-background/80 backdrop-blur-sm uppercase">{item.type}</div>
                                                </div>
                                                <h5 className="font-bold text-sm mb-1 truncate group-hover:text-primary transition-colors">{item.title}</h5>
                                                <p className="text-[10px] text-muted-foreground truncate mb-4">{item.courseId?.name}</p>
                                                <div className="flex items-center justify-between text-[10px] font-medium pt-3 border-t border-border/50">
                                                    <span className="text-muted-foreground">
                                                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-primary font-bold">Open Resource</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center"><p className="text-muted-foreground">No study materials available yet.</p></div>
                                )}
                            </div>
                        )}

                        {activeTab === 'doubts' && (
                            <Suspense fallback={<Loader fullScreen={false} />}>
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><MessageSquare className="w-6 h-6 text-primary" />My Academic Doubts</h3>
                                    <StudentDoubtManager />
                                </div>
                            </Suspense>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="space-y-6">
                                <div className="header-dashboard">
                                    <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
                                        <Trophy className="w-6 h-6 text-primary" />
                                        Advanced Learning Analysis
                                    </h3>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] bg-secondary/50 px-4 py-2 rounded-xl border border-border/50">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]"></span>
                                        Real-time Metrics
                                    </div>
                                </div>
                                <Suspense fallback={<Loader fullScreen={false} />}>
                                    <LearningProgress user={user} />
                                </Suspense>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <Suspense fallback={<Loader fullScreen={false} />}>
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <ProfileSection />
                                </div>
                            </Suspense>
                        )}
                    </div>
                </main >

                <AnimatePresence>
                    {selectedContent && (
                        <Suspense fallback={<Loader />}>
                            <div className="fixed inset-0 z-[100] bg-background">
                                <ContentViewer
                                    isOpen={!!selectedContent}
                                    content={selectedContent}
                                    onClose={() => setSelectedContent(null)}
                                />
                            </div>
                        </Suspense>
                    )}
                    <Suspense fallback={null}>
                        <ExtractedInfoModal
                            isOpen={showInfoModal}
                            onClose={() => {
                                setShowInfoModal(false);
                                setInfoContent(null);
                            }}
                            content={infoContent}
                        />
                    </Suspense>
                </AnimatePresence>

                <Suspense fallback={null}>
                    {showJoinModal && (
                        <JoinBranchModal
                            isOpen={showJoinModal}
                            onClose={() => {
                                setShowJoinModal(false);
                                fetchStudentData();
                            }}
                        />
                    )}

                    {showProfileModal && (
                        <ProfileCompletionModal
                            isOpen={showProfileModal}
                            onClose={() => setShowProfileModal(false)}
                            onComplete={handleProfileComplete}
                            onSkip={handleProfileSkip}
                            user={user}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
}
