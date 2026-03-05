import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Building2, GraduationCap, BookOpen, Plus,
    Users, FileText, Settings, Trash2, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import CreateBranchModal from '../../components/faculty/CreateBranchModal';
import EditBranchModal from '../../components/faculty/EditBranchModal';
import BranchCard from '../../components/faculty/BranchCard';
import CreateCourseModal from '../../components/faculty/CreateCourseModal';
import EditCourseModal from '../../components/faculty/EditCourseModal';
import CourseCard from '../../components/faculty/CourseCard';
import QRCodeModal from '../../components/faculty/QRCodeModal';
import Loader from '../../components/Loader';
import ThemeToggle from '../../components/ThemeToggle';

export default function ManageInstitution() {
    const { institutionId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [institution, setInstitution] = useState(null);
    const [branches, setBranches] = useState([]);
    const [courses, setCourses] = useState([]);

    // Modal states
    const [showCreateBranch, setShowCreateBranch] = useState(false);
    const [showEditBranch, setShowEditBranch] = useState(false);
    const [showCreateCourse, setShowCreateCourse] = useState(false);
    const [showEditCourse, setShowEditCourse] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);

    // Active tab
    const [activeTab, setActiveTab] = useState('branches');

    useEffect(() => {
        fetchInstitutionData();
    }, [institutionId]);

    const fetchInstitutionData = async () => {
        setLoading(true);
        try {
            // Fetch institution details
            const instResponse = await apiClient.get(`/institutions/${institutionId}`);
            setInstitution(instResponse.data.data.institution);

            // Fetch branches for this institution
            const branchesResponse = await apiClient.get(`/branches/institution/${institutionId}`);
            setBranches(branchesResponse.data.data.branches || []);

            // Fetch courses for this institution
            const coursesResponse = await apiClient.get(`/courses/institution/${institutionId}`);
            setCourses((coursesResponse.data.data.courses || []).filter(c => c.code !== 'YT_DISCOVERY'));
        } catch (error) {
            console.error('Fetch institution data error:', error);
            toast.error('Failed to load institution data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBranch = (newBranch) => {
        setBranches([...branches, newBranch]);
        setShowCreateBranch(false);
    };

    const handleDeleteBranch = async (branchId) => {
        if (!confirm('Are you sure you want to delete this branch?')) return;

        try {
            await apiClient.delete(`/branches/${branchId}`);
            setBranches(branches.filter(b => b._id !== branchId));
            toast.success('Branch deleted successfully');
        } catch (error) {
            console.error('Delete branch error:', error);
            toast.error('Failed to delete branch');
        }
    };

    const handleEditBranch = (branch) => {
        setSelectedBranch(branch);
        setShowEditBranch(true);
    };

    const handleUpdateBranch = (updatedBranch) => {
        setBranches(branches.map(b => b._id === updatedBranch._id ? updatedBranch : b));
        setShowEditBranch(false);
        setSelectedBranch(null);
    };

    const handleShowQR = (branch) => {
        setSelectedBranch(branch);
        setShowQRModal(true);
    };

    const handleCreateCourse = (newCourse) => {
        setCourses([...courses, newCourse]);
        setShowCreateCourse(false);
    };

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            await apiClient.delete(`/courses/${courseId}`);
            setCourses(courses.filter(c => c._id !== courseId));
            toast.success('Course deleted successfully');
        } catch (error) {
            console.error('Delete course error:', error);
            toast.error('Failed to delete course');
        }
    };

    const handleEditCourse = (course) => {
        setSelectedCourse(course);
        setShowEditCourse(true);
    };

    const handleUpdateCourse = (updatedCourse) => {
        setCourses(courses.map(c => c._id === updatedCourse._id ? updatedCourse : c));
        setShowEditCourse(false);
        setSelectedCourse(null);
    };

    if (loading) {
        return <Loader />;
    }

    if (!institution) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-muted-foreground mb-4">Institution not found</p>
                <button onClick={() => navigate('/faculty/dashboard')} className="btn-primary">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="header-responsive">
                        <div className="header-title-group">
                            <button
                                onClick={() => navigate('/faculty/dashboard')}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                {institution.metadata?.logo ? (
                                    <img
                                        src={institution.metadata.logo}
                                        alt={institution.name}
                                        className="w-12 h-12 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Building2 className="w-6 h-6 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold">{institution.name}</h1>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Manage branches and courses
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="header-actions-group">
                            <ThemeToggle />
                            <button className="btn-secondary flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                <span className="btn-text">Settings</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{branches.length}</p>
                                <p className="text-sm text-muted-foreground">Branches</p>
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
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{courses.length}</p>
                                <p className="text-sm text-muted-foreground">Courses</p>
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
                                <Users className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {branches.reduce((sum, b) => sum + (b.enrolledStudents?.length || 0), 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Students</p>
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
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {courses.reduce((sum, c) => sum + (c.contentIds?.length || 0), 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Content</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('branches')}
                        className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'branches'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Branches ({branches.length})
                        {activeTab === 'branches' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('courses')}
                        className={`pb-3 px-4 font-medium transition-colors relative ${activeTab === 'courses'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Courses ({courses.length})
                        {activeTab === 'courses' && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                            />
                        )}
                    </button>
                </div>

                {/* Branches Tab */}
                {activeTab === 'branches' && (
                    <div>
                        <div className="header-responsive mb-6">
                            <h2 className="text-xl font-semibold">Branches</h2>
                            <button
                                onClick={() => setShowCreateBranch(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="btn-text">Add Branch</span>
                            </button>
                        </div>

                        {branches.length === 0 ? (
                            <div className="card p-12 text-center">
                                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No branches yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first branch to get started
                                </p>
                                <button
                                    onClick={() => setShowCreateBranch(true)}
                                    className="btn-primary"
                                >
                                    Create Branch
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {branches.map((branch) => (
                                    <BranchCard
                                        key={branch._id}
                                        branch={branch}
                                        onEdit={handleEditBranch}
                                        onDelete={handleDeleteBranch}
                                        onShowQR={handleShowQR}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Courses Tab */}
                {activeTab === 'courses' && (
                    <div>
                        <div className="header-responsive mb-6">
                            <h2 className="text-xl font-semibold">Courses</h2>
                            <button
                                onClick={() => setShowCreateCourse(true)}
                                className="btn-primary flex items-center gap-2"
                                disabled={branches.length === 0}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="btn-text">Add Course</span>
                            </button>
                        </div>

                        {branches.length === 0 ? (
                            <div className="card p-12 text-center">
                                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Create a branch first</h3>
                                <p className="text-muted-foreground mb-4">
                                    You need to create at least one branch before adding courses
                                </p>
                                <button
                                    onClick={() => setActiveTab('branches')}
                                    className="btn-primary"
                                >
                                    Go to Branches
                                </button>
                            </div>
                        ) : courses.length === 0 ? (
                            <div className="card p-12 text-center">
                                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first course to get started
                                </p>
                                <button
                                    onClick={() => setShowCreateCourse(true)}
                                    className="btn-primary"
                                >
                                    Create Course
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {courses.map((course) => (
                                    <CourseCard
                                        key={course._id}
                                        course={course}
                                        onEdit={handleEditCourse}
                                        onDelete={handleDeleteCourse}
                                        onViewContent={(course) => navigate(`/faculty/courses/${course._id}/content`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateBranchModal
                isOpen={showCreateBranch}
                onClose={() => setShowCreateBranch(false)}
                onSuccess={handleCreateBranch}
                institutions={[institution]}
            />

            <EditBranchModal
                isOpen={showEditBranch}
                onClose={() => {
                    setShowEditBranch(false);
                    setSelectedBranch(null);
                }}
                onSuccess={handleUpdateBranch}
                branch={selectedBranch}
            />

            <CreateCourseModal
                isOpen={showCreateCourse}
                onClose={() => setShowCreateCourse(false)}
                onSuccess={handleCreateCourse}
                institutions={[institution]}
                branches={branches}
            />

            <EditCourseModal
                isOpen={showEditCourse}
                onClose={() => {
                    setShowEditCourse(false);
                    setSelectedCourse(null);
                }}
                onSuccess={handleUpdateCourse}
                course={selectedCourse}
                institutions={[institution]}
                branches={branches}
            />

            <QRCodeModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                branch={selectedBranch}
            />
        </div>
    );
}
