import express from 'express';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import Quiz from '../models/Quiz.model.js';
import Content from '../models/Content.model.js';
import Doubt from '../models/Doubt.model.js';
import Course from '../models/Course.model.js';
import aiService from '../services/ai.service.js';
import axios from 'axios';
import mongoose from 'mongoose';

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Helper: Calculate time limit based on difficulty and question count
 */
const calculateTimeLimit = (questionCount, difficulty) => {
    const timePerQuestion = {
        easy: 90,
        medium: 60,
        hard: 45,
        auto: 60
    };
    return questionCount * (timePerQuestion[difficulty] || 60);
};

/**
 * Helper: Extract content text up to the student's current position
 */
const getContentTextByProgress = (content, progress) => {
    const fullText = content.extractedData?.text || '';
    if (!fullText) return '';

    const type = progress?.type || content.type;

    if (type === 'pdf' || type === 'web' || type === 'document') {
        const currentPage = progress?.currentPage || 1;
        const totalPages = progress?.totalPages || content.file?.pages || 1;
        const ratio = Math.min(currentPage / Math.max(totalPages, 1), 1);
        const charLimit = Math.floor(fullText.length * ratio);
        return fullText.substring(0, charLimit);
    }

    if (type === 'video') {
        const currentTimestamp = progress?.currentTimestamp || 0;
        const totalDuration = progress?.totalDuration || content.file?.duration || 1;
        const ratio = Math.min(currentTimestamp / Math.max(totalDuration, 1), 1);
        const charLimit = Math.floor(fullText.length * ratio);
        return fullText.substring(0, charLimit);
    }

    // For other types, return full text
    return fullText;
};

/**
 * POST /api/quiz/generate
 * Generate a quiz from content progress + student doubts
 */
router.post('/generate', authenticate, attachUser, async (req, res) => {
    try {
        const { courseId, contentId, questionCount = 15, contentProgress, difficulty = 'auto' } = req.body;
        const studentId = req.dbUser._id;

        // Validate question count
        const qCount = Math.min(Math.max(parseInt(questionCount) || 15, 10), 30);

        // Fetch content with authoritative course and branch data
        const content = await Content.findById(contentId);
        if (!content) {
            return res.status(404).json({ success: false, message: 'Content not found' });
        }

        // Derive authoritative courseId
        const derivedCourseId = content.courseId;

        // Authorization Check
        const isAuthorized = req.dbUser.role === 'admin' ||
            (req.dbUser.role === 'faculty' && req.dbUser.institutionIds.some(id => id.equals(content.institutionId))) ||
            (req.dbUser.role === 'student' && req.dbUser.branchIds.some(id => content.branchIds.some(bid => bid.equals(id))));

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'You are not authorized to access this content quiz' });
        }

        // 1. Get content text up to student's progress
        const scopedText = getContentTextByProgress(content, contentProgress);
        if (!scopedText || scopedText.length < 50) {
            return res.status(400).json({
                success: false,
                message: 'Not enough content consumed to generate a quiz. Please read/watch more of the material.'
            });
        }

        // 2. Get student's doubts on this content
        const studentDoubts = await Doubt.find({
            studentId,
            contentId,
            query: { $exists: true, $ne: '' }
        }).select('query aiResponse').sort({ createdAt: -1 }).limit(20);

        const doubtContext = studentDoubts.length > 0
            ? studentDoubts.map(d => `Q: ${d.query}\nA: ${(d.aiResponse || '').substring(0, 200)}`).join('\n\n')
            : '';

        // 3. Get topics/concepts from content
        const topics = content.extractedData?.topics?.join(', ') || '';
        const concepts = content.extractedData?.concepts?.map(c => c.name).join(', ') || '';

        // 4. Build progress description
        let progressDesc = '';
        if (contentProgress?.type === 'pdf' || contentProgress?.type === 'web') {
            progressDesc = `Student has read pages 1 to ${contentProgress.currentPage} out of ${contentProgress.totalPages} total pages.`;
        } else if (contentProgress?.type === 'video') {
            const mins = Math.floor((contentProgress.currentTimestamp || 0) / 60);
            const secs = Math.floor((contentProgress.currentTimestamp || 0) % 60);
            progressDesc = `Student has watched up to ${mins}:${secs.toString().padStart(2, '0')} of the video.`;
        }

        // 5. Build Groq prompt
        const systemPrompt = `You are an expert quiz generator for educational content. Generate exactly ${qCount} multiple-choice questions (MCQs) based ONLY on the provided content text. Each question must have exactly 4 options with only one correct answer.

RULES:
- Questions MUST be based on content the student has actually consumed (provided text only)
- Include questions related to doubts the student has asked (if provided)
- Mix difficulty levels: ~30% easy, ~50% medium, ~20% hard
- Each question must have a clear, educational explanation for the correct answer
- Questions should test understanding, not just memorization
- Return ONLY valid JSON, no markdown or extra text

OUTPUT FORMAT (strict JSON array):
[
  {
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "The correct answer is Option A because...",
    "difficulty": "easy",
    "topic": "Topic name"
  }
]`;

        const userPrompt = `Content Title: "${content.title}"
${progressDesc}
${topics ? `\nTopics covered: ${topics}` : ''}
${concepts ? `\nKey concepts: ${concepts}` : ''}

--- CONTENT TEXT (consumed by student) ---
${scopedText.substring(0, 12000)}

${doubtContext ? `--- STUDENT'S DOUBTS & QUESTIONS ---\n${doubtContext.substring(0, 3000)}` : ''}

