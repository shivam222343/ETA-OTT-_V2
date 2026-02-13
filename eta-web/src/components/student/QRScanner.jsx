import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        const qrcodeScanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        qrcodeScanner.render(onScanSuccess, onScanFailure);
        setScanner(qrcodeScanner);

        function onScanSuccess(decodedText, decodedResult) {
            // handle the scanned code as you like, for example:
            console.log(`Code matched = ${decodedText}`, decodedResult);

            // Stop scanning and close
            if (qrcodeScanner) {
                qrcodeScanner.clear().then(() => {
                    onScan(decodedText);
                }).catch(err => {
                    console.error("Failed to clear scanner", err);
                    onScan(decodedText);
                });
            }
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            if (qrcodeScanner) {
                qrcodeScanner.clear().catch(err => console.error("Failed to clear scanner on unmount", err));
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <div className="p-4 border-b flex items-center justify-between bg-secondary/50">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-primary" />
                        <h3 className="font-bold">Scan Branch QR</h3>
                    </div>
                    <button
                        onClick={() => {
                            if (scanner) {
                                scanner.clear().then(() => onClose()).catch(() => onClose());
                            } else {
                                onClose();
                            }
                        }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-0 bg-black aspect-square">
                    <div id="reader" className="w-full h-full"></div>
                </div>

                <div className="p-6 text-center text-sm text-muted-foreground">
                    <p>Align the QR code within the frame to automatically scan and join the branch.</p>
                </div>
            </div>
        </div>
    );
}
