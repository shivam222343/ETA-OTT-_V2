import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Send, Award, MessageSquare,
    AlertCircle, CheckCircle2, User,
    Clock, Sparkles, BookOpen, Brain,
    ArrowRight, Image as ImageIcon, Upload, Trash2, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

const PeerQuestionModal = ({ isOpen, onClose, mode = 'ask', question = null, courses = [], currentBranchId, onSuccess, user }) => {
    const isFaculty = user?.role === 'faculty';
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

            // Only fetch chances for students
            if (!isFaculty) {
                const fetchChances = async () => {
                    try {
                        const { data } = await apiClient.get('/peer/chances/me');
                        if (data.success) setMonthlyChances(data.remaining);
                    } catch (err) {
                        console.error('Failed to fetch chances');
                    }
                };
                fetchChances();
            }
        }
    }, [question, mode, isOpen, isFaculty]);

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
                if (formData[key]) data.append(key, formData[key]);
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
                if (!currentBranchId) throw new Error('Branch information missing. Please re-login.');
                data.append('branchId', currentBranchId);
                await apiClient.post('/peer/ask', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Question submitted to Peer Learning system!');
            } else if (mode === 'solve') {
                if (!formData.answer) throw new Error('Answer cannot be empty');
                await apiClient.post(`/peer/${question._id}/solve`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Solution submitted for faculty review!');
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
                    className="absolute inset-0 bg-background/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className={`relative w-full max-w-2xl max-h-[90vh] bg-card border border-border shadow-2xl rounded-[32px] overflow-hidden flex flex-col ${isFaculty && mode === 'ask' ? 'ring-2 ring-indigo-500/20' : ''}`}
                >
                    {/* Header */}
                    <div className={`p-8 border-b border-border/50 bg-gradient-to-br ${isFaculty ? 'from-indigo-500/10 via-amber-500/5' : 'from-primary/5'} via-transparent to-transparent`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${isFaculty ? 'bg-indigo-500/20 text-indigo-500 shadow-lg shadow-indigo-500/10' : 'bg-primary/10 text-primary'}`}>
                                    {isFaculty ? <Brain className="w-6 h-6" /> : mode === 'ask' ? <MessageSquare className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                        {isFaculty ? (formData.isGolden ? 'Curate Golden Doubt' : 'Faculty Curation Hub') : mode === 'ask' ? 'Ask Peer Question' : 'Solve Doubt'}
                                        {isFaculty && formData.isGolden && <Star className="w-5 h-5 fill-amber-500 text-amber-500 animate-pulse" />}
                                    </h2>
                                    <p className="text-sm text-muted-foreground font-medium">
                                        {isFaculty
                                            ? 'Curate high-quality learning materials for the community.'
                                            : mode === 'ask'
                                                ? 'Get help from your batchmates and earn golden tags.'
                                                : 'Help your peers and earn reward credits.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-secondary rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {mode === 'ask' ? (
                                <>
                                    {isFaculty && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-[24px] border border-border/50">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Reward Credits</label>
                                                <div className="relative">
                                                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                                                    <input
                                                        type="number"
                                                        value={formData.rewardPoints}
                                                        onChange={(e) => setFormData({ ...formData, rewardPoints: parseInt(e.target.value) })}
                                                        className="w-full bg-background border border-border focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 outline-none transition-all text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => setFormData({ ...formData, isGolden: !formData.isGolden })}
                                                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${formData.isGolden ? 'bg-amber-500/10 border-amber-500/30' : 'bg-background border-border hover:border-amber-500/20'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.isGolden ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-secondary text-muted-foreground'}`}>
                                                    <Star className={`w-5 h-5 ${formData.isGolden ? 'fill-white' : ''}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className={`text-[10px] font-black uppercase tracking-wider ${formData.isGolden ? 'text-amber-900 dark:text-amber-100' : 'text-muted-foreground'}`}>Golden Question</h4>
                                                    <p className="text-[9px] text-muted-foreground/70 font-bold leading-tight">Featured on dashboard</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Select Course</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={formData.courseId}
                                                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                                    className="w-full bg-secondary/50 border border-border focus:border-primary rounded-xl px-4 py-3 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                                                >
                                                    <option value="">{courses.length === 0 ? 'No Courses Found' : 'Choose Course...'}</option>
                                                    {courses.map(course => (
                                                        <option key={course._id} value={course._id}>{course.name} ({course.code || 'N/A'})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                        </div>
                                        {!isFaculty && (
                                            <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                                <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                                                <p className="text-[10px] leading-tight text-primary font-bold uppercase tracking-wider">
                                                    You have {monthlyChances} chances remaining this month.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Question Title</label>
                                        <input
                                            required
                                            placeholder="What is the logic behind binary search?"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-primary rounded-2xl px-5 py-4 outline-none transition-all font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Attachment (Image/Diagram)</label>
                                        <div className="flex items-center gap-4">
                                            {imagePreview ? (
                                                <div className="relative group w-full max-w-[200px] aspect-video rounded-xl overflow-hidden border border-border">
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full max-w-[200px] aspect-[4/3] bg-secondary/30 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-2xl cursor-pointer transition-all group">
                                                    <div className="flex flex-col items-center gap-2 p-4">
                                                        <div className="p-3 rounded-xl bg-background border border-border group-hover:scale-110 group-hover:border-primary/30 transition-all">
                                                            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground group-hover:text-primary">Upload Image</span>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Detailed Description (Optional)</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Provide more context if needed..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-secondary/50 border border-border focus:border-primary rounded-2xl px-5 py-4 outline-none transition-all resize-none text-sm leading-relaxed"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="p-5 bg-secondary/30 rounded-2xl border border-border/50">
                                        <h4 className="font-bold text-lg mb-2">{question?.title}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{question?.description}</p>

                                        {question?.attachments?.length > 0 && (
                                            <div className="mb-4">
                                                <img
                                                    src={question.attachments[0].url}
                                                    alt="Problem diagram"
                                                    className="w-full max-h-[300px] object-contain rounded-xl border border-border bg-background"
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                                            <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                                <Award className="w-4 h-4" />
                                                Reward: {question?.rewardPoints} Credits
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {question?.status === 'solved' ? (
                                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 border-dashed">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Sparkles className="w-5 h-5 text-emerald-500" />
                                                        <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm italic">Approved Solution</h4>
                                                    </div>

                                                    {/* Solver Info */}
                                                    {question.solutions.find(s => s._id === question.acceptedSolutionId)?.studentId && (
                                                        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                            <div className="w-5 h-5 rounded-full overflow-hidden bg-secondary">
                                                                {question.solutions.find(s => s._id === question.acceptedSolutionId).studentId.profile?.avatar ? (
                                                                    <img
                                                                        src={question.solutions.find(s => s._id === question.acceptedSolutionId).studentId.profile.avatar}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <User className="w-3 h-3 text-emerald-600 m-auto" />
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200">
                                                                Solved by {question.solutions.find(s => s._id === question.acceptedSolutionId).studentId.profile?.name || 'Academic Star'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-emerald-500/10 mb-4">
                                                    <p className="text-sm text-emerald-950 dark:text-emerald-50 leading-relaxed italic">
                                                        {question.solutions.find(s => s._id === question.acceptedSolutionId)?.answer || "Solution content unavailable"}
                                                    </p>
                                                </div>
                                                {question.solutions.find(s => s._id === question.acceptedSolutionId)?.attachments?.length > 0 && (
                                                    <img
                                                        src={question.solutions.find(s => s._id === question.acceptedSolutionId).attachments[0].url}
                                                        alt="Solution"
                                                        className="rounded-xl border border-emerald-500/10 shadow-lg max-h-[300px] mx-auto cursor-zoom-in"
                                                        onClick={() => window.open(question.solutions.find(s => s._id === question.acceptedSolutionId).attachments[0].url, '_blank')}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Solution</label>
                                                    <textarea
                                                        required
                                                        rows={4}
                                                        placeholder="Write your explanation here..."
                                                        value={formData.answer}
                                                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                                        className="w-full bg-secondary/50 border border-border focus:border-primary rounded-2xl px-5 py-4 outline-none transition-all resize-none text-sm leading-relaxed"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Solution Diagram (Optional)</label>
                                                    <div className="flex items-center gap-4">
                                                        {imagePreview ? (
                                                            <div className="relative group w-full max-w-[160px] aspect-video rounded-xl overflow-hidden border border-border">
                                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="flex items-center gap-3 px-4 py-3 bg-secondary/30 border border-border border-dashed hover:border-primary/50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all">
                                                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Image</span>
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className="text-[10px] text-muted-foreground font-medium italic mt-1 px-1">
                                                    Help your community! Accepted solutions earn 15 credits.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-8 border-t border-border/50 bg-secondary/5 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl text-sm font-bold hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            {!(mode === 'solve' && question?.status === 'solved') && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Submitting...' : mode === 'ask' ? 'Post Question' : 'Submit Solution'}
                                    {!loading && <Send className="w-4 h-4 ml-1" />}
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PeerQuestionModal;