Generate ${qCount} MCQ questions based on the above content. Include 2-3 questions specifically related to the student's doubts if any were provided. Return ONLY valid JSON.`;

        // 6. Call Groq API
        const apiKey = req.dbUser?.groqApiKey || GROQ_API_KEY;
        const groqResponse = await axios.post(GROQ_API_URL, {
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 8000,
            response_format: { type: 'json_object' }
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        // 7. Parse response
        let questions = [];
        try {
            const responseText = groqResponse.data.choices[0]?.message?.content || '[]';
            const parsed = JSON.parse(responseText);
            // Handle both array and object with questions key
            questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        } catch (parseError) {
            console.error('Failed to parse Groq quiz response:', parseError);
            return res.status(500).json({
                success: false,
                message: 'AI generated an invalid response. Please try again.'
            });
        }

        // Validate and clean questions
        questions = questions
            .filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctAnswer === 'number')
            .slice(0, qCount)
            .map(q => ({
                question: q.question,
                options: q.options.slice(0, 4),
                correctAnswer: Math.min(Math.max(q.correctAnswer, 0), 3),
                explanation: q.explanation || 'No explanation provided.',
                difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
                topic: q.topic || '',
                studentAnswer: null,
                isCorrect: null
            }));

        if (questions.length < 5) {
            return res.status(500).json({
                success: false,
                message: 'AI could not generate enough questions for this content. Try reading more material first.'
            });
        }

        // 8. Create quiz document
        const timeLimit = calculateTimeLimit(questions.length, difficulty);

        const quiz = await Quiz.create({
            studentId,
            courseId: derivedCourseId,
            contentId,
            contentProgress: {
                type: contentProgress?.type || content.type,
                currentPage: contentProgress?.currentPage || null,
                totalPages: contentProgress?.totalPages || content.file?.pages || null,
                currentTimestamp: contentProgress?.currentTimestamp || null,
                totalDuration: contentProgress?.totalDuration || content.file?.duration || null
            },
            config: {
                totalQuestions: questions.length,
                timeLimit,
                difficulty
            },
            questions,
            status: 'in_progress',
            startedAt: new Date()
        });

        // Return quiz WITHOUT correct answers
        const safeQuiz = quiz.toObject();
        safeQuiz.questions = safeQuiz.questions.map(q => ({
            question: q.question,
            options: q.options,
            difficulty: q.difficulty,
            topic: q.topic,
            studentAnswer: q.studentAnswer
        }));

        res.json({
            success: true,
            data: { quiz: safeQuiz }
        });

    } catch (error) {
        console.error('Quiz generation error:', error?.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to generate quiz: ' + error.message });
    }
});

/**
 * POST /api/quiz/:quizId/submit
 * Submit quiz answers and get results
 */
