import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import ttsService from '../services/tts.service.js';

const router = express.Router();

/**
 * Text-to-Speech endpoint (AWS Polly)
 * Provides pure Indian voice for AI explanations
 */
router.post('/tts', authenticate, async (req, res) => {
    try {
        const { text, voiceId = "Aditi" } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }

        const audioBuffer = await ttsService.synthesizePolly(text, voiceId);

        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length
        });

        res.send(audioBuffer);
    } catch (error) {
        console.error('TTS Route error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
