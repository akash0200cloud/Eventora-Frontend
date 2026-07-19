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

const sendBookingEmail = async (userEmail, userName, eventTitle, amount, paymentStatus, paymentDetails = {}) => {
    if (!isEmailConfigured()) {
        console.log(`[DEV] Booking confirmed email skipped for ${userEmail}`);
        return;
    }
    try {
        const isPaid = paymentStatus === 'paid';
        const isFree = amount === 0;
        const upiId = paymentDetails.upiId || process.env.UPI_ID || '9431585217-3@ybl';
        const upiName = paymentDetails.upiName || process.env.UPI_NAME || 'Eventora Payments';

        const paymentSection = isFree
            ? `<div style="background:#d1fae5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:20px 0;">
                <p style="margin:0;color:#065f46;font-weight:bold;">✅ This is a FREE event — No payment required!</p>
               </div>`
            : isPaid
            ? `<div style="background:#d1fae5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:20px 0;">
                <p style="margin:0;color:#065f46;font-weight:bold;">✅ Payment of ₹${amount} has been marked as received. You're all set!</p>
               </div>`
            : `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;">
                <h3 style="margin:0 0 10px;color:#92400e;">💳 Payment Instructions</h3>
                <p style="margin:0 0 8px;color:#78350f;">Amount Due: <strong>₹${amount}</strong></p>
                <p style="margin:0 0 8px;color:#78350f;">Please complete your payment via UPI / Bank Transfer to the organizer and share the transaction ID on your dashboard.</p>
                <p style="margin:0 0 8px;color:#78350f;"><strong>UPI ID:</strong> ${upiId}</p>
                <p style="margin:0 0 8px;color:#78350f;"><strong>UPI Name:</strong> ${upiName}</p>
                <p style="margin:0;color:#78350f;">Your seat is reserved. Complete payment to finalize your ticket.</p>
               </div>`;

        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `🎉 Booking Confirmed: ${eventTitle}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
                    <div style="background:#111;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:24px;">🎟️ Eventora</h1>
                    </div>
                    <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                        <h2 style="color:#111;margin:0 0 8px;">Hi ${userName}! 🎉</h2>
                        <p style="color:#555;margin:0 0 20px;">Congratulations! Your booking is now <strong style="color:#10b981;">confirmed</strong> and your seat is reserved.</p>
                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
                            <p style="margin:0 0 6px;color:#374151;"><strong>Event:</strong> ${eventTitle}</p>
                        </div>
                        ${paymentSection}
                        <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">Thank you for choosing Eventora. See you at the event!</p>
                    </div>
                </div>`
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
        const title = type === 'account_verification' ? 'Verify your Eventora Account' : type === 'payment_confirm' ? 'Eventora Payment Verification' : 'Eventora Booking Verification';
        const msg = type === 'account_verification'
            ? 'Use this OTP to verify your Eventora account.'
            : type === 'payment_confirm'
            ? 'Use this OTP to confirm your UPI payment for the event booking.'
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

const sendPaymentInstructionsEmail = async (userEmail, userName, eventTitle, amount, paymentDetails = {}) => {
    if (!isEmailConfigured()) {
        console.log(`[DEV] Payment instructions email skipped for ${userEmail}`);
        return;
    }
    try {
        const details = {
            upiId: paymentDetails.upiId || process.env.UPI_ID || '9431585217-3@ybl',
            upiName: paymentDetails.upiName || process.env.UPI_NAME || 'Eventora Payments'
        };
        const upiLink = `upi://pay?pa=${details.upiId}&pn=${encodeURIComponent(details.upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Eventora: ' + eventTitle)}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

        await getTransporter().sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: `💳 Pay to confirm your booking: ${eventTitle}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:20px;">
                    <div style="background:#111;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                        <h1 style="color:#fff;margin:0;font-size:24px;">🎟️ Eventora</h1>
                    </div>
                    <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                        <h2 style="color:#111;margin:0 0 8px;">Hi ${userName}! 💳</h2>
                        <p style="color:#555;margin:0 0 16px;">Your booking request has been approved. Please complete the payment below to confirm your seat.</p>
                        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;">
                            <p style="margin:0 0 8px;color:#78350f;"><strong>Amount Due:</strong> ₹${amount}</p>
                            <p style="margin:0 0 8px;color:#78350f;"><strong>UPI ID:</strong> ${details.upiId}</p>
                            <p style="margin:0;color:#78350f;"><strong>UPI Name:</strong> ${details.upiName}</p>
                        </div>
                        <div style="text-align:center;margin:20px 0;">
                            <img src="${qrCodeUrl}" alt="UPI QR Code" style="width:220px;height:220px;border:1px solid #e5e7eb;border-radius:12px;padding:8px;background:#fff;" />
                        </div>
                        <p style="color:#555;margin:0 0 10px;">You can also open your UPI app directly using the payment link.</p>
                        <p style="color:#555;margin:0;"><a href="${upiLink}" style="color:#2563eb;">Pay via UPI</a></p>
                    </div>
                </div>`
        });
        console.log('Payment instruction email sent to', userEmail);
    } catch (error) {
        console.error('Error sending payment instructions email:', error.message);
    }
};

module.exports = { sendBookingEmail, sendOTPEmail, sendPaymentInstructionsEmail };
