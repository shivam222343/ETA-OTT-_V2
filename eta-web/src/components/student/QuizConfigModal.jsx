import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Zap, Clock, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function QuizConfigModal({ isOpen, onClose, onQuizReady, content, contentProgress }) {
    const [questionCount, setQuestionCount] = useState(15);
    const [difficulty, setDifficulty] = useState('auto');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const getProgressLabel = () => {
        if (!contentProgress) return 'Full content';
        const type = contentProgress.type;
        if (type === 'pdf' || type === 'web' || type === 'document') {
            return `Pages 1–${contentProgress.currentPage} of ${contentProgress.totalPages}`;
        }
        if (type === 'video') {
            const mins = Math.floor((contentProgress.currentTimestamp || 0) / 60);
            const secs = Math.floor((contentProgress.currentTimestamp || 0) % 60);
            const totalMins = Math.floor((contentProgress.totalDuration || 0) / 60);
            return `0:00 – ${mins}:${secs.toString().padStart(2, '0')} of ${totalMins} min`;
        }
        return 'Current progress';
    };

    const getTimeEstimate = () => {
        const timePerQ = { easy: 90, medium: 60, hard: 45, auto: 60 };
        const total = questionCount * (timePerQ[difficulty] || 60);
        return Math.ceil(total / 60);
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const courseId = content.courseId?._id || content.courseId;
            const response = await apiClient.post('/quiz/generate', {
                courseId,
                contentId: content._id,
                questionCount,
                contentProgress,
                difficulty
            });

            if (response.data.success) {
                toast.success('Quiz generated! Let\'s go! 🚀');
                onQuizReady(response.data.data.quiz);
            }
        } catch (error) {
            console.error('Quiz generation error:', error);
            toast.error(error.response?.data?.message || 'Failed to generate quiz');
        } finally {
            setLoading(false);
        }
    };

    const difficulties = [
        { id: 'auto', label: 'Auto Mix', icon: Sparkles, desc: 'AI picks the best mix', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        { id: 'easy', label: 'Easy', icon: BookOpen, desc: 'Foundational concepts', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
        { id: 'medium', label: 'Medium', icon: Brain, desc: 'Application level', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
        { id: 'hard', label: 'Hard', icon: Zap, desc: 'Deep understanding', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 p-6 border-b border-border">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-secondary rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <Brain className="w-7 h-7 text-primary-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black tracking-tight">Test Your Knowledge</h2>
                                <p className="text-xs text-muted-foreground font-medium mt-0.5 max-w-xs truncate">
                                    {content?.title || 'Content Quiz'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Progress Context */}
                        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
                            <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quiz Based On</p>
                                <p className="text-sm font-bold">{getProgressLabel()}</p>
                            </div>
                        </div>

                        {/* Question Count Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold">Number of Questions</label>
                                <span className="text-2xl font-black text-primary">{questionCount}</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="30"
                                step="1"
                                value={questionCount}
                                onChange={e => setQuestionCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span>10 Min</span>
                                <span>30 Max</span>
                            </div>
                        </div>

                        {/* Difficulty Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold">Difficulty Level</label>
                            <div className="grid grid-cols-2 gap-2">
                                {difficulties.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDifficulty(d.id)}
                                        className={`p-3 rounded-xl border-2 transition-all text-left group ${difficulty === d.id
                                            ? `${d.border} ${d.bg} shadow-sm`
                                            : 'border-border/50 hover:border-border bg-secondary/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <d.icon className={`w-4 h-4 ${difficulty === d.id ? d.color : 'text-muted-foreground'}`} />
                                            <span className={`text-xs font-bold ${difficulty === d.id ? '' : 'text-muted-foreground'}`}>{d.label}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{d.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Time Estimate */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-4 py-2.5 rounded-xl">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-medium">Estimated time: <strong className="text-foreground">{getTimeEstimate()} minutes</strong></span>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-3 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    <span>AI is generating your quiz...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>Generate Quiz</span>
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
