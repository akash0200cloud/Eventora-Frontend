const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');
const { sendPaymentConfirmationEmail } = require('../utils/email');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.paymentStatus === 'paid')
            return res.status(400).json({ message: 'Already paid' });

        const order = await razorpay.orders.create({
            amount: booking.amount * 100,
            currency: 'INR',
            receipt: `booking_${bookingId}`
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            upiId: process.env.UPI_ID,
            upiName: process.env.UPI_NAME
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
});

// Verify Razorpay payment — auto confirm + send email
router.post('/verify', protect, async (req, res) => {
    try {
        const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign).digest('hex');

        if (expectedSign !== razorpay_signature)
            return res.status(400).json({ message: 'Invalid payment signature' });

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.paymentStatus === 'paid') return res.status(400).json({ message: 'Already paid' });

        const event = await Event.findById(booking.eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats < (booking.persons || 1))
            return res.status(400).json({ message: 'No seats available' });

        // Auto confirm + mark paid
        booking.paymentStatus = 'paid';
        booking.txnId = razorpay_payment_id;
        booking.status = 'confirmed';
        await booking.save();

        event.availableSeats -= (booking.persons || 1);
        await event.save();

        // Send confirmation email to user
        const user = await User.findById(booking.userId);
        if (user) {
            sendPaymentConfirmationEmail(
                user.email,
                user.name,
                event.title,
                booking.amount,
                razorpay_payment_id
            ).catch(err => console.error('Email error:', err.message));
        }

        res.json({ message: 'Payment verified and booking confirmed!', booking });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
});

module.exports = router;
