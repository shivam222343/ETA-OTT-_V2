import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Building2,
    BookOpen,
    Upload,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    GraduationCap,
    Users,
    FileText,
    Bell,
    Search,
    Plus,
    Key,
    Video,
    Trash2,
    User
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import Loader from '../../components/Loader';
import ThemeToggle from '../../components/ThemeToggle';
import NotificationButton from '../../components/NotificationButton';

// Lazy Loaded Components
const CreateInstitutionModal = lazy(() => import('../../components/faculty/CreateInstitutionModal'));
const JoinInstitutionModal = lazy(() => import('../../components/faculty/JoinInstitutionModal'));
const InstitutionCard = lazy(() => import('../../components/faculty/InstitutionCard'));
const FacultyDoubtManager = lazy(() => import('../../components/faculty/FacultyDoubtManager'));
const ProfileSection = lazy(() => import('../../components/ProfileSection'));
const FacultyAnalytics = lazy(() => import('../../components/faculty/FacultyAnalytics'));

export default function FacultyDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [loading, setLoading] = useState(true);
    const [institutions, setInstitutions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [recentContent, setRecentContent] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState(null);

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'institutions', label: 'Institutions', icon: Building2 },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'content', label: 'Content', icon: Upload },
        { id: 'doubts', label: 'Doubts', icon: MessageSquare },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const stats = [
        { label: 'Institutions', value: institutions.length, icon: Building2, color: 'text-blue-500' },
        { label: 'Branches', value: user?.branchIds?.length || 0, icon: GraduationCap, color: 'text-purple-500' },
        { label: 'Active Courses', value: courses.length, icon: BookOpen, color: 'text-green-500' },
        { label: 'Total Content', value: recentContent.length, icon: FileText, color: 'text-orange-500' },
    ];

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        handleResize(); // Initial call
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [activeTab]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [instRes, courseRes, contentRes] = await Promise.all([
                apiClient.get('/institutions/user/my-institutions'),
                apiClient.get('/courses/user/my-courses'),
                apiClient.get('/content/recent')
            ]);

            setInstitutions(instRes.data.data.institutions || []);
            setCourses((courseRes.data.data.courses || []).filter(c => c.code !== 'YT_DISCOVERY'));
            setRecentContent((contentRes.data.data.recentContent || []).filter(c => c.courseId?.code !== 'YT_DISCOVERY'));
        } catch (error) {
            console.error('Fetch dashboard data error:', error);
            // Don't show toast for recent content failure if other parts work
            if (error.response?.status !== 404) {
                toast.error('Failed to load dashboard data');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInstitution = (newInstitution) => {
        setInstitutions([...institutions, newInstitution]);
    };

    const handleDeleteInstitution = async (id) => {
        if (!confirm('Are you sure you want to delete this institution? This action cannot be undone.')) return;

        try {
            await apiClient.delete(`/institutions/${id}`);
            setInstitutions(institutions.filter(inst => inst._id !== id));
            toast.success('Institution deleted successfully');
        } catch (error) {
            console.error('Delete institution error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete institution');
        }
    };

    const handleLeaveInstitution = async (id) => {
        if (!confirm('Are you sure you want to leave this institution?')) return;

        try {
            await apiClient.post(`/institutions/${id}/leave`);
            setInstitutions(institutions.filter(inst => inst._id !== id));
            toast.success('Left institution successfully');
        } catch (error) {
            console.error('Leave institution error:', error);
            toast.error(error.response?.data?.message || 'Failed to leave institution');
        }
    };

    const handleManageInstitution = (institution) => {
        navigate(`/faculty/institutions/${institution._id}`);
    };

    const handleEditInstitution = (institution) => {
        setSelectedInstitution(institution);
        setShowEditModal(true);
    };

    const handleUpdateInstitution = (updatedInstitution) => {
        setInstitutions(institutions.map(inst =>
            inst._id === updatedInstitution._id ? updatedInstitution : inst
        ));
        setShowEditModal(false);
        setSelectedInstitution(null);
    };

    const handleDeleteContent = async (itemId) => {
        if (!confirm('Are you sure you want to delete this resource? This will remove it from everywhere.')) return;

        try {
            await apiClient.delete(`/content/${itemId}`);
            setRecentContent(recentContent.filter(item => item._id !== itemId));
            toast.success('Resource deleted successfully');
        } catch (error) {
            console.error('Delete content error:', error);
            toast.error('Failed to delete resource');
        }
    };

    return (
        <div className="h-screen bg-background flex relative overflow-hidden">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobile && sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {sidebarOpen && (
                    <motion.aside
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r z-40 flex flex-col shadow-xl lg:shadow-none"
                    >
                        {/* Logo */}
                        <div className="p-6 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-8 h-8 text-primary" />
                                <span className="text-xl font-bold">Eta</span>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20">
                                    {user?.profile?.avatar ? (
                                        <img src={user.profile.avatar} alt={user.profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-primary font-semibold">
                                            {user?.profile?.name?.charAt(0) || 'F'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{user?.profile?.name || 'Faculty'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 p-4 overflow-y-auto">
                            <ul className="space-y-2">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <li key={item.id}>
                                            <button
                                                onClick={() => {
                                                    setActiveTab(item.id);
                                                    if (isMobile) setSidebarOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                                    ? 'bg-primary text-white shadow-lg'
                                                    : 'hover:bg-secondary text-foreground'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="font-medium">{item.label}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>

                        {/* Logout */}
                        <div className="p-4 border-t">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-card border-b px-6 py-4">
                    <div className="header-dashboard">
                        <div className="header-title-group">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4">
                            <h1 className="hidden sm:block text-base md:text-lg font-black tracking-tight mr-2 whitespace-nowrap">Faculty Dashboard</h1>

                            <div className="header-actions-group flex items-center gap-2 sm:gap-3">
                                <ThemeToggle />
                                <div className="hidden lg:flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="bg-transparent border-none outline-none w-32 xl:w-48 text-sm"
                                    />
                                </div>

                                <NotificationButton />

                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className="w-10 h-10 rounded-full overflow-hidden border border-border hover:ring-2 hover:ring-primary/20 transition-all flex-shrink-0"
                                >
                                    {user?.profile?.avatar ? (
                                        <img src={user.profile.avatar} alt={user.profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user?.profile?.name?.[0] || 'F'}
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Welcome */}
                            <div className="card p-6 bg-gradient-to-r from-primary/10 to-purple-500/10">
                                <h2 className="text-3xl font-bold mb-2">
                                    Welcome back, Prof. {user?.profile?.name}! 👋
                                </h2>
                                <p className="text-muted-foreground">
                                    Here's what's happening with your institutions and courses today.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {stats.map((stat, index) => {
                                    const Icon = stat.icon;
                                    return (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="card p-6 hover:shadow-lg transition-shadow"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <Icon className={`w-8 h-8 ${stat.color}`} />
                                            </div>
                                            <p className="text-3xl font-bold mb-1">{stat.value}</p>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Quick Actions */}
                            <div className="card p-6">
                                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => {
                                            setActiveTab('institutions');
                                            setShowCreateModal(true);
                                        }}
                                        className="btn-primary flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Institution
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('content')}
                                        className="btn-secondary flex items-center justify-center gap-2"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Upload Content
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('doubts')}
                                        className="btn-secondary flex items-center justify-center gap-2"
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Review Doubts
                                    </button>
                                </div>
                            </div>

                            {/* Recent Institutions */}
                            {institutions.length > 0 && (
                                <div className="card p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Your Institutions</h3>
                                        <button
                                            onClick={() => setActiveTab('institutions')}
                                            className="text-primary hover:underline text-sm"
                                        >
                                            View All
                                        </button>
                                    </div>
                                    <Suspense fallback={<div className="h-48 flex items-center justify-center bg-secondary/10 rounded-2xl animate-pulse"><Loader fullScreen={false} /></div>}>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {institutions.slice(0, 4).map((institution) => (
                                                <InstitutionCard
                                                    key={institution._id}
                                                    institution={institution}
                                                    onEdit={handleEditInstitution}
                                                    onDelete={handleDeleteInstitution}
                                                    onManage={handleManageInstitution}
                                                    onLeave={handleLeaveInstitution}
                                                    user={user}
                                                />
                                            ))}
                                        </div>
                                    </Suspense>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'institutions' && (
                        <div className="space-y-6">
                            <div className="header-dashboard">
                                <h2 className="text-2xl font-bold truncate">Institutions</h2>
                                <div className="header-actions-group">
                                    <button
                                        onClick={() => setShowJoinModal(true)}
                                        className="btn-secondary flex items-center gap-2"
                                    >
                                        <Key className="w-4 h-4" />
                                        <span className="btn-text">Join Institution</span>
                                    </button>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="btn-text">Create Institution</span>
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <Loader />
                            ) : institutions.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {institutions.map((institution) => (
                                        <InstitutionCard
                                            key={institution._id}
                                            institution={institution}
                                            onEdit={handleEditInstitution}
                                            onDelete={handleDeleteInstitution}
                                            onManage={handleManageInstitution}
                                            onLeave={handleLeaveInstitution}
                                            user={user}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="card p-6">
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg mb-2">No institutions yet</p>
                                        <p className="text-sm mb-4">Create your first institution to get started</p>
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                onClick={() => setShowJoinModal(true)}
                                                className="btn-secondary inline-flex items-center gap-2"
                                            >
                                                <Key className="w-5 h-5" />
                                                Join Existing
                                            </button>
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="btn-primary inline-flex items-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Create New
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="space-y-6">
                            <div className="header-dashboard">
                                <h2 className="text-2xl font-bold truncate">Courses</h2>
                                <button className="btn-primary flex items-center gap-2 flex-shrink-0">
                                    <Plus className="w-5 h-5" />
                                    <span className="btn-text">Add Course</span>
                                </button>
                            </div>
                            {courses.length > 0 ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {courses.map((course) => (
                                        <motion.div
                                            key={course._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="card p-6 border-l-4 border-primary hover:shadow-lg transition-all cursor-pointer"
                                            onClick={() => navigate(`/faculty/courses/${course._id}/content`)}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-1 rounded">
                                                    {course.code || 'NO CODE'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold mb-2 line-clamp-1">{course.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                {course.description || 'No description provided'}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    <span>{course.institutionId?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    <span>{course.branchIds?.length} Branches</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="card p-6">
                                    <div className="text-center py-12 text-muted-foreground">
                                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg mb-2">No courses yet</p>
                                        <p className="text-sm">Create courses within your institutions and branches</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            <div className="header-dashboard">
                                <h2 className="text-2xl font-bold truncate">Content Library</h2>
                                <button className="btn-primary flex items-center gap-2 flex-shrink-0" onClick={() => setActiveTab('courses')}>
                                    <Upload className="w-5 h-5" />
                                    <span className="btn-text">Manage Content</span>
                                </button>
                            </div>
                            {recentContent.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {recentContent.map((item) => (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="card p-4 hover:shadow-lg transition-all group"
                                        >
                                            <div className="aspect-video bg-secondary rounded-lg mb-4 overflow-hidden relative">
                                                {item.type === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                                                        <Video className="w-12 h-12" />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-orange-500/10 text-orange-500">
                                                        <FileText className="w-12 h-12" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded text-[10px] font-bold uppercase">
                                                    {item.type}
                                                </div>
                                            </div>
                                            <h4 className="font-bold mb-1 truncate">{item.title}</h4>
                                            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                                                {item.courseId?.name || 'Unknown Course'}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto pt-3 border-t">
                                                <span className="text-[10px] text-muted-foreground italic">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDeleteContent(item._id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                        title="Delete Resource"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/faculty/courses/${item.courseId?._id}/content`)}
                                                        className="text-xs text-primary font-bold hover:underline"
                                                    >
                                                        View in Course
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="card p-6">
                                    <div className="text-center py-12 text-muted-foreground">
                                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg mb-2">No content uploaded</p>
                                        <p className="text-sm">Upload videos, PDFs, and other learning materials to your courses</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'doubts' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Student Doubts</h2>
                            </div>
                            <Suspense fallback={<Loader />}>
                                <FacultyDoubtManager courses={courses} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <div className="header-dashboard">
                                <h2 className="text-2xl font-bold truncate">Academic Analysis</h2>
                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-3 py-1.5 rounded-lg border border-border/50">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live Processing
                                </div>
                            </div>
                            <Suspense fallback={<Loader />}>
                                <FacultyAnalytics institutions={institutions} courses={courses} />
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Suspense fallback={<Loader />}>
                                <ProfileSection />
                            </Suspense>
                        </div>
                    )}


                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Create Institution Modal */}
            <Suspense fallback={null}>
                <CreateInstitutionModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateInstitution}
                />
            </Suspense>

            {/* Join Institution Modal */}
            <Suspense fallback={null}>
                <JoinInstitutionModal
                    isOpen={showJoinModal}
                    onClose={() => setShowJoinModal(false)}
                    onSuccess={(newInst) => {
                        setInstitutions([...institutions, newInst]);
                        setShowJoinModal(false);
                        fetchDashboardData();
                    }}
                />
            </Suspense>

            {/* Edit Institution Modal */}
            <Suspense fallback={null}>
                <CreateInstitutionModal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedInstitution(null);
                    }}
                    onSuccess={handleUpdateInstitution}
                    institution={selectedInstitution}
                />
            </Suspense>
        </div>
    );
}
