import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function sendEmail(to, subject, text) {
    // Create a transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.forpsi.com',
        port: 465,
        secure: true,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    // Email options
    const mailOptions = { from: 'david@henger.studio', to, subject, text };

    // Send email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}:  ${info.response}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}