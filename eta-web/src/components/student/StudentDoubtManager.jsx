import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, User, Bot, BookOpen, Search, Filter } from 'lucide-react';
import apiClient from '../../api/axios.config';
import { useSocket } from '../../hooks/useSocket';

export default function StudentDoubtManager() {
    const [doubts, setDoubts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const socket = useSocket();

    useEffect(() => {
        fetchMyDoubts();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleDoubtAnswered = (data) => {
            setDoubts(prev => prev.map(doubt =>
                doubt._id === data.doubtId
                    ? { ...doubt, status: 'answered', facultyAnswer: data.answer }
                    : doubt
            ));
        };

        const handleDoubtEscalated = (data) => {
            setDoubts(prev => prev.map(doubt =>
                doubt._id === data.doubtId
                    ? { ...doubt, status: 'escalated' }
                    : doubt
            ));
        };

        socket.on('doubt:answered', handleDoubtAnswered);
        socket.on('doubt:escalated', handleDoubtEscalated);

        return () => {
            socket.off('doubt:answered', handleDoubtAnswered);
            socket.off('doubt:escalated', handleDoubtEscalated);
        };
    }, [socket]);

    const fetchMyDoubts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/doubts/my-doubts');
            setDoubts(response.data.data.doubts);
        } catch (error) {
            console.error('Fetch doubts error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDoubts = doubts.filter(d =>
        filterStatus === 'all' ? true : d.status === filterStatus
    );

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{doubts.length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Total Doubts</p>
                    </div>
                </div>
                <div className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{doubts.filter(d => d.status === 'answered' || d.status === 'resolved').length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Resolved</p>
                    </div>
                </div>
                <div className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{doubts.filter(d => d.status === 'pending' || d.status === 'escalated').length}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Awaiting Expert</p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between border bg-card p-2 rounded-xl">
                <div className="flex items-center gap-1">
                    {['all', 'resolved', 'answered', 'escalated'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${filterStatus === status ? 'bg-primary text-white shadow-md' : 'hover:bg-secondary text-muted-foreground'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="px-4">
                    <Search className="w-4 h-4 text-muted-foreground" />
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredDoubts.map((doubt, index) => (
                        <motion.div
                            key={doubt._id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${doubt.status === 'answered' || doubt.status === 'resolved'
                                                    ? 'bg-green-500/10 text-green-500'
                                                    : doubt.status === 'escalated'
                                                        ? 'bg-orange-500/10 text-orange-500'
                                                        : 'bg-secondary text-muted-foreground'
                                                }`}>
                                                {doubt.status}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                <Clock className="w-3 h-3" />
                                                {new Date(doubt.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-sm line-clamp-2">"{doubt.query}"</h4>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest">
                                            <BookOpen className="w-3 h-3" />
                                            {doubt.courseId?.name}
                                        </div>
                                    </div>
                                </div>

                                {/* AI Response Section */}
                                {doubt.aiResponse && (
                                    <div className="bg-secondary/30 rounded-xl p-4 mb-4 border border-border/50 text-xs">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Bot className="w-4 h-4 text-primary" />
                                            <span className="font-bold text-primary uppercase tracking-widest">AI Tutor Response</span>
                                            <span className="text-[10px] text-muted-foreground ml-auto">{doubt.confidence}% Confidence</span>
                                        </div>
                                        <p className="text-muted-foreground leading-relaxed">{doubt.aiResponse}</p>
                                    </div>
                                )}

                                {/* Mentor Answer Section */}
                                {(doubt.status === 'answered' || doubt.facultyAnswer) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="bg-primary/5 rounded-xl p-4 border border-primary/10 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <User className="w-4 h-4 text-primary" />
                                            <span className="font-bold text-primary uppercase tracking-widest text-xs">Verified Expert Answer</span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                            "{doubt.facultyAnswer}"
                                        </p>
                                    </motion.div>
                                )}

                                {doubt.status === 'escalated' && !doubt.facultyAnswer && (
                                    <div className="flex items-center justify-center p-4 bg-orange-500/5 rounded-xl border border-dashed border-orange-500/20">
                                        <div className="flex items-center gap-2 text-orange-600 animate-pulse">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Waiting for Mentor's Expertise...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredDoubts.length === 0 && !loading && (
                    <div className="bg-card border rounded-2xl p-20 text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <h3 className="text-lg font-bold">No doubts found</h3>
                        <p className="text-xs text-muted-foreground">Try adjusting your filters or ask a new doubt!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
