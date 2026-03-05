import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, ExternalLink, ChevronRight, Check, AlertCircle, X, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import apiClient from '../api/axios.config';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const GroqKeyModal = ({ isOpen, onClose, onSave, initialReason = null }) => {
    const { updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);

    const steps = [
        {
            title: "Why an API Key?",
            content: "To give you the best AI tutoring experience without limits, we use your own Groq API key. It's free to get and ensures privacy.",
            icon: <Zap className="w-6 h-6 text-amber-500" />
        },
        {
            title: "Get Your Key",
            content: "1. Visit Groq Console. 2. Create an API Key. 3. Copy the 'gsk_...' key and paste it here.",
            icon: <Key className="w-6 h-6 text-blue-500" />
        }
    ];

    const handleNext = () => {
        if (step < 2) setStep(step + 1);
    };

    const handleSave = async () => {
        if (!apiKey.startsWith('gsk_')) {
            toast.error('Invalid Groq API key format. Should start with gsk_');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/doubts/config/groq-key', { apiKey });
            if (res.data.success) {
                updateUser(res.data.data.user);
                toast.success('API Key configured successfully!');
                onSave(apiKey);
                onClose();
            }
        } catch (error) {
            toast.error('Failed to save API key');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        try {
            await apiClient.post('/doubts/config/onboarding-skip');
        } catch (e) { }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden"
                >
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full translate-y-12 -translate-x-12 blur-2xl" />

                    <div className="relative">
                        {/* Close Button */}
                        <button
                            onClick={handleSkip}
                            className="absolute -top-4 -right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>

                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                {steps[step - 1].icon}
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                                {initialReason === 'API_LIMIT_REACHED' ? 'Limit Reached' : steps[step - 1].title}
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
                                {initialReason === 'API_LIMIT_REACHED'
                                    ? "Your personal API key limit has been reached. Please provide a new key or wait for the limit to reset."
                                    : steps[step - 1].content
                                }
                            </p>
                        </div>

                        {step === 1 && (
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3 p-4 bg-emerald-50 content-[''] dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">Privacy First</p>
                                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/60 leading-relaxed">Your key is used only for your doubts and never shared with others.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 mb-8">
                                <a
                                    href="https://console.groq.com/keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 hover:border-primary transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                                            <ExternalLink className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium dark:text-zinc-300">Open Groq Console</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                                </a>

                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Configure Your Key</label>
                                    <div className="relative group">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            placeholder="gsk_..."
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={handleSkip}
                                className="flex-1 py-4 px-6 rounded-2xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all font-bold text-sm"
                            >
                                Skip for now
                            </button>
                            {step === 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="flex-[2] py-4 px-6 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                                >
                                    <span>Next Step</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={loading || !apiKey}
                                    className="flex-[2] py-4 px-6 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> <span>Save Key</span></>}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GroqKeyModal;
