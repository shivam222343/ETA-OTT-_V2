import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QRScanner({ onScan, onClose }) {
    const [permissionStatus, setPermissionStatus] = useState('pending'); // pending, granted, denied
    const [error, setError] = useState(null);
    const [isStarting, setIsStarting] = useState(false);
    const scannerRef = useRef(null);
    const readerId = "reader";

    useEffect(() => {
        // Initialize the low-level library
        scannerRef.current = new Html5Qrcode(readerId);

        // Optional: Check if permission was already granted (limited browser support)
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'camera' }).then(result => {
                if (result.state === 'granted') {
                    // We still don't start automatically to ensure UI is ready
                    // but we could. For now, let's just update the state.
                    // setPermissionStatus('granted');
                }
            });
        }

        return () => {
            stopScanner();
        };
    }, []);

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.error("Failed to stop scanner", err);
            }
        }
    };

    const handleRequestPermission = async () => {
        setIsStarting(true);
        setError(null);
        try {
            // First, trigger browser prompt by requesting cameras
            const devices = await Html5Qrcode.getCameras();

            if (devices && devices.length > 0) {
                setPermissionStatus('granted');
                startScanning();
            } else {
                setPermissionStatus('denied');
                setError("No camera devices found.");
            }
        } catch (err) {
            console.error("Camera permission error:", err);
            setPermissionStatus('denied');
            setError("Camera access denied. Please allow camera permissions in your browser settings to scan QR codes.");
        } finally {
            setIsStarting(false);
        }
    };

    const startScanning = async () => {
        try {
            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    // Success callback
                    stopScanner().then(() => {
                        onScan(decodedText);
                    });
                },
                () => {
                    // Failure callback - ignore to keep scanning
                }
            );
        } catch (err) {
            console.error("Failed to start scanning", err);
            setError("Could not start camera stream. Ensure no other app is using the camera.");
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Scan Branch QR</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Identity Verification</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/10 rounded-2xl transition-all hover:rotate-90 duration-300"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="relative aspect-square bg-black overflow-hidden group">
                    <div id={readerId} className="w-full h-full"></div>

                    <AnimatePresence>
                        {permissionStatus !== 'granted' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-black/80 text-center gap-6"
                            >
                                {permissionStatus === 'denied' ? (
                                    <>
                                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                            <AlertCircle className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-white text-lg">Permission Denied</h4>
                                            <p className="text-sm text-red-200/60 leading-relaxed font-medium">
                                                {error || "We need camera access to scan codes. Check your site settings."}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleRequestPermission}
                                            className="px-8 py-3 bg-red-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-red-600 transition-colors shadow-xl"
                                        >
                                            Retry Permission
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden">
                                            <ShieldCheck className="w-12 h-12 relative z-10" />
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.3, 0.1, 0.3]
                                                }}
                                                transition={{ duration: 3, repeat: Infinity }}
                                                className="absolute inset-0 bg-primary/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-white text-xl">Camera Permission</h4>
                                            <p className="text-sm text-muted-foreground px-4">
                                                Allow camera access to automatically detect and scan branch codes.
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleRequestPermission}
                                            disabled={isStarting}
                                            className="w-full max-w-[240px] px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20"
                                        >
                                            {isStarting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Camera className="w-5 h-5" />
                                                    Enable Camera
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Scanning Animation Overlays (Only show when granted) */}
                    {permissionStatus === 'granted' && (
                        <div className="absolute inset-0 pointer-events-none z-10 border-[40px] border-black/20">
                            <div className="w-full h-full border-2 border-primary/50 relative">
                                <motion.div
                                    animate={{ y: [0, 250, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.8)]"
                                />
                                {/* Corners */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 text-center bg-secondary/10">
                    <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                        Align the QR code within the central frame to automatically join the branch.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
