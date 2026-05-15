import express from 'express';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import Coupon from '../models/Coupon.model.js';
import Course from '../models/Course.model.js';

const router = express.Router();

/**
 * Validate a coupon code for a course
 */
router.post('/validate', authenticate, async (req, res) => {
    try {
        const { code, courseId } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }

        const query = { code: code.toUpperCase() };
        if (courseId) {
            query.courseId = courseId;
        }

        const coupon = await Coupon.findOne(query);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        }

        if (!coupon.isValid()) {
            return res.status(400).json({ success: false, message: 'Coupon is expired or inactive' });
        }

        res.json({
            success: true,
            data: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            }
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ success: false, message: 'Failed to validate coupon' });
    }
});

/**
 * List coupons for a course (Faculty only)
 */
router.get('/course/:id', authenticate, attachUser, async (req, res) => {
    try {
        const courseId = req.params.id;

        // Verify faculty access
        const course = await Course.findById(courseId);
        if (!course || !course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const coupons = await Coupon.find({ courseId }).sort({ createdAt: -1 });
        res.json({ success: true, data: { coupons } });
    } catch (error) {
        console.error('List coupons error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
    }
});

/**
 * Add a new coupon (Faculty only)
 */
router.post('/add', authenticate, attachUser, async (req, res) => {
    try {
        const { code, discountType, discountValue, courseId, expiryDate, maxUses } = req.body;

        if (!code || !discountValue || !courseId) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        // Verify faculty access
        const course = await Course.findById(courseId);
        if (!course || !course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Check if code already exists for this course
        const existing = await Coupon.findOne({ code: code.toUpperCase(), courseId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists for this course' });
        }

        const coupon = new Coupon({
            code,
            discountType,
            discountValue,
            courseId,
            expiryDate,
            maxUses,
            createdBy: req.dbUser._id
        });

        await coupon.save();
        res.status(201).json({ success: true, message: 'Coupon created successfully', data: { coupon } });
    } catch (error) {
        console.error('Add coupon error:', error);
        res.status(500).json({ success: false, message: 'Failed to create coupon' });
    }
});

/**
 * Update a coupon (Faculty only)
 */
router.patch('/:id', authenticate, attachUser, async (req, res) => {
    try {
        const couponId = req.params.id;
        const updates = req.body;

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Verify faculty access
        const course = await Course.findById(coupon.courseId);
        if (!course || !course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updates, { new: true });
        res.json({ success: true, message: 'Coupon updated successfully', data: { coupon: updatedCoupon } });
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ success: false, message: 'Failed to update coupon' });
    }
});

/**
 * Delete a coupon (Faculty only)
 */
router.delete('/:id', authenticate, attachUser, async (req, res) => {
    try {
        const couponId = req.params.id;

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Verify faculty access
        const course = await Course.findById(coupon.courseId);
        if (!course || !course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await Coupon.findByIdAndDelete(couponId);
        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete coupon' });
    }
});

export default router;
