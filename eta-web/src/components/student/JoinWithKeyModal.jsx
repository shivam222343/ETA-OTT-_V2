import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Send, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function JoinWithKeyModal({ isOpen, onClose, onSuccess }) {
    const [secretKey, setSecretKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [joinedData, setJoinedData] = useState(null);

    const handleJoin = async () => {
        if (!secretKey) {
            toast.error('Please enter your secret access key');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/institutions/join-with-key', { secretKey });
            setJoinedData(response.data.data.institution);
            toast.success(response.data.message);

            // Wait a bit to show success state before closing
            setTimeout(() => {
                if (onSuccess) onSuccess(response.data.data.institution);
                handleClose();
            }, 2500);
        } catch (error) {
            console.error('Join institution error:', error);
            toast.error(error.response?.data?.message || 'Invalid or expired secret key');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setSecretKey('');
        setJoinedData(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
            >
                <div className="p-6 border-b flex items-center justify-between bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Join Institute</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Enter your secure access key
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {joinedData ? (
                        <div className="text-center py-6 space-y-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto"
                            >
                                <CheckCircle2 className="w-12 h-12" />
                            </motion.div>
                            <div>
                                <h3 className="text-xl font-bold">Welcome to {joinedData.name}!</h3>
                                <p className="text-sm text-muted-foreground mt-2 px-4 text-center">
                                    You have successfully joined the institution. You can now access all branches and courses assigned to you.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Secret Access Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value.toUpperCase())}
                                        placeholder="UNI-XXXXXXX or ABC-123-XYZ"
                                        className="input pl-10 w-full font-mono tracking-wider h-12"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                    This key was sent to your registered email address or provided by your faculty.
                                </p>
                            </div>

                            <button
                                onClick={handleJoin}
                                disabled={loading || !secretKey}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base font-bold shadow-lg shadow-primary/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Join Institution
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-8 py-4 bg-secondary/20 border-t">
                    <div className="flex items-center gap-3 justify-center">
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground max-w-[250px]">
                            Private keys are for single use only. Universal keys can be used by multiple students.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function AlertCircle({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    );
}
