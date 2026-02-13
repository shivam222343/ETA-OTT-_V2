import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        required: true,
        default: 'student'
    },
    profile: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        avatar: {
            type: String,
            default: null
        },
        bio: {
            type: String,
            default: ''
        },
        phone: {
            type: String,
            default: null
        }
    },
    institutionIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution'
    }],
    branchIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }],
    progressStats: {
        coursesEnrolled: {
            type: Number,
            default: 0
        },
        coursesCompleted: {
            type: Number,
            default: 0
        },
        contentViewed: {
            type: Number,
            default: 0
        },
        doubtsAsked: {
            type: Number,
            default: 0
        },
        doubtsResolved: {
            type: Number,
            default: 0
        }
    },
    confidenceScore: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ 'profile.name': 'text' });

const User = mongoose.model('User', userSchema);

export default User;
