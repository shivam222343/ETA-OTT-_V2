import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, Upload, FileText, Video, Image,
    Filter, Search, Plus, Download, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import UploadContentModal from '../../components/faculty/UploadContentModal';
import BulkUploadModal from '../../components/faculty/BulkUploadModal';
import ContentCard from '../../components/faculty/ContentCard';
import ContentViewer from '../../components/faculty/ContentViewer';
import CourseKnowledgeGraph from '../../components/faculty/CourseKnowledgeGraph';
import StudentProfileSlideover from '../../components/faculty/StudentProfileSlideover';
import { Network, Layers, Users as UsersIcon, Mail, Trophy as TrophyIcon } from 'lucide-react';
import Loader from '../../components/Loader';
import ThemeToggle from '../../components/ThemeToggle';

export default function ManageCourseContent() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [content, setContent] = useState([]);
    const [filteredContent, setFilteredContent] = useState([]);

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showStudentSlideover, setShowStudentSlideover] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [selectedContent, setSelectedContent] = useState(null);
    const [showViewer, setShowViewer] = useState(false);
    const [showGraph, setShowGraph] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('content'); // 'content' or 'students'
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [fetchingStudents, setFetchingStudents] = useState(false);

    useEffect(() => {
        const handleOpenGraph = (e) => {
            if (e.detail.courseId === courseId) {
                setShowGraph(true);
            }
        };
        window.addEventListener('open-course-graph', handleOpenGraph);
        return () => window.removeEventListener('open-course-graph', handleOpenGraph);
    }, [courseId]);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    // Polling for processing items
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            // We use a ref-like approach by checking the current state
            // But since we're in an effect, we need to be careful.
            // A better way is to check the state inside the interval or use a functional update.
            setContent(prevContent => {
                const hasProcessingItems = prevContent.some(c =>
                    c.processingStatus === 'processing' || c.processingStatus === 'pending'
                );

                if (hasProcessingItems) {
                    // Trigger a silent update
                    fetchContentUpdate();
                }
                return prevContent;
            });
        }, 10000); // Increased to 10 seconds to be less aggressive

        return () => clearInterval(pollInterval);
    }, [courseId]);

    const fetchContentUpdate = async () => {
        try {
            const response = await apiClient.get(`/content/course/${courseId}`);
            setContent(response.data.data.content || []);
        } catch (error) {
            console.error('Silent content update error:', error);
        }
    };

    useEffect(() => {
        filterContent();
    }, [content, searchQuery, typeFilter, difficultyFilter]);

    const fetchCourseData = async () => {
        setLoading(true);
        try {
            // Fetch course details
            const courseResponse = await apiClient.get(`/courses/${courseId}`);
            setCourse(courseResponse.data.data.course);

            // Fetch content for this course
            const contentResponse = await apiClient.get(`/content/course/${courseId}`);
            setContent(contentResponse.data.data.content || []);

            // If we are on students tab, fetch them too
            if (activeTab === 'students') {
                fetchEnrolledStudents();
            }
        } catch (error) {
            console.error('Fetch course data error:', error);
            toast.error('Failed to load course data');
        } finally {
            setLoading(false);
        }
    };

    const filterContent = () => {
        let filtered = [...content];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(item => item.type === typeFilter);
        }

        // Difficulty filter
        if (difficultyFilter !== 'all') {
            filtered = filtered.filter(item => item.metadata?.difficulty === difficultyFilter);
        }

        setFilteredContent(filtered);
    };

    const handleUploadSuccess = (newContent) => {
        setContent([newContent, ...content]);
        toast.success('Content uploaded successfully!');
    };

    const fetchEnrolledStudents = async () => {
        setFetchingStudents(true);
        try {
            const response = await apiClient.get(`/courses/${courseId}/students`);
            setEnrolledStudents(response.data.data.students || []);
        } catch (error) {
            console.error('Fetch students error:', error);
            toast.error('Failed to load enrolled students');
        } finally {
            setFetchingStudents(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'students' && enrolledStudents.length === 0) {
            fetchEnrolledStudents();
        }
    }, [activeTab]);

    const handleViewContent = (item) => {
        setSelectedContent(item);
        setShowViewer(true);
    };

    const handleDownloadContent = async (content) => {
        try {
            // Increment download count
            await apiClient.get(`/content/${content._id}`);

            // Download file
            const link = document.createElement('a');
            link.href = content.file.url;
            link.download = content.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download content');
        }
    };

    const handleDeleteContent = async (contentItem) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            await apiClient.delete(`/content/${contentItem._id}`);
            setContent(content.filter(c => c._id !== contentItem._id));
            toast.success('Content deleted successfully');
        } catch (error) {
            console.error('Delete content error:', error);
            toast.error('Failed to delete content');
        }
    };

    const handleReprocessContent = async (contentItem) => {
        try {
            await apiClient.post(`/content/${contentItem._id}/reprocess`);

            // Update local state to show as pending/processing
            setContent(content.map(c =>
                c._id === contentItem._id
                    ? { ...c, processingStatus: 'pending', processingError: null }
                    : c
            ));

            toast.success('Reprocessing started');
        } catch (error) {
            console.error('Reprocess content error:', error);
            toast.error('Failed to start reprocessing');
        }
    };

    const getContentStats = () => {
        const stats = {
            total: content.length,
            pdf: content.filter(c => c.type === 'pdf').length,
            video: content.filter(c => c.type === 'video').length,
            other: content.filter(c => !['pdf', 'video'].includes(c.type)).length,
            totalViews: content.reduce((sum, c) => sum + (c.stats?.viewCount || 0), 0),
            totalDownloads: content.reduce((sum, c) => sum + (c.stats?.downloadCount || 0), 0)
        };
        return stats;
    };

    if (loading) {
        return <Loader />;
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-muted-foreground mb-4">Course not found</p>
                <button onClick={() => navigate(-1)} className="btn-primary">
                    Go Back
                </button>
            </div>
        );
    }

    const stats = getContentStats();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="bg-card border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="header-responsive">
                        <div className="header-title-group">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold truncate max-w-[200px] sm:max-w-[400px] md:max-w-none">{course.name}</h1>
                                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                                        Manage learning materials
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="header-actions-group">
                            <ThemeToggle />
                            <button onClick={() => setShowGraph(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-all shadow-sm">
                                <Network className="w-4 h-4 text-primary" />
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Knowledge Graph</span>
                            </button>
                            <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary/30 hover:bg-secondary/50 rounded-xl transition-all shadow-sm">
                                <Plus className="w-4 h-4 text-primary" />
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Upload Resource</span>
                            </button>
                            <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-all shadow-lg shadow-primary/20">
                                <Layers className="w-4 h-4" />
                                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Bulk Upload</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pdf}</p>
                                <p className="text-sm text-muted-foreground">PDFs</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Video className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.video}</p>
                                <p className="text-sm text-muted-foreground">Videos</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalViews}</p>
                                <p className="text-sm text-muted-foreground">Views</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Download className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                                <p className="text-sm text-muted-foreground">Downloads</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Tabs */}
            <div className="container mx-auto px-4 mt-8 border-b border-border/50">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'content' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Course Resources
                        {activeTab === 'content' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'students' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Enrolled Students
                        {activeTab === 'students' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8">
                {activeTab === 'content' ? (
                    <>
                        {/* Filters */}
                        <div className="card p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search content..."
                                            className="input w-full pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="pdf">PDF</option>
                                        <option value="video">Video</option>
                                        <option value="presentation">Presentation</option>
                                        <option value="document">Document</option>
                                        <option value="image">Image</option>
                                    </select>
                                </div>
                                <div>
                                    <select
                                        value={difficultyFilter}
                                        onChange={(e) => setDifficultyFilter(e.target.value)}
                                        className="input w-full"
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        {filteredContent.length === 0 ? (
                            <div className="card p-12 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {content.length === 0 ? 'No content yet' : 'No matching content'}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {content.length === 0
                                        ? 'Upload your first learning material to get started'
                                        : 'Try adjusting your filters'}
                                </p>
                                {content.length === 0 && (
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className="btn-primary"
                                    >
                                        Upload Content
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredContent.map((item) => (
                                    <ContentCard
                                        key={item._id}
                                        content={item}
                                        onView={handleViewContent}
                                        onDownload={handleDownloadContent}
                                        onDelete={handleDeleteContent}
                                        onReprocess={handleReprocessContent}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {fetchingStudents ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-48 bg-card animate-pulse rounded-3xl border border-border/50" />
                                ))
                            ) : enrolledStudents.length > 0 ? (
                                enrolledStudents.map((student) => (
                                    <motion.div
                                        key={student._id}
                                        whileHover={{ y: -5 }}
                                        onClick={() => {
                                            setSelectedStudentId(student._id);
                                            setShowStudentSlideover(true);
                                        }}
                                        className="bg-card p-6 rounded-3xl border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all group cursor-pointer overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
                                            <UsersIcon className="w-24 h-24" />
                                        </div>
                                        <div className="flex items-center gap-4 relative">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20 overflow-hidden">
                                                {student.profile?.avatar ? (
                                                    <img src={student.profile.avatar} alt={student.profile.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    student.profile?.name?.[0]
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-lg truncate group-hover:text-primary transition-colors">{student.profile.name}</h4>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="truncate">{student.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-border/50">
                                            <div className="p-3 bg-secondary/30 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <TrophyIcon className="w-3 h-3 text-orange-500" />
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Confidence</span>
                                                </div>
                                                <p className="font-black text-primary">{student.confidenceScore || 0}%</p>
                                            </div>
                                            <div className="p-3 bg-secondary/30 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BookOpen className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Enrolled</span>
                                                </div>
                                                <p className="font-black text-primary">{student.progressStats?.coursesEnrolled || 0}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all">
                                            View Performance Analysis
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-20 text-center bg-card/30 rounded-3xl border border-dashed border-border/50">
                                    <UsersIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold">No students enrolled yet</h3>
                                    <p className="text-sm text-muted-foreground">Students from selected branches will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <UploadContentModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={handleUploadSuccess}
                courseId={courseId}
                courseName={course.name}
            />

            {/* Bulk Upload Modal */}
            <BulkUploadModal
                isOpen={showBulkModal}
                onClose={() => setShowBulkModal(false)}
                onSuccess={handleUploadSuccess}
                courseId={courseId}
                courseName={course.name}
            />
            {/* Content Viewer Modal */}
            <ContentViewer
                isOpen={showViewer}
                onClose={() => {
                    setShowViewer(false);
                    setSelectedContent(null);
                }}
                content={selectedContent}
            />

            {/* Student Profile Slideover */}
            <StudentProfileSlideover
                isOpen={showStudentSlideover}
                onClose={() => setShowStudentSlideover(false)}
                studentId={selectedStudentId}
                courseName={course?.name}
            />

            {/* Knowledge Graph Modal */}
            <CourseKnowledgeGraph
                isOpen={showGraph}
                onClose={() => setShowGraph(false)}
                courseId={courseId}
            />
        </div>
    );
}
