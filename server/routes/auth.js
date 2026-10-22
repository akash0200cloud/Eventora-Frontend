const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { sendOTPEmail } = require('../utils/email');

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

// Create JWT token
const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );
};

// Send account verification OTP
const sendAccountOTP = async (user) => {
    const otp = generateOTP();

    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendOTPEmail(
        user.email,
        user.name,
        otp,
        'account_verification'
    );
};

// Send booking OTP
const sendBookingOTP = async (user) => {
    const otp = generateOTP();

    user.bookingOtpCode = otp;
    user.bookingOtpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendOTPEmail(
        user.email,
        user.name,
        otp,
        'booking_verification'
    );
};

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required.'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existing = await User.findOne({
            email: normalizedEmail
        });

        if (existing) {
            return res.status(400).json({
                message: 'User already exists.'
            });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            role: 'user',
            isVerified: false
        });

        await sendAccountOTP(user);

        return res.status(201).json({
            message:
                'User registered successfully. Verify your OTP to activate the account.',
            email: user.email
        });

    } catch (error) {
        console.error('Registration error:', error);

        return res.status(500).json({
            message: 'Registration failed',
            error: error.message
        });
    }
});

/*
|--------------------------------------------------------------------------
| VERIFY ACCOUNT OTP
|--------------------------------------------------------------------------
*/

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: 'Email and OTP are required.'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (
            !user.otpCode ||
            !user.otpExpires ||
            user.otpExpires < Date.now()
        ) {
            return res.status(400).json({
                message: 'OTP expired or invalid.'
            });
        }

        if (user.otpCode !== String(otp).trim()) {
            return res.status(400).json({
                message: 'Invalid OTP.'
            });
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
        console.error('OTP verification error:', error);

        return res.status(500).json({
            message: 'OTP verification failed',
            error: error.message
        });
    }
});

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Do NOT log password here.
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        if (!user.isVerified) {
            await sendAccountOTP(user);

            return res.status(403).json({
                message:
                    'Account not verified. A new OTP has been sent.',
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
        console.error('Login error:', error);

        return res.status(500).json({
            message: 'Login failed',
            error: error.message
        });
    }
});

/*
|--------------------------------------------------------------------------
| RESEND OTP
|--------------------------------------------------------------------------
*/

router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: 'Email is required.'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        await sendAccountOTP(user);

        return res.json({
            message: 'OTP resent successfully.'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);

        return res.status(500).json({
            message: 'Failed to resend OTP',
            error: error.message
        });
    }
});

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: 'Email is required.'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        const otp = generateOTP();

        user.resetOtpCode = otp;
        user.resetOtpExpires = Date.now() + 10 * 60 * 1000;

        await user.save();

        await sendOTPEmail(
            user.email,
            user.name,
            otp,
            'password_reset'
        );

        return res.json({
            message: 'Password reset OTP sent.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);

        return res.status(500).json({
            message: 'Password reset request failed',
            error: error.message
        });
    }
});

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

router.post('/reset-password', async (req, res) => {
    try {
        const {
            email,
            otp,
            newPassword
        } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message:
                    'Email, OTP, and new password are required.'
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (
            !user.resetOtpCode ||
            !user.resetOtpExpires ||
            user.resetOtpExpires < Date.now()
        ) {
            return res.status(400).json({
                message: 'OTP expired or invalid.'
            });
        }

        if (user.resetOtpCode !== String(otp).trim()) {
            return res.status(400).json({
                message: 'Invalid OTP.'
            });
        }

        user.password = newPassword;
        user.resetOtpCode = '';
        user.resetOtpExpires = null;

        await user.save();

        return res.json({
            message: 'Password reset successful.'
        });

    } catch (error) {
        console.error('Reset password error:', error);

        return res.status(500).json({
            message: 'Password reset failed',
            error: error.message
        });
    }
});

module.exports = router;


// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const User = require('../models/User');
// const { sendOTPEmail } = require('../utils/email');

// const router = express.Router();

// // Generate 6-digit OTP
// const generateOTP = () => {
//     return String(Math.floor(100000 + Math.random() * 900000));
// };

