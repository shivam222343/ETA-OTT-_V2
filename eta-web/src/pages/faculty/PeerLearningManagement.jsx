import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Star, Award, MessageSquare, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import FacultyReviewPeer from '../../components/faculty/FacultyReviewPeer';
import FacultyStudentData from '../../components/faculty/FacultyStudentData';

export default function PeerLearningManagement({ user }) {
    const [activeTab, setActiveTab] = useState('review');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Faculty Hub Header */}
            <div className="bg-card border border-border rounded-xl p-8 relative overflow-hidden group shadow-sm">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Peer Hub Management</h1>
                    </div>
                    <p className="text-muted-foreground max-w-lg text-sm font-medium leading-relaxed mb-8">
                        Moderated the student community. Review submitted solutions, award reward credits, and track top contributors in your batches.
                    </p>
                    
                    <div className="flex bg-secondary/50 p-1 rounded-lg border border-border w-fit">
                        {[
                            { id: 'review', label: 'Solution Review', icon: MessageSquare },
                            { id: 'stats', label: 'Student Performance', icon: Users }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Subtle decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'review' ? (
                        <FacultyReviewPeer user={user} />
                    ) : (
                        <FacultyStudentData />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
