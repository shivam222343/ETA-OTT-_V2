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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-xl shadow-2xl max-w-md w-full"
            >
                <div className="border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-primary" />
                        Branch QR Code
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">{branch.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {branch.institutionId?.name || 'Institution'}
                        </p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center p-6 bg-white rounded-lg">
                        <QRCodeSVG
                            id="qr-code-svg"
                            value={JSON.stringify({
                                type: 'branch',
                                branchId: branch._id,
                                accessKey: branch.accessKey,
                                name: branch.name
                            })}
                            size={256}
                            level="H"
                            includeMargin={true}
                        />
                    </div>

                    {/* Access Key */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Access Key</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={branch.accessKey}
                                readOnly
                                className="input flex-1 font-mono text-sm"
                            />
                            <button
                                onClick={copyAccessKey}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                Copy
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Students can use this key to join the branch
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={downloadQR}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download QR
                        </button>
                        <button
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            Close
                        </button>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Tip:</strong> Share this QR code with students to let them quickly join your branch. They can also manually enter the access key.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
