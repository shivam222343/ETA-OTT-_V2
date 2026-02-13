import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, User, BookOpen, Clock, CheckCircle2, Send, Search, Filter } from 'lucide-react';
import apiClient from '../../api/axios.config';
import toast from 'react-hot-toast';
import { useSocket } from '../../hooks/useSocket';
import Loader from '../Loader';

export default function FacultyDoubtManager({ courses }) {
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(courses[0]?._id || '');
    const [ansInputs, setAnsInputs] = useState({});
    const [saveToKB, setSaveToKB] = useState({}); // Per-doubt toggle
    const [submitting, setSubmitting] = useState({});
    const socket = useSocket();

    useEffect(() => {
        if (!socket || !selectedCourse) return;

        // Join course room to get real-time escalations
        socket.emit('join:course', selectedCourse);

        const handleNewEscalation = (data) => {
            // Check if we already have it to avoid duplicates
            setDoubts(prev => {
                if (prev.some(d => d._id === data.doubtId)) return prev;
                // Since data from socket might be partial, we might want to refetch
                // but let's just add a placeholder or refetch
                fetchEscalatedDoubts();
                return prev;
            });
            toast('New student doubt escalated!', { icon: '🚨' });
        };

        socket.on('doubt:escalated', handleNewEscalation);

        return () => {
            socket.emit('leave:course', selectedCourse);
            socket.off('doubt:escalated', handleNewEscalation);
        };
    }, [socket, selectedCourse]);

    useEffect(() => {
        if (selectedCourse) {
            fetchEscalatedDoubts();
        }
    }, [selectedCourse]);

    const fetchEscalatedDoubts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get(`/doubts/escalated/${selectedCourse}`);
            setDoubts(response.data.data.doubts);
        } catch (error) {
            console.error('Fetch doubts error:', error);
            toast.error('Failed to load escalated doubts');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSubmit = async (doubtId) => {
        const answer = ansInputs[doubtId];
        if (!answer?.trim()) return;

        const saveToGraph = saveToKB[doubtId] !== false; // Default to true

        setSubmitting(prev => ({ ...prev, [doubtId]: true }));
        try {
            await apiClient.post(`/doubts/${doubtId}/answer`, { answer, saveToGraph });
            toast.success(saveToGraph ? 'Doubt resolved and saved to Knowledge Base!' : 'Answer sent to student.');

            // Remove from list
            setDoubts(prev => prev.filter(d => d._id !== doubtId));
            setAnsInputs(prev => {
                const newInputs = { ...prev };
                delete newInputs[doubtId];
                return newInputs;
            });
        } catch (error) {
            toast.error('Failed to submit answer');
        } finally {
            setSubmitting(prev => ({ ...prev, [doubtId]: false }));
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Filter className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Filter Doubts</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Select a course to view escalations</p>
                    </div>
                </div>

                <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="bg-secondary px-4 py-2 rounded-lg text-sm font-medium border-none focus:ring-2 focus:ring-primary/20 outline-none min-w-[200px]"
                >
                    <option value="" disabled>Select Course</option>
                    {courses.map(course => (
                        <option key={course._id} value={course._id}>{course.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <Loader />
            ) : doubts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    <AnimatePresence>
                        {doubts.map((doubt, index) => (
                            <motion.div
                                key={doubt._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border-2 border-background">
                                                <User className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold">{doubt.studentId?.profile?.name}</h4>
                                                    <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-bold uppercase tracking-widest">
                                                        Urgent Elevation
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(doubt.createdAt).toLocaleString()}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="w-3 h-3" />
                                                        {doubt.courseId?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">AI Confidence</div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-500" style={{ width: `${doubt.confidence}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-yellow-600">{doubt.confidence}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-secondary/30 rounded-xl p-4 mb-6 border border-border/50">
                                        <p className="text-sm font-medium leading-relaxed italic">
                                            "{doubt.query}"
                                        </p>
                                        {doubt.selectedText && (
                                            <div className="mt-3 pt-3 border-t border-border/50">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Contextual Highlight</p>
                                                <p className="text-xs bg-background p-2 rounded border-l-4 border-primary">
                                                    {doubt.selectedText}
                                                </p>
                                            </div>
                                        )}
                                        {doubt.aiResponse && (
                                            <div className="mt-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                                                <p className="text-[10px] text-red-600 font-bold uppercase mb-1">Tentative AI Answer (Low Confidence)</p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">{doubt.aiResponse}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <textarea
                                                value={ansInputs[doubt._id] || ''}
                                                onChange={(e) => setAnsInputs(prev => ({ ...prev, [doubt._id]: e.target.value }))}
                                                placeholder="Provide the verified answer to resolve this doubt and improve the Knowledge Base..."
                                                className="w-full bg-secondary/50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[120px] transition-all"
                                            />
                                            <BotAnimation />
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div
                                                    onClick={() => setSaveToKB(prev => ({ ...prev, [doubt._id]: prev[doubt._id] === false ? true : false }))}
                                                    className={`w-10 h-5 rounded-full transition-all relative ${saveToKB[doubt._id] !== false ? 'bg-primary' : 'bg-secondary'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${saveToKB[doubt._id] !== false ? 'left-6' : 'left-1'}`} />
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                                    Add to Knowledge Base
                                                </span>
                                            </label>

                                            <button
                                                onClick={() => handleAnswerSubmit(doubt._id)}
                                                disabled={!ansInputs[doubt._id]?.trim() || submitting[doubt._id]}
                                                className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl disabled:opacity-50"
                                            >
                                                {submitting[doubt._id] ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                                {saveToKB[doubt._id] !== false ? 'Resolve & Verify' : 'Answer Student'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-card border rounded-2xl p-20 text-center">
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Clean Slate!</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        There are no escalated doubts for this course right now. Your students are learning well!
                    </p>
                </div>
            )}
        </div>
    );
}

function BotAnimation() {
    return (
        <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
            <MessageSquare className="w-12 h-12" />
        </div>
    );
}
