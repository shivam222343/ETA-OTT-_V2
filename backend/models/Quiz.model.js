import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                return v && v.length >= 2;
            },
            message: "At least 2 options are required"
        }
    },
    correctAnswer: {
        type: Number,
        required: true,
        validate: {
            validator: function (v) {
                return v >= 0 && v < (this.options?.length || 4);
            },
            message: "Correct answer must be a valid option index"
        }
    },
    explanation: {
        type: String,
        default: ''
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    topic: {
        type: String,
        default: ''
    },
    // Student's response
    studentAnswer: {
        type: Number,
        validate: {
            validator: function (v) {
                if (v === null || v === undefined) return true;
                return v >= 0 && v < (this.options?.length || 4);
            },
            message: "Student answer must be a valid option index"
        }
    },
    isCorrect: {
        type: Boolean,
        default: null
    }
}, { _id: false });

const quizSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true,
        index: true
    },

    // Snapshot of student's progress when quiz was generated
    contentProgress: {
        type: {
            type: String,
            enum: ['pdf', 'video', 'web', 'document', 'other'],
            default: 'pdf'
        },
        currentPage: { type: Number, default: null },
        totalPages: { type: Number, default: null },
        currentTimestamp: { type: Number, default: null }, // seconds
        totalDuration: { type: Number, default: null }     // seconds
    },

    // Quiz configuration
    config: {
        totalQuestions: {
            type: Number,
            required: true,
            min: 10,
            max: 30
        },
        timeLimit: {
            type: Number, // total seconds
            required: true
        },
        difficulty: {
            type: String,
            enum: ['auto', 'easy', 'medium', 'hard'],
            default: 'auto'
        }
    },

    // Questions array
    questions: [questionSchema],

    // Results
    score: {
        type: Number,
        default: 0
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    timeTaken: {
        type: Number, // seconds
        default: 0
    },

    // Lifecycle
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'expired'],
        default: 'pending',
        index: true
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },

    // AI-generated post-quiz analysis
    aiAnalysis: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes for performance
quizSchema.index({ studentId: 1, courseId: 1, createdAt: -1 });
quizSchema.index({ studentId: 1, contentId: 1 });
quizSchema.index({ studentId: 1, status: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
