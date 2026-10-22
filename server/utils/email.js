const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
});

const sendMail = async (options) => {
    try {
        const info = await transporter.sendMail(options);
        console.log('✅ Email sent to:', options.to, '| ID:', info.messageId);
        return true;
    } catch (err) {
        console.error('❌ Email send error:', err.message);
        return false;
    }
};

const wrap = (content) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:#111;padding:24px 32px;text-align:center;">
<span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">🎟️ Eventora</span>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Eventora Platform · All rights reserved</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const sendOTPEmail = async (email, name, otp, purpose = 'account_verification') => {
    const isBooking = purpose === 'booking_verification';
    const isReset = purpose === 'password_reset';
    const subject = isBooking ? 'Booking OTP – Eventora' : isReset ? 'Password Reset OTP – Eventora' : 'Verify Your Account – Eventora';
    const purposeText = isBooking ? 'confirm your event booking' : isReset ? 'reset your password' : 'verify your account';

    return sendMail({
        from: `"Eventora" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: wrap(`
            <h2 style="color:#111;margin-top:0;">Hi ${name || 'there'} 👋</h2>
            <p style="color:#555;">Use the OTP below to <strong>${purposeText}</strong>. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align:center;margin:28px 0;">
                <span style="display:inline-block;background:#111;color:#fff;font-size:36px;font-weight:900;letter-spacing:12px;padding:18px 32px;border-radius:12px;">${otp}</span>
            </div>
            <p style="color:#9ca3af;font-size:13px;text-align:center;">Do not share this OTP with anyone.</p>
        `),
    });
};

const sendBookingConfirmationEmail = async (email, name, eventTitle, amount, bookingId) => {
    return sendMail({
        from: `"Eventora" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Booking Confirmed: ${eventTitle}`,
        html: wrap(`
            <h2 style="color:#111;margin-top:0;">Booking Confirmed! 🎉</h2>
            <p style="color:#555;">Hi <strong>${name}</strong>, your booking for <strong>${eventTitle}</strong> has been confirmed.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:20px 0;">
                <p style="margin:0 0 6px;color:#166534;font-size:13px;font-weight:bold;">BOOKING DETAILS</p>
                <p style="margin:0;color:#15803d;">Amount: <strong>${amount === 0 ? 'Free' : '₹' + amount}</strong></p>
                <p style="margin:4px 0 0;color:#15803d;font-size:12px;">Booking ID: ${bookingId}</p>
            </div>
            <p style="color:#555;">Please carry a valid ID to the event. See you there!</p>
        `),
    });
};

// Alias — bookings.js calls sendBookingEmail(email, name, title, date, location, amount, paymentStatus)
// We only use email, name, title, amount — extra args are ignored
const sendBookingEmail = (email, name, eventTitle, _date, _location, amount, _payStatus) =>
    sendBookingConfirmationEmail(email, name, eventTitle, amount, '');

const sendPaymentConfirmationEmail = async (email, name, eventTitle, amount, txnId) => {
    return sendMail({
        from: `"Eventora" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Payment Confirmed: ${eventTitle}`,
        html: wrap(`
            <h2 style="color:#111;margin-top:0;">Payment Successful! ✅</h2>
            <p style="color:#555;">Hi <strong>${name}</strong>, your payment for <strong>${eventTitle}</strong> has been received.</p>
            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:20px 0;">
                <p style="margin:0 0 6px;color:#1e40af;font-size:13px;font-weight:bold;">PAYMENT DETAILS</p>
                <p style="margin:0;color:#1d4ed8;">Amount Paid: <strong>₹${amount}</strong></p>
                <p style="margin:4px 0 0;color:#1d4ed8;font-size:12px;">Transaction ID: ${txnId}</p>
            </div>
            <p style="color:#555;">Your seat is confirmed. Enjoy the event!</p>
        `),
    });
};

// bookings.js calls sendPaymentInstructionsEmail(email, name, title, date, location, amount, {upiId, upiName})
// Signature normalised: (email, name, eventTitle, _date, _location, amount, opts)
const sendPaymentInstructionsEmail = (email, name, eventTitle, _date, _location, amount, opts = {}) => {
    const upiId = opts?.upiId || process.env.UPI_ID || 'N/A';
    const upiName = opts?.upiName || process.env.UPI_NAME || 'Eventora';
    return sendMail({
        from: `"Eventora" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Payment Instructions: ${eventTitle}`,
        html: wrap(`
            <h2 style="color:#111;margin-top:0;">Complete Your Payment 💳</h2>
            <p style="color:#555;">Hi <strong>${name}</strong>, your booking for <strong>${eventTitle}</strong> has been approved. Please complete the payment to confirm your seat.</p>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:20px 0;">
                <p style="margin:0 0 6px;color:#92400e;font-size:13px;font-weight:bold;">PAYMENT DETAILS</p>
                <p style="margin:0;color:#78350f;">Amount: <strong>₹${amount}</strong></p>
                <p style="margin:4px 0 0;color:#78350f;">UPI ID: <strong>${upiId}</strong></p>
                <p style="margin:4px 0 0;color:#78350f;">Pay To: <strong>${upiName}</strong></p>
            </div>
            <p style="color:#555;">After payment, share the transaction ID with the admin for confirmation.</p>
        `),
    });
};

const sendCancellationEmail = async (email, name, eventTitle, amount, isRefundable) => {
    return sendMail({
        from: `"Eventora" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Booking Cancelled: ${eventTitle}`,
        html: wrap(`
            <h2 style="color:#111;margin-top:0;">Booking Cancelled</h2>
            <p style="color:#555;">Hi <strong>${name}</strong>, your booking for <strong>${eventTitle}</strong> has been cancelled.</p>
            ${amount > 0 && isRefundable ? `<p style="color:#555;">A refund of <strong>₹${amount}</strong> will be processed within 3-5 business days.</p>` : ''}
            <p style="color:#555;">If you have any questions, please contact our support team.</p>
        `),
    });
};

const sendEnquiryReplyEmail = async (userEmail, userName, subject, originalMessage, replyMessage) => {
    return sendMail({
        from: `"Eventora Support" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Re: ${subject || 'Your Eventora Enquiry'}`,
        html: wrap(`
            <h2 style="color:#111;margin-top:0;">Hi ${userName || 'there'} 👋</h2>
            <p style="color:#555;">Thank you for contacting <strong>Eventora</strong>. Our team has replied to your enquiry.</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin:20px 0;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:bold;">YOUR ENQUIRY</p>
                <p style="margin:0 0 10px;color:#111;font-weight:bold;">${subject || 'General Enquiry'}</p>
                <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">${originalMessage}</p>
            </div>
            <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;padding:18px;margin:20px 0;">
                <p style="margin:0 0 8px;color:#1e40af;font-size:12px;font-weight:bold;">EVENTORA SUPPORT REPLY</p>
                <p style="margin:0;color:#1e3a8a;font-size:14px;line-height:1.7;white-space:pre-line;">${replyMessage}</p>
            </div>
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:20px;">If you have further questions, feel free to contact us again.</p>
        `),
    });
};

module.exports = {
    sendOTPEmail,
    sendBookingEmail,
    sendBookingConfirmationEmail,
    sendPaymentConfirmationEmail,
    sendPaymentInstructionsEmail,
    sendCancellationEmail,
    sendEnquiryReplyEmail,
};
