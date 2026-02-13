import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Key, Send, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import QRScanner from './QRScanner';

export default function JoinBranchModal({ isOpen, onClose, onSuccess }) {
    const [accessKey, setAccessKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [joinedData, setJoinedData] = useState(null);

    const handleJoin = async (key = accessKey) => {
        if (!key) {
            toast.error('Please enter an access key or scan a QR code');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/branches/join', { accessKey: key });
            setJoinedData(response.data.data.branch);
            toast.success('Successfully joined branch!');

            // Wait a bit to show success state before closing
            setTimeout(() => {
                onSuccess(response.data.data.branch);
                handleClose();
            }, 2000);
        } catch (error) {
            console.error('Join branch error:', error);
            toast.error(error.response?.data?.message || 'Failed to join branch');
        } finally {
            setLoading(false);
        }
    };

    const handleQRScan = (decodedText) => {
        setShowScanner(false);
        try {
            // Check if it's our JSON QR format
            const data = JSON.parse(decodedText);
            if (data.type === 'branch_enrollment' && data.accessKey) {
                handleJoin(data.accessKey);
            } else {
                toast.error('Invalid QR code format');
            }
        } catch (e) {
            // If not JSON, maybe it's just the key string
            handleJoin(decodedText);
        }
    };

    const handleClose = () => {
        setAccessKey('');
        setJoinedData(null);
        setShowScanner(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <AnimatePresence>
                {showScanner && (
                    <QRScanner
                        onScan={handleQRScan}
                        onClose={() => setShowScanner(false)}
                    />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
            >
                <div className="p-6 border-b flex items-center justify-between bg-secondary/30">
                    <div>
                        <h2 className="text-xl font-bold">Join Learning Community</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            Enter the access key provided by your branch
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
                                You have successfully enrolled in this branch.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Access Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={accessKey}
                                        onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                                        placeholder="BR-XXXXXXXXXX"
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
                                        Join Branch
                                    </>
                                )}
                            </button>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase tracking-widest">or</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>

                            <button
                                onClick={() => setShowScanner(true)}
                                className="w-full py-4 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/40 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <QrCode className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-sm">Scan QR Code</p>
                                    <p className="text-[10px] text-muted-foreground">Scan the enrollment QR from your faculty</p>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-8 py-4 bg-secondary/20 border-t">
                    <p className="text-[10px] text-center text-muted-foreground">
                        Need help? Contact your institution administrator for a valid access key or QR code.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
