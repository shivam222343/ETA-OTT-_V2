import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, Share2, Maximize2, Minimize2,
    FileText, Video, Info, BarChart3, List, MessageCircle,
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Eye, Pencil, Play
} from 'lucide-react';
import ReactPlayer from 'react-player';
import { Document, Page, pdfjs } from 'react-pdf';
import toast from 'react-hot-toast';
import AITutor from '../AITutor';
import Loader from '../Loader';
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

    const pdfFile = useMemo(() => {
        if (!content?.file?.url) return null;
        return {
            url: `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/content/view/proxy?url=${encodeURIComponent(content.file.url)}`,
            httpHeaders: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        };
    }, [content?.file?.url]);

    if (!isOpen || !content) return null;

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
        e.stopPropagation();

        const rect = viewerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + viewerRef.current.scrollLeft;
        const y = e.clientY - rect.top + viewerRef.current.scrollTop;

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
    };

    const handleMouseMove = (e) => {
        if (!isSelectionMode || (!isDrawing && !isMoving && !isResizing) || !viewerRef.current) return;

        const rect = viewerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + viewerRef.current.scrollLeft;
        const y = e.clientY - rect.top + viewerRef.current.scrollTop;

        if (isDrawing) {
            setSelectionBox({
                x: Math.min(x, startPos.x),
                y: Math.min(y, startPos.y),
                width: Math.abs(x - startPos.x),
                height: Math.abs(y - startPos.y),
                type: 'rect'
            });
        } else if (isMoving) {
            setSelectionBox(prev => ({
                ...prev,
                x: x - startPos.x,
                y: y - startPos.y
            }));
        } else if (isResizing === 'se') {
            setSelectionBox(prev => ({
                ...prev,
                width: Math.max(20, x - prev.x),
                height: Math.max(20, y - prev.y)
            }));
        }
    };

    const extractTextFromArea = (box) => {
        if (!box || content.type !== 'pdf' || !viewerRef.current) return '';
        const textElements = document.querySelectorAll('.react-pdf__Page__textContent span');
        let extractedText = [];
        const vRect = viewerRef.current.getBoundingClientRect();

        textElements.forEach(el => {
            const eRect = el.getBoundingClientRect();
            const relRect = {
                left: eRect.left - vRect.left + viewerRef.current.scrollLeft,
                top: eRect.top - vRect.top + viewerRef.current.scrollTop,
                right: eRect.right - vRect.left + viewerRef.current.scrollLeft,
                bottom: eRect.bottom - vRect.top + viewerRef.current.scrollTop
            };

            if (relRect.left < box.x + box.width && relRect.right > box.x &&
                relRect.top < box.y + box.height && relRect.bottom > box.y) {
                extractedText.push(el.innerText);
            }
        });
        return extractedText.join(' ').replace(/\s+/g, ' ').trim();
    };

    const handleMouseUp = () => {
        if (isDrawing || isMoving || isResizing) {
            if (selectionBox?.width > 10 && selectionBox?.height > 10) {
                if (content.type === 'pdf') {
                    const txt = extractTextFromArea(selectionBox);
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
        switch (content.type) {
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
                                    <Page pageNumber={pageNumber} scale={scale} className="shadow-2xl rounded-sm" renderTextLayer={true} renderAnnotationLayer={true} />
                                )}
                            </Document>
                        </div>
                    </div >
                );
            case 'video':
                return (
                    <div className="relative aspect-video w-full bg-black flex items-center justify-center group">
                        <ReactPlayer
                            ref={playerRef}
                            url={content.file.url}
                            controls={!isSelectionMode}
                            width="100%"
                            height="100%"
                            playing={!isSelectionMode}
                            light={content.type === 'video' && content.file?.thumbnail?.url ? content.file.thumbnail.url : false}
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
                        {/* Dim overlay when selection mode is active to emphasize interaction */}
                        {isSelectionMode && !selectionBox && (
                            <div className="absolute inset-0 bg-black/20 pointer-events-none transition-opacity" />
                        )}
                    </div>
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${isFullScreen ? 'p-0' : 'p-4 md:p-8'} bg-black/80 backdrop-blur-sm`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-card w-full h-full max-w-7xl overflow-hidden flex flex-col ${isFullScreen ? '' : 'rounded-2xl shadow-2xl border border-border/50'} ${isSelectionMode ? 'cursor-crosshair' : ''}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {content.type === 'video' ? <Video className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold truncate">{content.title}</h2>
                            <p className="text-xs text-muted-foreground capitalize">
                                {content.metadata?.category || content.type} • {content.metadata?.difficulty}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSelectionMode(!isSelectionMode)}
                            className={`p-2 rounded-lg transition-all ${isSelectionMode ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`}
                            title="Selection Tool - Highlight area for AI context"
                        >
                            <Pencil className={`w-5 h-5 ${isSelectionMode ? 'animate-pulse' : ''}`} />
                        </button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        >
                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                        {content.file?.format !== 'youtube' && (
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
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors ml-2"
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
                            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l bg-card flex flex-col h-full border-border/50 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] overflow-hidden z-40">
                                <AITutor courseId={content.courseId} contentId={content._id} selectedText={selection} visualContext={selectionBox} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sidebar Tabs */}
                    {!isFullScreen && (
                        <div className="w-16 border-l bg-card flex flex-col items-center py-6 gap-6 z-40">
                            <button onClick={() => setActiveTab('viewer')} className={`p-3 rounded-xl transition-all ${activeTab === 'viewer' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="Content Viewer"><Eye className="w-6 h-6" /></button>
                            <button onClick={() => setActiveTab('details')} className={`p-3 rounded-xl transition-all ${activeTab === 'details' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="Extracted Data & Details"><Info className="w-6 h-6" /></button>
                            <button onClick={() => setActiveTab('graph')} className={`p-3 rounded-xl transition-all ${activeTab === 'graph' ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="Knowledge Graph"><BarChart3 className="w-6 h-6" /></button>
                            <button onClick={() => setIsAISidebarOpen(!isAISidebarOpen)} className={`p-3 rounded-xl transition-all ${isAISidebarOpen ? 'bg-primary text-white shadow-lg' : 'hover:bg-secondary text-muted-foreground'}`} title="AI Tutor & Doubts"><MessageCircle className="w-6 h-6" /></button>
                        </div>
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
