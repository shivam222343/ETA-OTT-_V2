import express from 'express';
import axios from 'axios';
import cloudinary from '../config/cloudinary.config.js';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import { requireFaculty } from '../middleware/role.middleware.js';
import { uploadWithThumbnail, validateFileSize, getContentType } from '../services/upload.service.js';
import Content from '../models/Content.model.js';
import Course from '../models/Course.model.js';
import { extractPDFData, generateSummary } from '../services/extraction/pdf.extractor.js';
import { extractVideoMetadata, formatDuration, getQualityLabel } from '../services/extraction/video.extractor.js';
import { extractCodeData } from '../services/extraction/code.extractor.js';
import { extractWithML } from '../services/extraction/ml.service.js';
import {
    createContentNode,
    linkContentToCourse,
    createTopicNodes,
    createConceptNodes,
    linkRelatedContent,
    getLearningPath,
    getRecommendations,
    recordView,
    getContentGraph,
    deleteContentNode
} from '../services/graph/content.graph.js';
import { emitToCourse } from '../services/websocket.service.js';

const router = express.Router();

// Get recent content for current user
router.get('/recent', authenticate, attachUser, async (req, res) => {
    try {
        let query = { isActive: true };

        if (req.dbUser.role === 'faculty') {
            query.uploadedBy = req.dbUser._id;
        } else if (req.dbUser.role === 'student') {
            // Content belonging to branches the student has joined
            query.branchIds = { $in: req.dbUser.branchIds || [] };
        }

        const recentContent = await Content.find(query)
            .populate('courseId', 'name')
            .populate('uploadedBy', 'profile.name')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: { recentContent }
        });
    } catch (error) {
        console.error('Get recent content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent content',
            error: error.message
        });
    }
});

// Upload and create content
router.post('/', authenticate, attachUser, requireFaculty, uploadWithThumbnail, validateFileSize, async (req, res) => {
    try {
        const file = req.files?.file?.[0] || req.file;
        const thumbnail = req.files?.thumbnail?.[0];

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { courseId, title, description, difficulty, category, tags } = req.body;

        // Verify course exists and user is faculty
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (!course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to upload content to this course'
            });
        }

        // Determine content type
        const contentType = getContentType(file.mimetype);

        // Prepare file object
        const fileData = {
            url: file.path,
            publicId: file.filename,
            format: file.mimetype.split('/')[1],
            size: file.size
        };

        // Add thumbnail if provided
        if (thumbnail) {
            fileData.thumbnail = {
                url: thumbnail.path,
                publicId: thumbnail.filename
            };
        }

        // Create content record
        const content = await Content.create({
            courseId,
            branchIds: course.branchIds,
            institutionId: course.institutionId,
            title: title || file.originalname,
            description,
            type: contentType,
            file: fileData,
            metadata: {
                difficulty: difficulty || 'intermediate',
                category,
                tags: tags ? JSON.parse(tags) : []
            },
            uploadedBy: req.dbUser._id,
            processingStatus: 'pending',
            isPublished: true, // Show to students immediately
            publishedAt: new Date()
        });

        // Link content to course and increment stats
        await Course.findByIdAndUpdate(courseId, {
            $push: { contentIds: content._id },
            $inc: { 'stats.totalContent': 1 }
        });

        // Notify students via WebSocket
        try {
            emitToCourse(courseId, 'content:uploaded', {
                contentId: content._id,
                title: content.title,
                type: content.type,
                courseId: courseId,
                timestamp: new Date()
            });
        } catch (wsError) {
            console.error('WebSocket notification error:', wsError);
        }

        // Start background processing (don't wait for it)
        processContent(content._id, contentType, req.file.path).catch(err => {
            console.error('Content processing error:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Content uploaded successfully. Processing in background...',
            data: { content }
        });
    } catch (error) {
        console.error('Upload content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload content',
            error: error.message
        });
    }
});

