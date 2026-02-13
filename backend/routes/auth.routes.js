import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { verifyFirebaseToken } from '../config/firebase.config.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { firebaseUid, email, role, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ firebaseUid }, { email }] });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create new user
        const user = await User.create({
            firebaseUid,
            email,
            role: role || 'student',
            profile: { name }
        });

        // Generate JWT
        const token = jwt.sign(
            { firebaseUid: user.firebaseUid, userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    profile: user.profile
                },
                token
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Signup failed',
            error: error.message
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { firebaseToken } = req.body;

        // Verify Firebase token
        const decodedToken = await verifyFirebaseToken(firebaseToken);

        // Find user
        const user = await User.findOne({ firebaseUid: decodedToken.uid });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please sign up first.'
            });
        }

        // Generate JWT
        const token = jwt.sign(
            { firebaseUid: user.firebaseUid, userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    institutionIds: user.institutionIds,
                    branchIds: user.branchIds
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error full details:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
            details: error.code || 'Internal Server Error'
        });
    }
});

// Verify token
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});

// Get profile (requires authentication)
router.get('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-__v');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

export default router;
