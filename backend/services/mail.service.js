import nodemailer from 'nodemailer';

const createTransporter = () => {
    // Check if SMTP credentials are provided
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP credentials missing. Emails will be logged to console instead of sent.');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

export const sendStudentInvitation = async (studentEmail, studentName, institutionName, secretKey, branchName = null) => {
    const transporter = createTransporter();
    
    const subject = branchName 
        ? `Invitation to join ${branchName} at ${institutionName}`
        : `Invitation to join ${institutionName}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Eta Educational Platform" <noreply@etaott.com>',
        to: studentEmail,
        subject: subject,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Welcome to Eta!</h2>
                <p>Hello ${studentName || 'Student'},</p>
                <p>You have been invited to join <strong>${institutionName}</strong>${branchName ? ` (Branch: <strong>${branchName}</strong>)` : ''} on the Eta Educational Platform.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">YOUR SECRET ACCESS KEY</p>
                    <h1 style="margin: 10px 0; letter-spacing: 5px; color: #111827;">${secretKey}</h1>
                </div>
                
                <p>To join, please log in to your student dashboard and click on <strong>"Join Institute"</strong>.</p>
                <p style="color: #dc2626; font-size: 13px;"><em>* Note: This key is for your personal use only and will expire once used.</em></p>
                
                <hr style="border: 0; border-top: 1px solid #e1e1e1; margin: 30px 0;" />
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    If you did not expect this invitation, please ignore this email.
                </p>
            </div>
        `
    };

    if (transporter) {
        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('Error sending invitation email:', error);
            return false;
        }
    } else {
        console.log(`\n📧 [EMAIL SIMULATION]`);
        console.log(`To: ${studentEmail}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Key: ${secretKey}`);
        console.log(`-------------------------\n`);
        return true;
    }
};
