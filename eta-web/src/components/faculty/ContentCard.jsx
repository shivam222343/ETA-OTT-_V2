import { motion } from 'framer-motion';
import {
    FileText, Video, Image, File, Download, Eye, Edit, Trash2,
    Clock, User, Tag, BarChart3, CheckCircle, Loader2, AlertCircle, Info
} from 'lucide-react';
import { useState } from 'react';
import ExtractedInfoModal from './ExtractedInfoModal';

const FILE_TYPE_ICONS = {
    pdf: FileText,
    video: Video,
    image: Image,
    presentation: FileText,
    document: FileText,
    other: File
};

const DIFFICULTY_COLORS = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20'
};

const PROCESSING_STATUS = {
    pending: { icon: Clock, color: 'text-gray-500', label: 'Pending' },
    processing: { icon: Loader2, color: 'text-blue-500', label: 'Processing', spin: true },
    completed: { icon: CheckCircle, color: 'text-green-500', label: 'Ready' },
    failed: { icon: AlertCircle, color: 'text-red-500', label: 'Failed' }
};

export default function ContentCard({ content, onView, onEdit, onDelete, onDownload, onReprocess }) {
    const [showExtractedInfo, setShowExtractedInfo] = useState(false);
    const FileIcon = FILE_TYPE_ICONS[content.type] || File;
    const statusInfo = PROCESSING_STATUS[content.processingStatus] || PROCESSING_STATUS.pending;
    const StatusIcon = statusInfo.icon;

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDuration = (seconds) => {
        if (!seconds) return null;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 hover:shadow-lg transition-shadow"
        >
            {/* Thumbnail/Image Preview */}
            {(content.type === 'video' || content.type === 'pdf') && (
                <div className="relative aspect-video mb-4 rounded-xl overflow-hidden bg-secondary group">
                    {content.file?.thumbnail?.url ? (
                        <img
                            src={content.file.thumbnail.url}
                            alt={content.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <FileIcon className="w-12 h-12 text-primary/20" />
                        </div>
                    )}

                    {/* Overlay for Video/PDF indicator */}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                        <FileIcon className="w-3 h-3" />
                        {content.type}
                    </div>

                    {content.file?.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                            {formatDuration(content.file.duration)}
                        </div>
                    )}
                    {content.file?.pages && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                            {content.file.pages} pages
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                {!(content.type === 'video' || content.type === 'pdf') && (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-6 h-6 text-primary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{content.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {!(content.type === 'video' || content.type === 'pdf') && (
                            <span className="text-xs text-muted-foreground capitalize">
                                {content.type}
                            </span>
                        )}
                        {content.file?.size && (
                            <>
                                {!(content.type === 'video' || content.type === 'pdf') && (
                                    <span className="text-xs text-muted-foreground">•</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    {formatFileSize(content.file.size)}
                                </span>
                            </>
                        )}
                        {/* Pages and duration are now in the thumbnail overlay */}
                    </div>
                </div>
            </div>

            {/* Description */}
            {content.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {content.description}
                </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mb-3">
                {/* Difficulty */}
                <span className={`text-xs px-2 py-1 rounded-full border ${DIFFICULTY_COLORS[content.metadata?.difficulty] || DIFFICULTY_COLORS.intermediate}`}>
                    {content.metadata?.difficulty || 'Intermediate'}
                </span>

                {/* Category */}
                {content.metadata?.category && (
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-foreground border border-border">
                        {content.metadata.category}
                    </span>
                )}

                {/* Processing Status */}
                {content.processingStatus === 'completed' || content.processingStatus === 'failed' ? (
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                        <StatusIcon className={`w-3 h-3 ${statusInfo.spin ? 'animate-spin' : ''}`} />
                        {statusInfo.label}
                    </span>
                ) : (
                    <div className="flex-1 min-w-[120px]">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                {content.processingStatus === 'processing' ? 'Processing...' : 'In Queue'}
                            </span>
                            <span className="text-[10px] font-bold text-primary">
                                {content.processingProgress || 0}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${content.processingProgress || 0}%` }}
                                className="h-full bg-primary"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Tags */}
            {content.metadata?.tags && content.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {content.metadata.tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={index}
                            className="text-xs px-2 py-0.5 rounded bg-primary/5 text-primary flex items-center gap-1"
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                    {content.metadata.tags.length > 3 && (
                        <span className="text-xs px-2 py-0.5 text-muted-foreground">
                            +{content.metadata.tags.length - 3} more
                        </span>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 pb-3 border-b">
                <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{content.stats?.viewCount || 0} views</span>
                </div>
                <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{content.stats?.downloadCount || 0} downloads</span>
                </div>
                {content.stats?.averageRating > 0 && (
                    <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{content.stats.averageRating.toFixed(1)} rating</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">
                        {content.uploadedBy?.profile?.name || 'Unknown'}
                    </span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(content.createdAt)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t">
                <button
                    onClick={() => onView(content)}
                    className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1"
                >
                    <Eye className="w-4 h-4" />
                    View
                </button>
                {onDownload && (
                    <button
                        onClick={() => onDownload(content)}
                        className="btn-secondary text-sm py-2 px-3 flex items-center justify-center"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                )}
                {onEdit && (
                    <button
                        onClick={() => onEdit(content)}
                        className="btn-secondary text-sm py-2 px-3 flex items-center justify-center"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={() => setShowExtractedInfo(true)}
                    className="btn-secondary text-sm py-2 px-3 flex items-center justify-center hover:text-primary transition-colors"
                    title="View AI Extracted Info"
                >
                    <Info className="w-4 h-4" />
                </button>
                {onDelete && (
                    <button
                        onClick={() => onDelete(content)}
                        className="btn-secondary text-sm py-2 px-3 flex items-center justify-center text-red-500 hover:bg-red-500/10"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            <ExtractedInfoModal
                isOpen={showExtractedInfo}
                onClose={() => setShowExtractedInfo(false)}
                content={content}
            />

            {/* Processing Error */}
            {content.processingStatus === 'failed' && content.processingError && (
                <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                    <div className="flex items-start gap-2 text-red-500">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-xs">
                            <p className="font-bold">Processing Failed</p>
                            <p className="mt-1 opacity-80">{content.processingError}</p>
                        </div>
                    </div>
                    {onReprocess && (
                        <button
                            onClick={() => onReprocess(content)}
                            className="w-full py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Loader2 className="w-3 h-3" />
                            Retry Extraction
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
