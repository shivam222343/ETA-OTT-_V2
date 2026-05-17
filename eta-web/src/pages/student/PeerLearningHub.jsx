import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, Plus, Star, Trophy,
    MessageSquare, Award, ArrowRight,
    TrendingUp, Users, ChevronDown,
    LayoutGrid, List, Sparkles, HelpCircle,
    RotateCcw
} from 'lucide-react';
import apiClient from '../../api/axios.config';
import PeerQuestionCard from '../../components/student/PeerQuestionCard';
import PeerQuestionModal from '../../components/student/PeerQuestionModal';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const PeerLearningHub = () => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState({ credits: 0, totalSolved: 0, remainingChances: 3 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('ask');
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchData();
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const { data } = await apiClient.get('/courses/user/my-courses');
            if (data.success) {
                setCourses(data.data.courses.filter(c => c.code !== 'YT_DISCOVERY'));
            }
        } catch (err) {
            console.error('Failed to fetch courses');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [qRes, lRes, sRes] = await Promise.all([
                apiClient.get('/peer/golden'),
                apiClient.get('/peer/leaderboard'),
                apiClient.get('/peer/stats')
            ]);
            if (qRes.data.success) setQuestions(qRes.data.data.peerDoubts);
            if (lRes.data.success) setLeaderboard(lRes.data.data);
            if (sRes.data.success) setStats(sRes.data.data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load Peer Learning data');
        } finally {
            setLoading(false);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.description.toLowerCase().includes(searchQuery.toLowerCase());
        if (filter === 'all') return matchesSearch;
        if (filter === 'golden') return q.isGolden && matchesSearch;
        if (filter === 'open') return q.status === 'open' && matchesSearch;
        if (filter === 'solved') return q.status === 'solved' && matchesSearch;
        return matchesSearch;
    });

    const handleSolve = (q) => {
        setSelectedQuestion(q);
        setModalMode('solve');
        setIsModalOpen(true);
    };

    const handleAsk = () => {
        setModalMode('ask');
        setSelectedQuestion(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this question?')) return;
        try {
            await apiClient.delete(`/peer/${id}`);
            toast.success('Question removed');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    if (loading && questions.length === 0) return <div className="h-[60vh] flex items-center justify-center"><Loader /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-8 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Users className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight">Peer Learning Hub</h1>
                        </div>
                        <p className="text-muted-foreground max-w-lg text-sm font-medium leading-relaxed mb-8">
                            Collaborate with your batchmates, solve challenging doubts, and earn credits to boost your academic profile.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={handleAsk}
                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-sm shadow-sm hover:shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Ask Question
                            </button>
                            <div className="h-10 w-px bg-border mx-2 hidden sm:block" />
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Credits</p>
                                    <p className="text-xl font-bold text-primary">{stats.credits}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Solved</p>
                                    <p className="text-xl font-bold">{stats.totalSolved}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chances Left</p>
                                    <p className="text-xl font-bold">{stats.remainingChances}/3</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Section */}
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            Top Contributors
                        </h3>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>

                    <div className="space-y-4 flex-1">
                        {leaderboard.length > 0 ? leaderboard.slice(0, 4).map((student, i) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                                        {student.avatar ? (
                                            <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-bold text-muted-foreground">{i + 1}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate max-w-[100px] group-hover:text-primary transition-colors">{student.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">Rank #{i + 1}</p>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-primary flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    {student.credits}
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                <HelpCircle className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-[10px] font-medium">No contributors yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by topic, course or question..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border">
                            {['all', 'golden', 'open', 'solved'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${
                                        filter === f 
                                            ? 'bg-background shadow-sm text-primary' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchData}
                            className="p-2.5 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
                            title="Refresh Data"
                        >
                            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Question Feed */}
                {filteredQuestions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filteredQuestions.map((q) => (
                                <PeerQuestionCard
                                    key={q._id}
                                    question={q}
                                    onSolve={handleSolve}
                                    onDelete={handleDelete}
                                    currentUserId={user?._id}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="bg-card border border-dashed border-border rounded-xl p-20 text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-lg font-bold mb-1">No questions found</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            {searchQuery ? "Try refining your search terms." : "The community is quiet right now. Why not start a discussion?"}
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <PeerQuestionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                question={selectedQuestion}
                courses={courses}
                currentBranchId={user?.branchIds?.[0]}
                user={user}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default PeerLearningHub;
