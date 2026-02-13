import express from 'express';
import { authenticate, attachUser } from '../middleware/auth.middleware.js';
import { requireFaculty } from '../middleware/role.middleware.js';
import Course from '../models/Course.model.js';
import Branch from '../models/Branch.model.js';
import Institution from '../models/Institution.model.js';
import { runNeo4jQuery } from '../config/neo4j.config.js';

const router = express.Router();

// Get courses for current user (Faculty: owned, Student: joined branches)
router.get('/user/my-courses', authenticate, attachUser, async (req, res) => {
    try {
        let query = { isActive: true };

        if (req.dbUser.role === 'faculty') {
            query.facultyIds = req.dbUser._id;
        } else if (req.dbUser.role === 'student') {
            // Courses belonging to branches the student has joined
            query.branchIds = { $in: req.dbUser.branchIds || [] };
        } else if (req.dbUser.role === 'admin') {
            // Admins can see everything
        }

        const courses = await Course.find(query)
            .populate('branchIds', 'name')
            .populate('institutionId', 'name icon')
            .populate('facultyIds', 'profile.name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { courses }
        });
    } catch (error) {
        console.error('Get my courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get courses',
            error: error.message
        });
    }
});

// Create course (Faculty only)
router.post('/', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { branchIds, institutionId, name, description, code, metadata, accessRules } = req.body;

        // Validate input
        if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one branch must be selected'
            });
        }

        if (!institutionId) {
            return res.status(400).json({
                success: false,
                message: 'Institution ID is required'
            });
        }

        // Verify institution exists and user is faculty
        const institution = await Institution.findById(institutionId);
        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Institution not found'
            });
        }

        if (!institution.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to create courses in this institution'
            });
        }

        // Verify all branches exist and belong to the institution
        const branches = await Branch.find({
            _id: { $in: branchIds },
            institutionId: institutionId
        });

        if (branches.length !== branchIds.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more branches not found or do not belong to this institution'
            });
        }

        // Create course
        const course = await Course.create({
            branchIds,
            institutionId,
            name,
            description,
            code,
            metadata: metadata || {},
            facultyIds: [req.dbUser._id],
            accessRules: accessRules || {}
        });

        // Update branch stats for all branches
        await Branch.updateMany(
            { _id: { $in: branchIds } },
            { $inc: { 'stats.totalCourses': 1 } }
        );

        // Update institution stats
        await Institution.findByIdAndUpdate(institutionId, {
            $inc: { 'stats.totalCourses': 1 }
        });

        // Create course node in Neo4j and link to all branches
        for (const branchId of branchIds) {
            await runNeo4jQuery(
                `MATCH (b:Branch {id: $branchId})
           MERGE (c:Course {id: $courseId})
           ON CREATE SET c.name = $name, c.code = $code, c.createdAt = datetime()
           MERGE (b)-[:HAS]->(c)`,
                {
                    branchId: branchId.toString(),
                    courseId: course._id.toString(),
                    name: course.name,
                    code: course.code || ''
                }
            );
        }

        // Populate and return
        const populatedCourse = await Course.findById(course._id)
            .populate('branchIds', 'name')
            .populate('institutionId', 'name')
            .populate('facultyIds', 'profile.name email');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: { course: populatedCourse }
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message
        });
    }
});

// Get course by ID
router.get('/:id', authenticate, attachUser, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('branchIds', 'name institutionId')
            .populate('facultyIds', 'profile.name email')
            .populate('contentIds');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: { course }
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get course',
            error: error.message
        });
    }
});

// Update course
router.put('/:id', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const { name, description, code, branchIds, metadata, accessRules } = req.body;

        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Verify user is faculty of the course
        if (!course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this course'
            });
        }

        // Update basic fields
        if (name) course.name = name;
        if (description !== undefined) course.description = description;
        if (code !== undefined) course.code = code;
        if (accessRules) course.accessRules = { ...course.accessRules, ...accessRules };

        // Update metadata
        if (metadata) {
            course.metadata = { ...course.metadata, ...metadata };
        }

        // Update branchIds if provided
        if (branchIds && Array.isArray(branchIds)) {
            const oldBranchIds = course.branchIds.map(id => id.toString());
            const newBranchIds = branchIds.map(id => id.toString());

            // Find added and removed branches
            const addedBranches = newBranchIds.filter(id => !oldBranchIds.includes(id));
            const removedBranches = oldBranchIds.filter(id => !newBranchIds.includes(id));

            // Update Neo4j relationships
            for (const branchId of addedBranches) {
                await runNeo4jQuery(
                    `MATCH (b:Branch {id: $branchId})
                     MERGE (c:Course {id: $courseId})
                     ON CREATE SET c.name = $name, c.code = $code
                     MERGE (b)-[:HAS]->(c)`,
                    {
                        branchId: branchId,
                        courseId: course._id.toString(),
                        name: course.name,
                        code: course.code || ''
                    }
                );
            }

            for (const branchId of removedBranches) {
                await runNeo4jQuery(
                    `MATCH (b:Branch {id: $branchId})-[r:HAS]->(c:Course {id: $courseId})
                     DELETE r`,
                    {
                        branchId: branchId,
                        courseId: course._id.toString()
                    }
                );
            }

            course.branchIds = branchIds;
        }

        await course.save();

        // Update Neo4j course properties
        await runNeo4jQuery(
            `MATCH (c:Course {id: $id})
       SET c.name = $name, c.code = $code`,
            {
                id: course._id.toString(),
                name: course.name,
                code: course.code || ''
            }
        );

        // Populate and return
        const populatedCourse = await Course.findById(course._id)
            .populate('branchIds', 'name')
            .populate('institutionId', 'name')
            .populate('facultyIds', 'profile.name email');

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: { course: populatedCourse }
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error.message
        });
    }
});

// Delete course
router.delete('/:id', authenticate, attachUser, requireFaculty, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Verify user is faculty of the course
        if (!course.facultyIds.includes(req.dbUser._id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this course'
            });
        }

        // Soft delete
        course.isActive = false;
        await course.save();

        // Update branch stats
        await Branch.updateMany(
            { _id: { $in: course.branchIds } },
            { $inc: { 'stats.totalCourses': -1 } }
        );

        // Delete from Neo4j
        await runNeo4jQuery(
            `MATCH (c:Course {id: $id}) DETACH DELETE c`,
            { id: course._id.toString() }
        );

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error.message
        });
    }
});

// Get all courses for a branch
router.get('/branch/:branchId', authenticate, attachUser, async (req, res) => {
    try {
        const courses = await Course.find({
            branchIds: req.params.branchId,
            isActive: true
        })
            .populate('branchIds', 'name')
            .populate('institutionId', 'name')
            .populate('facultyIds', 'profile.name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { courses }
        });
    } catch (error) {
        console.error('Get branch courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get courses',
            error: error.message
        });
    }
});

// Get all courses for an institution
router.get('/institution/:institutionId', authenticate, attachUser, async (req, res) => {
    try {
        const courses = await Course.find({
            institutionId: req.params.institutionId,
            isActive: true
        })
            .populate('branchIds', 'name')
            .populate('institutionId', 'name')
            .populate('facultyIds', 'profile.name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: { courses }
        });
    } catch (error) {
        console.error('Get institution courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get courses',
            error: error.message
        });
    }
});

export default router;
