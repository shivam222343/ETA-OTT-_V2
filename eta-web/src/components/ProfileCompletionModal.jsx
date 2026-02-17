import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, User, Phone, Briefcase, GraduationCap, Book,
    Calendar, Code, Heart, ChevronRight, Sparkles, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProfileCompletionModal({ isOpen, onClose, onSkip }) {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(1);

    const [formData, setFormData] = useState({
        phone: user?.profile?.phone || '',
        bio: user?.profile?.bio || '',
        // Faculty fields
        department: user?.profile?.department || '',
        designation: user?.profile?.designation || '',
        specialization: user?.profile?.specialization || '',
        // Student fields
        semester: user?.profile?.semester || '',
        prnNumber: user?.profile?.prnNumber || '',
        interests: user?.profile?.interests || ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile(formData);
            toast.success('Profile completed successfully!');
            onClose();
        } catch (error) {
            console.error('Profile completion error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (onSkip) onSkip();
        onClose();
    };

    const isSection1Complete = formData.phone && formData.bio;
    const isSection2Complete = user?.role === 'faculty'
        ? formData.department && formData.designation
        : formData.semester && formData.prnNumber;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="w-full max-w-3xl bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 p-8 border-b border-border">
                        <div className="absolute inset-0 backdrop-blur-3xl" />
                        <div className="relative flex items-start justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Complete Your Profile</h2>
                                        <p className="text-sm text-muted-foreground">Help us personalize your experience</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSkip}
                                className="p-2 hover:bg-secondary/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Progress Indicator */}
                        <div className="relative mt-6 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-secondary/30 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: '0%' }}
                                    animate={{ width: activeSection === 1 ? '50%' : '100%' }}
                                    className="h-full bg-gradient-to-r from-primary to-blue-500"
                                />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">
                                Section {activeSection} of 2
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <AnimatePresence mode="wait">
                            {activeSection === 1 && (
                                <motion.div
                                    key="section1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-bold text-sm text-blue-500">Basic Information</h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Let's start with some essential details about you.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-primary" />
                                                Phone Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="input w-full bg-secondary/50 border-none"
                                                placeholder="Enter your phone number"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <User className="w-4 h-4 text-primary" />
                                                Bio <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                className="input w-full bg-secondary/50 border-none min-h-[100px]"
                                                placeholder="Tell us about yourself..."
                                                required
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeSection === 2 && (
                                <motion.div
                                    key="section2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                        <AlertCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-bold text-sm text-purple-500">
                                                {user?.role === 'faculty' ? 'Professional Details' : 'Academic Details'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {user?.role === 'faculty'
                                                    ? 'Share your professional background and expertise.'
                                                    : 'Help us understand your academic journey.'}
                                            </p>
                                        </div>
                                    </div>

                                    {user?.role === 'faculty' ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-primary" />
                                                    Department <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="department"
                                                    value={formData.department}
                                                    onChange={handleInputChange}
                                                    className="input w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Computer Science"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <GraduationCap className="w-4 h-4 text-primary" />
                                                    Designation <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="designation"
                                                    value={formData.designation}
                                                    onChange={handleInputChange}
                                                    className="input w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Assistant Professor"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Book className="w-4 h-4 text-primary" />
                                                    Specialization
                                                </label>
                                                <input
                                                    name="specialization"
                                                    value={formData.specialization}
                                                    onChange={handleInputChange}
                                                    className="input w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Machine Learning, Data Science"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Code className="w-4 h-4 text-primary" />
                                                    PRN Number (Admission ID) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="prnNumber"
                                                    value={formData.prnNumber}
                                                    onChange={handleInputChange}
                                                    className="input w-full bg-secondary/50 border-none"
                                                    placeholder="Enter your PRN/Admission ID"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    Semester <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="semester"
                                                    value={formData.semester}
                                                    onChange={handleInputChange}
                                                    className="input w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., 5th Semester"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-sm font-medium flex items-center gap-2">
                                                    <Heart className="w-4 h-4 text-primary" />
                                                    Interests
                                                </label>
                                                <input
                                                    name="interests"
                                                    value={formData.interests}
                                                    onChange={handleInputChange}
                                                    className="input w-full bg-secondary/50 border-none"
                                                    placeholder="e.g., Web Development, AI, Robotics"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="px-6 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors"
                            >
                                Skip for now
                            </button>

                            <div className="flex items-center gap-3">
                                {activeSection === 2 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(1)}
                                        className="px-6 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors"
                                    >
                                        Back
                                    </button>
                                )}

                                {activeSection === 1 ? (
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(2)}
                                        disabled={!isSection1Complete}
                                        className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={loading || !isSection2Complete}
                                        className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Saving...' : 'Complete Profile'}
                                        <Sparkles className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
