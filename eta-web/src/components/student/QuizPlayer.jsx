import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, ChevronLeft, ChevronRight, CheckCircle2,
    AlertTriangle, Flag, ArrowRight, Send, X, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function QuizPlayer({ quiz, onComplete, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(quiz?.config?.timeLimit || 600);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const startTimeRef = useRef(Date.now());
    const timerRef = useRef(null);

    const questions = quiz?.questions || [];
    const totalQuestions = questions.length;
    const currentQ = questions[currentIndex];

    // Timer countdown
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true); // Auto-submit on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, []);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        const ratio = timeLeft / (quiz?.config?.timeLimit || 600);
        if (ratio > 0.5) return 'text-green-500';
        if (ratio > 0.2) return 'text-yellow-500';
        return 'text-red-500 animate-pulse';
    };

    const handleAnswer = (optionIndex) => {
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    };

    const goNext = () => {
        if (currentIndex < totalQuestions - 1) setCurrentIndex(prev => prev + 1);
    };

    const goPrev = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const answeredCount = Object.keys(answers).length;

    const handleSubmit = useCallback(async (isTimeout = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        clearInterval(timerRef.current);

        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

        try {
            const response = await apiClient.post(`/quiz/${quiz._id}/submit`, {
                answers,
                timeTaken
            });

            if (response.data.success) {
                toast.success(isTimeout ? 'Time\'s up! Quiz submitted.' : 'Quiz submitted! 🎉');
                onComplete(response.data.data.quiz);
            }
        } catch (error) {
            console.error('Quiz submit error:', error);
            toast.error('Failed to submit quiz');
            setIsSubmitting(false);
        }
    }, [answers, quiz, isSubmitting, onComplete]);

    const getDifficultyBadge = (diff) => {
        const styles = {
            easy: 'bg-green-500/10 text-green-500 border-green-500/20',
            medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            hard: 'bg-red-500/10 text-red-500 border-red-500/20'
        };
        return styles[diff] || styles.medium;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[300] bg-background flex flex-col"
        >
            {/* Top Bar */}
            <div className="bg-card border-b border-border px-6 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold">Knowledge Quiz</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                Question {currentIndex + 1} / {totalQuestions}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border font-mono ${getTimerColor()}`}>
                            <Clock className="w-4 h-4" />
                            <span className="text-lg font-black tracking-tight">{formatTime(timeLeft)}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors"
                            title="Exit Quiz"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-secondary">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-6 py-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Question */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20">
                                        {currentIndex + 1}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getDifficultyBadge(currentQ?.difficulty)}`}>
                                        {currentQ?.difficulty}
                                    </span>
                                    {currentQ?.topic && (
                                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border border-border/50">
                                            {currentQ.topic}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold leading-relaxed pl-1">
                                    {currentQ?.question}
                                </h3>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                {currentQ?.options?.map((option, idx) => {
                                    const isSelected = answers[currentIndex] === idx;
                                    return (
                                        <motion.button
                                            key={idx}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => handleAnswer(idx)}
                                            className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 group ${isSelected
                                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                                                : 'border-border hover:border-primary/30 bg-card hover:bg-secondary/20'
                                                }`}
                                        >
                                            <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${isSelected
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span className={`text-sm font-medium leading-relaxed pt-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                                {option}
                                            </span>
                                            {isSelected && (
                                                <CheckCircle2 className="w-5 h-5 text-primary ml-auto flex-shrink-0 mt-1.5" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="bg-card border-t border-border px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    {/* Question Dots */}
                    <div className="flex items-center gap-1.5 flex-wrap max-w-[50%]">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-3 h-3 rounded-full transition-all ${idx === currentIndex
                                    ? 'bg-primary scale-125 shadow-sm shadow-primary/30'
                                    : answers[idx] !== undefined
                                        ? 'bg-primary/40'
                                        : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                                title={`Question ${idx + 1}`}
                            />
                        ))}
                    </div>

                    {/* Nav Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={goPrev}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-secondary transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        {currentIndex < totalQuestions - 1 ? (
                            <button
                                onClick={goNext}
                                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-md shadow-primary/20"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-md shadow-green-600/20"
                            >
                                <Send className="w-4 h-4" />
                                <span>Submit ({answeredCount}/{totalQuestions})</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowConfirm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl text-center space-y-5"
                            onClick={e => e.stopPropagation()}
                        >
                            {answeredCount < totalQuestions && (
                                <div className="flex items-center justify-center gap-2 text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/20">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-bold">{totalQuestions - answeredCount} questions unanswered</span>
                                </div>
                            )}
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                <Flag className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-black">Submit Quiz?</h3>
                            <p className="text-sm text-muted-foreground">
                                You've answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
                                Once submitted, you cannot change your answers.
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border border-border font-bold text-sm hover:bg-secondary transition-all"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
