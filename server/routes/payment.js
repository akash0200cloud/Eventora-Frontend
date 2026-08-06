const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

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
            amount: booking.amount * 100, // paise
            currency: 'INR',
            receipt: `booking_${bookingId}`
        });

        res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
});

// Verify Razorpay payment
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

        booking.paymentStatus = 'paid';
        booking.txnId = razorpay_payment_id;
        booking.status = 'confirmed';
        await booking.save();

        const Event = require('../models/Event');
        await Event.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: -(booking.persons || 1) } });

        res.json({ message: 'Payment verified successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying payment', error: error.message });
    }
});

module.exports = router;
