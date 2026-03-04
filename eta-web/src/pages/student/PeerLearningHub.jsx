import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Star, Award, Search,
    Plus, Filter, RefreshCw, Trophy,
    MessageSquare, AlertCircle, ChevronRight,
    TrendingUp, Lightbulb, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import PeerQuestionCard from '../../components/student/PeerQuestionCard';
import PeerQuestionModal from '../../components/student/PeerQuestionModal';
import Loader from '../../components/Loader';

export default function PeerLearningHub({ user }) {
    const [loading, setLoading] = useState(true);
    const [peerDoubts, setPeerDoubts] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState({ credits: 0, remainingChances: 3, totalSolved: 0 });
    const [courses, setCourses] = useState([]);
    const [filter, setFilter] = useState({ courseId: '', type: 'all' });
    const [searchQuery, setSearchQuery] = useState('');
    const [modalConfig, setModalConfig] = useState({ isOpen: false, mode: 'ask', selectedQuestion: null });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [doubtsRes, statsRes, coursesRes, leaderboardRes] = await Promise.all([
                apiClient.get('/peer/golden', { params: { courseId: filter.courseId } }),
                apiClient.get('/peer/stats'),
                apiClient.get('/courses/user/my-courses'),
                apiClient.get('/peer/leaderboard')
            ]);

            setPeerDoubts(doubtsRes.data.data.peerDoubts);
            setStats(statsRes.data.data);
            setCourses(coursesRes.data.data.courses || []);
            setLeaderboard(leaderboardRes.data.data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to load Peer Learning data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [filter.courseId]);

    const handleSolve = (question) => {
        setModalConfig({ isOpen: true, mode: 'solve', selectedQuestion: question });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this question?')) return;
        try {
            await apiClient.delete(`/peer/${id}`);
            toast.success('Question removed');
            fetchDashboardData();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const filteredDoubts = peerDoubts.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filter.type === 'all' ||
            (filter.type === 'golden' && q.isGolden) ||
            (filter.type === 'open' && q.status === 'open');
        return matchesSearch && matchesType;
    });

    if (loading && peerDoubts.length === 0) return <Loader fullScreen={false} />;

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Section / Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-blue-600 rounded-[32px] p-10 text-primary-foreground shadow-2xl shadow-primary/20">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Users className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter">Peer Learning Hub</h1>
                        </div>
                        <p className="text-primary-foreground/80 max-w-lg text-lg font-medium leading-relaxed mb-8">
                            Join the elite community of students. Solve Golden Questions, help your peers, and earn reward credits for your profile!
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={() => setModalConfig({ isOpen: true, mode: 'ask', selectedQuestion: null })}
                                className="px-8 py-4 bg-white text-primary rounded-2xl font-black text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Ask Peer Doubt
                            </button>
                            <div className="flex items-center gap-4 px-6 py-4 bg-black/10 backdrop-blur-md rounded-2xl border border-white/10">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Chances Left</span>
                                    <span className="text-xl font-black">{stats.remainingChances}/3</span>
                                </div>
                                <div className="w-px h-8 bg-white/20" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Credits Won</span>
                                    <span className="text-xl font-black flex items-center gap-2">
                                        <Award className="w-5 h-5" />
                                        {stats.credits}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Abstract Decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-20 -mb-20 blur-2xl" />
                    <Sparkles className="absolute top-10 right-10 w-24 h-24 text-white/5 animate-pulse" />
                </div>

                <div className="bg-card border border-border rounded-[32px] p-8 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-xl tracking-tight flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Top Contributors
                        </h3>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>

                    <div className="space-y-4">
                        {leaderboard.length > 0 ? leaderboard.slice(0, 3).map((contributor, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary overflow-hidden">
                                        {contributor.avatar ? (
                                            <img src={contributor.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            `#${i + 1}`
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold truncate max-w-[120px]">{contributor.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-medium">Rank #{i + 1}</span>
                                    </div>
                                </div>
                                <div className="text-xs font-black text-primary flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-primary" />
                                    {contributor.credits} pts
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-6 text-muted-foreground text-xs font-medium">
                                Start solving to appear here!
                            </div>
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-orange-500 shrink-0" />
                        <p className="text-[10px] leading-relaxed text-orange-600 font-bold dark:text-orange-400">
                            PRO TIP: Solve "Golden Questions" for double credits and profile badges!
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search peer doubts by title or topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-border focus:border-primary rounded-2xl pl-12 pr-4 py-4 font-medium outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={filter.courseId}
                            onChange={(e) => setFilter({ ...filter, courseId: e.target.value })}
                            className="bg-card border border-border rounded-2xl px-4 py-4 text-sm font-bold outline-none cursor-pointer hover:border-primary transition-colors min-w-[180px]"
                        >
                            <option value="">All Courses</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border">
                            {['all', 'golden', 'open'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilter({ ...filter, type })}
                                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter.type === type ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="p-4 bg-card border border-border rounded-2xl hover:bg-secondary transition-colors"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Question Grid */}
                {filteredDoubts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoubts.map(question => (
                            <PeerQuestionCard
                                key={question._id}
                                question={question}
                                onSolve={handleSolve}
                                onDelete={handleDelete}
                                currentUserId={user._id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-dashed border-border rounded-[32px] p-24 text-center">
                        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No peer doubts found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
                            {searchQuery ? "No results match your search query." : "Looks like everyone is on the same page! Why not ask a question yourself?"}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="px-6 py-3 bg-secondary rounded-xl text-xs font-bold hover:bg-secondary/70 transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <PeerQuestionModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                mode={modalConfig.mode}
                question={modalConfig.selectedQuestion}
                user={user}
                courses={courses}
                currentBranchId={user.branchIds?.[0]}
                onSuccess={fetchDashboardData}
            />
        </div>
    );
}
