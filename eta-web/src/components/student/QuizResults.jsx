import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, CheckCircle2, XCircle, ChevronDown, ChevronUp,
    ArrowLeft, RotateCcw, Clock, Target, Brain, Sparkles, BarChart3
} from 'lucide-react';

export default function QuizResults({ quiz, onRetake, onClose, onViewPerformance }) {
    const [expandedQ, setExpandedQ] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(true);

    if (!quiz) return null;

    const { questions, score, percentage, timeTaken, aiAnalysis, config } = quiz;
    const totalQ = questions.length;
    const correctCount = questions.filter(q => q.isCorrect).length;
    const wrongCount = totalQ - correctCount;
    const timeMinutes = Math.floor((timeTaken || 0) / 60);
    const timeSeconds = (timeTaken || 0) % 60;

    const getGrade = () => {
        if (percentage >= 90) return { label: 'Excellent!', emoji: '🏆', color: 'text-yellow-500', bg: 'from-yellow-500/20 to-orange-500/20' };
        if (percentage >= 75) return { label: 'Great Job!', emoji: '🌟', color: 'text-green-500', bg: 'from-green-500/20 to-emerald-500/20' };
        if (percentage >= 60) return { label: 'Good Effort!', emoji: '👍', color: 'text-blue-500', bg: 'from-blue-500/20 to-cyan-500/20' };
        if (percentage >= 40) return { label: 'Keep Trying!', emoji: '💪', color: 'text-orange-500', bg: 'from-orange-500/20 to-amber-500/20' };
        return { label: 'Don\'t Give Up!', emoji: '📚', color: 'text-red-500', bg: 'from-red-500/20 to-pink-500/20' };
    };

    const grade = getGrade();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[300] bg-background overflow-y-auto"
        >
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-secondary transition-colors text-sm font-bold"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Content
                    </button>
                    <div className="flex items-center gap-2">
                        {onViewPerformance && (
                            <button
                                onClick={onViewPerformance}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-sm font-bold"
                            >
                                <BarChart3 className="w-4 h-4" />
                                Performance
                            </button>
                        )}
                        <button
                            onClick={onRetake}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all text-sm font-bold shadow-md shadow-primary/20"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Retake Quiz
                        </button>
                    </div>
                </div>

                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-br ${grade.bg} rounded-3xl p-8 border border-border text-center relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_60%)]" />
                    <div className="relative space-y-4">
                        <div className="text-5xl">{grade.emoji}</div>
                        <h2 className={`text-3xl font-black ${grade.color}`}>{grade.label}</h2>

                        {/* Animated Score */}
                        <div className="relative w-36 h-36 mx-auto">
                            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="8" />
                                <motion.circle
                                    cx="60" cy="60" r="52" fill="none" stroke="currentColor"
                                    className={grade.color}
                                    strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 52}`}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - percentage / 100) }}
                                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-4xl font-black"
                                >
                                    {percentage}%
                                </motion.span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Score</span>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-bold">{correctCount} Correct</span>
                            </div>
                            <div className="w-px h-4 bg-border" />
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-bold">{wrongCount} Wrong</span>
                            </div>
                            <div className="w-px h-4 bg-border" />
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold">{timeMinutes}m {timeSeconds}s</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* AI Analysis */}
                {aiAnalysis && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-card border border-border rounded-2xl overflow-hidden"
                    >
                        <button
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className="w-full flex items-center justify-between p-5 hover:bg-secondary/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-sm font-bold">AI Tutor Analysis</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Personalized feedback</p>
                                </div>
                            </div>
                            {showAnalysis ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                        <AnimatePresence>
                            {showAnalysis && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-5 pb-5 border-t border-border/50"
                                >
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none pt-4 text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: aiAnalysis
                                                .replace(/### (.*)/g, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/^- (.*)/gm, '<li class="ml-4">$1</li>')
                                                .replace(/\n/g, '<br/>')
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Question Review */}
                <div className="space-y-4">
                    <h3 className="text-lg font-black flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Review Your Answers
                    </h3>

                    {questions.map((q, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * Math.min(idx, 5) }}
                            className={`bg-card border rounded-2xl overflow-hidden transition-all ${q.isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}
                        >
                            <button
                                onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                                className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/10 transition-colors"
                            >
                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${q.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    {q.isCorrect
                                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        : <XCircle className="w-4 h-4 text-red-500" />
                                    }
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{q.question}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${q.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                                    </p>
                                </div>
                                {expandedQ === idx ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                            </button>

                            <AnimatePresence>
                                {expandedQ === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-border/50"
                                    >
                                        <div className="p-5 space-y-4">
                                            <p className="text-sm font-medium">{q.question}</p>

                                            {/* Options with highlighting */}
                                            <div className="space-y-2">
                                                {q.options.map((opt, optIdx) => {
                                                    const isCorrectOpt = optIdx === q.correctAnswer;
                                                    const isStudentAns = optIdx === q.studentAnswer;
                                                    const isWrong = isStudentAns && !q.isCorrect;
                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`flex items-center gap-3 p-3 rounded-xl text-sm ${isCorrectOpt
                                                                ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400'
                                                                : isWrong
                                                                    ? 'bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400'
                                                                    : 'bg-secondary/30 border border-transparent'
                                                                }`}
                                                        >
                                                            <span className="font-bold text-xs w-6">{String.fromCharCode(65 + optIdx)}.</span>
                                                            <span className="flex-1">{opt}</span>
                                                            {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                                                            {isWrong && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            {q.explanation && (
                                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Brain className="w-4 h-4 text-primary" />
                                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">Explanation</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom spacer */}
                <div className="h-8" />
            </div>
        </motion.div>
    );
}
