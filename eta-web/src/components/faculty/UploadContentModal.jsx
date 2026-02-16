import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, Video, Image, File, Loader2, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';
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

const DIFFICULTY_LEVELS = [
    { value: 'beginner', label: 'Beginner', color: 'text-green-500' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-yellow-500' },
    { value: 'advanced', label: 'Advanced', color: 'text-red-500' }
];

const CATEGORIES = [
    'Lecture',
    'Assignment',
    'Reference Material',
    'Lab Manual',
    'Tutorial',
    'Exam Paper',
    'Notes',
    'Other'
];

export default function UploadContentModal({ isOpen, onClose, onSuccess, courseId, courseName }) {
    const [activeTab, setActiveTab] = useState('file'); // 'file', 'youtube', or 'web'
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [webUrl, setWebUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        difficulty: 'intermediate',
        category: 'Lecture',
        tags: ''
    });

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (file) => {
        const maxSize = 500 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File size exceeds 500MB limit');
            return;
        }

        setSelectedFile(file);

        if (!formData.title) {
            const fileName = file.name.replace(/\.[^/.]+$/, '');
            setFormData(prev => ({ ...prev, title: fileName }));
        }

        // Auto-clear thumbnail if changing from video to non-video
        if (!file.type.includes('video')) {
            setThumbnailFile(null);
            setThumbnailPreview(null);
        }
    };

    const handleThumbnailSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.includes('image')) {
                toast.error('Please select an image file for thumbnail');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Thumbnail size should be less than 5MB');
                return;
            }
            setThumbnailFile(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (activeTab === 'file' && !selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }

        if (activeTab === 'youtube' && !youtubeUrl) {
            toast.error('Please enter a YouTube URL');
            return;
        }

        if (activeTab === 'web' && !webUrl) {
            toast.error('Please enter a website URL');
            return;
        }

        if (!formData.title) {
            toast.error('Please enter a title');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            let response;

            if (activeTab === 'file') {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedFile);
                uploadFormData.append('courseId', courseId);
                uploadFormData.append('title', formData.title);
                uploadFormData.append('description', formData.description);
                uploadFormData.append('difficulty', formData.difficulty);
                uploadFormData.append('category', formData.category);

                const tags = formData.tags
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                uploadFormData.append('tags', JSON.stringify(tags));

                if (thumbnailFile) {
                    uploadFormData.append('thumbnail', thumbnailFile);
                }

                response = await apiClient.post('/content', uploadFormData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(progress);
                    }
                });
            } else if (activeTab === 'youtube') {
                // YouTube Link
                const youtubeData = {
                    courseId,
                    url: youtubeUrl,
                    title: formData.title,
                    description: formData.description,
                    difficulty: formData.difficulty,
                    category: formData.category,
                    tags: formData.tags
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0)
                };

                response = await apiClient.post('/content/youtube', youtubeData);
            } else if (activeTab === 'web') {
                // Web Link
                const webData = {
                    courseId,
                    url: webUrl,
                    title: formData.title,
                    description: formData.description,
                    difficulty: formData.difficulty,
                    category: formData.category,
                    tags: formData.tags
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0)
                };

                response = await apiClient.post('/content/web', webData);
            }

            setUploading(false);
            setProcessing(true);

            toast.success('Content added successfully! Processing in background...');

            setTimeout(() => {
                setProcessing(false);
                onSuccess(response.data.data.content);
                resetForm();
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            setUploading(false);
            setProcessing(false);
            toast.error(error.response?.data?.message || 'Failed to add content');
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setThumbnailFile(null);
        setThumbnailPreview(null);
        setYoutubeUrl('');
        setWebUrl('');
        setUploadProgress(0);
        setFormData({
            title: '',
            description: '',
            difficulty: 'intermediate',
            category: 'Lecture',
            tags: ''
        });
    };

    if (!isOpen) return null;

    const FileIcon = activeTab === 'file' && selectedFile ? FILE_TYPE_ICONS[getFileType(selectedFile)] : (activeTab === 'youtube' ? Video : (activeTab === 'web' ? LinkIcon : Upload));

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Upload className="w-6 h-6 text-primary" />
                            Add Content
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Add learning materials to {courseName}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        disabled={uploading || processing}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b">
                    <div className="flex bg-secondary p-1 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setActiveTab('file')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'file' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
                                }`}
                        >
                            File Upload
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('youtube')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'youtube' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
                                }`}
                        >
                            YouTube Link
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('web')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'web' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
                                }`}
                        >
                            Web Link
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Content Area */}
                    {activeTab === 'file' ? (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                File <span className="text-red-500">*</span>
                            </label>
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                {selectedFile ? (
                                    <div className="space-y-3">
                                        <FileIcon className="w-12 h-12 mx-auto text-primary" />
                                        <div>
                                            <p className="font-medium">{selectedFile.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatFileSize(selectedFile.size)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(null)}
                                            className="text-sm text-red-500 hover:underline"
                                            disabled={uploading || processing}
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">
                                                Drag and drop your file here, or{' '}
                                                <label className="text-primary cursor-pointer hover:underline">
                                                    browse
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={handleFileInput}
                                                        accept=".pdf,.mp4,.avi,.mov,.ppt,.pptx,.doc,.docx,.jpg,.png,.gif"
                                                    />
                                                </label>
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Supported: PDF, Video, PPT, Images, Documents (Max 500MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'youtube' ? (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                YouTube Video URL <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="url"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    className="input w-full pl-10"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    disabled={uploading || processing}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                For YouTube videos, the default thumbnail will be used automatically.
                            </p>
                        </div>
                    ) : activeTab === 'web' ? (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Website URL <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="url"
                                    value={webUrl}
                                    onChange={(e) => setWebUrl(e.target.value)}
                                    className="input w-full pl-10"
                                    placeholder="https://example.com/article"
                                    disabled={uploading || processing}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Our AI will scrape the page content, simplify it for students, and automatically generate a thumbnail.
                            </p>
                        </div>
                    ) : null}

                    {/* Thumbnail Option for Videos */}
                    {activeTab === 'file' && selectedFile && getFileType(selectedFile) === 'video' && (
                        <div className="bg-secondary/50 p-4 rounded-xl border border-dashed border-border">
                            <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                                <Image className="w-4 h-4 text-primary" />
                                Custom Thumbnail (Optional)
                            </label>
                            <div className="flex items-center gap-4">
                                {thumbnailPreview ? (
                                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden border bg-background">
                                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setThumbnailFile(null); setThumbnailPreview(null); }}
                                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="w-32 aspect-video rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                        <Upload className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-[10px] text-muted-foreground mt-1 text-center px-2">Upload Image</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={handleThumbnailSelect}
                                            accept="image/*"
                                        />
                                    </label>
                                )}
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">
                                        Providing a custom thumbnail helps students identify your content.
                                        If left blank, a thumbnail will be automatically generated.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {uploading && activeTab === 'file' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Processing Status */}
                    {processing && (
                        <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing content and extracting data...</span>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., Introduction to Data Structures"
                            disabled={uploading || processing}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input w-full min-h-[100px]"
                            placeholder="Brief description of the content..."
                            disabled={uploading || processing}
                        />
                    </div>

                    {/* Difficulty and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Difficulty Level
                            </label>
                            <select
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                className="input w-full"
                                disabled={uploading || processing}
                            >
                                {DIFFICULTY_LEVELS.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input w-full"
                                disabled={uploading || processing}
                            >
                                {CATEGORIES.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Tags
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            className="input w-full"
                            placeholder="e.g., algorithms, sorting, complexity (comma separated)"
                            disabled={uploading || processing}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Separate tags with commas
                        </p>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                resetForm();
                                onClose();
                            }}
                            className="btn-secondary flex-1"
                            disabled={uploading || processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                            disabled={uploading || processing || (activeTab === 'file' ? !selectedFile : activeTab === 'youtube' ? !youtubeUrl : !webUrl)}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {activeTab === 'file' ? 'Uploading...' : 'Processing...'}
                                </>
                            ) : processing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {activeTab === 'file' ? <Upload className="w-4 h-4" /> : activeTab === 'youtube' ? <Video className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                    {activeTab === 'file' ? 'Upload Content' : activeTab === 'youtube' ? 'Add YouTube Video' : 'Add Web Resource'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div >
    );
}