router.post('/:quizId/submit', authenticate, attachUser, async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers, timeTaken } = req.body; // answers = { questionIndex: selectedOption }
        const studentId = req.dbUser._id;

        const quiz = await Quiz.findOne({ _id: quizId, studentId });
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        if (quiz.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Quiz already submitted' });
        }

        // Grade each question
        let correctCount = 0;
        quiz.questions.forEach((q, idx) => {
            const rawAnswer = answers?.[idx];
            const studentAnswer = (rawAnswer !== undefined && rawAnswer !== null) ? Number(rawAnswer) : null;

            q.studentAnswer = studentAnswer;
            // Coerce to number to handle potential string inputs from client
            q.isCorrect = studentAnswer !== null && Number(studentAnswer) === Number(q.correctAnswer);
            if (q.isCorrect) correctCount++;
        });

        quiz.score = correctCount;
        quiz.percentage = Math.round((correctCount / quiz.questions.length) * 100);
        quiz.timeTaken = timeTaken || 0;
        quiz.status = 'completed';
        quiz.completedAt = new Date();

        // Generate AI analysis
        try {
            const wrongTopics = quiz.questions
                .filter(q => !q.isCorrect)
                .map(q => q.topic || q.question.substring(0, 50))
                .join(', ');

            const rightTopics = quiz.questions
                .filter(q => q.isCorrect)
                .map(q => q.topic || q.question.substring(0, 50))
                .join(', ');

            const apiKey = req.dbUser?.groqApiKey || GROQ_API_KEY;
            const analysisResponse = await axios.post(GROQ_API_URL, {
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a supportive AI tutor analyzing a student\'s quiz performance. Respond in a friendly, encouraging tone using PURE PROFESSIONAL ENGLISH only. No Hindi or Hinglish mixing. Use markdown formatting with headers and bullet points. Keep it concise (max 250 words).'
                    },
                    {
                        role: 'user',
                        content: `Student scored ${quiz.percentage}% (${correctCount}/${quiz.questions.length}).
Time taken: ${Math.floor((timeTaken || 0) / 60)} minutes.
Strong topics: ${rightTopics || 'None identified'}
Weak topics: ${wrongTopics || 'None — perfect score!'}

Give a brief, personalized analysis with:
1. Performance summary (2 lines)
2. Strengths (2-3 bullet points)
3. Areas to improve (2-3 bullet points)  
4. Study tips (2-3 actionable tips)
5. A motivational closing line`
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            quiz.aiAnalysis = analysisResponse.data.choices[0]?.message?.content || null;
        } catch (aiError) {
            console.warn('AI analysis generation failed:', aiError.message);
            quiz.aiAnalysis = null;
        }

        await quiz.save();

        res.json({
            success: true,
            data: {
                quiz: quiz.toObject()
            }
        });

    } catch (error) {
        console.error('Quiz submission error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to submit quiz' });
    }
});

/**
 * GET /api/quiz/:quizId
 * Get a single quiz (hides answers if in_progress)
 */
