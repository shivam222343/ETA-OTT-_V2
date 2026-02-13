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
import ContentCard from '../../components/faculty/ContentCard';
import ContentViewer from '../../components/faculty/ContentViewer';
import CourseKnowledgeGraph from '../../components/faculty/CourseKnowledgeGraph';
import { Network } from 'lucide-react';
import Loader from '../../components/Loader';

export default function ManageCourseContent() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [content, setContent] = useState([]);
    const [filteredContent, setFilteredContent] = useState([]);

    // Modal states
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [showViewer, setShowViewer] = useState(false);
    const [showGraph, setShowGraph] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');

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
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
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
                                    <h1 className="text-2xl font-bold">{course.name}</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Manage learning materials
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowGraph(true)}
                                className="btn-secondary flex items-center gap-2"
                                title="View Knowledge Graph"
                            >
                                <Network className="w-4 h-4" />
                                <span className="hidden md:inline">Knowledge Graph</span>
                            </button>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Upload Content
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

                {/* Filters */}
                <div className="card p-4 mb-6">
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
            </div>

            {/* Upload Modal */}
            <UploadContentModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
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

            {/* Knowledge Graph Modal */}
            <CourseKnowledgeGraph
                isOpen={showGraph}
                onClose={() => setShowGraph(false)}
                courseId={courseId}
            />
        </div>
    );
}
