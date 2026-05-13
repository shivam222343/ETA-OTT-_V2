import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model.js';
import Institution from './models/Institution.model.js';
import Course from './models/Course.model.js';

dotenv.config();

const checkPremium = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find course
        const course = await Course.findOne({ name: /gello/i });
        if (!course) {
            console.log('Course "gello" not found');
            process.exit(1);
        }
        console.log(`Found Course: ${course.name} (${course._id})`);

        // Find institution from course
        const institution = await Institution.findById(course.institutionId);
        if (!institution) {
            console.log('Institution for course not found');
            process.exit(1);
        }
        console.log(`Institution for this course: ${institution.name} (${institution._id})`);

        // Find all students
        const allStudents = await User.find({ role: 'student' });
        console.log(`\nTotal Students in Database: ${allStudents.length}`);

        console.log('\n--- Full Students Subscriptions Report ---');
        allStudents.forEach((s, i) => {
            console.log(`${i+1}. ${s.profile.name} (${s.email})`);
            if (s.subscriptions && s.subscriptions.length > 0) {
                s.subscriptions.forEach(sub => {
                    console.log(`   - Inst: ${sub.institutionId} | Plan: ${sub.plan}`);
                });
            } else {
                console.log(`   - No subscriptions`);
            }
        });

        const premiumStudents = allStudents.filter(s => 
            s.subscriptions?.some(sub => 
                sub.institutionId?.toString() === institution._id.toString() && 
                sub.plan === 'premium'
            )
        );

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkPremium();
