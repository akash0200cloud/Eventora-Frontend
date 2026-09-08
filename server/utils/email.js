const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS || ''
    }
});

transporter.verify(err => {
    if (err) console.error('❌ Email transporter error:', err.message);
    else console.log('✅ Email transporter ready');
});

const sendOTPEmail = async (userEmail, otp, type) => {
    const title = type === 'account_verification'
        ? 'Verify your Eventora Account'
        : type === 'payment_confirm'
        ? 'Eventora Payment Verification'
        : 'Eventora Booking Verification';
    const msg = type === 'account_verification'
        ? 'Use this OTP to verify your Eventora account.'
        : type === 'payment_confirm'
        ? 'Use this OTP to confirm your UPI payment for the event booking.'
        : 'Use this OTP to confirm your event booking.';

    const mailOptions = {
        from: `"Eventora" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: title,
        html: `
            <div style="font-family:Arial,sans-serif;text-align:center;padding:20px;">
                <h2>${title}</h2>
                <p>${msg}</p>
                <div style="margin:20px auto;padding:15px;font-size:28px;font-weight:bold;background:#f4f4f4;width:max-content;letter-spacing:8px;">${otp}</div>
                <p style="color:#999;font-size:12px;">Expires in 10 minutes.</p>
            </div>`
    };

    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            await transporter.sendMail(mailOptions);
            console.log(`✅ OTP sent to ${userEmail}`);
            return;
        } catch (error) {
            lastError = error;
            console.error(`❌ OTP attempt ${attempt} failed:`, error.message);
            if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
    console.error(`❌ All OTP attempts failed for ${userEmail}: ${lastError?.message}`);
    console.warn(`⚠️  DEV FALLBACK — OTP for ${userEmail} is: ${otp}`);
};

const sendBookingEmail = async (userEmail, userName, eventTitle, amount, paymentStatus, paymentDetails = {}) => {
    const isFree = amount === 0;
    const isPaid = paymentStatus === 'paid';
    const upiId = paymentDetails.upiId || process.env.UPI_ID || '9431585217-3@ybl';
    const upiName = paymentDetails.upiName || process.env.UPI_NAME || 'Eventora Payments';

    const paymentSection = isFree
        ? `<div style="background:#d1fae5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;color:#065f46;font-weight:bold;">✅ This is a FREE event — No payment required!</p>
           </div>`
        : isPaid
        ? `<div style="background:#d1fae5;border-left:4px solid #10b981;padding:16px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;color:#065f46;font-weight:bold;">✅ Payment of ₹${amount} received. You're all set!</p>
           </div>`
        : `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#78350f;"><strong>Amount Due:</strong> ₹${amount}</p>
            <p style="margin:0 0 8px;color:#78350f;"><strong>UPI ID:</strong> ${upiId}</p>
            <p style="margin:0;color:#78350f;"><strong>UPI Name:</strong> ${upiName}</p>
           </div>`;
    try {
        await transporter.sendMail({
            from: `"Eventora" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `🎉 Booking Confirmed: ${eventTitle}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
                    <div style="background:#111;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                        <h1 style="color:#fff;margin:0;">🎟️ Eventora</h1>
                    </div>
                    <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                        <h2 style="color:#111;">Hi ${userName}! 🎉</h2>
                        <p style="color:#555;">Your booking for <strong>${eventTitle}</strong> is confirmed.</p>
                        ${paymentSection}
                        <p style="color:#9ca3af;font-size:12px;text-align:center;">Thank you for choosing Eventora!</p>
                    </div>
                </div>`
        });
        console.log('✅ Booking email sent to', userEmail);
    } catch (error) {
        console.error('❌ Error sending booking email:', error.message);
    }
};

const sendPaymentInstructionsEmail = async (userEmail, userName, eventTitle, amount, paymentDetails = {}) => {
    const upiId = paymentDetails.upiId || process.env.UPI_ID || '9431585217-3@ybl';
    const upiName = paymentDetails.upiName || process.env.UPI_NAME || 'Eventora Payments';
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Eventora: ' + eventTitle)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;
    try {
        await transporter.sendMail({
            from: `"Eventora" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `💳 Complete Payment: ${eventTitle}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
                    <div style="background:#111;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                        <h1 style="color:#fff;margin:0;">🎟️ Eventora</h1>
                    </div>
                    <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                        <h2 style="color:#111;">Hi ${userName}! 💳</h2>
                        <p style="color:#555;">Your booking for <strong>${eventTitle}</strong> is approved. Please complete payment.</p>
                        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin:20px 0;">
                            <p style="margin:0 0 8px;color:#78350f;"><strong>Amount:</strong> ₹${amount}</p>
                            <p style="margin:0 0 8px;color:#78350f;"><strong>UPI ID:</strong> ${upiId}</p>
                            <p style="margin:0;color:#78350f;"><strong>Name:</strong> ${upiName}</p>
                        </div>
                        <div style="text-align:center;margin:20px 0;">
                            <img src="${qrCodeUrl}" alt="UPI QR" style="width:200px;height:200px;border-radius:12px;" />
                        </div>
                        <p style="text-align:center;"><a href="${upiLink}" style="color:#2563eb;">Open UPI App</a></p>
                    </div>
                </div>`
        });
        console.log('✅ Payment instructions sent to', userEmail);
    } catch (error) {
        console.error('❌ Error sending payment instructions:', error.message);
    }
};

const sendPaymentConfirmationEmail = async (userEmail, userName, eventTitle, amount, txnId) => {
    try {
        await transporter.sendMail({
            from: `"Eventora" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `✅ Payment Confirmed: ${eventTitle}`,
            html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
                    <div style="background:#111;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                        <h1 style="color:#fff;margin:0;">🎟️ Eventora</h1>
                    </div>
                    <div style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
                        </div>
                        <h2 style="color:#111;text-align:center;">Payment Successful!</h2>
                        <p style="color:#555;text-align:center;">Hi <strong>${userName}</strong>, your payment for <strong>${eventTitle}</strong> has been received.</p>
                        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
                            <table style="width:100%;font-size:14px;">
                                <tr><td style="color:#6b7280;padding:4px 0;">Event</td><td style="font-weight:bold;text-align:right;">${eventTitle}</td></tr>
                                <tr><td style="color:#6b7280;padding:4px 0;">Amount Paid</td><td style="font-weight:bold;color:#059669;text-align:right;">₹${amount}</td></tr>
                                <tr><td style="color:#6b7280;padding:4px 0;">Transaction ID</td><td style="font-family:monospace;font-size:12px;text-align:right;color:#374151;">${txnId}</td></tr>
                                <tr><td style="color:#6b7280;padding:4px 0;">Status</td><td style="font-weight:bold;color:#059669;text-align:right;">Confirmed ✅</td></tr>
                            </table>
                        </div>
                        <p style="color:#9ca3af;font-size:12px;text-align:center;">Thank you for booking with Eventora! See you at the event 🎉</p>
                    </div>
                </div>`
        });
        console.log('✅ Payment confirmation email sent to', userEmail);
    } catch (error) {
        console.error('❌ Error sending payment confirmation email:', error.message);
    }
};

module.exports = { sendBookingEmail, sendOTPEmail, sendPaymentInstructionsEmail, sendPaymentConfirmationEmail };
