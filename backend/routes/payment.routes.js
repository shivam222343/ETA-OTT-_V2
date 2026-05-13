import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import User from '../models/User.model.js';
import Institution from '../models/Institution.model.js';
import Course from '../models/Course.model.js';
import Coupon from '../models/Coupon.model.js';

const router = express.Router();

// Initialize Razorpay
console.log('DEBUG: Initializing Razorpay with Key ID:', process.env.RAZORPAY_KEY_ID ? 'FOUND (starts with ' + process.env.RAZORPAY_KEY_ID.substring(0, 8) + ')' : 'MISSING');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

/**
 * Create a Razorpay Order
 */
router.post('/create-order', authenticate, attachUser, async (req, res) => {
    try {
        const { institutionId, courseId, amount, couponCode } = req.body;

        let targetInstitutionId = institutionId;

        if (courseId) {
            const course = await Course.findById(courseId);
            if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
            targetInstitutionId = course.institutionId;
        }

        if (!targetInstitutionId) {
            return res.status(400).json({ success: false, message: 'Institution or Course ID is required' });
        }

        const institution = await Institution.findById(targetInstitutionId);
        if (!institution) return res.status(404).json({ success: false, message: 'Institution not found' });

        let pricingAmount = institution.pricing?.amount || 4999;
        let pricingType = institution.pricing?.type || 'one-time';
        let targetType = 'institution';

        // Apply coupon if provided
        let appliedCoupon = null;
        if (couponCode) {
            const couponQuery = { 
                code: couponCode.toUpperCase(), 
                isActive: true 
            };
            if (courseId) couponQuery.courseId = courseId;
            else couponQuery.institutionId = institutionId;

            const coupon = await Coupon.findOne(couponQuery);

            if (coupon && coupon.isValid()) {
                appliedCoupon = coupon;
                if (coupon.discountType === 'percentage') {
                    pricingAmount = pricingAmount * (1 - coupon.discountValue / 100);
                } else if (coupon.discountType === 'fixed') {
                    pricingAmount = Math.max(0, pricingAmount - coupon.discountValue);
                }
            }
        }

        const options = {
            amount: Math.round(pricingAmount * 100), // Convert to paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
            notes: {
                u: req.dbUser?._id?.toString(),
                i: targetInstitutionId.toString(),
                c: courseId?.toString() || null,
                type: pricingType,
                targetType,
                coupon: appliedCoupon?.code || null
            }
        };

        console.log('DEBUG: Creating Razorpay order with options:', options);

        const order = await razorpay.orders.create(options);
        console.log('DEBUG: Razorpay order created:', order.id);

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID
            }
        });
    } catch (error) {
        console.error('Create order error details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create payment order',
            error: error.message 
        });
    }
});

/**
 * Verify Razorpay Payment Signature
 */
router.post('/verify-payment', authenticate, attachUser, async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            institutionId,
            courseId 
        } = req.body;

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
            .update(body.toString())
            .digest('hex');

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (!isSignatureValid) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // 2. Update User Subscription to Premium
        const user = await User.findById(req.dbUser._id);
        const order = await razorpay.orders.fetch(razorpay_order_id);
        const { i: instId, c: crsId, targetType, coupon: couponCode } = order.notes;

        const subQuery = { institutionId: instId };

        const subIndex = user.subscriptions.findIndex(sub => 
            sub.institutionId?.toString() === instId
        );

        if (subIndex > -1) {
            user.subscriptions[subIndex].plan = 'premium';
            user.subscriptions[subIndex].aiCredits = 99999;
        } else {
            user.subscriptions.push({
                ...subQuery,
                plan: 'premium',
                aiCredits: 99999
            });
        }

        await user.save();

        // 3. Increment Coupon Usage if applied
        if (couponCode) {
            const couponUpdateQuery = { code: couponCode };
            if (crsId) couponUpdateQuery.courseId = crsId;
            else couponUpdateQuery.institutionId = instId;
            
            await Coupon.findOneAndUpdate(
                couponUpdateQuery,
                { $inc: { currentUses: 1 } }
            );
        }

        res.json({
            success: true,
            message: 'Payment verified and account upgraded to PREMIUM!',
            data: { paymentId: razorpay_payment_id }
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
});

export default router;
