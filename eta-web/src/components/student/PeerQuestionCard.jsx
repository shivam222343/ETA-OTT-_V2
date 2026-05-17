import { motion } from 'framer-motion';
import {
    MessageSquare, Award, User, Clock,
    CheckCircle2, ChevronRight, Star,
    Trash2, Edit3, MoreVertical
} from 'lucide-react';

const PeerQuestionCard = ({ question, onSolve, onEdit, onDelete, isFaculty = false, currentUserId }) => {
    const isOwner = question.studentId?._id === currentUserId;
    const canManage = isFaculty || isOwner;

    const getStatusStyles = (status) => {
        switch (status) {
            case 'open': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
            case 'review': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
            case 'solved': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
            default: return 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-card hover:bg-accent/5 border border-border rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-md"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {question.studentId?.profile?.avatar ? (
                            <img src={question.studentId.profile.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-4 h-4 text-muted-foreground" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate leading-none mb-1">
                            {question.studentId?.profile?.name || 'Student'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            <Clock className="w-3 h-3" />
                            {new Date(question.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${getStatusStyles(question.status)}`}>
                        {question.status}
                    </span>
                    {question.isGolden && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                            <Star className="w-3 h-3 fill-current" />
                            GOLDEN
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-6">
                <div className="flex justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
                            {question.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {question.description}
                        </p>
                    </div>
                    {question.attachments?.length > 0 && (
                        <div className="w-20 h-20 rounded-lg border border-border overflow-hidden shrink-0 bg-muted/30">
                            <img
                                src={question.attachments[0].url}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-primary">
                        <Award className="w-4 h-4" />
                        <span className="text-xs font-bold">{question.rewardPoints} <span className="hidden sm:inline">Credits</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium">{question.solutions?.length || 0} <span className="hidden sm:inline">Solutions</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {canManage && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onEdit?.(question)}
                                className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete?.(question._id)}
                                className="p-2 rounded-md hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {question.status !== 'solved' && !isOwner ? (
                        <button
                            onClick={() => onSolve?.(question)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                        >
                            Solve
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        question.status === 'solved' && (
                            <button
                                onClick={() => onSolve?.(question)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Solution
                            </button>
                        )
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PeerQuestionCard;