// Add YouTube Video
router.post('/youtube', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { courseId, title, url, description, difficulty, category, tags } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: 'YouTube URL is required' });
        }

        // Basic YouTube URL validation
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (!youtubeRegex.test(url)) {
            return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
        }

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (!course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Create content record
        const content = await Content.create({
            courseId,
            branchIds: course.branchIds,
            institutionId: course.institutionId,
            title: title || 'YouTube Video',
            description,
            type: 'video', // We still treat it as a video type for most parts
            file: {
                url: url,
                format: 'youtube',
                size: 0
            },
            metadata: {
                difficulty: difficulty || 'intermediate',
                category,
                tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : []
            },
            uploadedBy: req.dbUser._id,
            processingStatus: 'pending',
            isPublished: true,
            publishedAt: new Date()
        });

        // Link content to course
        await Course.findByIdAndUpdate(courseId, {
            $push: { contentIds: content._id },
            $inc: { 'stats.totalContent': 1 }
        });

        // Notify students via WebSocket
        try {
            emitToCourse(courseId, 'content:uploaded', {
                contentId: content._id,
                title: content.title,
                type: 'video',
                courseId: courseId,
                timestamp: new Date()
            });
        } catch (wsError) {
            console.error('WebSocket notification error:', wsError);
        }

        // Start background processing via ML service
        processContent(content._id, 'youtube', url).catch(err => {
            console.error('YouTube processing error:', err);
        });

        res.status(201).json({
            success: true,
            message: 'YouTube video added. Processing metadata and transcript in background...',
            data: { content }
        });
    } catch (error) {
        console.error('Add YouTube video error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add YouTube video',
            error: error.message
        });
    }
});

// Background processing function
async function processContent(contentId, contentType, fileUrl) {
    try {
        console.log(`🌀 Starting background processing for content: ${contentId} (${contentType})`);
        const content = await Content.findById(contentId);
        if (!content) {
            console.error(`❌ Content ${contentId} not found in database`);
            return;
        }

        // 1. Mark as processing
        content.processingStatus = 'processing';
        content.processingProgress = 10;
        await content.save();
        console.log(`📊 [${contentId}] Status: processing, Progress: 10%`);

        let extractedData = {};

        // 2. Extract data based on content type
        try {
            console.log(`🔍 [${contentId}] Extracting ${contentType} data via ML service...`);
            if (contentType === 'pdf' || contentType === 'video' || contentType === 'youtube') {
                const mlData = await extractWithML(fileUrl, contentId, contentType);

                if (contentType === 'pdf') {
                    extractedData = {
                        text: mlData.text,
                        summary: mlData.summary,
                        topics: mlData.topics,
                        keywords: mlData.keywords,
                        structure: mlData.structure,
                        metadata: mlData.metadata
                    };
                } else if (contentType === 'video' || contentType === 'youtube') {
                    extractedData = {
                        text: mlData.text,
                        summary: mlData.summary,
                        topics: mlData.topics || [],
                        keywords: mlData.keywords || [],
                        metadata: {
                            ...mlData.metadata,
                            duration: mlData.duration,
                            language: mlData.language
                        }
                    };

                    // Update content with video specific info
                    content.file.duration = mlData.duration;
                    if (mlData.metadata && mlData.metadata.thumbnail) {
                        content.file.thumbnail = {
                            url: mlData.metadata.thumbnail,
                            publicId: mlData.metadata.thumbnail_public_id || ''
                        };
                    } else if (mlData.thumbnail_url) {
                        content.file.thumbnail = {
                            url: mlData.thumbnail_url,
                            publicId: mlData.thumbnail_public_id || ''
                        };
                    }
                }

                // Handle PDF thumbnail if generated
                if (contentType === 'pdf' && mlData.thumbnail_url) {
                    content.file.thumbnail = {
                        url: mlData.thumbnail_url,
                        publicId: mlData.thumbnail_public_id || ''
                    };
                }
            } else if (contentType === 'code' || contentType === 'document') {
                const codeData = await extractCodeData(fileUrl, content.title);
                extractedData = {
                    text: codeData.text,
                    summary: codeData.summary,
                    topics: codeData.topics,
                    keywords: codeData.keywords,
                    metadata: codeData.metadata
                };
            }
        } catch (extractionError) {
            console.error(`❌ [${contentId}] Extraction failed:`, extractionError);
            throw extractionError;
        }

        content.processingProgress = 40;
        await content.save();
        console.log(`📊 [${contentId}] Progress: 40% (Extraction complete)`);

        // 3. Update content with extracted data
        content.extractedData = extractedData;
        content.processingProgress = 60;
        await content.save();
        console.log(`📊 [${contentId}] Progress: 60% (Data saved)`);

        // 4. Create graph structure
        try {
            console.log(`🕸️ [${contentId}] Creating graph nodes...`);
            const graphNodeId = await createContentNode(content);
            content.graphNodeId = graphNodeId;
            content.processingProgress = 80;
            await content.save();
            console.log(`📊 [${contentId}] Progress: 80% (Graph created)`);

            // Link to course
            await linkContentToCourse(content._id, content.courseId);

            // Create topic nodes if available
            if (extractedData.topics && extractedData.topics.length > 0) {
                await createTopicNodes(content._id, extractedData.topics);
            }

            // Link related content
            await linkRelatedContent(content._id);
        } catch (graphError) {
            console.error(`❌ [${contentId}] Graph processing failed:`, graphError);
            // We don't necessarily want to fail the whole process if graph fails, 
            // but for now let's keep it strict or log it.
        }

        // 5. Complete processing
        content.processingStatus = 'completed';
        content.processingProgress = 100;
        content.isPublished = true; // Auto-publish on success
        if (!content.publishedAt) content.publishedAt = new Date();

        await content.save();
        console.log(`✅ [${contentId}] Content processed successfully!`);
    } catch (error) {
        console.error(`❌ Content processing failed for ${contentId}:`, error);
        try {
            const content = await Content.findById(contentId);
            if (content) {
                content.processingStatus = 'failed';
                content.processingError = error.message;
                content.processingProgress = 100; // Stop the progress bar
                await content.save();
            }
        } catch (saveError) {
            console.error('❌ Failed to save failure status:', saveError);
        }
    }
}