// // Create JWT token
// const createToken = (user) => {
//     if (!process.env.JWT_SECRET) {
//         throw new Error('JWT_SECRET is missing in server/.env');
//     }

//     return jwt.sign(
//         {
//             id: user._id,
//             email: user.email,
//             role: user.role
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: '7d' }
//     );
// };

// // Send OTP email and check result
// const deliverOTP = async (user, otp, purpose) => {
//     console.log(`📧 Sending OTP email. Purpose: ${purpose}`);

//     const result = await sendOTPEmail(
//         user.email,
//         user.name,
//         otp,
//         purpose
//     );

//     if (result !== true) {
//         console.error(
//             `❌ OTP email sending failed for ${user.email}`
//         );

//         throw new Error(
//             'Email could not be sent. Check EMAIL_USER, EMAIL_PASS and email transporter settings.'
//         );
//     }

//     console.log(`✅ OTP email sent successfully to ${user.email}`);
// };

// // Send account verification OTP
// const sendAccountOTP = async (user) => {
//     const otp = generateOTP();

//     user.otpCode = otp;
//     user.otpExpires = Date.now() + 10 * 60 * 1000;

//     await user.save();

//     await deliverOTP(user, otp, 'account_verification');
// };

// // Send booking OTP
// const sendBookingOTP = async (user) => {
//     const otp = generateOTP();

//     user.bookingOtpCode = otp;
//     user.bookingOtpExpires = Date.now() + 10 * 60 * 1000;

//     await user.save();

//     await deliverOTP(user, otp, 'booking_verification');
// };

// // REGISTER
// router.post('/register', async (req, res) => {
//     try {
//         const { name, email, password } = req.body;

//         if (!name || !email || !password) {
//             return res.status(400).json({
//                 message: 'Name, email, and password are required.'
//             });
//         }

//         const normalizedEmail = email.toLowerCase().trim();

//         const existing = await User.findOne({
//             email: normalizedEmail
//         });

//         if (existing) {
//             return res.status(400).json({
//                 message: 'User already exists.'
//             });
//         }

//         const user = await User.create({
//             name: name.trim(),
//             email: normalizedEmail,
//             password,
//             role: 'user',
//             isVerified: false
//         });

//         console.log(`👤 User registered: ${user.email}`);

//         await sendAccountOTP(user);

//         return res.status(201).json({
//             message: 'User registered successfully. Verify your OTP to activate the account.',
//             email: user.email
//         });
//     } catch (error) {
//         console.error('❌ Registration error:', error.message);

//         return res.status(500).json({
//             message: 'Registration failed. Please check the server logs and try again.',
//             error: error.message
//         });
//     }
// });

// // VERIFY ACCOUNT OTP
// router.post('/verify-otp', async (req, res) => {
//     try {
//         const { email, otp } = req.body;

//         if (!email || !otp) {
//             return res.status(400).json({
//                 message: 'Email and OTP are required.'
//             });
//         }

//         const user = await User.findOne({
//             email: email.toLowerCase().trim()
//         });

//         if (!user) {
//             return res.status(404).json({
//                 message: 'User not found.'
//             });
//         }

//         if (
//             !user.otpCode ||
//             !user.otpExpires ||
//             user.otpExpires < Date.now()
//         ) {
//             return res.status(400).json({
//                 message: 'OTP expired or invalid. Please request a new OTP.'
//             });
//         }

//         if (user.otpCode !== String(otp).trim()) {
//             return res.status(400).json({
//                 message: 'Invalid OTP.'
//             });
//         }

//         user.isVerified = true;
//         user.otpCode = '';
//         user.otpExpires = null;

//         await user.save();

//         console.log(`✅ Account verified: ${user.email}`);

//         return res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             token: createToken(user)
//         });
//     } catch (error) {
//         console.error('❌ OTP verification error:', error.message);

//         return res.status(500).json({
//             message: 'OTP verification failed.',
//             error: error.message
//         });
//     }
// });

// // LOGIN
// router.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         if (!email || !password) {
//             return res.status(400).json({
//                 message: 'Email and password are required.'
//             });
//         }

//         const user = await User.findOne({
//             email: email.toLowerCase().trim()
//         });

