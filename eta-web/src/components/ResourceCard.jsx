import { FileText, File, Video, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Modern Academic Resource Card
 * Features: Sharp corners, clean layout, dark/light theme support
 */
export default function ResourceCard({ resource, onClick }) {
    // Determine icon based on resource type
    const getIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'pdf':
                return FileText;
            case 'video':
                return Video;
            case 'web':
                return Globe;
            default:
                return File;
        }
    };

    const Icon = getIcon(resource.type);

    // Format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '/');
    };

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="resource-card group cursor-pointer"
        >
            {/* Card Container */}
            <div className="
                relative overflow-hidden
                bg-gradient-to-br from-card to-card/95
                dark:from-gray-900 dark:to-gray-900/95
                border border-border/50 dark:border-gray-800
                transition-all duration-300
                hover:border-primary/30 dark:hover:border-primary/30
                shadow-lg hover:shadow-xl
            ">
                {/* Top Section - Icon & Title */}
                <div className="p-6 pb-4 flex flex-col items-center text-center space-y-4">
                    {/* Icon Container - Sharp Square */}
                    <div className="
                        w-20 h-20 
                        bg-gradient-to-br from-primary/10 to-primary/5
                        dark:from-primary/20 dark:to-primary/10
                        border border-primary/20 dark:border-primary/30
                        flex items-center justify-center
                        transition-all duration-300
                        group-hover:border-primary/40 dark:group-hover:border-primary/50
                        group-hover:bg-primary/15 dark:group-hover:bg-primary/25
                    ">
                        <Icon className="w-9 h-9 text-primary dark:text-primary/90" strokeWidth={1.5} />
                    </div>

                    {/* Resource Label */}
                    <div className="
                        text-[10px] font-bold tracking-[0.15em] uppercase
                        text-primary/70 dark:text-primary/60
                        letter-spacing-wide
                    ">
                        RESOURCE
                    </div>

                    {/* Title */}
                    <h3 className="
                        text-lg font-bold leading-snug
                        text-foreground dark:text-gray-100
                        line-clamp-2 min-h-[3.5rem]
                        transition-colors duration-300
                        group-hover:text-primary dark:group-hover:text-primary/90
                    ">
                        {resource.title || 'Untitled Resource'}
                    </h3>
                </div>

                {/* Divider */}
                <div className="px-6">
                    <div className="h-px bg-border/30 dark:bg-gray-800/50" />
                </div>

                {/* Bottom Section - Metadata */}
                <div className="p-6 pt-4 space-y-3">
                    {/* Category */}
                    <div className="flex items-center">
                        <div className="
                            w-1 h-4 bg-primary/60 dark:bg-primary/50 mr-2
                        " />
                        <span className="
                            text-[11px] font-semibold tracking-[0.1em] uppercase
                            text-muted-foreground dark:text-gray-400
                        ">
                            {resource.courseId?.name || resource.category || 'General'}
                        </span>
                    </div>

                    {/* Date & File Size */}
                    <div className="flex items-center justify-between text-xs">
                        {/* Date */}
                        <span className="
                            text-muted-foreground/70 dark:text-gray-500
                            font-medium
                        ">
                            {formatDate(resource.createdAt || resource.uploadedAt)}
                        </span>

                        {/* File Size Badge */}
                        <div className="
                            px-2.5 py-1
                            bg-primary/10 dark:bg-primary/15
                            border border-primary/20 dark:border-primary/25
                            text-primary dark:text-primary/90
                            font-bold text-[10px] tracking-wide
                            transition-all duration-300
                            group-hover:bg-primary/15 dark:group-hover:bg-primary/20
                            group-hover:border-primary/30 dark:group-hover:border-primary/35
                        ">
                            {formatFileSize(resource.file?.sizeBytes || resource.fileSize)}
                        </div>
                    </div>
                </div>

                {/* Hover Indicator - Subtle Left Border */}
                <div className="
                    absolute left-0 top-0 bottom-0 w-0.5
                    bg-primary
                    transform scale-y-0 group-hover:scale-y-100
                    transition-transform duration-300 origin-top
                " />
            </div>
        </motion.div>
    );
}
