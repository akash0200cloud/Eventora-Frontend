const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/email');

const router = express.Router();

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const createToken = (user) => jwt.sign(
  { id: user._id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const sendAccountOTP = async (user) => {
  const otp = generateOTP();
  user.otpCode = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();
  await sendOTPEmail(user.email, otp, 'account_verification');
};

const sendBookingOTP = async (user) => {
  const otp = generateOTP();
  user.bookingOtpCode = otp;
  user.bookingOtpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();
  await sendOTPEmail(user.email, otp, 'booking_verification');
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
      isVerified: false
    });

    await sendAccountOTP(user);

    return res.status(201).json({
      message: 'User registered successfully. Verify your OTP to activate the account.',
      email: user.email
    });
  } catch (error) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.otpCode || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid.' });
    }

    if (user.otpCode !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    user.isVerified = true;
    user.otpCode = '';
    user.otpExpires = null;
    await user.save();

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: createToken(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      await sendAccountOTP(user);
      return res.status(403).json({
        message: 'Account not verified. A new OTP has been sent.',
        needsVerification: true
      });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: createToken(user)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await sendAccountOTP(user);
    return res.json({ message: 'OTP resent successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const otp = generateOTP();
    user.resetOtpCode = otp;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOTPEmail(user.email, otp, 'password_reset');

    return res.json({ message: 'Password reset OTP sent.' });
  } catch (error) {
    return res.status(500).json({ message: 'Password reset request failed', error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.resetOtpCode || !user.resetOtpExpires || user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired or invalid.' });
    }

    if (user.resetOtpCode !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    user.password = newPassword;
    user.resetOtpCode = '';
    user.resetOtpExpires = null;
    await user.save();

    return res.json({ message: 'Password reset successful.' });
  } catch (error) {
    return res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
});

module.exports = router;
