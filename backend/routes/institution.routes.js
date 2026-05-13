import express from 'express';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import { requireFaculty, requireFacultyOrAdmin, requireAdmin } from '../middleware/role.middleware.js';
import Notification from '../models/Notification.model.js';
import { sendNotification } from '../services/websocket.service.js';
import Institution from '../models/Institution.model.js';
import User from '../models/User.model.js';
import JoinKey from '../models/JoinKey.model.js';
import { runNeo4jQuery } from '../config/neo4j.config.js';
import { sendStudentInvitation } from '../services/mail.service.js';
import multer from 'multer';
import * as xlsx from 'xlsx';
import fs from 'fs';
import Branch from '../models/Branch.model.js';

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Create institution (Faculty only)
router.post('/', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { name, description, logo, website, address } = req.body;

        // Create institution (approved by default - Temporarily removed admin verification)
        const institution = await Institution.create({
            name,
            createdBy: req.dbUser._id,
            facultyIds: [req.dbUser._id],
            metadata: {
                description,
                logo,
                website,
                address
            },
            isActive: true,
            status: 'approved'
        });

        // Link institution to user
        await User.findByIdAndUpdate(req.dbUser._id, {
            $addToSet: { institutionIds: institution._id }
        });

        // Create Neo4j node for the institution
        try {
            await runNeo4jQuery(
                `CREATE (i:Institution {
                    id: $id,
                    name: $name,
                    createdAt: datetime()
                })`,
                { id: institution._id.toString(), name: institution.name }
            );
        } catch (neo4jError) {
            console.error('Neo4j institution creation error:', neo4jError);
            // Non-blocking error, we still created the Mongo record
        }

        // Notify all admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            const notification = await Notification.create({
                recipientId: admin._id,
                type: 'institution_created',
                title: 'New Institution Created',
                message: `A new institution "${name}" has been created by ${req.dbUser.profile.name}.`,
                metadata: {
                    institutionId: institution._id,
                    facultyId: req.dbUser._id
                }
            });
            sendNotification(admin._id, notification);
        }

        res.status(201).json({
            success: true,
            message: 'Institution created successfully',
            data: { institution }
        });
    } catch (error) {
        console.error('Create institution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create institution',
            error: error.message
        });
    }
});

// Join institution via access key (Faculty only)
router.post('/join', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { accessKey } = req.body;

        // Find institution by access key
        const institution = await Institution.findOne({ facultyAccessKey: accessKey });
        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Invalid access key'
            });
        }

        // Check if already a member
        if (institution.facultyIds.includes(req.dbUser._id)) {
            return res.status(400).json({
                success: false,
                message: 'Already a member of this institution'
            });
        }

        // Add faculty to institution
        institution.facultyIds.push(req.dbUser._id);
        await institution.save();

        // Add institution to user's institutionIds
        await User.findByIdAndUpdate(req.dbUser._id, {
            $addToSet: { institutionIds: institution._id }
        });

        res.json({
            success: true,
            message: 'Successfully joined institution',
            data: { institution }
        });
    } catch (error) {
        console.error('Join institution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join institution',
            error: error.message
        });
    }
});

// Leave institution (Faculty only)
router.post('/:id/leave', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Institution not found'
            });
        }

        // Check if user is the creator
        if (institution.createdBy.toString() === req.dbUser._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Creators cannot leave their own institution. You must delete it instead.'
            });
        }

        // Remove faculty from institution
        await Institution.findByIdAndUpdate(req.params.id, {
            $pull: { facultyIds: req.dbUser._id }
        });

        // Remove institution from user's institutionIds
        await User.findByIdAndUpdate(req.dbUser._id, {
            $pull: { institutionIds: institution._id }
        });

        res.json({
            success: true,
            message: 'Successfully left institution'
        });
    } catch (error) {
        console.error('Leave institution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave institution',
            error: error.message
        });
    }
});

// Get pending institutions (Admin only)
router.get('/admin/pending', authenticate, attachUser, requireAdmin, async (req, res) => {
    try {
        const institutions = await Institution.find({ status: 'pending' })
            .populate('createdBy', 'profile.name email');

        res.json({
            success: true,
            data: { institutions }
        });
    } catch (error) {
        console.error('Get pending institutions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending institutions',
            error: error.message
        });
    }
});

// Get institution by ID
router.get('/:id', authenticate, attachUser, async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id)
            .populate('createdBy', 'profile.name email')
            .populate('facultyIds', 'profile.name email');

        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Institution not found'
            });
        }

        res.json({
            success: true,
            data: { institution }
        });
    } catch (error) {
        console.error('Get institution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get institution',
            error: error.message
        });
    }
});

