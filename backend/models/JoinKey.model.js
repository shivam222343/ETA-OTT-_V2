import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const joinKeySchema = new mongoose.Schema({
    key: {
        type: String,
        unique: true,
        index: true,
        default: () => nanoid(12).toUpperCase()
    },
    institutionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false
    },
    studentEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    studentName: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['individual', 'universal'],
        default: 'individual'
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster lookups
joinKeySchema.index({ institutionId: 1 });
joinKeySchema.index({ studentEmail: 1 });

const JoinKey = mongoose.model('JoinKey', joinKeySchema);

export default JoinKey;
