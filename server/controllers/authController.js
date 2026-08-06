const User = require('../models/User');
const OTP = require('../models/OTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

const createAndSendOTP = async (email, action = 'account_verification') => {
    const otp = generateOTP();
    await OTP.findOneAndDelete({ email, action });
    await OTP.create({ email, otp, action });
    await sendOTPEmail(email, otp, action);
    return otp;
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'All fields are required' });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 8);
        user = await User.create({ name, email, password: hashedPassword, role: 'user', isVerified: false });

        await createAndSendOTP(email);
        res.status(201).json({ message: 'OTP sent to email. Please verify.', email: user.email });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Email and password are required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified && user.role !== 'admin') {
            await createAndSendOTP(user.email);
            return res.status(403).json({
                message: 'Account not verified. OTP sent to email.',
                needsVerification: true,
                email: user.email
            });
        }

        res.json({ _id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user.id, user.role) });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return res.status(400).json({ message: 'Email and OTP are required' });

        const validOTP = await OTP.findOne({ email, otp, action: 'account_verification' });
        if (!validOTP)
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        await OTP.deleteOne({ _id: validOTP._id });

        res.json({ _id: user.id, name: user.name, email: user.email, role: user.role, token: generateToken(user.id, user.role) });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        await createAndSendOTP(email);
        res.json({ message: 'OTP resent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Forgot Password - send OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'No account found with this email' });

        await createAndSendOTP(email, 'forgot_password');
        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Reset Password - verify OTP and set new password
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return res.status(400).json({ message: 'All fields are required' });

        const validOTP = await OTP.findOne({ email, otp, action: 'forgot_password' });
        if (!validOTP)
            return res.status(400).json({ message: 'Invalid or expired OTP' });

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        await User.findOneAndUpdate({ email }, { password: hashedPassword });
        await OTP.deleteOne({ _id: validOTP._id });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
