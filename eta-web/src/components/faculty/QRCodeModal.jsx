import { motion } from 'framer-motion';
import { X, QrCode, Download, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function QRCodeModal({ isOpen, onClose, branch }) {
    if (!isOpen || !branch) return null;

    const copyAccessKey = () => {
        navigator.clipboard.writeText(branch.accessKey);
        toast.success('Access key copied to clipboard!');
    };

    const downloadQR = () => {
        const svg = document.getElementById('qr-code-svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `${branch.name}-QR.png`;
            downloadLink.href = pngFile;
            downloadLink.click();

            toast.success('QR code downloaded!');
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="bg-card rounded-2xl shadow-2xl max-w-md md:max-w-4xl w-full overflow-hidden border border-border"
            >
                {/* Header */}
                <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <QrCode className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">Branch Access Portal</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors group"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                    {/* Left Section - Info & Details (Mobile Top / Desktop Left) */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2 py-1 rounded">Branch Details</span>
                            <h3 className="text-3xl font-black mt-2 leading-tight">{branch.name}</h3>
                            <p className="text-muted-foreground font-medium mt-1">
                                {branch.institutionId?.name || 'Institution Headed'}
                            </p>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                <span className="p-1 bg-blue-500 rounded-md text-white">💡</span> Expert Tip
                            </h4>
                            <p className="text-sm leading-relaxed text-blue-900/80 dark:text-blue-100/80">
                                Share this portal with your students. They can join instantly by scanning the QR or using the secure access key below.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={downloadQR}
                                className="btn-primary flex items-center justify-center gap-3 py-4 shadow-lg shadow-primary/20"
                            >
                                <Download className="w-5 h-5" />
                                <span className="font-bold">Download Pro Kit</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="btn-secondary py-3 font-bold"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>

                    {/* Right Section - Interactive QR & Key (Mobile Bottom / Desktop Right) */}
                    <div className="w-full md:w-[380px] space-y-6 flex flex-col items-center justify-center bg-muted/20 rounded-2xl p-6 border border-border/50">
                        {/* QR Container */}
                        <div className="relative group">
                            <div className="absolute -inset-2 bg-primary/20 rounded-2xl blur-xl group-hover:bg-primary/30 transition-all opacity-0 group-hover:opacity-100"></div>
                            <div className="relative bg-white p-4 rounded-xl shadow-xl transition-transform group-hover:scale-[1.02]">
                                <QRCodeSVG
                                    id="qr-code-svg"
                                    value={JSON.stringify({
                                        type: 'branch',
                                        branchId: branch._id,
                                        accessKey: branch.accessKey,
                                        name: branch.name
                                    })}
                                    size={240}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                        </div>

                        {/* Key Display */}
                        <div className="w-full space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Secure Access Key</label>
                            <div className="flex gap-2 p-1.5 bg-background border border-border rounded-xl focus-within:ring-2 ring-primary/20 transition-all">
                                <input
                                    type="text"
                                    value={branch.accessKey}
                                    readOnly
                                    className="bg-transparent border-none focus:ring-0 flex-1 px-3 font-mono text-lg font-bold tracking-tighter"
                                />
                                <button
                                    onClick={copyAccessKey}
                                    className="p-3 hover:bg-primary hover:text-white rounded-lg transition-all"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
