import StudentIntelligence from '../models/StudentIntelligence.model.js';
import Quiz from '../models/Quiz.model.js';
import Doubt from '../models/Doubt.model.js';
import PeerDoubt from '../models/PeerDoubt.model.js';
import User from '../models/User.model.js';
import aiService from '../services/ai.service.js';
import mongoose from 'mongoose';

/**
 * Aggregate student statistics from all relevant models
 * Uses logic (0 tokens) to calculate core metrics
 */
const aggregateStudentMetrics = async (studentId) => {
    const [quizData, doubtCount, peerData] = await Promise.all([
        Quiz.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: "$percentage" },
                    totalQuizzes: { $sum: 1 },
                    timeTaken: { $avg: "$timeTaken" }
                }
            }
        ]),
        Doubt.countDocuments({ studentId }),
        PeerDoubt.aggregate([
            { $unwind: "$solutions" },
            { $match: { "solutions.studentId": new mongoose.Types.ObjectId(studentId), "solutions.status": "accepted" } },
            { $group: { _id: null, totalAccepted: { $sum: 1 }, credits: { $sum: "$solutions.creditsAwarded" } } }
        ])
    ]);

    const stats = quizData[0] || { avgScore: 0, totalQuizzes: 0, timeTaken: 0 };
    const peerStats = peerData[0] || { totalAccepted: 0, credits: 0 };

    // Heuristic: Calculate learner profiling
    let learnerType = 'Steady Progressor';
    if (stats.avgScore > 85 && doubtCount < 5) learnerType = 'Quick Learner';
    else if (stats.avgScore > 75 && doubtCount > 10) learnerType = 'Deep Diver';
    else if (stats.avgScore < 50 && stats.totalQuizzes > 5) learnerType = 'Slow Learner';
    else if (peerStats.totalAccepted > 3) learnerType = 'Collaborative Master';

    return {
        metrics: {
            avgQuizScore: Math.round(stats.avgScore),
            quizCompletionRate: stats.totalQuizzes, // Normalized as count for now
            doubtsToSolutionRatio: doubtCount,
            creditsEarned: peerStats.credits
        },
        persona: {
            learnerType,
            collaborationScore: Math.min(100, peerStats.totalAccepted * 20)
        }
    };
};

/**
 * Controller: Get class overview for faculty comparison
 */
export const getClassIntelligence = async (req, res) => {
    try {
        const { institutionId } = req.query; // Faculty can filter by institution

        // Find all students in faculty's institutions
        const user = await User.findById(req.dbUser._id);
        const query = { role: 'student' };
        if (user.institutionIds && user.institutionIds.length > 0) {
            query.institutionIds = { $in: user.institutionIds };
        }

        const students = await User.find(query).select('profile email rewards progressStats');

        // Fetch or create intelligence records for each student
        const intelligenceData = await Promise.all(students.map(async (student) => {
            let intel = await StudentIntelligence.findOne({ studentId: student._id });

            // If outdated or non-existent, refresh basic metrics (0 tokens)
            if (!intel || (Date.now() - new Date(intel.updatedAt).getTime() > 3600000)) {
                const updatedStats = await aggregateStudentMetrics(student._id);
                intel = await StudentIntelligence.findOneAndUpdate(
                    { studentId: student._id },
                    {
                        $set: {
                            ...updatedStats,
                            lastAnalysisAt: intel?.lastAnalysisAt || Date.now()
                        }
                    },
                    { upsert: true, new: true }
                );
            }

            return {
                id: student._id,
                name: student.profile.name,
                email: student.email,
                avatar: student.profile.avatar,
                credits: student.rewards?.credits || 0,
                learnerType: intel.persona.learnerType,
                avgScore: intel.metrics.avgQuizScore,
                doubts: intel.metrics.doubtsToSolutionRatio
            };
        }));

        res.json({
            success: true,
            data: intelligenceData
        });
    } catch (error) {
        console.error('getClassIntelligence error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch class intelligence' });
    }
};

/**
 * Controller: Get deep analysis for an individual student
 * Includes token-efficient AI generation if requested
 */
export const getStudentDeepAnalysis = async (req, res) => {
    try {
        const { id } = req.params;
        const { refreshAI } = req.query;

        let intel = await StudentIntelligence.findOne({ studentId: id }).populate('studentId', 'profile email');
        if (!intel) {
            const basic = await aggregateStudentMetrics(id);
            intel = await StudentIntelligence.create({ studentId: id, ...basic });
        }

        // Trigger Deep AI Analysis (Uses tokens, but only on demand/periodic)
        if (refreshAI === 'true' || !intel.analysis?.narrativeSummary) {
            const student = await User.findById(id);
            const doubts = await Doubt.find({ studentId: id }).limit(10).select('query aiResponse');
            const language = req.query.language || 'english';

            // Token-efficient prompt: Summary of activity only
            const prompt = `
                Analyze this student's learning profile:
                Name: ${student.profile.name}
                Avg Quiz Score: ${intel.metrics.avgQuizScore}%
                Doubts Asked: ${intel.metrics.doubtsToSolutionRatio}
                Peer Helpings: ${Math.round(intel.persona.collaborationScore / 20)}
                Recent Doubts: ${doubts.map(d => d.query).join(' | ')}

                Provide:
                1. Narrative summary (3 sentences)
                2. Key Strength
                3. Key Weakness
                4. One actionable recommendation.
                
                STRICT RULE: The response must be in ${language === 'hindi' ? 'HINGLISH (Hindi written in English script)' : 'PURE PROFESSIONAL ENGLISH'} only. 
                Format as JSON: { "summary": "", "strength": "", "weakness": "", "recommendation": "" }
            `;

            const aiResponse = await aiService.askGroq(prompt, "STUDENT_PEDAGOGY_ANALYSIS", null, null, null, language);
            try {
                // Clean AI response if needed (handle non-JSON output)
                const cleaned = aiResponse.explanation.substring(aiResponse.explanation.indexOf('{'), aiResponse.explanation.lastIndexOf('}') + 1);
                const analysis = JSON.parse(cleaned);

                intel.analysis = {
                    narrativeSummary: analysis.summary,
                    strengths: [analysis.strength],
                    weaknesses: [analysis.weakness],
                    recommendedTopics: [analysis.recommendation]
                };
                intel.lastAnalysisAt = Date.now();
                await intel.save();
            } catch (e) {
                console.error('AI JSON Parse error:', e);
            }
        }

        res.json({
            success: true,
            data: intel
        });
    } catch (error) {
        console.error('getStudentDeepAnalysis error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch deep analysis' });
    }
};

export default {
    getClassIntelligence,
    getStudentDeepAnalysis
};
