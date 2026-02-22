import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Upload, FileText, Video, Image, File, Loader2,
    CheckCircle, AlertCircle, Trash2, Play, Pause,
    Layers, ChevronRight, FileUp, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/axios.config';

const FILE_TYPE_ICONS = {
    pdf: FileText,
    video: Video,
    image: Image,
    presentation: FileText,
    document: FileText,
    other: File
};

const getFileType = (file) => {
    const type = file.type;
    if (type.includes('pdf')) return 'pdf';
    if (type.includes('video')) return 'video';
    if (type.includes('image')) return 'image';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
    if (type.includes('document') || type.includes('word')) return 'document';
    return 'other';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function BulkUploadModal({ isOpen, onClose, onSuccess, courseId, courseName }) {
    const [queue, setQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const addFilesToQueue = (files) => {
        const newItems = Array.from(files)
            .filter(file => !queue.some(q => q.file.name === file.name && q.file.size === file.size))
            .map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                title: file.name.replace(/\.[^/.]+$/, ''),
                type: getFileType(file),
                status: 'queued', // queued, uploading, processing, completed, failed
                progress: 0,
                error: null
            }));

        setQueue(prev => [...prev, ...newItems]);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFilesToQueue(e.dataTransfer.files);
        }
    };

    const removeFromFile = (id) => {
        if (isProcessing) return;
        setQueue(prev => prev.filter(item => item.id !== id));
    };

    const clearCompleted = () => {
        setQueue(prev => prev.filter(item => item.status !== 'completed'));
    };

    const uploadFile = async (item) => {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('courseId', courseId);
        formData.append('title', item.title);
        formData.append('difficulty', 'intermediate');
        formData.append('category', 'Lecture');
        formData.append('tags', JSON.stringify([]));

        updateItemStatus(item.id, { status: 'uploading', progress: 0 });

        try {
            const response = await apiClient.post('/content', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    updateItemStatus(item.id, { progress });
                }
            });

            updateItemStatus(item.id, { status: 'processing', progress: 100 });

            // Backend handles transcription/processing in background
            // We consider the "Upload Queue" task done once it's handed over to backend
            setTimeout(() => {
                updateItemStatus(item.id, { status: 'completed' });
                onSuccess(response.data.data.content);
            }, 1500);

            return true;
        } catch (error) {
            console.error('Bulk upload error for file:', item.file.name, error);
            updateItemStatus(item.id, {
                status: 'failed',
                error: error.response?.data?.message || 'Upload failed'
            });
            return false;
        }
    };

    const updateItemStatus = (id, updates) => {
        setQueue(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    };

    const startBulkUpload = async () => {
        if (isProcessing || queue.length === 0) return;

        setIsProcessing(true);
        const queuedItems = queue.filter(item => item.status === 'queued' || item.status === 'failed');

        // Parallel upload capability: Process 2 at a time to not choke the pipe
        const concurrency = 2;
        for (let i = 0; i < queuedItems.length; i += concurrency) {
            const chunk = queuedItems.slice(i, i + concurrency);
            await Promise.all(chunk.map(item => uploadFile(item)));
        }

        setIsProcessing(false);
        toast.success('Bulk upload session completed!');
    };

    if (!isOpen) return null;

    const stats = {
        total: queue.length,
        completed: queue.filter(q => q.status === 'completed').length,
        processing: queue.filter(q => ['uploading', 'processing'].includes(q.status)).length,
        failed: queue.filter(q => q.status === 'failed').length,
        queued: queue.filter(q => q.status === 'queued').length,
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-border/50"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b bg-card flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">BULK RESOURCE QUEUE</h2>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                                {courseName} <ChevronRight className="w-3 h-3" /> System Workflow
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-xl transition-colors"
                        disabled={isProcessing}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Queue Control / Dropzone */}
                    <div className="w-full md:w-80 border-r p-6 space-y-6 bg-secondary/20">
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragActive ? 'border-primary bg-primary/5 scale-105' : 'border-border/50 hover:border-primary/50'
                                }`}
                        >
                            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm font-bold mb-1">Drag & Drop Files</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black">or</p>
                            <label className="mt-2 block">
                                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-primary/90 block shadow-lg shadow-primary/20">
                                    Select Files
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => addFilesToQueue(e.target.files)}
                                />
                            </label>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                <span>Queue Stats</span>
                                {stats.completed > 0 && (
                                    <button onClick={clearCompleted} className="text-primary hover:underline">Clear Done</button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-3 bg-card rounded-xl border border-border/50">
                                    <p className="text-lg font-black">{stats.queued}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Pending</p>
                                </div>
                                <div className="p-3 bg-card rounded-xl border border-border/50">
                                    <p className="text-lg font-black text-emerald-500">{stats.completed}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Finished</p>
                                </div>
                                <div className="p-3 bg-card rounded-xl border border-border/50">
                                    <p className="text-lg font-black text-primary">{stats.processing}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Active</p>
                                </div>
                                <div className="p-3 bg-card rounded-xl border border-border/50">
                                    <p className="text-lg font-black text-red-500">{stats.failed}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Failed</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={startBulkUpload}
                            disabled={isProcessing || stats.queued + stats.failed === 0}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                        >
                            {isProcessing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileUp className="w-5 h-5" />
                            )}
                            {isProcessing ? 'Processing Queue' : 'Start Bulk Upload'}
                        </button>
                    </div>

                    {/* Right: Queue List */}
                    <div className="flex-1 flex flex-col bg-card/50">
                        <div className="p-4 border-b bg-secondary/10 flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Files in Pipeline
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {queue.length} Total
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {queue.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                                    <Upload className="w-16 h-16 mb-4" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Queue is currently empty</p>
                                </div>
                            ) : (
                                <AnimatePresence initial={false}>
                                    {queue.map((item) => {
                                        const ItemIcon = FILE_TYPE_ICONS[item.type] || File;
                                        return (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className={`group relative p-4 bg-card rounded-2xl border transition-all ${item.status === 'completed' ? 'border-emerald-500/30' :
                                                    item.status === 'failed' ? 'border-red-500/30' :
                                                        'border-border/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        item.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-secondary text-primary'
                                                        }`}>
                                                        <ItemIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h5 className="text-sm font-bold truncate pr-4">{item.title}</h5>
                                                            <span className={`text-[10px] font-black uppercase ${item.status === 'completed' ? 'text-emerald-500' :
                                                                item.status === 'failed' ? 'text-red-500' :
                                                                    'text-muted-foreground'
                                                                }`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{formatFileSize(item.file.size)}</span>
                                                            <span className="text-[10px] font-black text-muted-foreground/30">•</span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.type}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromFile(item.id)}
                                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                                                        disabled={isProcessing}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Progress Bar for Active Items */}
                                                {['uploading', 'processing'].includes(item.status) && (
                                                    <div className="mt-3">
                                                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${item.progress}%` }}
                                                                className="h-full bg-primary"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Error Message */}
                                                {item.status === 'failed' && (
                                                    <div className="mt-2 text-[10px] font-bold text-red-500 bg-red-500/5 p-2 rounded-lg flex items-center gap-2">
                                                        <AlertCircle className="w-3 h-3" /> {item.error}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer/Progress Info */}
                {isProcessing && (
                    <div className="bg-primary/5 p-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            <span className="text-xs font-black uppercase tracking-wider text-primary">System is handling bulk serialization...</span>
                        </div>
                        <div className="text-xs font-black text-primary">
                            {stats.completed} / {stats.total} COMPLETED
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