// Get content by ID
router.get('/:id', authenticate, attachUser, async (req, res) => {
    try {
        const content = await Content.findById(req.params.id)
            .populate('courseId', 'name code')
            .populate('branchIds', 'name')
            .populate('institutionId', 'name')
            .populate('uploadedBy', 'profile.name email');

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Increment view count
        await content.incrementViews();

        // Record view in graph (if student)
        if (req.dbUser.role === 'student') {
            await recordView(req.dbUser._id, content._id).catch(err => {
                console.error('Record view error:', err);
            });
        }

        res.json({
            success: true,
            data: { content }
        });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content',
            error: error.message
        });
    }
});

// Get all content for a course
router.get('/course/:courseId', authenticate, attachUser, async (req, res) => {
    try {
        const { type, difficulty, published } = req.query;

        const filter = {
            courseId: req.params.courseId,
            isActive: true
        };

        if (type) filter.type = type;
        if (difficulty) filter['metadata.difficulty'] = difficulty;
        if (published !== undefined) filter.isPublished = published === 'true';

        const content = await Content.find(filter)
            .populate('uploadedBy', 'profile.name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { content }
        });
    } catch (error) {
        console.error('Get course content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content',
            error: error.message
        });
    }
});

// Update content
router.put('/:id', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { title, description, difficulty, category, tags, isPublished } = req.body;

        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Verify authorization
        if (content.uploadedBy.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this content'
            });
        }

        // Update fields
        if (title) content.title = title;
        if (description !== undefined) content.description = description;
        if (difficulty) content.metadata.difficulty = difficulty;
        if (category) content.metadata.category = category;
        if (tags) content.metadata.tags = tags;
        if (isPublished !== undefined) {
            content.isPublished = isPublished;
            if (isPublished && !content.publishedAt) {
                content.publishedAt = new Date();
            }
        }

        await content.save();

        res.json({
            success: true,
            message: 'Content updated successfully',
            data: { content }
        });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update content',
            error: error.message
        });
    }
});

// Delete content
router.delete('/:id', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Verify authorization
        if (content.uploadedBy.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this content'
            });
        }

        // Delete from Neo4j
        await deleteContentNode(content._id);

        // Soft delete
        content.isActive = false;
        await content.save();

        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete content',
            error: error.message
        });
    }
});

