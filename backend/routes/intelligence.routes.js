import express from 'express';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import { requireFaculty } from '../middleware/role.middleware.js';
import intelligenceController from '../controllers/intelligence.controller.js';

const router = express.Router();

// Faculty: Get class-wide intelligence grid (Comparison view)
router.get('/class-overview', authenticate, attachUser, requireFaculty, intelligenceController.getClassIntelligence);

// Faculty: Get individual student deep analysis (Individual deep dive)
router.get('/student/:id', authenticate, attachUser, requireFaculty, intelligenceController.getStudentDeepAnalysis);

export default router;
