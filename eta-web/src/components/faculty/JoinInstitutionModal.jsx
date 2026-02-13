import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Send, Loader2, CheckCircle2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

export default function JoinInstitutionModal({ isOpen, onClose, onSuccess }) {
    const [accessKey, setAccessKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [joinedData, setJoinedData] = useState(null);

    const handleJoin = async (key = accessKey) => {
        if (!key) {
            toast.error('Please enter an access key');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/institutions/join', { accessKey: key });
            setJoinedData(response.data.data.institution);
            toast.success('Successfully joined institution!');

            // Wait a bit to show success state before closing
            setTimeout(() => {
                onSuccess(response.data.data.institution);
                handleClose();
            }, 2000);
        } catch (error) {
            console.error('Join institution error:', error);
            toast.error(error.response?.data?.message || 'Failed to join institution');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setAccessKey('');
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
                    <div>
                        <h2 className="text-xl font-bold">Join Institution</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            Enter the faculty access key for the institution
                        </p>
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
                        <div className="text-center py-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <CheckCircle2 className="w-10 h-10" />
                            </motion.div>
                            <h3 className="text-lg font-bold">Welcome to {joinedData.name}!</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                                You are now a faculty member of this institution.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Faculty Access Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={accessKey}
                                        onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                                        placeholder="INS-XXXXXXXXXX"
                                        className="input pl-10 w-full font-mono tracking-wider"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => handleJoin()}
                                disabled={loading || !accessKey}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Join Institution
                                    </>
                                )}
                            </button>

                            <div className="bg-secondary/20 p-4 rounded-xl flex items-start gap-3 border border-border">
                                <Building2 className="w-5 h-5 text-primary shrink-0" />
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    Access keys are provided by the institution administrator.
                                    By joining, you will have access to create and manage courses
                                    within the institution branches.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-4 bg-secondary/20 border-t">
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-medium">
                        Secure Faculty Access
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
