import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, LayoutDashboard, BookOpen, MessageSquare,
    Bell, LogOut, Menu, X,
    Plus, Search, Trophy, Clock,
    ArrowRight, Star, GraduationCap,
    Grid, List, Filter, FileText, Video,
    Layers, Building2, Users, Play, Youtube, ChevronUp, ChevronDown,
    Crown, Zap, ShieldCheck, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import Loader from '../../components/Loader';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationButton from '../../components/NotificationButton';
import { useSocket } from '../../hooks/useSocket';

// Lazy Loaded Components
const ProfileSection = lazy(() => import('../../components/ProfileSection'));
const ProfileCompletionModal = lazy(() => import('../../components/ProfileCompletionModal'));
const JoinBranchModal = lazy(() => import('../../components/student/JoinBranchModal'));
const JoinWithKeyModal = lazy(() => import('../../components/student/JoinWithKeyModal'));
const StudentDoubtManager = lazy(() => import('../../components/student/StudentDoubtManager'));
const ContentViewer = lazy(() => import('../../components/faculty/ContentViewer'));
const ExtractedInfoModal = lazy(() => import('../../components/faculty/ExtractedInfoModal'));
const YouTubeFeed = lazy(() => import('../../components/student/YouTubeFeed'));
const LearningProgress = lazy(() => import('../../components/student/LearningProgress'));
import UpgradeModal from '../../components/student/UpgradeModal';
export default function StudentDashboard() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showInstJoinModal, setShowInstJoinModal] = useState(false);
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
    const [institutions, setInstitutions] = useState([]);
    const [expandedInstitutions, setExpandedInstitutions] = useState({});

    // Profile completion tracking
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [interactionCount, setInteractionCount] = useState(0);
    const [profileSkipped, setProfileSkipped] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeInstitutionId, setUpgradeInstitutionId] = useState(null);

    const socket = useSocket();

    useEffect(() => {
        fetchStudentData();
        
        if (socket) {
            socket.on('plan_updated', (data) => {
                console.log('Plan updated via socket:', data);
                toast.success('Your subscription has been updated! Refreshing...');
                fetchStudentData(); // Refresh all data including profile and localStorage
            });
        }

        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isPremium = () => {
        return user?.subscriptions?.some(s => s.plan === 'premium');
    };

    const fetchStudentData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [profileRes, branchesRes, coursesRes, contentRes, institutionsRes] = await Promise.all([
                apiClient.get('/auth/profile'),
                apiClient.get('/branches/student/my-branches'),
                apiClient.get('/courses/user/my-courses'),
                apiClient.get('/content/recent'),
                apiClient.get('/institutions/user/my-institutions')
            ]);

            const updatedUser = profileRes.data.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setBranches(branchesRes.data.data.branches || []);

            // Filter out YT Discovery course from the dashboard list
            const allCourses = coursesRes.data.data.courses || [];
            setCourses(allCourses.filter(c => c.code !== 'YT_DISCOVERY'));

            setRecentContent(contentRes.data.data.recentContent || []);
            setInstitutions(institutionsRes.data.data.institutions || []);

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

    const handleContentClick = (content) => {
        if (user.role === 'faculty' || user.role === 'admin') {
            setSelectedContent(content);
            return;
        }

        // Get IDs safely as strings
        const contentInstId = (content.institutionId?._id || content.institutionId || '').toString();
        
        // Find subscription for this institution
        const sub = user.subscriptions?.find(s => 
            (s.institutionId?._id || s.institutionId || '').toString() === contentInstId
        );
        
        const isPremiumUser = sub?.plan === 'premium';
        
        // Treat as premium if accessRules.isPremium is NOT explicitly false
        const isPremiumContent = content.accessRules?.isPremium !== false;

        if (isPremiumContent && !isPremiumUser) {
            setUpgradeInstitutionId(contentInstId);
            setShowUpgradeModal(true);
            return;
        }
        
        setSelectedContent(content);
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
                            <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-500 ${
                                isPremium() 
                                    ? 'bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/30 premium-card-glow' 
                                    : 'bg-secondary/30 border-border/50'
                            }`}>
                                <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold border ${
                                    isPremium() ? 'border-yellow-500 premium-gold-border' : 'bg-primary/10 text-primary border-primary/20'
                                }`}>
                                    {user?.profile?.avatar ? (
                                        <img src={user.profile.avatar} alt={user.profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user?.profile?.name?.[0] || 'S'
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className={`text-sm font-bold truncate ${isPremium() ? 'premium-gold-text' : ''}`}>
                                            {user?.profile?.name || 'Student Name'}
                                        </p>
                                        {isPremium() && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{user?.role || 'Student'}</p>
                                        {isPremium() && (
                                            <span className="premium-badge">Premium</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                            <div className="space-y-2">
                                <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Main Menu</p>
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
                            </div>

                            {institutions.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <div className="px-4 flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Joined Institutions</p>
                                        <Building2 className="w-3 h-3 text-muted-foreground/30" />
                                    </div>
                                    <div className="space-y-2">
                                        {institutions.map((inst) => {
                                            const instBranches = branches.filter(b => 
                                                (b.institutionId?._id || b.institutionId) === inst._id
                                            );
                                            const isExpanded = expandedInstitutions[inst._id];

                                            return (
                                                <div key={inst._id} className="px-2 space-y-1">
                                                    <button 
                                                        onClick={() => setExpandedInstitutions(prev => ({
                                                            ...prev,
                                                            [inst._id]: !prev[inst._id]
                                                        }))}
                                                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group text-left ${
                                                            isExpanded ? 'bg-primary/5 border-primary/20' : 'hover:bg-secondary'
                                                        }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-border group-hover:border-primary/30 overflow-hidden flex-shrink-0">
                                                            {inst.metadata?.logo ? (
                                                                <img src={inst.metadata.logo} alt={inst.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Building2 className="w-4 h-4 text-primary/40" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[11px] font-bold truncate group-hover:text-primary">{inst.name}</p>
                                                                 <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                                                                    (user.subscriptions?.find(s => (s.institutionId?._id || s.institutionId)?.toString() === inst._id?.toString())?.plan === 'premium')
                                                                        ? 'premium-badge'
                                                                        : 'bg-secondary text-muted-foreground border border-border'
                                                                }`}>
                                                                    {(user.subscriptions?.find(s => (s.institutionId?._id || s.institutionId)?.toString() === inst._id?.toString())?.plan === 'premium') ? 'PRO' : 'FREE'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[9px] text-muted-foreground font-medium">{instBranches.length} Branches</p>
                                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="pl-4 space-y-1 overflow-hidden"
                                                            >
                                                                {instBranches.length > 0 ? instBranches.map(branch => (
                                                                    <button
                                                                        key={branch._id}
                                                                        onClick={() => navigate(`/student/branch/${branch._id}`)}
                                                                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-all text-left group"
                                                                    >
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                                                                        <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground truncate">
                                                                            {branch.name}
                                                                        </span>
                                                                    </button>
                                                                )) : (
                                                                    <div className="p-2 text-[9px] text-muted-foreground italic">
                                                                        No branches joined yet
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
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
                                <div className="flex items-center gap-2">
                                    {isPremium() && (
                                        <div className="premium-badge flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black">
                                            <Crown className="w-2.5 h-2.5" />
                                            PREMIUM
                                        </div>
                                    )}
                                    <h2 className={`text-sm md:text-base font-black tracking-tight capitalize leading-tight ${isPremium() ? 'premium-gold-text' : ''}`}>
                                        Good Morning, {user?.profile?.name?.split(' ')[0] || 'Learner'}! 👋
                                    </h2>
                                </div>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Beta v2.0</p>
                            </div>

                            <div className="header-actions-group flex items-center gap-2 sm:gap-3">
                                <ThemeToggle />
                                <div className="hidden lg:block relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input type="text" placeholder="Search courses..." className="input pl-10 w-48 xl:w-64 bg-secondary/50 border-none focus:ring-1 focus:ring-primary/30" />
                                </div>
                                <NotificationButton />
                                <button onClick={() => setShowInstJoinModal(true)} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Join Institute</span>
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
                            <div className="space-y-12">
                                {recentContent.filter(c =>
                                    c.type === 'video' &&
                                    c.courseId?.code !== 'YT_DISCOVERY'
                                ).length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b border-border/50 pb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] ring-1 ring-primary/20">
                                                        <Video className="w-6 h-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-xl md:text-2xl font-black tracking-tighter">Recently Uploaded Course Videos</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Faculty Lectures & Curated Content</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setActiveTab('content')} className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all text-xs font-bold ring-1 ring-border/50">
                                                    View Library
                                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>

                                            <div className="relative group/scroll">
                                                <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6 snap-x">
                                                    {recentContent.filter(c =>
                                                        c.type === 'video' &&
                                                        c.courseId?.code !== 'YT_DISCOVERY'
                                                    ).map((content) => (
                                                        <motion.div
                                                            key={content._id}
                                                            whileHover={{ y: -8 }}
                                                            className="min-w-[340px] w-[340px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all duration-300 snap-start"
                                                            onClick={() => handleContentClick(content)}
                                                        >
                                                            <div className="relative aspect-video bg-secondary/30">
                                                                {content.file?.thumbnail?.url ? (
                                                                    <img src={content.file.thumbnail.url} alt={content.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                                                                        {content.file?.format === 'youtube' ? <Youtube className="w-12 h-12 text-red-500/20" /> : <Video className="w-12 h-12 text-primary/20" />}
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                                                                        <Play className="w-5 h-5 fill-current ml-1" />
                                                                    </div>
                                                                </div>
                                                                <div className={`absolute top-3 left-3 px-2 py-1 rounded-md border text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-md ${content.file?.format === 'youtube' ? 'bg-red-500/40 border-red-500/20' : 'bg-primary/40 border-primary/20'}`}>
                                                                    {content.file?.format === 'youtube' ? 'YouTube Resource' : 'Faculty Lecture'}
                                                                </div>
                                                                {content.accessRules?.isPremium && (
                                                                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-yellow-500/90 text-[9px] font-black text-black uppercase tracking-tighter shadow-lg flex items-center gap-1">
                                                                        <Star className="w-3 h-3 fill-current" />
                                                                        Premium
                                                                    </div>
                                                                )}
                                                                {content.file?.duration && (
                                                                    <div className="absolute bottom-3 right-3 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white">
                                                                        {Math.floor(content.file.duration / 60)}:{(content.file.duration % 60).toString().padStart(2, '0')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-4 space-y-4">
                                                                <div className="space-y-1">
                                                                    <h5 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">{content.title}</h5>
                                                                    <div className="flex items-center gap-1.5 pt-1">
                                                                        <User className="w-3 h-3 text-primary/60" />
                                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                                                                            {content.uploadedBy?.profile?.name || 'Academic Library'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <BookOpen className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                                                        <p className="text-[11px] text-muted-foreground font-medium truncate uppercase tracking-wider">{content.courseId?.name}</p>
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(content.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Left Column - Enrolled Branches/Courses */}
                                    <div className="lg:col-span-2 space-y-6 mt-6">
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
                                    <div className="space-y-6 mt-20">
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

                                {/* Row 03: Study Materials & Docs (Redesigned) */}
                                {recentContent.filter(c =>
                                    c.type === 'pdf' &&
                                    c.courseId?.code !== 'YT_DISCOVERY'
                                ).length > 0 && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-xl md:text-2xl font-black tracking-tighter">Study Materials & Docs</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Academic Repository</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative group/scroll">
                                                <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6 snap-x">
                                                    {recentContent.filter(c =>
                                                        c.type === 'pdf' &&
                                                        c.courseId?.code !== 'YT_DISCOVERY'
                                                    ).map((content) => (
                                                        <motion.div
                                                            key={content._id}
                                                            whileHover={{ y: -4 }}
                                                            className="min-w-[240px] w-[240px] bg-card border border-border rounded-xl group cursor-pointer shadow-sm hover:shadow-md hover:border-orange-500/40 transition-all duration-300 snap-start flex flex-col"
                                                            onClick={() => handleContentClick(content)}
                                                        >
                                                            <div className="relative h-32 bg-secondary/30 rounded-t-xl overflow-hidden flex items-center justify-center">
                                                                <FileText className="w-12 h-12 text-primary/20" />
                                                                {content.accessRules?.isPremium && (
                                                                    <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-yellow-500/90 text-black shadow-lg">
                                                                        <Star className="w-3 h-3 fill-current" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        >
                                                            <div className="p-4 flex flex-col items-center justify-center aspect-[4/3] bg-secondary/10 border-b border-border/30 rounded-t-xl overflow-hidden">
                                                                <div className="w-16 h-16 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center mb-3">
                                                                    <FileText className="w-8 h-8 text-orange-500/40" />
                                                                </div>
                                                                <div className="text-[10px] font-black text-orange-500/60 uppercase tracking-widest">Resource</div>
                                                            </div>
                                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                                <div className="space-y-2">
                                                                    <h5 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors uppercase italic">{content.title}</h5>
                                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase truncate">{content.courseId?.name}</p>
                                                                </div>
                                                                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                                                    <span className="text-[9px] font-semibold text-muted-foreground">{new Date(content.createdAt).toLocaleDateString()}</span>
                                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-500/10 text-orange-600 text-[8px] font-black uppercase">
                                                                        {content.file?.size ? (content.file.size / (1024 * 1024)).toFixed(1) + ' MB' : 'PDF'}
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

                        {activeTab === 'premium' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
                                {/* Premium Hero */}
                                <div className="premium-gold-bg rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                                        <Crown className="w-64 h-64" />
                                    </div>
                                    
                                    <div className="relative z-10 space-y-6">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-yellow-500 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                                            <Star className="w-4 h-4 fill-current" />
                                            Elite Membership Status
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <h2 className="text-4xl md:text-6xl font-black text-black tracking-tighter italic">
                                                {isPremium() ? 'YOU ARE PREMIUM' : 'UPGRADE TO PRO'}
                                            </h2>
                                            <p className="text-black/70 font-bold max-w-xl text-sm md:text-base leading-relaxed">
                                                {isPremium() 
                                                    ? 'You have unlocked the full power of ETA-OTT. Enjoy unlimited AI credits, premium course materials, and priority features.' 
                                                    : 'Join the elite tier of learners. Get unlimited AI credits, unlock all faculty materials, and get priority processing for your videos.'}
                                            </p>
                                        </div>

                                        {isPremium() ? (
                                            <div className="flex flex-wrap gap-4 pt-4">
                                                <div className="px-6 py-3 bg-black text-white rounded-2xl font-black flex items-center gap-2 shadow-xl">
                                                    <Zap className="w-5 h-5 text-yellow-500 fill-current" />
                                                    99,999 AI CREDITS
                                                </div>
                                                <div className="px-6 py-3 bg-white/30 backdrop-blur-md text-black rounded-2xl font-black flex items-center gap-2 border border-white/40">
                                                    <ShieldCheck className="w-5 h-5" />
                                                    PRO VERIFIED
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    setUpgradeInstitutionId(institutions[0]?._id);
                                                    setShowUpgradeModal(true);
                                                }}
                                                className="px-8 py-4 bg-black text-white rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
                                            >
                                                ACTIVATE PREMIUM NOW
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Premium Benefits Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { icon: MessageSquare, title: 'Unlimited AI', desc: 'Ask unlimited doubts and get instant insights from any content.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                        { icon: Lock, title: 'Elite Content', desc: 'Access exclusive materials tagged as premium by your faculty.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                        { icon: Zap, title: 'Speed Boost', desc: 'Your video processing and AI generation gets priority over others.', color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                    ].map((benefit, i) => (
                                        <div key={i} className="bg-card border border-border/50 p-6 rounded-3xl space-y-4 hover:border-primary/30 transition-all group">
                                            <div className={`w-12 h-12 rounded-2xl ${benefit.bg} ${benefit.color} flex items-center justify-center`}>
                                                <benefit.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-black text-lg">{benefit.title}</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Institutions Status */}
                                <div className="bg-card border border-border/50 rounded-[2rem] overflow-hidden">
                                    <div className="p-6 border-b border-border/50 flex items-center justify-between">
                                        <h3 className="font-black text-xl flex items-center gap-3">
                                            <Building2 className="w-6 h-6 text-primary" />
                                            Institution Memberships
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-border/50">
                                        {institutions.length > 0 ? institutions.map(inst => {
                                            const sub = user?.subscriptions?.find(s => (s.institutionId?._id || s.institutionId)?.toString() === inst._id?.toString());
                                            const isInstPremium = sub?.plan === 'premium';

                                            return (
                                                <div key={inst._id} className="p-6 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-border overflow-hidden">
                                                            {inst.metadata?.logo ? (
                                                                <img src={inst.metadata.logo} alt={inst.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Building2 className="w-6 h-6 text-primary/30" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-base">{inst.name}</p>
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                                Joined {new Date(sub?.enrolledAt || Date.now()).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                                            isInstPremium ? 'premium-badge' : 'bg-secondary text-muted-foreground border border-border'
                                                        }`}>
                                                            {isInstPremium ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                                            {isInstPremium ? 'PRO' : 'FREE'}
                                                        </div>
                                                        {!isInstPremium && (
                                                            <button 
                                                                onClick={() => {
                                                                    setUpgradeInstitutionId(inst._id);
                                                                    setShowUpgradeModal(true);
                                                                }}
                                                                className="text-[10px] font-black text-primary hover:underline underline-offset-4 uppercase tracking-widest"
                                                            >
                                                                Upgrade
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="p-12 text-center text-muted-foreground italic">
                                                You haven't joined any institutions yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
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

                    {showInstJoinModal && (
                        <JoinWithKeyModal
                            isOpen={showInstJoinModal}
                            onClose={() => {
                                setShowInstJoinModal(false);
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

                    <UpgradeModal 
                        isOpen={showUpgradeModal} 
                        onClose={() => setShowUpgradeModal(false)} 
                        institutionId={upgradeInstitutionId}
                        user={user}
                    />
                </Suspense>
            </div>
        </div>
    );
}
