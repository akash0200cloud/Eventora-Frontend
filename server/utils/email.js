const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const isEmailConfigured = () =>
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your_gmail@gmail.com' &&
    process.env.EMAIL_PASS !== 'your_gmail_app_password';

const getTransporter = () => nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls: { rejectUnauthorized: false }
});

const sendBookingEmail = async (userEmail, userName, eventTitle) => {
    if (!isEmailConfigured()) {
        console.log(`[DEV] Booking confirmed email skipped for ${userEmail}`);
        return;
    }
    try {
        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed: ${eventTitle}`,
            html: `<h2>Hi ${userName}!</h2><p>Your booking for <strong>${eventTitle}</strong> is confirmed.</p><p>Thank you for choosing Eventora.</p>`
        });
        console.log('Booking email sent to', userEmail);
    } catch (error) {
        console.error('Error sending booking email:', error.message);
    }
};

const sendOTPEmail = async (userEmail, otp, type) => {
    if (!isEmailConfigured()) {
        console.log(`[DEV MODE] OTP for ${userEmail}: ${otp}`);
        return;
    }
    try {
        const title = type === 'account_verification' ? 'Verify your Eventora Account' : 'Eventora Booking Verification';
        const msg = type === 'account_verification'
            ? 'Use this OTP to verify your Eventora account.'
            : 'Use this OTP to confirm your event booking.';

        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: title,
            html: `
                <div style="font-family:Arial,sans-serif;text-align:center;padding:20px;">
                    <h2>${title}</h2>
                    <p>${msg}</p>
                    <div style="margin:20px auto;padding:15px;font-size:28px;font-weight:bold;background:#f4f4f4;width:max-content;letter-spacing:8px;">${otp}</div>
                    <p style="color:#999;font-size:12px;">Expires in 5 minutes.</p>
                </div>`
        });
        console.log(`OTP sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending OTP email:', error.message);
    }
};

module.exports = { sendBookingEmail, sendOTPEmail };