// Update institution
router.put('/:id', authenticate, attachUser, requireFacultyOrAdmin, async (req, res) => {
    try {
        const { name, description, logo, website, address } = req.body;

        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Institution not found'
            });
        }

        // Check if user is creator or admin
        if (institution.createdBy.toString() !== req.dbUser._id.toString() && req.dbUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only the creator or admin can update this institution'
            });
        }

        // Update institution
        if (name) institution.name = name;
        if (description !== undefined) institution.metadata.description = description;
        if (logo !== undefined) institution.metadata.logo = logo;
        if (website !== undefined) institution.metadata.website = website;
        if (address !== undefined) institution.metadata.address = address;

        await institution.save();

        // Update Neo4j
        await runNeo4jQuery(
            `MATCH (i:Institution {id: $id})
       SET i.name = $name`,
            { id: institution._id.toString(), name: institution.name }
        );

        res.json({
            success: true,
            message: 'Institution updated successfully',
            data: { institution }
        });
    } catch (error) {
        console.error('Update institution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update institution',
            error: error.message
        });
    }
});

// Get user's institutions
router.get('/user/my-institutions', authenticate, attachUser, async (req, res) => {
    try {
        const institutions = await Institution.find({
            _id: { $in: req.dbUser.institutionIds }
        })
            .populate('createdBy', 'profile.name email')
            .populate('facultyIds', 'profile.name email');

        res.json({
            success: true,
            data: { institutions }
        });
    } catch (error) {
        console.error('Get my institutions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get institutions',
            error: error.message
        });
    }
});

// Delete institution
router.delete('/:id', authenticate, attachUser, requireFacultyOrAdmin, async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Institution not found'
            });
        }

        // Check if user is creator or admin
        if (institution.createdBy.toString() !== req.dbUser._id.toString() && req.dbUser.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only the creator or admin can delete this institution'
            });
        }

        // Delete from Neo4j
        await runNeo4jQuery(
            `MATCH (i:Institution {id: $id}) DETACH DELETE i`,
            { id: institution._id.toString() }
        );

        // Remove institution from all users
        await User.updateMany(
            { institutionIds: institution._id },
            { $pull: { institutionIds: institution._id } }
        );

        // Delete institution
        await Institution.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Institution deleted successfully'
        });
    } catch (error) {
        console.error('Delete institution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete institution',
            error: error.message
        });
    }
});

// Approve/Reject institution (Admin only)
router.patch('/:id/moderate', authenticate, attachUser, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const institution = await Institution.findById(req.params.id);
        if (!institution) {
            return res.status(404).json({ success: false, message: 'Institution not found' });
        }

        institution.status = status;
        institution.isActive = status === 'approved';
        await institution.save();

        if (status === 'approved') {
            // Add institution to creator's institutionIds and create Neo4j node
            await User.findByIdAndUpdate(institution.createdBy, {
                $addToSet: { institutionIds: institution._id }
            });

            await runNeo4jQuery(
                `CREATE (i:Institution {
                    id: $id,
                    name: $name,
                    createdAt: datetime()
                })`,
                { id: institution._id.toString(), name: institution.name }
            );
        }

        // Notify faculty
        const notification = await Notification.create({
            recipientId: institution.createdBy,
            type: status === 'approved' ? 'institution_approved' : 'institution_rejected',
            title: status === 'approved' ? 'Institution Approved' : 'Institution Rejected',
            message: status === 'approved'
                ? `Your institution "${institution.name}" has been approved!`
                : `Your institution "${institution.name}" was rejected.`,
            metadata: {
                institutionId: institution._id
            }
        });
        sendNotification(institution.createdBy, notification);

        res.json({
            success: true,
            message: `Institution ${status} successfully`,
            data: { institution }
        });
    } catch (error) {
        console.error('Moderate institution error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to moderate institution',
            error: error.message
        });
    }
});

// Invite students via Excel (Faculty only)
router.post('/:id/invite-students', authenticate, attachUser, requireFaculty, upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const institution = await Institution.findById(id);
        
        if (!institution) {
            return res.status(404).json({ success: false, message: 'Institution not found' });
        }

        // Verify faculty member
        const isFaculty = institution.facultyIds.some(fid => fid.equals(req.dbUser._id));
        if (!isFaculty) {
            return res.status(403).json({ success: false, message: 'Access denied: You are not a faculty of this institution' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File missing: Please upload an Excel or CSV file' });
        }

        // Parse Excel
        let data;
        try {
            const fileBuffer = fs.readFileSync(req.file.path);
            const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            data = xlsx.utils.sheet_to_json(sheet);
        } catch (parseError) {
            console.error('Excel parsing error:', parseError);
            return res.status(400).json({ 
                success: false, 
                message: 'Failed to parse Excel file', 
                error: parseError.message 
            });
        }

        const invitations = [];
        for (const row of data) {
            const email = row.Email || row.email || row['Student Email'];
            const name = row.Name || row.name || row['Student Name'];

            if (email) {
                const joinKey = await JoinKey.create({
                    institutionId: id,
                    studentEmail: email,
                    studentName: name,
                    type: 'individual'
                });

                try {
                    await sendStudentInvitation(email, name, institution.name, joinKey.key);
                } catch (emailError) {
                    console.error('Individual email sending failed:', emailError);
                }
                
                invitations.push({ email, name, key: joinKey.key });
            }
        }

        res.json({
            success: true,
            message: `Processed ${invitations.length} invitations`,
            data: { 
                invitationCount: invitations.length,
                invitations 
            }
        });

        // Clean up uploaded file
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        }
    } catch (error) {
        console.error('Invite students detailed error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process invitations', 
            error: error.message
        });
    }
});

