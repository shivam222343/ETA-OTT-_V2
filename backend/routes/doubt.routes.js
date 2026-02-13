import express from 'express';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import { requireFaculty } from '../middleware/role.middleware.js';
import Doubt from '../models/Doubt.model.js';
import Course from '../models/Course.model.js';
import Content from '../models/Content.model.js';
import aiService from '../services/ai.service.js';
import { emitToCourse, emitToUser } from '../services/websocket.service.js';

const router = express.Router();

/**
 * Ask a doubt - Main resolution workflow
 */
router.post('/ask', authenticate, attachUser, async (req, res) => {
    try {
        const { query, selectedText, courseId, contentId, context, visualContext } = req.body;
        const studentId = req.dbUser._id;

        if (!query || !courseId) {
            return res.status(400).json({ success: false, message: 'Query and Course ID are required' });
        }

        // Fetch content details early to get extracted data
        const contentDoc = await Content.findById(contentId);
        const contentUrl = contentDoc?.file?.url;
        const contentType = contentDoc?.type;
        const extractedText = contentDoc?.extractedData?.text || '';

        // Build enhanced context with extracted data
        let enhancedContext = selectedText || context || '';

        // If we have extracted data and it's not already in the context, add it
        if (extractedText && !enhancedContext.includes(extractedText.substring(0, 100))) {
            // For videos with timestamps, try to find relevant portion
            if (contentType === 'video' && visualContext) {
                // Extract timestamp from context if available
                const timeMatch = context?.match(/\[at (\d+):(\d+)\]/);
                if (timeMatch) {
                    const minutes = parseInt(timeMatch[1]);
                    const seconds = parseInt(timeMatch[2]);
                    const totalSeconds = minutes * 60 + seconds;

                    // Try to find relevant text around this timestamp
                    // Assuming extracted text might have timestamps or we use a window
                    const wordsPerSecond = 2.5; // Average speaking rate
                    const windowSize = 30; // seconds before and after
                    const startWord = Math.max(0, Math.floor((totalSeconds - windowSize) * wordsPerSecond));
                    const endWord = Math.floor((totalSeconds + windowSize) * wordsPerSecond);

                    const words = extractedText.split(/\s+/);
                    const relevantText = words.slice(startWord, endWord).join(' ');

                    if (relevantText.length > 50) {
                        enhancedContext += `\n\n[Extracted Content around timestamp ${timeMatch[0]}]:\n${relevantText}`;
                    }
                } else if (extractedText.length > 0) {
                    // No timestamp, provide a sample of the extracted text
                    const sampleLength = Math.min(1000, extractedText.length);
                    enhancedContext += `\n\n[Extracted Content Sample]:\n${extractedText.substring(0, sampleLength)}${extractedText.length > sampleLength ? '...' : ''}`;
                }
            } else if (extractedText.length > 0) {
                // For non-video content, include more of the extracted text
                const sampleLength = Math.min(2000, extractedText.length);
                enhancedContext += `\n\n[Full Extracted Content]:\n${extractedText.substring(0, sampleLength)}${extractedText.length > sampleLength ? '...' : ''}`;
            }
        }

        // 1. Search existing verified doubts in Graph DB
        const existingResult = await aiService.searchExistingDoubts(query, enhancedContext, contentId);
        if (existingResult) {
            const doubt = await Doubt.create({
                studentId,
                courseId,
                contentId,
                query,
                selectedText,
                context: enhancedContext,
                visualContext,
                aiResponse: existingResult.answer,
                confidence: existingResult.confidence,
                status: 'resolved'
            });

            return res.json({
                success: true,
                message: 'Answer found in knowledge base',
                data: { doubt, source: 'knowledge_base' }
            });
        }

        // 2. Not found in DB, ask Groq Llama with enhanced context
        const aiResult = await aiService.askGroq(
            query,
            enhancedContext,
            visualContext,
            contentUrl,
            contentType
        );

        const doubt = await Doubt.create({
            studentId,
            courseId,
            contentId,
            query,
            selectedText,
            context: enhancedContext,
            visualContext,
            aiResponse: aiResult.explanation,
            confidence: aiResult.confidence,
            status: aiResult.confidence >= 80 ? 'resolved' : 'pending'
        });

        // 3. If high confidence, save to Graph DB for future (Linked to specific content)
        if (aiResult.confidence >= 85) {
            await aiService.saveDoubtToGraph(query, aiResult.explanation, aiResult.confidence, enhancedContext, contentId);
        }

        res.json({
            success: true,
            message: aiResult.confidence >= 80 ? 'AI solved your doubt!' : 'AI provided a tentative answer, but confidence is low.',
            data: {
                doubt,
                source: aiResult.source,
                needsEscalation: aiResult.confidence < 80
            }
        });
    } catch (error) {
        console.error('Ask doubt error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Escalate a doubt to a mentor
 */
router.post('/:id/escalate', authenticate, attachUser, async (req, res) => {
    try {
        const doubt = await Doubt.findById(req.params.id);
        if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });

        doubt.escalated = true;
        doubt.status = 'escalated';
        await doubt.save();

        // Notify course faculty via WebSocket
        emitToCourse(doubt.courseId, 'doubt:escalated', {
            doubtId: doubt._id,
            query: doubt.query,
            studentName: req.dbUser.profile.name
        });

        res.json({ success: true, message: 'Doubt escalated to mentors' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Answer an escalated doubt (Faculty Only)
 */
router.post('/:id/answer', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { answer, saveToGraph = true } = req.body;
        const doubt = await Doubt.findById(req.params.id);

        if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found' });

        doubt.facultyAnswer = answer;
        doubt.answeredBy = req.dbUser._id;
        doubt.status = 'answered';
        doubt.resolvedAt = new Date();
        await doubt.save();

        // Save mentor's verified answer to Graph DB if toggled
        if (saveToGraph) {
            const mentorContext = doubt.selectedText || doubt.context || '';
            await aiService.saveDoubtToGraph(doubt.query, answer, 100, mentorContext, doubt.contentId);
        }

        // Notify student
        emitToUser(doubt.studentId, 'doubt:answered', {
            doubtId: doubt._id,
            answer,
            query: doubt.query
        });

        res.json({ success: true, message: 'Answered and saved to knowledge base' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Get student's doubt history
 */
router.get('/my-doubts', authenticate, attachUser, async (req, res) => {
    try {
        const doubts = await Doubt.find({ studentId: req.dbUser._id })
            .sort({ createdAt: -1 })
            .populate('courseId', 'name');
        res.json({ success: true, data: { doubts } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Get escalated doubts for a course (Faculty Only)
 */
router.get('/escalated/:courseId', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const doubts = await Doubt.find({
            courseId: req.params.courseId,
            status: 'escalated'
        })
            .populate('studentId', 'profile.name')
            .sort({ createdAt: 1 });

        res.json({ success: true, data: { doubts } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
