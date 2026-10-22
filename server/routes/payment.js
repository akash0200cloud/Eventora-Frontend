
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const Booking = require('../models/Booking');
const User = require('../models/User');
const Event = require('../models/Event');
const { protect } = require('../middleware/auth');
const { sendPaymentConfirmationEmail } = require('../utils/email');

// Check environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
    throw new Error(
        'Razorpay keys missing. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
    );
}

const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
});

// Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                message: 'Booking ID is required'
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }

        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Not authorized'
            });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({
                message: 'Booking already paid'
            });
        }

        const amountInPaise = Math.round(Number(booking.amount) * 100);

        if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({
                message: 'Invalid booking amount'
            });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `booking_${booking._id}`
        });

        // Save order ID to booking if your Booking schema supports this field
        booking.razorpayOrderId = order.id;
        await booking.save();

        return res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: keyId,
            upiId: process.env.UPI_ID || '',
            upiName: process.env.UPI_NAME || ''
        });

    } catch (error) {
        console.error('Create order error:', error.message);

        return res.status(500).json({
            message: 'Error creating payment order'
        });
    }
});

// Verify payment and confirm booking
router.post('/verify', protect, async (req, res) => {
    try {
        const {
            bookingId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !bookingId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: 'All payment details are required'
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }

        if (booking.userId.toString() !== req.user.id) {
            return res.status(403).json({
                message: 'Not authorized'
            });
        }

        if (booking.paymentStatus === 'paid') {
            return res.status(400).json({
                message: 'Booking already paid'
            });
        }

        // Match order with the order created for this booking
        if (booking.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                message: 'Payment order does not match booking'
            });
        }

        // Verify Razorpay signature
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        const received = Buffer.from(razorpay_signature, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');

        if (
            received.length !== expected.length ||
            !crypto.timingSafeEqual(received, expected)
        ) {
            return res.status(400).json({
                message: 'Invalid payment signature'
            });
        }

        // Confirm payment status directly with Razorpay
        let payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (
            payment.order_id !== razorpay_order_id ||
            payment.currency !== 'INR' ||
            payment.amount !== Math.round(Number(booking.amount) * 100)
        ) {
            return res.status(400).json({
                message: 'Payment details do not match'
            });
        }

        // Auto-capture if authorized (test mode payments come as 'authorized')
        if (payment.status === 'authorized') {
            payment = await razorpay.payments.capture(razorpay_payment_id, payment.amount, 'INR');
        }

        if (payment.status !== 'captured') {
            return res.status(400).json({
                message: `Payment not captured. Status: ${payment.status}`
            });
        }

        const event = await Event.findById(booking.eventId);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        const persons = booking.persons || 1;

        if (event.availableSeats < persons) {
            return res.status(400).json({
                message: 'No seats available. Contact support before retrying.'
            });
        }

        // Mark booking as paid and confirmed
        booking.paymentStatus = 'paid';
        booking.txnId = razorpay_payment_id;
        booking.status = 'confirmed';

        await booking.save();

        event.availableSeats -= persons;
        await event.save();

        // Send confirmation email
        const user = await User.findById(booking.userId);

        if (user) {
            sendPaymentConfirmationEmail(
                user.email,
                user.name,
                event.title,
                booking.amount,
                razorpay_payment_id
            ).catch(err => {
                console.error('Email error:', err.message);
            });
        }

        return res.json({
            message: 'Payment verified and booking confirmed!',
            booking
        });

    } catch (error) {
        console.error('Payment verification error:', error.message);

        return res.status(500).json({
            message: 'Error verifying payment'
        });
    }
});

module.exports = router;