// Get or regenerate universal key (Faculty only)
router.get('/:id/universal-key', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const institution = await Institution.findById(req.params.id);
        if (!institution) return res.status(404).json({ success: false, message: 'Institution not found' });

        if (!institution.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            data: {
                universalJoinKey: institution.universalJoinKey,
                universalKeyEnabled: institution.universalKeyEnabled
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle universal key
router.patch('/:id/universal-key/toggle', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { enabled } = req.body;
        const institution = await Institution.findByIdAndUpdate(req.params.id, {
            universalKeyEnabled: enabled
        }, { new: true });
        
        res.json({ success: true, data: { enabled: institution.universalKeyEnabled } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all student invitations for an institution (Faculty only)
router.get('/:id/invitations', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { id } = req.params;
        const institution = await Institution.findById(id);
        
        if (!institution) {
            return res.status(404).json({ success: false, message: 'Institution not found' });
        }

        // Verify faculty member
        const isFaculty = institution.facultyIds.some(fid => fid.equals(req.dbUser._id));
        if (!isFaculty) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const invitations = await JoinKey.find({ 
            institutionId: id,
            type: 'individual'
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { invitations }
        });
    } catch (error) {
        console.error('Fetch invitations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Join institution with secret key (Student)
router.post('/join-with-key', authenticate, attachUser, async (req, res) => {
    try {
        const { secretKey } = req.body;

        if (!secretKey) return res.status(400).json({ success: false, message: 'Secret key is required' });

        // 1. Find the Key (could be Institution or Branch key)
        let joinKey = await JoinKey.findOne({ key: secretKey.trim().toUpperCase(), isUsed: false });
        let institution;
        let branch;

        if (joinKey) {
            if (joinKey.branchId) {
                branch = await Branch.findById(joinKey.branchId);
                if (!branch) return res.status(404).json({ success: false, message: 'This branch no longer exists' });
                institution = await Institution.findById(branch.institutionId);
            } else {
                institution = await Institution.findById(joinKey.institutionId);
                if (!institution) return res.status(404).json({ success: false, message: 'This institution no longer exists' });
            }
        } else {
            // Check for Universal Institution Key
            institution = await Institution.findOne({ 
                universalJoinKey: secretKey.trim().toUpperCase(),
                universalKeyEnabled: true 
            });

            if (!institution) {
                // Check for Universal Branch Key
                branch = await Branch.findOne({
                    accessKey: secretKey.trim().toUpperCase(),
                    universalKeyEnabled: true
                });
                
                if (branch) {
                    institution = await Institution.findById(branch.institutionId);
                } else {
                    return res.status(400).json({ success: false, message: 'Invalid or expired secret key' });
                }
            }
        }

        // 2. Process Enrollment
        if (branch) {
            // Check if already a member of branch
            if (req.dbUser.branchIds.some(id => id.toString() === branch._id.toString())) {
                return res.status(400).json({ success: false, message: `You are already enrolled in ${branch.name}` });
            }

            const user = await User.findById(req.dbUser._id);
            if (!user.branchIds.includes(branch._id)) user.branchIds.push(branch._id);
            if (!user.institutionIds.includes(institution._id)) user.institutionIds.push(institution._id);

            let existingSub = user.subscriptions.find(s => 
                s.institutionId?.toString() === institution._id.toString()
            );

            if (existingSub) {
                if (joinKey && existingSub.plan === 'free') {
                    existingSub.plan = 'premium';
                    existingSub.aiCredits = 99999;
                }
                existingSub.branchId = branch._id; 
            } else {
                user.subscriptions.push({
                    institutionId: institution._id,
                    branchId: branch._id,
                    plan: joinKey ? 'premium' : 'free',
                    aiCredits: joinKey ? 99999 : 5,
                    enrolledAt: new Date(),
                    isActive: true
                });
            }

            user.markModified('subscriptions');
            await user.save();

            await Branch.findByIdAndUpdate(branch._id, {
                $addToSet: { enrolledStudents: req.dbUser._id },
                $inc: { 'stats.totalStudents': 1 }
            });
            
            if (!req.dbUser.institutionIds.some(id => id.toString() === institution._id.toString())) {
                await Institution.findByIdAndUpdate(institution._id, {
                    $inc: { 'stats.totalStudents': 1 }
                });
            }

            if (joinKey) {
                joinKey.isUsed = true;
                joinKey.usedBy = req.dbUser._id;
                await joinKey.save();
            }

            return res.json({
                success: true,
                message: `Welcome to ${branch.name} at ${institution.name}!`,
                data: { institution, branch }
            });
        }

        // 3. Process Institution Join
        const isAlreadyMember = req.dbUser.institutionIds.some(id => id.toString() === institution._id.toString());
        if (isAlreadyMember) {
            return res.status(400).json({ 
                success: false, 
                message: `You are already a member of ${institution.name}` 
            });
        }

        if (joinKey) {
            joinKey.isUsed = true;
            joinKey.usedBy = req.dbUser._id;
            await joinKey.save();
        }

        await User.findByIdAndUpdate(req.dbUser._id, {
            $addToSet: { 
                institutionIds: institution._id,
                subscriptions: {
                    institutionId: institution._id,
                    branchId: null,
                    plan: joinKey ? 'premium' : 'free',
                    aiCredits: joinKey ? 99999 : 5,
                    enrolledAt: new Date()
                }
            }
        });

        await Institution.findByIdAndUpdate(institution._id, {
            $inc: { 'stats.totalStudents': 1 }
        });

        res.json({
            success: true,
            message: `Welcome to ${institution.name}! You have successfully joined.`,
            data: { 
                institution: {
                    _id: institution._id,
                    name: institution.name,
                    metadata: institution.metadata
                } 
            }
        });
    } catch (error) {
        console.error('Join with key error:', error);
        res.status(500).json({ success: false, message: 'Internal server error during join', error: error.message });
    }
});

// Toggle member subscription plan (Faculty only)
router.patch('/:id/members/:userId/plan', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { plan } = req.body;
        const { id, userId } = req.params;

        if (!['free', 'premium'].includes(plan)) {
            return res.status(400).json({ success: false, message: 'Invalid plan' });
        }

        const institution = await Institution.findById(id);
        if (!institution) return res.status(404).json({ success: false, message: 'Institution not found' });

        const isFaculty = institution.facultyIds.some(fid => fid.equals(req.dbUser._id));
        if (!isFaculty) return res.status(403).json({ success: false, message: 'Access denied' });

        const student = await User.findById(userId);
        if (!student) return res.status(404).json({ success: false, message: 'User not found' });

        let subFound = false;
        for (let i = 0; i < student.subscriptions.length; i++) {
            const sub = student.subscriptions[i];
            if (sub.institutionId?.toString() === id) {
                sub.plan = plan;
                if (plan === 'premium') sub.aiCredits = 99999;
                else sub.aiCredits = 5;
                subFound = true;
                break;
            }
        }

        if (!subFound) {
            student.subscriptions.push({
                institutionId: id,
                plan: plan,
                aiCredits: plan === 'premium' ? 99999 : 5,
                enrolledAt: new Date(),
                isActive: true
            });
        }

        student.markModified('subscriptions');
        await student.save();

        try {
            const Notification = (await import('../models/Notification.model.js')).default;
            const notification = await Notification.create({
                recipientId: userId,
                type: 'plan_updated',
                title: 'Subscription Updated',
                message: `Your membership for "${institution.name}" has been upgraded to ${plan.toUpperCase()}!`,
                metadata: {
                    institutionId: id,
                    plan: plan
                }
            });
            sendNotification(userId, notification);
        } catch (notifError) {
            console.error('Failed to send plan update notification:', notifError);
        }

        res.json({
            success: true,
            message: `User plan updated to ${plan} successfully`,
            data: { plan }
        });
    } catch (error) {
        console.error('Update member plan error:', error);
        res.status(500).json({ success: false, message: 'Failed to update plan', error: error.message });
    }
});

// Update institution pricing (Faculty only)
router.patch('/:id/pricing', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { type, amount } = req.body;
        const { id } = req.params;

        if (type && !['one-time', 'monthly'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid pricing type' });
        }

        const institution = await Institution.findById(id);
        if (!institution) return res.status(404).json({ success: false, message: 'Institution not found' });

        const isFaculty = institution.facultyIds.some(fid => fid.equals(req.dbUser._id));
        if (!isFaculty) return res.status(403).json({ success: false, message: 'Access denied' });

        if (type) institution.pricing.type = type;
        if (amount !== undefined) institution.pricing.amount = amount;

        await institution.save();

        res.json({
            success: true,
            message: 'Pricing updated successfully',
            data: { pricing: institution.pricing }
        });
    } catch (error) {
        console.error('Update pricing error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