// Get learning path for a course
router.get('/course/:courseId/learning-path', authenticate, attachUser, async (req, res) => {
    try {
        const path = await getLearningPath(req.params.courseId);

        res.json({
            success: true,
            data: { path }
        });
    } catch (error) {
        console.error('Get learning path error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get learning path',
            error: error.message
        });
    }
});

// Get recommendations for student
router.get('/recommendations/me', authenticate, attachUser, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const recommendations = await getRecommendations(req.dbUser._id, limit);

        res.json({
            success: true,
            data: { recommendations }
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations',
            error: error.message
        });
    }
});

// Get content graph visualization
router.get('/course/:courseId/graph', authenticate, attachUser, async (req, res) => {
    try {
        const graph = await getContentGraph(req.params.courseId);

        res.json({
            success: true,
            data: { graph }
        });
    } catch (error) {
        console.error('Get content graph error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content graph',
            error: error.message
        });
    }
});

// Reprocess content
router.post('/:id/reprocess', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Verify authorization
        if (content.uploadedBy.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to reprocess this content'
            });
        }

        // Start reprocessing
        content.processingStatus = 'pending';
        content.processingError = null;
        await content.save();

        processContent(content._id, content.type, content.file.url).catch(err => {
            console.error('Reprocessing error:', err);
        });

        res.json({
            success: true,
            message: 'Content reprocessing started'
        });
    } catch (error) {
        console.error('Reprocess content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reprocess content',
            error: error.message
        });
    }
});

// Proxy external content (to bypass CORS for PDF viewer)
router.get('/view/proxy', authenticate, async (req, res) => {
    let { url } = req.query;
    try {
        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }

        // Validate URL (ensure it's from Cloudinary)
        if (!url.includes('cloudinary.com')) {
            return res.status(403).json({ success: false, message: 'Forbidden: Only Cloudinary URLs can be proxied' });
        }

        // Handle potential multiple encoding (common with URLs in query params)
        while (url && url.includes('%25')) {
            url = decodeURIComponent(url);
        }

        // Ensure the URL is properly formatted
        url = encodeURI(decodeURI(url));

        let targetUrl = url;

        // If it's a Cloudinary URL, we can sign it to ensure access
        if (url.includes('cloudinary.com')) {
            try {
                // Extract public_id and resource_type
                // Format: .../upload/v12345/folder/id.ext
                const parts = url.split('/upload/');
                if (parts.length > 1) {
                    const pathAfterUpload = parts[1];
                    const pathParts = pathAfterUpload.split('/');

                    // Remove version if present
                    const publicIdWithExt = pathParts[0].startsWith('v')
                        ? pathParts.slice(1).join('/')
                        : pathParts.join('/');

                    // Determine resource type from URL
                    let resourceType = 'raw';
                    if (url.includes('/video/')) resourceType = 'video';
                    else if (url.includes('/image/')) resourceType = 'image';

                    // Get public_id without extension for images/videos
                    let publicId = publicIdWithExt;
                    if (resourceType !== 'raw') {
                        publicId = publicIdWithExt.split('.').slice(0, -1).join('.');
                    }

                    targetUrl = cloudinary.utils.url(publicId, {
                        resource_type: resourceType,
                        secure: true,
                        sign_url: true
                    });

                    console.log('🔄 Proxying via signed URL:', targetUrl);
                }
            } catch (signError) {
                console.warn('⚠️ Could not sign Cloudinary URL, using original:', signError.message);
            }
        }

        const response = await axios.get(targetUrl, {
            responseType: 'stream',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/pdf,*/*'
            }
        });

        // Set appropriate headers
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/pdf');
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        // Pipe the stream
        response.data.pipe(res);
    } catch (error) {
        console.error('❌ Proxy error for:', url);
        console.error('Reason:', error.message);
        if (error.response) {
            console.error('Target status code:', error.response.status);
            res.status(error.response.status).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: 'Failed to proxy content: ' + error.message });
        }
    }
});

export default router;

