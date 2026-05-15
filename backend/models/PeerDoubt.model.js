import mongoose from 'mongoose';

const solutionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    creditsAwarded: {
        type: Number,
        default: 0,
        min: 0
    },
    feedback: String,
    attachments: [{
        url: String,
        publicId: String,
        type: { type: String, default: 'image' }
    }]
}, {
    timestamps: true
});

const peerDoubtSchema = new mongoose.Schema({
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
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    attachments: [{
        url: String,
        publicId: String,
        type: { type: String, default: 'image' }
    }],
    status: {
        type: String,
        enum: ['open', 'review', 'solved', 'removed'],
        default: 'open',
        index: true
    },
    isGolden: {
        type: Boolean,
        default: false,
        index: true
    },
    rewardPoints: {
        type: Number,
        default: 10,
        min: 0
    },
    solutions: [solutionSchema],
    acceptedSolutionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    facultyNotes: String
}, {
    timestamps: true
});

// Compound indexes for efficient branch/course filtering
peerDoubtSchema.index({ branchId: 1, courseId: 1, isGolden: 1 });
peerDoubtSchema.index({ status: 1, createdAt: -1 });

const PeerDoubt = mongoose.model('PeerDoubt', peerDoubtSchema);

export default PeerDoubt;
