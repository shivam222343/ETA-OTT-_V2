import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, BookOpen, MessageSquare,
    Bell, Settings, LogOut, Menu, X,
    Plus, Search, Trophy, Clock,
    ArrowRight, Star, GraduationCap,
    Grid, List, Filter, FileText, Video,
    Layers, Building2, Users, Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import JoinBranchModal from '../../components/student/JoinBranchModal';
import StudentDoubtManager from '../../components/student/StudentDoubtManager';
import Loader from '../../components/Loader';
import ContentViewer from '../../components/faculty/ContentViewer';
import ExtractedInfoModal from '../../components/faculty/ExtractedInfoModal';

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
            setCourses(coursesRes.data.data.courses || []);
            setRecentContent(contentRes.data.data.recentContent || []);
        } catch (error) {
            console.error('Fetch student data error:', error);
            setError(true);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
        toast.success('Logged out successfully');
    };

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'courses', icon: BookOpen, label: 'My Courses' },
        { id: 'content', icon: FileText, label: 'Recent Uploads' },
        { id: 'doubts', icon: MessageSquare, label: 'My Doubts' },
        { id: 'analytics', icon: Trophy, label: 'Learning Progress' },
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
        <div className="min-h-screen bg-background flex overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {isSidebarOpen && (
                    <motion.aside
                        initial={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
                        animate={isMobile ? { x: 0 } : { width: 280, opacity: 1 }}
                        exit={isMobile ? { x: -300 } : { width: 0, opacity: 0 }}
                        className="fixed lg:relative z-40 h-full bg-card border-r border-border flex flex-col transition-all duration-300"
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
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {user?.profile?.name?.[0] || 'S'}
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
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? '' : 'group-hover:scale-110 transition-transform'}`} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="p-4 mt-auto border-t border-border/50 space-y-2">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                                <Settings className="w-5 h-5" />
                                <span className="font-medium">Settings</span>
                            </button>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all font-medium">
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden overflow-y-auto">
                <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {!isSidebarOpen && (
                                <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                    <Menu className="w-6 h-6" />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold capitalize">Good Morning, {user?.profile?.name?.split(' ')[0] || 'Learner'}! 👋</h2>
                                <p className="text-xs text-muted-foreground">Continue where you left off today.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative hidden md:block">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input type="text" placeholder="Search courses..." className="input pl-10 w-64 bg-secondary/50 border-none focus:ring-1 focus:ring-primary/30" />
                            </div>
                            <button className="p-3 bg-secondary/50 rounded-xl relative hover:bg-secondary transition-colors group">
                                <Bell className="w-5 h-5 group-hover:shake transition-opacity" />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                            </button>
                            <button onClick={() => setShowJoinModal(true)} className="btn-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Join Branch</span>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
                    {/* Stats Grid */}
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

                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column - Enrolled Branches/Courses */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-primary" />
                                            Your Learning Communities
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

                            {/* Recent Resources (Horizontal Scrolling) */}
                            {recentContent.length > 0 && (
                                <div className="space-y-12 mt-12 pt-12 border-t border-border/50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <Layers className="w-5 h-5 text-primary" />
                                            Recent Resources
                                        </h3>
                                        <button onClick={() => setActiveTab('content')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                            View All <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Videos Row */}
                                    {recentContent.filter(c => c.type === 'video').length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Video className="w-4 h-4" /></div>
                                                <h4 className="font-bold text-sm tracking-tight text-foreground/80">Video Lectures</h4>
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                                                {recentContent.filter(c => c.type === 'video').map((content) => (
                                                    <motion.div
                                                        key={content._id}
                                                        whileHover={{ y: -4 }}
                                                        className="min-w-[300px] w-[300px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50 transition-all"
                                                        onClick={() => setSelectedContent(content)}
                                                    >
                                                        <div className="relative aspect-video bg-secondary">
                                                            {content.file?.thumbnail?.url ? (
                                                                <img src={content.file.thumbnail.url} alt={content.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center"><Video className="w-10 h-10 text-primary/20" /></div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Play className="w-5 h-5 fill-current" /></div>
                                                            </div>
                                                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-widest">{content.file?.format === 'youtube' ? 'YouTube' : 'Video'}</div>
                                                            {content.file?.duration && (
                                                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                                                                    {Math.floor(content.file.duration / 60)}:{(content.file.duration % 60).toString().padStart(2, '0')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-4">
                                                            <h5 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{content.title}</h5>
                                                            <p className="text-[10px] text-muted-foreground truncate mt-1">{content.courseId?.name}</p>
                                                            <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50">
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                                    {new Date(content.createdAt).toLocaleDateString()} {new Date(content.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Start Watching</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* PDFs Row */}
                                    {recentContent.filter(c => c.type === 'pdf').length > 0 && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500"><FileText className="w-4 h-4" /></div>
                                                <h4 className="font-bold text-sm tracking-tight text-foreground/80">Reading Materials</h4>
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                                                {recentContent.filter(c => c.type === 'pdf').map((content) => (
                                                    <motion.div
                                                        key={content._id}
                                                        whileHover={{ y: -4 }}
                                                        className="min-w-[200px] w-[200px] bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-orange-500/5 hover:border-orange-500/30 transition-all"
                                                        onClick={() => setSelectedContent(content)}
                                                    >
                                                        <div className="relative aspect-[3/4] bg-secondary">
                                                            {content.file?.thumbnail?.url ? (
                                                                <img src={content.file.thumbnail.url} alt={content.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-2">
                                                                    <FileText className="w-10 h-10 text-orange-500/20" />
                                                                    <span className="text-[10px] text-muted-foreground font-medium">{content.title}</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <div className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2">Read Now <ArrowRight className="w-3 h-3" /></div>
                                                            </div>
                                                            {content.file?.pages && <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">{content.file.pages} pages</div>}
                                                        </div>
                                                        <div className="p-3">
                                                            <h5 className="font-bold text-xs truncate group-hover:text-orange-500 transition-colors">{content.title}</h5>
                                                            <p className="text-[10px] text-muted-foreground truncate mt-1">{content.courseId?.name}</p>
                                                            <div className="mt-2 flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                                <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                                                                <span>{new Date(content.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
                            {recentContent.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {recentContent.map((item) => (
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
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 mb-6"><MessageSquare className="w-6 h-6 text-primary" />My Academic Doubts</h3>
                            <StudentDoubtManager />
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="bg-card border border-border rounded-3xl p-20 text-center">
                            <h3 className="text-xl font-bold mb-2 uppercase tracking-widest opacity-20">{activeTab}</h3>
                            <p className="text-muted-foreground">This section is being prepared for your personalized learning experience.</p>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {selectedContent && (
                    <div className="fixed inset-0 z-[100] bg-background">
                        <ContentViewer
                            isOpen={!!selectedContent}
                            content={selectedContent}
                            onClose={() => setSelectedContent(null)}
                        />
                    </div>
                )}
                <ExtractedInfoModal
                    isOpen={showInfoModal}
                    onClose={() => {
                        setShowInfoModal(false);
                        setInfoContent(null);
                    }}
                    content={infoContent}
                />
            </AnimatePresence>

            <JoinBranchModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                onSuccess={() => {
                    fetchStudentData();
                    setShowJoinModal(false);
                }}
            />
        </div>
    );
}