//         if (!user) {
//             return res.status(401).json({
//                 message: 'Invalid email or password.'
//             });
//         }

//         const isMatch = await bcrypt.compare(
//             password,
//             user.password
//         );

//         if (!isMatch) {
//             return res.status(401).json({
//                 message: 'Invalid email or password.'
//             });
//         }

//         if (!user.isVerified) {
//             await sendAccountOTP(user);

//             return res.status(403).json({
//                 message: 'Account not verified. A new OTP has been sent.',
//                 needsVerification: true
//             });
//         }

//         console.log(`✅ Login successful: ${user.email}`);

//         return res.json({
//             _id: user._id,
//             name: user.name,
//             email: user.email,
//             role: user.role,
//             token: createToken(user)
//         });
//     } catch (error) {
//         console.error('❌ Login error:', error.message);

//         return res.status(500).json({
//             message: 'Login failed.',
//             error: error.message
//         });
//     }
// });

// // RESEND OTP
// router.post('/resend-otp', async (req, res) => {
//     try {
//         const { email } = req.body;

//         if (!email) {
//             return res.status(400).json({
//                 message: 'Email is required.'
//             });
//         }

//         const user = await User.findOne({
//             email: email.toLowerCase().trim()
//         });

//         if (!user) {
//             return res.status(404).json({
//                 message: 'User not found.'
//             });
//         }

//         if (user.isVerified) {
//             return res.status(400).json({
//                 message: 'Account is already verified.'
//             });
//         }

//         await sendAccountOTP(user);

//         return res.json({
//             message: 'OTP resent successfully.'
//         });
//     } catch (error) {
//         console.error('❌ Resend OTP error:', error.message);

//         return res.status(500).json({
//             message: 'Failed to resend OTP.',
//             error: error.message
//         });
//     }
// });

// // FORGOT PASSWORD
// router.post('/forgot-password', async (req, res) => {
//     try {
//         const { email } = req.body;

//         if (!email) {
//             return res.status(400).json({
//                 message: 'Email is required.'
//             });
//         }

//         const user = await User.findOne({
//             email: email.toLowerCase().trim()
//         });

//         if (!user) {
//             return res.status(404).json({
//                 message: 'User not found.'
//             });
//         }

//         const otp = generateOTP();

//         user.resetOtpCode = otp;
//         user.resetOtpExpires = Date.now() + 10 * 60 * 1000;

//         await user.save();

//         await deliverOTP(user, otp, 'password_reset');

//         return res.json({
//             message: 'Password reset OTP sent.'
//         });
//     } catch (error) {
//         console.error('❌ Forgot password error:', error.message);

//         return res.status(500).json({
//             message: 'Password reset request failed.',
//             error: error.message
//         });
//     }
// });

// // RESET PASSWORD
// router.post('/reset-password', async (req, res) => {
//     try {
//         const { email, otp, newPassword } = req.body;

//         if (!email || !otp || !newPassword) {
//             return res.status(400).json({
//                 message: 'Email, OTP, and new password are required.'
//             });
//         }

//         const user = await User.findOne({
//             email: email.toLowerCase().trim()
//         });

//         if (!user) {
//             return res.status(404).json({
//                 message: 'User not found.'
//             });
//         }

//         if (
//             !user.resetOtpCode ||
//             !user.resetOtpExpires ||
//             user.resetOtpExpires < Date.now()
//         ) {
//             return res.status(400).json({
//                 message: 'OTP expired or invalid.'
//             });
//         }

//         if (user.resetOtpCode !== String(otp).trim()) {
//             return res.status(400).json({
//                 message: 'Invalid OTP.'
//             });
//         }

//         user.password = newPassword;
//         user.resetOtpCode = '';
//         user.resetOtpExpires = null;

//         await user.save();

//         console.log(`✅ Password reset successful: ${user.email}`);

//         return res.json({
//             message: 'Password reset successful.'
//         });
//     } catch (error) {
//         console.error('❌ Reset password error:', error.message);

//         return res.status(500).json({
//             message: 'Password reset failed.',
//             error: error.message
//         });
//     }
// });

// module.exports = router;
