import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, Share2, Maximize2, Minimize2,
    FileText, Video, Info, BarChart3, List, MessageCircle,
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Eye, Pencil, Play, ExternalLink, Globe, Clock
} from 'lucide-react';
import ReactPlayer from 'react-player';
import { Document, Page, pdfjs } from 'react-pdf';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';
import { useSocket } from '../../hooks/useSocket';
const AITutor = lazy(() => import('../AITutor'));
import Loader from '../Loader';
import ThemeToggle from '../ThemeToggle';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();


export default function ContentViewer({ isOpen, onClose, content }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [activeTab, setActiveTab] = useState('viewer'); // 'viewer', 'details', 'graph'
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isScrollMode, setIsScrollMode] = useState(false);
    const [selection, setSelection] = useState('');
    const [selectionBox, setSelectionBox] = useState(null); // { x, y, width, height, type: 'rect' }
    const [isDrawing, setIsDrawing] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [isResizing, setIsResizing] = useState(null); // 'nw', 'ne', 'sw', 'se'
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const viewerRef = useRef(null);
    const playerRef = useRef(null);
    const selectionBoxRef = useRef(null);
    const [localContent, setLocalContent] = useState(content);
    const [estimatedTime, setEstimatedTime] = useState(0);
    const [aiSidebarWidth, setAISidebarWidth] = useState(400); // Default width
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const [isTabsVisible, setIsTabsVisible] = useState(true);
    const socket = useSocket();

    // Sync local content with prop
    useEffect(() => {
        setLocalContent(content);
    }, [content?._id]);

    // WebSocket Real-time Updates
    useEffect(() => {
        if (!socket || !localContent) return;

        const courseId = localContent.courseId?._id || localContent.courseId;
        if (courseId) {
            socket.emit('join:course', courseId);
            console.log(`📡 Joined course room for real-time updates: ${courseId}`);
        }

        const handleProcessing = (data) => {
            if (data.contentId === localContent._id) {
                console.log('🔄 Progress update:', data);
                setLocalContent(prev => ({
                    ...prev,
                    processingProgress: data.progress,
                    processingStatus: data.status
                }));
            }
        };

        const handleCompleted = (data) => {
            if (data.contentId === localContent._id) {
                console.log('✅ Extraction completed!');
                setLocalContent(data.content);
            }
        };

        const handleFailed = (data) => {
            if (data.contentId === localContent._id) {
                console.log('❌ Extraction failed:', data.error);
                setLocalContent(prev => ({
                    ...prev,
                    processingStatus: 'failed',
                    processingError: data.error
                }));
            }
        };

        socket.on('content:processing', handleProcessing);
        socket.on('content:completed', handleCompleted);
        socket.on('content:failed', handleFailed);

        return () => {
            socket.off('content:processing', handleProcessing);
            socket.off('content:completed', handleCompleted);
            socket.off('content:failed', handleFailed);
        };
    }, [socket, localContent?._id]);

    // Polling for updates if not completed/failed
    const restartTriggeredRef = useRef(false);

    useEffect(() => {
        // Automatic extraction restart if opened again and was previously failed/cancelled
        const autoRestart = async () => {
            if (localContent?.processingStatus === 'failed' && !restartTriggeredRef.current) {
                console.log('♻️ Content was failed/cancelled - Auto-restarting extraction...');
                restartTriggeredRef.current = true;
                try {
                    const response = await apiClient.post(`/content/${localContent._id}/reprocess`);
                    if (response.data.success) {
                        // Refresh local content to 'pending' state to start polling
                        const updated = await apiClient.get(`/content/${localContent._id}`);
                        if (updated.data.success) {
                            setLocalContent(updated.data.data.content);
                        }
                    }
                } catch (error) {
                    console.error('Failed to auto-restart processing:', error);
                }
            }
        };

        autoRestart();

        let pollInterval;
        if (localContent && (localContent.processingStatus === 'pending' || localContent.processingStatus === 'processing')) {
            pollInterval = setInterval(async () => {
                try {
                    const response = await apiClient.get(`/content/${localContent._id}`);
                    if (response.data.success) {
                        setLocalContent(response.data.data.content);
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }, 5000);
        }
        return () => clearInterval(pollInterval);
    }, [localContent?._id, localContent?.processingStatus]);

    // AI Processing Countdown logic
    useEffect(() => {
        if (localContent?.processingStatus === 'pending' || localContent?.processingStatus === 'processing') {
            if (estimatedTime === 0) {
                // Initial estimate: roughly 8% of duration + 15s base overhead
                const duration = localContent.file?.duration || 120;
                const progress = localContent.processingProgress || 0;
                const remainingRatio = Math.max(0.1, (100 - progress) / 100);
                const initialEst = Math.ceil((duration * 0.08 + 15) * remainingRatio);
                setEstimatedTime(initialEst);
            }
        } else {
            setEstimatedTime(0);
        }
    }, [localContent?.processingStatus, localContent?._id]);

    // Track processing status in ref to handle cancellation on unmount correctly
    const processingStatusRef = useRef(localContent?.processingStatus);
    useEffect(() => {
        processingStatusRef.current = localContent?.processingStatus;
    }, [localContent?.processingStatus]);

    // Handle cancellation on unmount
    useEffect(() => {
        return () => {
            if (processingStatusRef.current === 'pending' || processingStatusRef.current === 'processing') {
                console.log('⏹️ Closing viewer - terminating background extraction...');
                apiClient.patch(`/content/${localContent._id}/cancel-processing`).catch(err => {
                    console.error('Failed to cancel processing on unmount:', err);
                });
            }
        };
    }, [localContent?._id]);

    useEffect(() => {
        let timer;
        if ((localContent?.processingStatus === 'pending' || localContent?.processingStatus === 'processing') && estimatedTime > 0) {
            timer = setInterval(() => {
                setEstimatedTime(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [localContent?.processingStatus, estimatedTime > 0]);

    // Resize Event Handler for AI Sidebar
    useEffect(() => {
        const handleMouseMoveResize = (e) => {
            if (!isResizingSidebar) return;
            // Adjustment for right tabs (64px)
            const newWidth = window.innerWidth - e.clientX - 64;
            setAISidebarWidth(Math.min(Math.max(300, newWidth), 800));
        };
        const handleMouseUpResize = () => setIsResizingSidebar(false);

        if (isResizingSidebar) {
            window.addEventListener('mousemove', handleMouseMoveResize);
            window.addEventListener('mouseup', handleMouseUpResize);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMoveResize);
            window.removeEventListener('mouseup', handleMouseUpResize);
        };
    }, [isResizingSidebar]);

    const pdfFile = useMemo(() => {
        if (!content?.file?.url) return null;

        // If it's web content but not yet a PDF, don't try to load it in the PDF viewer
        if (content.type === 'web' && content.file.format !== 'pdf') return null;

        const isCloudinary = content.file.url.includes('cloudinary.com');

        if (isCloudinary) {
            return {
                url: `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content/view/proxy?url=${encodeURIComponent(content.file.url)}`,
                httpHeaders: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            };
        }

        return content.file.url;
    }, [content?.file?.url, content?.type, content?.file?.format]);

    if (!isOpen || !content || !localContent) return null;

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    function onDocumentLoadError(error) {
        console.error('PDF Load Error:', error);
        toast.error('Failed to load PDF: ' + error.message);
    }

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    const handleMouseDown = (e) => {
        if (!isSelectionMode || !viewerRef.current) return;

        // Prevent default touch behavior (scrolling) when drawing
        if (e.type === 'touchstart' && isSelectionMode) {
            e.preventDefault();
        }

        e.stopPropagation();

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const rect = viewerRef.current.getBoundingClientRect();
        const x = clientX - rect.left + viewerRef.current.scrollLeft;
        const y = clientY - rect.top + viewerRef.current.scrollTop;

        const handleSize = 10;
        if (selectionBox) {
            const { x: bx, y: by, width: bw, height: bh } = selectionBox;
            const onRight = x > bx + bw - handleSize && x < bx + bw + handleSize;
            const onBottom = y > by + bh - handleSize && y < by + bh + handleSize;

            if (onRight && onBottom) {
                setIsResizing('se');
                setStartPos({ x, y });
                return;
            }

            if (x > bx && x < bx + bw && y > by && y < by + bh) {
                setIsMoving(true);
                setStartPos({ x: x - bx, y: y - by });
                return;
            }
        }

        setIsDrawing(true);
        setStartPos({ x, y });
        selectionBoxRef.current = null;
    };

    const handleMouseMove = (e) => {
        if (!isSelectionMode || (!isDrawing && !isMoving && !isResizing) || !viewerRef.current) return;

        if (e.type === 'touchmove' && isSelectionMode) {
            e.preventDefault();
        }

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const rect = viewerRef.current.getBoundingClientRect();
        const x = clientX - rect.left + viewerRef.current.scrollLeft;
        const y = clientY - rect.top + viewerRef.current.scrollTop;

        let newBox = null;
        if (isDrawing) {
            newBox = {
                x: Math.min(x, startPos.x),
                y: Math.min(y, startPos.y),
                width: Math.abs(x - startPos.x),
                height: Math.abs(y - startPos.y),
                type: 'rect'
            };
        } else if (isMoving) {
            newBox = {
                ...selectionBox,
                x: x - startPos.x,
                y: y - startPos.y
            };
        } else if (isResizing === 'se') {
            newBox = {
                ...selectionBox,
                width: Math.max(20, x - selectionBox.x),
                height: Math.max(20, y - selectionBox.y)
            };
        }

        if (newBox) {
            setSelectionBox(newBox);
            selectionBoxRef.current = newBox;

            // Auto-scroll logic when drawing/moving/resizing near edges
            const scrollThreshold = 60;
            const scrollSpeed = 15;
            const container = viewerRef.current;

            if (clientX > rect.right - scrollThreshold) {
                container.scrollLeft += scrollSpeed;
            } else if (clientX < rect.left + scrollThreshold) {
                container.scrollLeft -= scrollSpeed;
            }

            if (clientY > rect.bottom - scrollThreshold) {
                container.scrollTop += scrollSpeed;
            } else if (clientY < rect.top + scrollThreshold) {
                container.scrollTop -= scrollSpeed;
            }
        }
    };

    const extractTextFromArea = (box) => {
        if (!box || (content.type !== 'pdf' && content.type !== 'web') || !viewerRef.current) return '';

        // Target all text layer elements (react-pdf uses both span and div)
        const textElements = document.querySelectorAll('.react-pdf__Page__textContent span, .react-pdf__Page__textContent div, .textLayer span, .textLayer div, [role="presentation"] span, .pdf-text span');
        let extractedText = [];
        const vRect = viewerRef.current.getBoundingClientRect();

        // Add small padding to the box for better hit detection
        const padding = 2;
        const boxX = box.x - padding;
        const boxY = box.y - padding;
        const boxW = box.width + (padding * 2);
        const boxH = box.height + (padding * 2);

        textElements.forEach(el => {
            // Only process elements that actually have text
            if (!el.innerText?.trim()) return;

            const eRect = el.getBoundingClientRect();
            const relRect = {
                left: eRect.left - vRect.left + viewerRef.current.scrollLeft,
                top: eRect.top - vRect.top + viewerRef.current.scrollTop,
                right: eRect.right - vRect.left + viewerRef.current.scrollLeft,
                bottom: eRect.bottom - vRect.top + viewerRef.current.scrollTop
            };

            // Check if element intersects with selection box
            if (relRect.left < boxX + boxW && relRect.right > boxX &&
                relRect.top < boxY + boxH && relRect.bottom > boxY) {
                extractedText.push(el.innerText);
            }
        });

        const result = extractedText.join(' ').replace(/\s+/g, ' ').trim();
        return result;
    };

    const handleMouseUp = () => {
        const currentBox = selectionBoxRef.current || selectionBox;

        if (isDrawing || isMoving || isResizing) {
            if (currentBox?.width > 10 && currentBox?.height > 10) {
                if (content.type === 'pdf' || content.type === 'web') {
                    const txt = extractTextFromArea(currentBox);
                    setSelection(txt || '(Visual Scan - AI Analysis)');
                } else if (content.type === 'image') {
                    setSelection('(Image Focus - AI Vision)');
                } else if (content.type === 'video') {
                    const currentTime = playerRef.current?.getCurrentTime();
                    const formattedTime = currentTime ? ` [at ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}]` : '';
                    setSelection(`(Video Focus - Analyzing Frame${formattedTime})`);
                }

                if (!isAISidebarOpen) setIsAISidebarOpen(true);
            }
        }
        setIsDrawing(false);
        setIsMoving(false);
        setIsResizing(null);
    };

    const renderViewer = () => {
        const type = (localContent?.type || content?.type || '').toLowerCase();
        const format = (localContent?.file?.format || content?.file?.format || '').toLowerCase();
        const url = localContent?.file?.url || content?.file?.url || '';

        // Prioritize video player if it's a known video format or explicitly typed
        if (type === 'video' || format === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
            return (
                <div className="relative aspect-video w-full bg-black flex items-center justify-center group h-full">
                    <ReactPlayer
                        ref={playerRef}
                        url={url}
                        controls={!isSelectionMode}
                        width="100%"
                        height="100%"
                        style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                        playing={!isSelectionMode}
                        light={(localContent?.file?.thumbnail?.url || content?.file?.thumbnail?.url) || false}
                        playIcon={
                            <div className="w-20 h-20 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-2xl scale-125 hover:scale-150 transition-transform">
                                <Play className="w-8 h-8 fill-current ml-1" />
                            </div>
                        }
                        config={{
                            file: {
                                attributes: {
                                    controlsList: 'nodownload'
                                }
                            }
                        }}
                    />
                    {isSelectionMode && (
                        <div
                            className="absolute inset-0 z-20 bg-transparent cursor-crosshair"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                    {isSelectionMode && !selectionBox && (
                        <div className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity" />
                    )}
                </div>
            );
        }

        switch (type) {
            case 'pdf':
                return (
                    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-900 overflow-auto p-4 min-h-[500px] w-full custom-scrollbar">
                        <div className="sticky top-0 z-20 flex flex-wrap justify-center items-center gap-2 mb-4 bg-card/80 backdrop-blur p-2 rounded-lg shadow-sm w-full max-w-3xl">
                            {!isScrollMode && (
                                <>
                                    <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1} className="p-2 hover:bg-secondary rounded disabled:opacity-50">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-medium min-w-[100px] text-center">
                                        Page {pageNumber} of {numPages || '?'}
                                    </span>
                                    <button onClick={() => setPageNumber(Math.min(numPages || pageNumber, pageNumber + 1))} disabled={numPages && pageNumber >= numPages} className="p-2 hover:bg-secondary rounded disabled:opacity-50">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <div className="w-px h-6 bg-border mx-2" />
                            <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg">
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-secondary rounded"><ZoomOut className="w-4 h-4" /></button>
                                <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                                <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 hover:bg-secondary rounded"><ZoomIn className="w-4 h-4" /></button>
                            </div>
                            <div className="w-px h-6 bg-border mx-2" />
                            <button
                                onClick={() => setIsScrollMode(!isScrollMode)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isScrollMode ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
                            >
                                <List className="w-4 h-4" />
                                {isScrollMode ? 'Exit Scroll Mode' : 'Continuous Scroll'}
                            </button>
                        </div>
                        <div className="flex-1 w-full flex flex-col items-center pb-8 gap-4">
                            <Document
                                file={pdfFile}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading={<Loader fullScreen={false} className="py-20" />}
                                error={
                                    <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
                                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-2">
                                            <X className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Failed to load PDF</h3>
                                            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                                We couldn't retrieve the document. This might be due to a connection issue or CORS restrictions.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="btn-primary"
                                        >
                                            Try Refreshing
                                        </button>
                                        <a
                                            href={content.file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Open in new tab instead
                                        </a>
                                    </div>
                                }
                            >
                                {isScrollMode ? (
                                    Array.from(new Array(numPages), (el, index) => (
                                        <Page
                                            key={`page_${index + 1}`}
                                            pageNumber={index + 1}
                                            scale={scale}
                                            className="shadow-xl mb-4"
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                        />
                                    ))
                                ) : (
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={pageNumber}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Page pageNumber={pageNumber} scale={scale} className="shadow-2xl rounded-sm" renderTextLayer={true} renderAnnotationLayer={true} />
                                        </motion.div>
                                    </AnimatePresence>
                                )}
                            </Document>
                        </div>
                    </div >
                );
            case 'image':
                return (
                    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 min-h-[500px]">
                        <img
                            src={content.file.url}
                            alt={content.title}
                            className="max-w-full max-h-full shadow-lg rounded-lg"
                        />
                    </div>
                );
            case 'code':
            case 'document':
                if (!content.extractedData?.text) {
                    return (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-[#1e1e1e] text-gray-400">
                            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                                <Code className="w-8 h-8 text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Extraction in Progress</h3>
                            <p className="text-sm mb-6 max-w-sm">
                                We're still processing the AI-powered text preview for this file.
                                You can still view the full file by downloading it below.
                            </p>
                            <a
                                href={content.file.url}
                                download={content.title}
                                className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Download Source File
                            </a>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300 font-mono p-6 overflow-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                            <span className="text-xs text-primary font-bold tracking-widest uppercase">
                                {content.extractedData?.metadata?.language || 'Source Code'}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                {content.extractedData?.metadata?.lineCount || '0'} lines
                            </span>
                        </div>
                        <pre className="text-sm leading-relaxed">
                            <code>{content.extractedData.text}</code>
                        </pre>
                        {content.extractedData.text.length >= 10000 && (
                            <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[10px] text-yellow-500">
                                Note: Only showing the first 10,000 characters. Download the file to view complete source.
                            </div>
                        )}
                    </div>
                );
            case 'web':
                if (content.file.format === 'pdf') {
                    // Reuse PDF viewer for converted web content
                    return (
                        <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-900 overflow-auto p-4 min-h-[500px] w-full custom-scrollbar">
                            <div className="sticky top-0 z-20 flex flex-wrap justify-center items-center gap-2 mb-4 bg-card/80 backdrop-blur p-2 rounded-lg shadow-sm w-full max-w-3xl">
                                {!isScrollMode && (
                                    <>
                                        <button onClick={() => setPageNumber(Math.max(1, pageNumber - 1))} disabled={pageNumber <= 1} className="p-2 hover:bg-secondary rounded disabled:opacity-50">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="text-sm font-medium min-w-[100px] text-center">
                                            Page {pageNumber} of {numPages || '?'}
                                        </span>
                                        <button onClick={() => setPageNumber(Math.min(numPages || pageNumber, pageNumber + 1))} disabled={numPages && pageNumber >= numPages} className="p-2 hover:bg-secondary rounded disabled:opacity-50">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                                <div className="w-px h-6 bg-border mx-2" />
                                <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg">
                                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-secondary rounded"><ZoomOut className="w-4 h-4" /></button>
                                    <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                                    <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-1.5 hover:bg-secondary rounded"><ZoomIn className="w-4 h-4" /></button>
                                </div>
                                <div className="w-px h-6 bg-border mx-2" />
                                <button
                                    onClick={() => setIsScrollMode(!isScrollMode)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isScrollMode ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}
                                >
                                    <List className="w-4 h-4" />
                                    {isScrollMode ? 'Exit Scroll Mode' : 'Continuous Scroll'}
                                </button>
                            </div>
                            <div className="flex-1 w-full flex flex-col items-center pb-8 gap-4">
                                <Document
                                    file={pdfFile}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    onLoadError={onDocumentLoadError}
                                    loading={<Loader fullScreen={false} className="py-20" />}
                                    error={
                                        <div className="flex flex-col items-center gap-4 py-20 text-center px-6">
                                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-2">
                                                <X className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">Failed to load PDF</h3>
                                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                                    We couldn't retrieve the AI-generated document.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="btn-primary"
                                            >
                                                Try Refreshing
                                            </button>
                                        </div>
                                    }
                                >
                                    {isScrollMode ? (
                                        Array.from(new Array(numPages), (el, index) => (
                                            <Page
                                                key={`page_${index + 1}`}
                                                pageNumber={index + 1}
                                                scale={scale}
                                                className="shadow-xl mb-4"
                                                renderTextLayer={true}
                                                renderAnnotationLayer={true}
                                            />
                                        ))
                                    ) : (
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={pageNumber}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Page
                                                    pageNumber={pageNumber}
                                                    scale={scale}
                                                    className="shadow-xl"
                                                    renderTextLayer={true}
                                                    renderAnnotationLayer={true}
                                                />
                                            </motion.div>
                                        </AnimatePresence>
                                    )}
                                </Document>
                            </div>
                        </div>
                    );
                }

                // Fallback for non-PDF web content (processing or failed)
                // Fallback for non-PDF web content (processing or failed)
                const screenshotUrl = content.file?.thumbnail?.url || content.extractedData?.metadata?.thumbnail_url;

                return (
                    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-900 overflow-auto p-4 h-full min-h-[500px] w-full custom-scrollbar" ref={viewerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
                        {screenshotUrl ? (
                            <div className="relative w-full max-w-4xl mx-auto shadow-2xl rounded-xl overflow-hidden bg-white dark:bg-black group">
                                <img
                                    src={screenshotUrl}
                                    alt="Website Screenshot"
                                    className="w-full h-auto object-contain select-none pointer-events-none"
                                />

                                {isSelectionMode && (
                                    <div className="absolute inset-0 z-40 bg-black/10 cursor-crosshair">
                                        <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-bounce">
                                            Selection Mode Active
                                        </div>
                                    </div>
                                )}

                                {selectionBox && (
                                    <div
                                        className="absolute border-2 border-primary bg-primary/10 z-50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                                        style={{
                                            left: selectionBox.x,
                                            top: selectionBox.y,
                                            width: selectionBox.width,
                                            height: selectionBox.height
                                        }}
                                    >
                                        <div className="absolute -top-3 -left-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white scale-75">
                                            <Pencil className="w-3 h-3" />
                                        </div>
                                        <div className="absolute top-0 right-0 w-4 h-4 bg-primary cursor-se-resize" />
                                    </div>
                                )}

                                {/* Status Overlay for Web processing */}
                                {(content.processingStatus === 'processing' || content.processingStatus === 'pending') && (
                                    <div className="absolute bottom-6 left-6 right-6 bg-background/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-primary/20 flex flex-col items-center text-center z-[60]">
                                        <Loader fullScreen={false} className="mb-4 scale-75" />
                                        <h3 className="text-xl font-black mb-1">AI Simplification in Progress</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            We're currently distilling this website into a student-friendly summary and PDF.
                                        </p>
                                        <div className="w-full max-w-xs bg-secondary rounded-full h-1.5 mb-2 overflow-hidden">
                                            <motion.div
                                                className="bg-primary h-full rounded-full"
                                                initial={{ width: "10%" }}
                                                animate={{ width: `${content.processingProgress || 20}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                                            Step: {content.processingProgress < 40 ? 'Researching' : content.processingProgress < 70 ? 'Simplifying' : 'Generating Files'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full flex-1">
                                {content.processingStatus === 'processing' || content.processingStatus === 'pending' ? (
                                    <div className="max-w-md w-full">
                                        <Loader fullScreen={false} className="mb-6" />
                                        <h3 className="text-2xl font-bold mb-2">AI is Simplifying...</h3>
                                        <p className="text-muted-foreground mb-8">
                                            Hang tight! We're scraping the website and using AI to create a student-friendly summary for you.
                                        </p>
                                        <div className="w-full bg-secondary rounded-full h-2 mb-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${content.processingProgress || 10}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : content.processingStatus === 'failed' ? (
                                    <div className="max-w-md">
                                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                                            <X className="w-10 h-10 text-red-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Simplification Failed</h3>
                                        <p className="text-muted-foreground mb-8">
                                            We couldn't automatically simplify this page. You can still visit the original website below.
                                        </p>
                                        <a
                                            href={content.file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Visit Original Website
                                        </a>
                                    </div>
                                ) : (
                                    <div className="max-w-md">
                                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                            <Globe className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Web Resource</h3>
                                        <p className="text-muted-foreground mb-8">
                                            This is an external web resource. The AI simplification is not available as a PDF for this link.
                                        </p>
                                        <a
                                            href={content.file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn-primary flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Open Website
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FileText className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Unsupported Preview</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            We can't preview this file type directly yet. You can download it to view on your device.
                        </p>
                        <a
                            href={content.file.url}
                            download
                            className="btn-primary flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Download File
                        </a>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-card w-screen h-screen overflow-hidden flex flex-col ${isSelectionMode ? 'cursor-crosshair' : ''}`}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4 border-b bg-card">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {(localContent?.type === 'video' || localContent?.file?.format === 'youtube') ? <Video className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold truncate pr-4">{localContent?.title || 'Loading Content...'}</h2>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                <p className="text-xs text-muted-foreground capitalize flex items-center gap-2">
                                    <span>{localContent?.metadata?.category || localContent?.type || 'General'}</span>
                                    <span className="text-muted-foreground/30">•</span>
                                    <span>{localContent?.metadata?.difficulty || 'Standard'}</span>
                                </p>
                                {localContent.processingStatus && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground/30 text-[10px] hidden sm:inline">•</span>
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${localContent.processingStatus === 'completed'
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : localContent.processingStatus === 'failed'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${localContent.processingStatus === 'completed'
                                                ? 'bg-green-500'
                                                : localContent.processingStatus === 'failed'
                                                    ? 'bg-red-500'
                                                    : 'bg-yellow-500'
                                                }`} />
                                            {localContent.processingStatus === 'completed' ? 'AI Ready' :
                                                localContent.processingStatus === 'failed' ? 'AI Failed' : 'AI Processing'}
                                        </div>
                                        {(localContent.processingStatus === 'processing' || localContent.processingStatus === 'pending') && (
                                            <span className="text-[10px] font-bold text-primary animate-pulse flex items-center gap-1 whitespace-nowrap">
                                                <Clock className="w-3 h-3" />
                                                {estimatedTime > 0 ? `~${estimatedTime}s` : 'Ready Soon'}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (!isAISidebarOpen) setIsAISidebarOpen(true);
                            }}
                            className={`p-2 rounded-lg transition-all ${isSelectionMode ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`}
                            title="Selection Tool - Highlight area for AI context"
                        >
                            <Pencil className={`w-5 h-5 ${isSelectionMode ? 'animate-pulse' : ''}`} />
                        </button>
                        {content.type === 'web' && content.extractedData?.metadata?.url && (
                            <a
                                href={content.extractedData.metadata.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span className="hidden lg:inline">Original Website</span>
                            </a>
                        )}
                        {content.type === 'web' && (
                            <div className="flex items-center gap-2">
                                {content.file.format === 'pdf' && (
                                    <a
                                        href={content.file.url}
                                        download={`${content.title}_Summary.pdf`}
                                        className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                                        title="Download PDF Summary"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="hidden lg:inline">PDF Summary</span>
                                    </a>
                                )}
                            </div>
                        )}
                        <div className="hidden sm:block w-px h-6 bg-border mx-1" />
                        <ThemeToggle />
                        <div className="hidden sm:block w-px h-6 bg-border mx-1" />
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        >
                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                        {content.file?.format !== 'youtube' && content.type !== 'web' && (
                            <a
                                href={content.file?.url}
                                download
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                title="Download"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors ml-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-950">
                        <AnimatePresence mode="wait">
                            {activeTab === 'viewer' && (
                                <motion.div
                                    key="viewer"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full relative viewer-container overflow-auto"
                                    ref={viewerRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onTouchStart={handleMouseDown}
                                    onTouchMove={handleMouseMove}
                                    onTouchEnd={handleMouseUp}
                                >
                                    {renderViewer()}
                                    {isSelectionMode && selectionBox && (
                                        <div
                                            className="absolute border-2 border-primary bg-primary/10 shadow-lg rounded-sm z-30 pointer-events-none"
                                            style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }}
                                        >
                                            <div className="absolute -top-7 left-0 flex items-center gap-1 bg-primary text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider shadow-lg pointer-events-auto">
                                                Area Selected
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectionBox(null);
                                                        setSelection('');
                                                    }}
                                                    className="hover:bg-white/20 rounded p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-full cursor-se-resize shadow-lg pointer-events-auto border-2 border-white" />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'details' && (
                                <motion.div
                                    key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="h-full overflow-auto p-8 max-w-4xl mx-auto space-y-8"
                                >
                                    <section>
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Info className="w-5 h-5 text-primary" />
                                            Overview
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{content.description || 'No description provided.'}</p>
                                    </section>

                                    {content.extractedData?.summary && (
                                        <section className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-primary">
                                                <BarChart3 className="w-5 h-5" />
                                                AI-Generated Summary
                                            </h3>
                                            <p className="text-sm leading-relaxed">{content.extractedData.summary}</p>
                                        </section>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {content.extractedData?.topics && content.extractedData.topics.length > 0 && (
                                            <section>
                                                <h3 className="font-bold mb-3 flex items-center gap-2"><List className="w-4 h-4" />Key Topics</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {content.extractedData.topics.map((t, i) => <span key={i} className="px-3 py-1 bg-secondary rounded-full text-sm">{t}</span>)}
                                                </div>
                                            </section>
                                        )}
                                        {content.metadata?.tags && content.metadata.tags.length > 0 && (
                                            <section>
                                                <h3 className="font-bold mb-3 flex items-center gap-2"><Share2 className="w-4 h-4" />Tags</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {content.metadata.tags.map((t, i) => <span key={i} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm">#{t}</span>)}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'graph' && (
                                <motion.div
                                    key="graph" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="h-full flex flex-col items-center justify-center p-12 text-center"
                                >
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                        <BarChart3 className="w-10 h-10 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Knowledge Graph</h3>
                                    <p className="text-muted-foreground mb-8 max-w-md">Connect this lesson to the broader course structure and see related topics.</p>
                                    <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-course-graph', { detail: { courseId: content.courseId } })); }} className="btn-primary flex items-center gap-2 px-8 py-3">
                                        <Share2 className="w-4 h-4" /> Open Full Course Graph
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* AI Tutor Sidebar */}
                    <AnimatePresence>
                        {isAISidebarOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: aiSidebarWidth, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="border-l bg-card flex flex-col h-full border-border/50 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] overflow-hidden z-40 relative group/sidebar"
                            >
                                {/* Resize Handle */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/30 transition-colors z-50"
                                    onMouseDown={(e) => {
                                        setIsResizingSidebar(true);
                                        e.preventDefault();
                                    }}
                                />
                                <Suspense fallback={
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-pulse">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                            <MessageCircle className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-secondary rounded mx-auto"></div>
                                            <div className="h-3 w-48 bg-secondary rounded mx-auto"></div>
                                        </div>
                                    </div>
                                }>
                                    <AITutor
                                        courseId={content.courseId}
                                        contentId={content._id}
                                        contentTitle={content.title}
                                        selectedText={selection}
                                        visualContext={selectionBox}
                                        isParentActive={activeTab === 'viewer'}
                                        onQuerySubmit={() => {
                                            // Clear selection after query is submitted
                                            setSelection('');
                                            setSelectionBox(null);
                                        }}
                                    />
                                </Suspense>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sidebar Tabs */}
                    {!isFullScreen && (
                        <AnimatePresence>
                            {isTabsVisible ? (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 64, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="border-l bg-card flex flex-col items-center py-6 gap-6 z-40 relative h-full"
                                >
                                    {/* Mobile close button */}
                                    <button
                                        onClick={() => setIsTabsVisible(false)}
                                        className="md:hidden absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-12 bg-card border border-r-0 flex items-center justify-center rounded-l-xl text-muted-foreground shadow-[-4px_0_10px_rgba(0,0,0,0.1)]"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    <button onClick={() => setActiveTab('viewer')} className={`p-3 rounded-xl transition-all ${activeTab === 'viewer' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="Content Viewer"><Eye className="w-6 h-6" /></button>
                                    <button onClick={() => setActiveTab('details')} className={`p-3 rounded-xl transition-all ${activeTab === 'details' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="Extracted Data & Details"><Info className="w-6 h-6" /></button>
                                    <button onClick={() => setActiveTab('graph')} className={`p-3 rounded-xl transition-all ${activeTab === 'graph' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="Knowledge Graph"><BarChart3 className="w-6 h-6" /></button>
                                    <button onClick={() => setIsAISidebarOpen(!isAISidebarOpen)} className={`p-3 rounded-xl transition-all ${isAISidebarOpen ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="AI Tutor & Doubts"><MessageCircle className="w-6 h-6" /></button>
                                </motion.div>
                            ) : (
                                <button
                                    onClick={() => setIsTabsVisible(true)}
                                    className="md:hidden fixed right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-primary text-white flex items-center justify-center rounded-l-2xl z-50 shadow-2xl animate-pulse"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer / Meta */}
                {!isFullScreen && (
                    <div className="px-6 py-3 border-t bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span>Uploaded by: {content.uploadedBy?.profile?.name}</span>
                            <span>•</span>
                            <span>Date: {new Date(content.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {content.stats?.viewCount || 0}</span>
                            <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {content.stats?.downloadCount || 0}</span>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
