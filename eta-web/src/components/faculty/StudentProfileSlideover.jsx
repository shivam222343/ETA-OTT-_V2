import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Mail, GraduationCap, Trophy,
    MessageSquare, Target, Activity, Star,
    Briefcase, Calendar, MapPin, Phone,
    Loader2, TrendingUp, BookOpen, Clock,
    ChevronRight, ExternalLink
} from 'lucide-react';
import apiClient from '../../api/axios.config';
import LearningProgress from '../student/LearningProgress';

export default function StudentProfileSlideover({ isOpen, onClose, studentId, courseName }) {
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchStudentDetails();
        }
    }, [isOpen, studentId]);

    const fetchStudentDetails = async () => {
        setLoading(true);
        try {
            // We reuse the profile endpoint but it might need to be specialized for faculty viewing students
            // For now, we assume the faculty has permission to see student details
            const response = await apiClient.get(`/auth/profile/${studentId}`);
            setStudent(response.data.data.user);
        } catch (error) {
            console.error('Fetch student details error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] overflow-hidden">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Slideover Content */}
                <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex">
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="h-full w-full bg-background shadow-2xl flex flex-col border-l border-border"
                    >
                        {/* Header */}
                        <div className="p-6 border-b flex items-center justify-between bg-card">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary font-black">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight">Student Profile</h2>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{courseName}</span>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-[10px] text-primary font-black uppercase tracking-widest">Performance Analysis</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synthesizing Analytics...</p>
                                </div>
                            ) : student ? (
                                <div className="p-8 space-y-10">
                                    {/* Profile Hero */}
                                    <div className="relative p-6 rounded-3xl bg-secondary/20 border border-border/50 overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Trophy className="w-32 h-32" />
                                        </div>
                                        <div className="flex flex-col md:flex-row items-center gap-6 relative">
                                            <div className="w-24 h-24 rounded-3xl border-2 border-primary/20 p-1 bg-background shadow-xl">
                                                {student.profile?.avatar ? (
                                                    <img src={student.profile.avatar} alt={student.profile.name} className="w-full h-full object-cover rounded-2xl" />
                                                ) : (
                                                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-3xl rounded-2xl">
                                                        {student.profile?.name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-center md:text-left">
                                                <h3 className="text-2xl font-black">{student.profile?.name}</h3>
                                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                        <Mail className="w-3 h-3" /> {student.email}
                                                    </span>
                                                    <span className="text-muted-foreground/30">•</span>
                                                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary">
                                                        <TrendingUp className="w-3 h-3" /> Confidence: {student.confidenceScore}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio / About */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground py-2 border-b flex items-center gap-2">
                                            <Activity className="w-4 h-4" /> Academic Overview
                                        </h4>
                                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                            {student.profile?.bio || 'No academic bio provided.'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Semester</p>
                                                <p className="text-sm font-bold uppercase">{student.profile?.semester || 'N/A'}</p>
                                            </div>
                                            <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">PRN Number</p>
                                                <p className="text-sm font-bold uppercase tracking-widest">{student.profile?.prnNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interactive Analytics Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground py-2 border-b flex items-center gap-2 flex-1">
                                                <Target className="w-4 h-4 text-primary" /> Performance Deep-Dive
                                            </h4>
                                        </div>

                                        {/* Injecting the LearningProgress component with custom studentId */}
                                        <div className="scale-95 origin-top">
                                            <LearningProgress overrideUserId={studentId} isCompact={true} />
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="pt-6 border-t flex gap-4">
                                        <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:shadow-2xl transition-all active:scale-95">
                                            <MessageSquare className="w-4 h-4" /> Start Discussion
                                        </button>
                                        <button className="px-6 py-3 bg-secondary text-foreground rounded-2xl font-black uppercase tracking-widest text-xs border border-border/50 hover:bg-secondary/80 transition-all">
                                            Export PDF
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    <p>Student details could not be found.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
}
