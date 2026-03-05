import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, FileText, Video, Code,
    ArrowLeft, Search, Filter, Play,
    ExternalLink, Download, Clock, Star, Trophy,
    ChevronRight, Lock, MessageSquare, List,
    FileCode, FileImage, FileAudio, FileQuestion, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import Loader from '../../components/Loader';
import ThemeToggle from '../../components/ThemeToggle';

// Lazy Loaded Components
const ContentViewer = lazy(() => import('../../components/faculty/ContentViewer'));
const ExtractedInfoModal = lazy(() => import('../../components/faculty/ExtractedInfoModal'));

export default function CourseResources() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [course, setCourse] = useState(null);
    const [contents, setContents] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoContent, setInfoContent] = useState(null);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await apiClient.get(`/courses/${courseId}`);
            setCourse(response.data.data.course);
            // Filter out any null/undefined items (orphaned references)
            const validContents = (response.data.data.course.contentIds || []).filter(item => item !== null && typeof item === 'object' && item._id);
            setContents(validContents);
        } catch (error) {
            console.error('Fetch course resources error:', error);
            setError(true);
            toast.error('Failed to load course materials');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'video': return Video;
            case 'pdf': return FileText;
            case 'code': return Code;
            case 'document': return FileCode;
            case 'image': return FileImage;
            case 'audio': return FileAudio;
            case 'quiz': return FileQuestion;
            default: return FileText;
        }
    };

    const filteredContents = contents.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || item.type === activeTab;
        return matchesSearch && matchesTab;
    });

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
                <BookOpen className="w-16 h-16 text-red-500/20 mb-6" />
                <h2 className="text-2xl font-bold mb-2">Could not load course</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                    We had trouble fetching the contents for this course. Please try again.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={fetchCourseData}
                        className="btn-primary px-8"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 header-responsive">
                    <div className="header-title-group">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-secondary rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{course?.name}</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                {course?.code || 'COURSE'} • {contents.length} Total Lessons
                            </p>
                        </div>
                    </div>
                    <div className="header-actions-group">
                        <ThemeToggle />
                        <button className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-all shadow-sm">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Rate Course</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Course Summary Card */}
                    <div className="bg-gradient-to-br from-primary/5 to-blue-600/5 rounded-3xl p-8 border border-primary/10">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20">
                                <BookOpen className="w-12 h-12" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <h2 className="text-2xl font-bold leading-tight">Master this topic at your own pace</h2>
                                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                                    {course?.description || 'Build core expertise through interactive lessons, high-quality video content, and comprehensive documentation. Track your progress as you go.'}
                                </p>
                                <div className="flex flex-wrap gap-4 pt-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                                        <Clock className="w-3 h-3 text-primary" />
                                        12 Hours Total
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg border border-border/50">
                                        <Trophy className="w-3 h-3 text-yellow-500" />
                                        Certificate Included
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-2 sm:pb-0">
                                {['all', 'video', 'pdf', 'code', 'quiz'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                            : 'hover:bg-secondary text-muted-foreground'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Find lesson..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input pl-10 w-full py-2 bg-secondary/30 border-none text-sm"
                                />
                            </div>
                        </div>

                        {/* Resource List */}
                        <div className="space-y-3">
                            {filteredContents.length === 0 ? (
                                <div className="py-20 text-center bg-secondary/10 rounded-3xl border border-dashed border-border">
                                    <p className="text-muted-foreground text-sm">No materials found for this filter.</p>
                                </div>
                            ) : (
                                filteredContents.map((content, idx) => {
                                    const Icon = getIcon(content.type);
                                    return (
                                        <motion.div
                                            key={`${content._id || 'content'}-${idx}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => setSelectedContent(content)}
                                            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-primary/5"
                                        >
                                            <div className="relative w-full sm:w-32 aspect-video rounded-xl overflow-hidden bg-secondary/50 group-hover:shadow-md transition-all flex-shrink-0">
                                                {content.file?.thumbnail?.url ? (
                                                    <img
                                                        src={content.file.thumbnail.url}
                                                        alt={content.title}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = ''; // Clear broken src
                                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-secondary/30"><div class="text-[8px] font-bold text-muted-foreground uppercase opacity-40">No Preview</div></div>';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </div>
                                                )}

                                                {/* Overlay Duration/Pages */}
                                                {(content.file?.duration || content.file?.pages) && (
                                                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-[8px] text-white px-1 py-0.5 rounded font-bold">
                                                        {content.type === 'video' ?
                                                            `${Math.floor(content.file.duration / 60)}:${(content.file.duration % 60).toString().padStart(2, '0')}` :
                                                            `${content.file.pages} pages`}
                                                    </div>
                                                )}

                                                {/* Type Icon Overlay */}
                                                <div className="absolute top-1 left-1 p-1 rounded-md bg-black/40 backdrop-blur-sm">
                                                    <Icon className="w-3 h-3 text-white" />
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                                                        {content.title}
                                                    </h4>
                                                    {content.processingStatus !== 'completed' && (
                                                        <span className="text-[8px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded border border-yellow-500/20 animate-pulse">
                                                            Processing AI Features...
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                    <span className="flex items-center gap-1">
                                                        {content.type} • {content.file?.format || (content.processingStatus === 'completed' ? 'Resource' : 'Analyzing...')}
                                                    </span>
                                                    <span className="flex items-center gap-1 opacity-60">
                                                        • {new Date(content.createdAt).toLocaleDateString()} {new Date(content.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                                                <a
                                                    href={content.file.url}
                                                    download={content.title}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2.5 bg-secondary hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setInfoContent(content);
                                                        setShowInfoModal(true);
                                                    }}
                                                    className="p-2.5 bg-secondary hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                                    title="View AI Insights"
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedContent(content)}
                                                    className="flex-1 sm:flex-none py-2 px-6 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-all text-sm font-bold flex items-center justify-center gap-2"
                                                >
                                                    <span className="btn-text">Start Learning</span>
                                                    <Play className="w-3 h-3 fill-current" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </main>

                {/* Performance / Discussion Column */}
                <div className="hidden xl:block w-80 border-l border-border p-6 space-y-8 bg-secondary/10 overflow-y-auto">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" />
                            Your Performance
                        </h4>
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span>Completion</span>
                                    <span>24%</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[24%]" />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Keep going! You're doing great with the theory part.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Course Discussion
                        </h4>
                        <div className="space-y-3">
                            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                                <p className="text-[10px] text-muted-foreground">Join 240+ students discussing this course</p>
                                <button className="w-full py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-[10px] font-bold transition-all">
                                    Open Forum
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Viewer Modal/Modal Overlays */}
            <AnimatePresence mode="wait">
                {selectedContent && (
                    <Suspense fallback={<Loader />}>
                        <motion.div
                            key="content-viewer-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-background"
                        >
                            <ContentViewer
                                isOpen={!!selectedContent}
                                content={selectedContent}
                                onClose={() => setSelectedContent(null)}
                            />
                        </motion.div>
                    </Suspense>
                )}
                {showInfoModal && (
                    <Suspense fallback={null}>
                        <ExtractedInfoModal
                            key="info-modal-overlay"
                            isOpen={showInfoModal}
                            onClose={() => {
                                setShowInfoModal(false);
                                setInfoContent(null);
                            }}
                            content={infoContent}
                        />
                    </Suspense>
                )}
            </AnimatePresence>
        </div>
    );
}