router.get('/:quizId', authenticate, attachUser, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.quizId,
            studentId: req.dbUser._id
        }).populate('contentId', 'title type file.thumbnail');

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const quizObj = quiz.toObject();

        // Hide correct answers if quiz is still in progress
        if (quiz.status === 'in_progress') {
            quizObj.questions = quizObj.questions.map(q => ({
                question: q.question,
                options: q.options,
                difficulty: q.difficulty,
                topic: q.topic,
                studentAnswer: q.studentAnswer
            }));
        }

        res.json({ success: true, data: { quiz: quizObj } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/quiz/history
 * Get quiz history for current student
 */
router.get('/history/me', authenticate, attachUser, async (req, res) => {
    try {
        const studentId = req.dbUser._id;
        const { courseId, contentId, limit = 20 } = req.query;

        const filter = { studentId, status: 'completed' };
        if (courseId) filter.courseId = courseId;
        if (contentId) filter.contentId = contentId;

        const sanitizedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

        const quizzes = await Quiz.find(filter)
            .select('courseId contentId config.totalQuestions score percentage timeTaken status createdAt completedAt contentProgress')
            .populate('contentId', 'title type')
            .populate('courseId', 'name code')
            .sort({ createdAt: -1 })
            .limit(sanitizedLimit);

        res.json({
            success: true,
            data: { quizzes }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/quiz/performance
 * Aggregated performance data for the Performance dashboard
 */
router.get('/performance/me', authenticate, attachUser, async (req, res) => {
    try {
        const studentId = req.dbUser._id;

        // 1. Overall stats
        const totalQuizzes = await Quiz.countDocuments({ studentId, status: 'completed' });
        const avgResult = await Quiz.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
            {
                $group: {
                    _id: null,
                    avgPercentage: { $avg: '$percentage' },
                    totalScore: { $sum: '$score' },
                    totalQuestions: { $sum: '$config.totalQuestions' },
                    avgTimeTaken: { $avg: '$timeTaken' }
                }
            }
        ]);

        // 2. Score trend (last 10 quizzes)
        const scoreTrend = await Quiz.find({ studentId, status: 'completed' })
            .select('percentage createdAt contentId config.totalQuestions score')
            .populate('contentId', 'title')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // 3. Course-wise performance
        const coursePerformance = await Quiz.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
            {
                $group: {
                    _id: '$courseId',
                    avgPercentage: { $avg: '$percentage' },
                    quizCount: { $sum: 1 },
                    bestScore: { $max: '$percentage' },
                    worstScore: { $min: '$percentage' }
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'course'
                }
            },
            { $unwind: '$course' },
            {
                $project: {
                    courseName: '$course.name',
                    courseCode: '$course.code',
                    avgPercentage: 1,
                    quizCount: 1,
                    bestScore: 1,
                    worstScore: 1
                }
            }
        ]);

        // 4. Weak topics (most frequently wrong)
        const weakTopics = await Quiz.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
            { $unwind: '$questions' },
            { $match: { 'questions.isCorrect': false, 'questions.topic': { $ne: '' } } },
            {
                $group: {
                    _id: '$questions.topic',
                    wrongCount: { $sum: 1 }
                }
            },
            { $sort: { wrongCount: -1 } },
            { $limit: 8 }
        ]);

        // 5. Strong topics (most frequently correct)
        const strongTopics = await Quiz.aggregate([
            { $match: { studentId: new mongoose.Types.ObjectId(studentId), status: 'completed' } },
            { $unwind: '$questions' },
            { $match: { 'questions.isCorrect': true, 'questions.topic': { $ne: '' } } },
            {
                $group: {
                    _id: '$questions.topic',
                    correctCount: { $sum: 1 }
                }
            },
            { $sort: { correctCount: -1 } },
            { $limit: 8 }
        ]);

        res.json({
            success: true,
            data: {
                stats: {
                    totalQuizzes,
                    avgPercentage: Math.round(avgResult[0]?.avgPercentage || 0),
                    totalCorrect: avgResult[0]?.totalScore || 0,
                    totalQuestions: avgResult[0]?.totalQuestions || 0,
                    avgTimeTaken: Math.round(avgResult[0]?.avgTimeTaken || 0)
                },
                scoreTrend: scoreTrend.reverse(), // oldest first for chart
                coursePerformance,
                weakTopics,
                strongTopics
            }
        });
    } catch (error) {
        console.error('Performance fetch error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/quiz/ai-analysis
 * Get AI-generated study analysis based on all quiz data + doubts
 */
router.get('/ai-analysis/me', authenticate, attachUser, async (req, res) => {
    try {
        const studentId = req.dbUser._id;

        // Gather data
        const recentQuizzes = await Quiz.find({ studentId, status: 'completed' })
            .select('percentage score config.totalQuestions contentProgress createdAt')
            .populate('contentId', 'title')
            .populate('courseId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        const totalDoubts = await Doubt.countDocuments({ studentId });
        const recentDoubts = await Doubt.find({ studentId })
            .select('query courseId')
            .populate('courseId', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        if (recentQuizzes.length === 0) {
            return res.json({
                success: true,
                data: {
                    analysis: '### 📚 No Quiz Data Yet\n\nYou haven\'t taken any quizzes yet! Start by reading or watching some content, then click **"Test Your Knowledge"** to generate a personalized quiz.\n\nAfter each quiz, I will provide a detailed analysis and study tips to help you improve! 🚀'
                }
            });
        }

        const avgScore = Math.round(recentQuizzes.reduce((sum, q) => sum + q.percentage, 0) / recentQuizzes.length);
        const quizSummary = recentQuizzes.map(q =>
            `- ${q.contentId?.title || 'Unknown'} (${q.courseId?.name || 'Unknown'}): ${q.percentage}% (${q.score}/${q.config.totalQuestions})`
        ).join('\n');

        const doubtSummary = recentDoubts.map(d =>
            `- "${d.query}" (${d.courseId?.name || 'General'})`
        ).join('\n');

        const language = req.query.language || 'english';

        const prompt = `Analyze this student's learning journey:

Average Quiz Score: ${avgScore}%
Total Quizzes: ${recentQuizzes.length}
Total Doubts Asked: ${totalDoubts}

Recent Quiz Results:
${quizSummary}

Recent Doubts:
${doubtSummary || 'No doubts asked recently.'}

Provide:
1. ### 📊 Overall Performance Summary
2. ### 💪 Your Strengths
3. ### 📈 Areas for Improvement
4. ### 🎯 Personalized Study Plan (actionable steps)
5. ### 🔥 Motivation & Next Steps

CRITICAL INSTRUCTION: Respond in a friendly, encouraging tone using ${language === 'hindi' ? 'HINGLISH (Hindi written in English script)' : 'PURE PROFESSIONAL ENGLISH'} only. Use markdown with headers (###), bullet points, and bold text. Max 500 words.`;

        const completion = await aiService.askGroq(prompt, "COMPREHENSIVE_STUDY_ANALYSIS", null, null, null, language);

        res.json({
            success: true,
            data: {
                analysis: completion.explanation
            }
        });

    } catch (error) {
        console.error('AI analysis error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate analysis' });
    }
});

export default router;
