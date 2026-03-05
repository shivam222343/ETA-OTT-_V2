import { motion } from 'framer-motion';
import {
    MessageSquare, Award, User, Clock,
    CheckCircle2, ChevronRight, Star,
    Trash2, Edit3
} from 'lucide-react';

const PeerQuestionCard = ({ question, onSolve, onEdit, onDelete, isFaculty = false, currentUserId }) => {
    const isOwner = question.studentId?._id === currentUserId;
    const canManage = isFaculty || isOwner;

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'review': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'solved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group bg-card border border-border rounded-2xl p-5 hover:border-primary/50 transition-all ${question.isGolden ? 'ring-1 ring-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.05)]' : ''}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                        {question.studentId?.profile?.avatar ? (
                            <img src={question.studentId.profile.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold truncate max-w-[150px]">
                            {question.studentId?.profile?.name || 'Unknown Student'}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                            <Clock className="w-3 h-3" />
                            {new Date(question.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(question.status)}`}>
                        {question.status}
                    </span>
                    {question.isGolden && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-primary" />
                            GOLDEN
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <div className="flex justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors mb-1 line-clamp-1">
                            {question.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {question.description}
                        </p>
                    </div>
                    {question.attachments?.length > 0 && (
                        <div className="w-20 h-20 rounded-xl border border-border overflow-hidden shrink-0 bg-secondary/30">
                            <img
                                src={question.attachments[0].url}
                                alt="Diagram"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-primary">
                        <Award className="w-4 h-4" />
                        <span className="text-xs font-bold">{question.rewardPoints} Credits</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium">{question.solutions?.length || 0} Solns</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canManage && (
                        <>
                            <button
                                onClick={() => onEdit?.(question)}
                                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                                title="Edit Question"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete?.(question._id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/70 hover:text-red-500 transition-colors"
                                title="Remove Question"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {question.status !== 'solved' && !isOwner && (
                        <button
                            onClick={() => onSolve?.(question)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all"
                        >
                            Solve Now
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}

                    {question.status === 'solved' && (
                        <button
                            onClick={() => onSolve?.(question)}
                            className="flex items-center gap-1 text-blue-500 text-xs font-bold bg-blue-500/10 px-3 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            View Solution
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PeerQuestionCard;
