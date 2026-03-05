import mongoose from 'mongoose';

const studentIntelligenceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    // AI Derived categorization
    persona: {
        learningStyle: {
            type: String,
            enum: ['Visual', 'Active', 'Theoretical', 'Pragmatic', 'Balanced'],
            default: 'Balanced'
        },
        learnerType: {
            type: String,
            enum: ['Quick Learner', 'Steady Progressor', 'Deep Diver', 'Surface Learner', 'Occasional'],
            default: 'Steady Progressor'
        },
        curiosityIndex: {
            type: Number, // 0-100 based on doubts asked
            default: 0
        },
        collaborationScore: {
            type: Number, // 0-100 based on peer helping
            default: 0
        }
    },
    // Performance aggregation
    metrics: {
        avgQuizScore: { type: Number, default: 0 },
        quizCompletionRate: { type: Number, default: 0 },
        doubtsToSolutionRatio: { type: Number, default: 0 },
        consistencyScore: { type: Number, default: 0 },
        timeInvestedHours: { type: Number, default: 0 }
    },
    // Deep AI analysis
    analysis: {
        strengths: [String],
        weaknesses: [String],
        recommendedTopics: [String],
        narrativeSummary: String,
        behavioralInsights: String
    },
    // Trends (history of scores/activity)
    trends: [{
        date: { type: Date, default: Date.now },
        score: Number,
        activityCount: Number
    }],
    lastAnalysisAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faculty filtering/sorting
studentIntelligenceSchema.index({ 'persona.learnerType': 1 });
studentIntelligenceSchema.index({ 'metrics.avgQuizScore': -1 });

// Trim trends array to prevent unbounded growth (keep last 365 days)
studentIntelligenceSchema.pre('save', function (next) {
    if (this.trends && this.trends.length > 365) {
        this.trends = this.trends.slice(-365);
    }
    next();
});

const StudentIntelligence = mongoose.model('StudentIntelligence', studentIntelligenceSchema);

export default StudentIntelligence;
