import express from 'express';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import PeerDoubt from '../models/PeerDoubt.model.js';
import User from '../models/User.model.js';
import mongoose from 'mongoose';
import { uploadWithThumbnail } from '../services/upload.service.js';

const router = express.Router();

// Helper to reset monthly limits if needed
const checkAndResetMonthlyLimits = async (user) => {
    const now = new Date();
    if (!user.limits) {
        user.limits = {
            peerDoubtsThisMonth: 0,
            lastPeerDoubtReset: now
        };
        await user.save();
        return user;
    }

    const lastReset = new Date(user.limits.lastPeerDoubtReset || user.createdAt);

    // If different month and year, reset
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
        user.limits.peerDoubtsThisMonth = 0;
        user.limits.lastPeerDoubtReset = now;
        await user.save();
    }
    return user;
};

/**
 * POST /api/peer/ask
 * Submit a peer doubt (limited to 3/month)
 */
router.post('/ask', authenticate, attachUser, uploadWithThumbnail, async (req, res) => {
    try {
        const { title, description, courseId, branchId, isGolden, rewardPoints } = req.body;

        let attachments = [];
        if (req.files?.file) {
            attachments.push({
                url: req.files.file[0].path,
                publicId: req.files.file[0].filename,
                type: 'image'
            });
        }
        let user = req.dbUser;

        // Reset limits if it's a new month
        user = await checkAndResetMonthlyLimits(user);

        const SUBMISSION_LIMIT = 3;
        if ((user.limits?.peerDoubtsThisMonth || 0) >= SUBMISSION_LIMIT && user.role === 'student') {
            return res.status(403).json({
                success: false,
                message: `Monthly limit reached. You can only submit ${SUBMISSION_LIMIT} peer doubts per month.`
            });
        }

        const isAdminOrFaculty = user.role === 'faculty' || user.role === 'admin';

        const peerDoubt = await PeerDoubt.create({
            studentId: user._id,
            title,
            description,
            courseId,
            branchId,
            status: 'open',
            isGolden: isAdminOrFaculty ? (isGolden === 'true' || isGolden === true) : false,
            rewardPoints: isAdminOrFaculty ? (parseInt(rewardPoints) || 15) : 15,
            attachments
        });

        // Increment usage
        user.limits.peerDoubtsThisMonth += 1;
        await user.save();

        res.status(201).json({
            success: true,
            data: { peerDoubt }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/peer/golden
 * Fetch golden questions and open peer doubts for user's branch/course
 */
router.get('/golden', authenticate, attachUser, async (req, res) => {
    try {
        const { courseId, branchId } = req.query;
        const query = { status: { $ne: 'removed' } };

        if (courseId) query.courseId = courseId;

        // Restrict branch access for students
        if (req.dbUser.role === 'student') {
            const allowedBranchIds = req.dbUser.branchIds.map(id => id.toString());
            if (branchId) {
                if (allowedBranchIds.includes(branchId)) {
                    query.branchId = branchId;
                } else {
                    return res.status(403).json({ success: false, message: 'Unauthorized branch' });
                }
            } else {
                query.branchId = { $in: req.dbUser.branchIds };
            }
        } else {
            // Admin/Faculty can filter by any provided branchId
            if (branchId) query.branchId = branchId;
        }

        const peerDoubts = await PeerDoubt.find(query)
            .populate('studentId', 'profile.name profile.avatar')
            .populate('courseId', 'name code')
            .populate('solutions.studentId', 'profile.name profile.avatar')
            .sort({ isGolden: -1, createdAt: -1 })
            .limit(50);

        res.json({ success: true, data: { peerDoubts } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/peer/leaderboard
 * Fetch top students by credits
 */
router.get('/leaderboard', authenticate, async (req, res) => {
    try {
        const User = (await import('../models/User.model.js')).default;
        const topStudents = await User.find({ role: 'student' })
            .select('profile.name profile.avatar rewards.credits')
            .sort({ 'rewards.credits': -1 })
            .limit(10);

        res.json({
            success: true,
            data: topStudents.map(s => ({
                name: s.profile.name,
                avatar: s.profile.avatar,
                credits: s.rewards.credits || 0
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/peer/faculty/student-stats
 * Faculty view of all students' peer learning progress
 */
router.get('/faculty/student-stats', authenticate, attachUser, async (req, res) => {
    try {
        if (req.dbUser.role !== 'faculty' && req.dbUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const User = (await import('../models/User.model.js')).default;
        const students = await User.find({ role: 'student' })
            .select('profile.name profile.avatar email branchIds rewards.credits');

        // Get count of solved questions for each student
        const stats = await Promise.all(students.map(async (student) => {
            const solvedCount = await PeerDoubt.countDocuments({
                'solutions.studentId': student._id,
                'solutions.status': 'accepted'
            });

            return {
                id: student._id,
                name: student.profile.name,
                email: student.email,
                credits: student.rewards.credits || 0,
                solved: solvedCount
            };
        }));

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/peer/:id/solve
 * Submit a solution to a peer doubt
 */
router.post('/:id/solve', authenticate, attachUser, uploadWithThumbnail, async (req, res) => {
    try {
        const { answer } = req.body;
        const { id } = req.params;

        const peerDoubt = await PeerDoubt.findById(id);
        if (!peerDoubt) return res.status(404).json({ success: false, message: 'Question not found' });

        if (['solved', 'removed', 'review'].includes(peerDoubt.status) && req.dbUser.role === 'student') {
            // Let it fall through if it's already in review and they just want to submit (existing solution check will catch them)
            // But if it's solved or removed, nobody can solve it.
            if (['solved', 'removed'].includes(peerDoubt.status)) {
                return res.status(400).json({ success: false, message: 'This doubt is no longer accepting solutions' });
            }
        }

        if (peerDoubt.studentId.toString() === req.dbUser._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot solve your own question' });
        }

        // Check if student already submitted a solution
        const existingSolution = peerDoubt.solutions.find(s => s.studentId.toString() === req.dbUser._id.toString());
        if (existingSolution) {
            return res.status(400).json({ success: false, message: 'You have already submitted a solution' });
        }

        let attachments = [];
        if (req.files?.file) {
            attachments.push({
                url: req.files.file[0].path,
                publicId: req.files.file[0].filename,
                type: 'image'
            });
        }

        peerDoubt.solutions.push({
            studentId: req.dbUser._id,
            answer,
            status: 'pending',
            attachments
        });

        // Mark as review if it was open
        if (peerDoubt.status === 'open') {
            peerDoubt.status = 'review';
        }

        await peerDoubt.save();

        res.json({ success: true, message: 'Solution submitted for review' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/peer/stats
 * Get user stats (credits and remaining chances)
 */
router.get('/stats', authenticate, attachUser, async (req, res) => {
    try {
        let user = req.dbUser;
        user = await checkAndResetMonthlyLimits(user);

        res.json({
            success: true,
            data: {
                credits: user.rewards?.credits || 0,
                remainingChances: Math.max(0, 3 - (user.limits?.peerDoubtsThisMonth || 0)),
                totalSolved: await PeerDoubt.countDocuments({
                    'solutions.studentId': user._id,
                    'solutions.status': 'accepted'
                })
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * PATCH /api/peer/:id/review (FACULTY ONLY)
 * Review a solution and award credits
 */
router.patch('/:id/review', authenticate, attachUser, async (req, res) => {
    try {
        if (req.dbUser.role !== 'faculty' && req.dbUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only faculty can review solutions' });
        }

        const { solutionId, status, points, feedback, isGolden } = req.body;
        const peerDoubt = await PeerDoubt.findById(req.params.id);

        if (!peerDoubt) return res.status(404).json({ success: false, message: 'Question not found' });

        if (isGolden !== undefined) peerDoubt.isGolden = isGolden;

        if (solutionId && status) {
            const solution = peerDoubt.solutions.id(solutionId);
            if (!solution) return res.status(404).json({ success: false, message: 'Solution not found' });

            solution.status = status;
            solution.feedback = feedback;

            if (status === 'accepted') {
                // Only award credits if this doubt isn't already solved by this solution
                if (peerDoubt.status !== 'solved' || peerDoubt.acceptedSolutionId?.toString() !== solutionId) {
                    solution.creditsAwarded = points || peerDoubt.rewardPoints;
                    peerDoubt.status = 'solved';
                    peerDoubt.acceptedSolutionId = solutionId;

                    // Award credits to the solver
                    await User.findByIdAndUpdate(solution.studentId, {
                        $inc: { 'rewards.credits': solution.creditsAwarded }
                    });
                } else {
                    // Already accepted, just update other fields if necessary
                    solution.creditsAwarded = points || peerDoubt.rewardPoints;
                }
            }
        }

        await peerDoubt.save();
        res.json({ success: true, data: { peerDoubt } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * DELETE /api/peer/:id (FACULTY/OWNER)
 * Remove or edit question
 */
router.delete('/:id', authenticate, attachUser, async (req, res) => {
    try {
        const peerDoubt = await PeerDoubt.findById(req.params.id);
        if (!peerDoubt) return res.status(404).json({ success: false, message: 'Question not found' });

        if (req.dbUser.role !== 'faculty' && req.dbUser.role !== 'admin' && peerDoubt.studentId.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        peerDoubt.status = 'removed';
        await peerDoubt.save();

        res.json({ success: true, message: 'Question removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
