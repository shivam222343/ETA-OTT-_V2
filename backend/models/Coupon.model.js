import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiryDate: {
        type: Date,
        default: null
    },
    maxUses: {
        type: Number,
        default: 0 // 0 for unlimited
    },
    currentUses: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Helper to check if coupon is valid
couponSchema.methods.isValid = function() {
    if (!this.isActive) return false;
    if (this.expiryDate && new Date() > this.expiryDate) return false;
    if (this.maxUses > 0 && this.currentUses >= this.maxUses) return false;
    return true;
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
