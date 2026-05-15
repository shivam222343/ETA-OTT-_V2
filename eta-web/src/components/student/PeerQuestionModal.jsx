import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Award, MessageSquare,
    AlertCircle, CheckCircle2, User,
    Clock, Sparkles, BookOpen, Brain,
    ArrowRight, Image as ImageIcon, Upload, Trash2, Star, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

const PeerQuestionModal = ({ isOpen, onClose, mode = 'ask', question = null, courses = [], currentBranchId, onSuccess, user }) => {
    const isFaculty = user?.role === 'faculty' || user?.role === 'admin';
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        answer: '',
        isGolden: false,
        rewardPoints: 15
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [monthlyChances, setMonthlyChances] = useState(3);

    useEffect(() => {
        if (question && mode === 'solve') {
            setFormData(prev => ({ ...prev, title: question.title, description: question.description }));
        } else if (mode === 'ask') {
            setFormData({
                title: '',
                description: '',
                courseId: '',
                answer: '',
                isGolden: false,
                rewardPoints: 15
            });
            setSelectedImage(null);
            setImagePreview(null);

            if (user?.role === 'student') {
                const fetchChances = async () => {
                    try {
                        const { data } = await apiClient.get('/peer/stats');
                        if (data.success) setMonthlyChances(data.data.remainingChances);
                    } catch (err) {
                        console.error('Failed to fetch chances');
                    }
                };
                fetchChances();
            }
        }
    }, [question, mode, isOpen, isFaculty, user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });
            if (selectedImage) {
                data.append('file', selectedImage);
            }
            if (isFaculty) {
                data.append('isGolden', formData.isGolden);
                data.append('rewardPoints', formData.rewardPoints);
            }

            if (mode === 'ask') {
                if (!formData.courseId) throw new Error('Please select a course');
                if (!currentBranchId) throw new Error('Branch information missing.');
                data.append('branchId', currentBranchId);
                await apiClient.post('/peer/ask', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Question submitted!');
            } else if (mode === 'solve') {
                if (!formData.answer) throw new Error('Answer cannot be empty');
                await apiClient.post(`/peer/${question._id}/solve`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Solution submitted!');
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-xl max-h-[90vh] bg-card border border-border shadow-xl rounded-xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                {mode === 'ask' ? <MessageSquare className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold leading-tight">
                                    {mode === 'ask' ? 'Ask a Question' : 'Submit Solution'}
                                </h2>
                                <p className="text-xs text-muted-foreground font-medium">
                                    {mode === 'ask' ? 'Get help from your learning community' : 'Help your peers and earn credits'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {mode === 'ask' ? (
                                <>
                                    {isFaculty && (
                                        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg border border-border">
                                            <div className="flex items-center gap-3">
                                                <Star className={`w-4 h-4 ${formData.isGolden ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                                                <span className="text-xs font-bold">Mark as Golden Question</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={formData.isGolden}
                                                onChange={(e) => setFormData({ ...formData, isGolden: e.target.checked })}
                                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Related Course</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={formData.courseId}
                                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                                    className="w-full h-10 bg-background border border-input rounded-md px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">Select a course...</option>
                                                    {courses.map(course => (
                                                        <option key={course._id} value={course._id}>{course.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Question Title</label>
                                            <input
                                                required
                                                placeholder="e.g., How does the quicksort partition logic work?"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full h-10 bg-background border border-input rounded-md px-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</label>
                                            <textarea
                                                rows={4}
                                                placeholder="Provide details or paste the problem statement..."
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Attachment</label>
                                            <div className="flex items-center gap-3">
                                                {imagePreview ? (
                                                    <div className="relative group w-24 h-24 rounded-md overflow-hidden border border-border">
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-input hover:border-primary/50 hover:bg-accent/50 rounded-md cursor-pointer transition-all">
                                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-[8px] font-bold uppercase mt-1">Upload</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                    </label>
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                                        Add a screenshot or diagram to help others understand your question better.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-4 bg-muted/30 rounded-lg border border-border mb-6">
                                        <h4 className="font-bold text-sm mb-1">{question?.title}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">{question?.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest">
                                                {question?.rewardPoints} Credits Reward
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Solution</label>
                                            <textarea
                                                required
                                                rows={6}
                                                placeholder="Write a clear, step-by-step explanation..."
                                                value={formData.answer}
                                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Supporting Image</label>
                                            <div className="flex items-center gap-3">
                                                {imagePreview ? (
                                                    <div className="relative group w-20 h-20 rounded-md overflow-hidden border border-border">
                                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-white" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center gap-2 px-3 h-10 border border-input hover:border-primary/50 rounded-md cursor-pointer transition-all">
                                                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-xs font-bold uppercase">Add Image</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-border bg-accent/20 flex items-center justify-between">
                            <div className="text-[10px] text-muted-foreground font-medium">
                                {mode === 'ask' && user?.role === 'student' && `Chances left: ${monthlyChances}/3`}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="h-9 px-4 rounded-md text-xs font-bold hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="h-9 px-6 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? 'Processing...' : mode === 'ask' ? 'Post Question' : 'Submit Solution'}
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PeerQuestionModal;
