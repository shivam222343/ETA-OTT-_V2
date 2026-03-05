import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, Award, MessageSquare,
    Star, Trash2, Filter, Search,
    ChevronDown, ChevronUp, User, Clock,
    AlertCircle, Sparkles, Wand2, Plus,
    Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import Loader from '../../components/Loader';
import PeerQuestionModal from '../student/PeerQuestionModal';

const FacultyReviewPeer = ({ user, courses = [] }) => {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [filter, setFilter] = useState({ state: 'review' }); // review, all
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [moderatingId, setModeratingId] = useState(null);
    const [showAskModal, setShowAskModal] = useState(false);
    const [branchCourses, setBranchCourses] = useState([]);

    const fetchBranches = async () => {
        try {
            if (!user?.institutionIds || user.institutionIds.length === 0) {
                setLoading(false);
                return;
            }

            // Fetch branches for each institution the faculty belongs to
            const branchPromises = user.institutionIds.map(instId =>
                apiClient.get(`/branches/institution/${instId}`)
            );
            const responses = await Promise.all(branchPromises);
            const allBranches = responses.flatMap(r => r.data.data.branches);

            // For faculty, show all branches in their institution, not just those they are "enrolled" in
            setBranches(allBranches);

            if (allBranches.length > 0) {
                setSelectedBranchId(allBranches[0]._id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch branches:', error);
            setLoading(false);
        }
    };

    const fetchQuestions = async () => {
        if (!selectedBranchId) return;
        setLoading(true);
        try {
            const res = await apiClient.get('/peer/golden', {
                params: { branchId: selectedBranchId }
            });
            setQuestions(res.data.data.peerDoubts);
        } catch (error) {
            toast.error('Failed to load peer questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    useEffect(() => {
        if (selectedBranchId) {
            fetchQuestions();
            fetchBranchCourses();
        }
    }, [selectedBranchId]);

    const fetchBranchCourses = async () => {
        try {
            const res = await apiClient.get(`/courses/branch/${selectedBranchId}`);
            setBranchCourses(res.data.data.courses || []);
        } catch (error) {
            console.error('Failed to fetch branch courses:', error);
        }
    };

    const handleReview = async (id, solutionId, status, points = null, feedback = '') => {
        setModeratingId(solutionId);
        try {
            await apiClient.patch(`/peer/${id}/review`, {
                solutionId,
                status,
                points,
                feedback
            });
            toast.success(`Solution ${status} successfully`);
            fetchQuestions();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setModeratingId(null);
        }
    };

    const toggleGolden = async (id, currentState) => {
        try {
            await apiClient.patch(`/peer/${id}/review`, {
                isGolden: !currentState
            });
            toast.success(currentState ? 'Removed from Golden Questions' : 'Marked as Golden Question');
            fetchQuestions();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const deleteQuestion = async (id) => {
        if (!window.confirm('Are you sure you want to remove this peer doubt?')) return;
        try {
            await apiClient.delete(`/peer/${id}`);
            toast.success('Question removed');
            fetchQuestions();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter.state === 'all' ||
            (filter.state === 'review' && q.status === 'review') ||
            (filter.state === 'golden' && q.isGolden);
        return matchesSearch && matchesFilter;
    });

    if (loading && questions.length === 0 && branches.length > 0) return <Loader fullScreen={false} />;

    if (!loading && branches.length === 0) {
        return (
            <div className="bg-card border border-dashed border-border rounded-[28px] p-20 text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-1">No Branches Assigned</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    You don't seem to have any branches assigned to your account. Please contact your administrator to get access to specific branches.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-6 rounded-[28px] shadow-sm">
                <div>
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Peer Solution Moderation
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">Review student solutions and curate Golden Questions.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAskModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all mr-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Question
                    </button>
                    <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="bg-secondary/50 border border-border focus:border-primary rounded-xl px-3 py-2 text-sm font-bold outline-none cursor-pointer hover:border-primary transition-colors min-w-[150px]"
                    >
                        <option value="" disabled>Select Branch</option>
                        {branches.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                    </select>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-secondary/50 border border-border focus:border-primary rounded-xl pl-10 pr-4 py-2 text-sm font-medium outline-none transition-all w-[200px]"
                        />
                    </div>
                    <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                        {['review', 'golden', 'all'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilter({ state: s })}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter.state === s ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <PeerQuestionModal
                isOpen={showAskModal}
                onClose={() => setShowAskModal(false)}
                mode="ask"
                user={user}
                courses={branchCourses}
                currentBranchId={selectedBranchId}
                onSuccess={fetchQuestions}
            />

            <div className="space-y-4">
                {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                    <motion.div
                        key={q._id}
                        layout
                        className={`bg-card border border-border rounded-[28px] overflow-hidden transition-all ${expandedId === q._id ? 'ring-1 ring-primary/20 shadow-lg' : ''}`}
                    >
                        <div
                            className="p-6 cursor-pointer hover:bg-secondary/20 transition-colors"
                            onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${q.status === 'review' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {q.status}
                                        </span>
                                        {q.isGolden && (
                                            <span className="flex items-center gap-1 text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                <Star className="w-3 h-3 fill-primary" />
                                                GOLDEN
                                            </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase">{q.courseId?.code}</span>
                                    </div>
                                    <h3 className="font-bold text-lg leading-tight mb-2">{q.title}</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                            <User className="w-3 h-3" />
                                            {q.studentId?.profile?.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                                            <MessageSquare className="w-3 h-3" />
                                            {q.solutions?.length || 0} solutions received
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleGolden(q._id, q.isGolden); }}
                                        className={`p-2 rounded-xl transition-all ${q.isGolden ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground'}`}
                                    >
                                        <Star className={`w-5 h-5 ${q.isGolden ? 'fill-primary' : ''}`} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteQuestion(q._id); }}
                                        className="p-2 rounded-xl hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    {expandedId === q._id ? <ChevronUp className="w-5 h-5 text-muted-foreground ml-2" /> : <ChevronDown className="w-5 h-5 text-muted-foreground ml-2" />}
                                </div>
                            </div>
                        </div>

                        <AnimatePresence>
                            {expandedId === q._id && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="border-t border-border/50 bg-secondary/10"
                                >
                                    <div className="p-6">
                                        <div className="bg-background/50 border border-border/50 rounded-2xl p-5 mb-6">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Original Doubt</h4>
                                            <p className="text-sm leading-relaxed mb-4">{q.description}</p>
                                            {q.attachments?.length > 0 && (
                                                <div className="mt-2">
                                                    <img
                                                        src={q.attachments[0].url}
                                                        alt="Doubt diagram"
                                                        className="max-w-full h-auto max-h-[300px] rounded-xl border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(q.attachments[0].url, '_blank')}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Pending Solutions ({q.solutions.filter(s => s.status === 'pending').length})</h4>
                                        <div className="space-y-4">
                                            {q.solutions.length > 0 ? q.solutions.map(s => (
                                                <div key={s._id} className={`bg-card border border-border rounded-2xl p-5 ${s.status === 'accepted' ? 'ring-1 ring-emerald-500/30' : ''}`}>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs overflow-hidden">
                                                                {s.studentId?.profile?.avatar ? (
                                                                    <img src={s.studentId.profile.avatar} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-4 h-4" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-bold block">{s.studentId?.profile?.name || 'Unknown Student'}</span>
                                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(s.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {s.status === 'pending' && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    disabled={moderatingId === s._id}
                                                                    onClick={() => handleReview(q._id, s._id, 'accepted', q.rewardPoints)}
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                                                                >
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    disabled={moderatingId === s._id}
                                                                    onClick={() => handleReview(q._id, s._id, 'rejected')}
                                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors shadow-sm"
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {s.status === 'accepted' && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-bold border border-emerald-500/20">
                                                                <Award className="w-4 h-4" />
                                                                +{s.creditsAwarded} Credits Awarded
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/20 p-4 rounded-xl border border-border/30 mb-4">
                                                        {s.answer}
                                                    </p>
                                                    {s.attachments?.length > 0 && (
                                                        <div className="mt-2 px-1">
                                                            <img
                                                                src={s.attachments[0].url}
                                                                alt="Solution diagram"
                                                                className="max-w-[300px] h-auto rounded-xl border border-border cursor-zoom-in hover:opacity-90 transition-opacity"
                                                                onClick={() => window.open(s.attachments[0].url, '_blank')}
                                                            />
                                                            <p className="text-[10px] text-muted-foreground mt-1">Solution Diagram</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )) : (
                                                <p className="text-xs text-muted-foreground font-medium text-center py-4 italic">No solutions submitted yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )) : (
                    <div className="bg-card border border-dashed border-border rounded-[28px] p-20 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="font-bold text-lg mb-1">
                            {filter.state === 'review' ? 'No pending reviews' :
                                filter.state === 'golden' ? 'No golden questions' :
                                    'No peer doubts found'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {filter.state === 'review' ? 'Everything is up to date. No solutions are waiting for your approval.' :
                                'Try adjusting your filters or search query to find more content.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyReviewPeer;
