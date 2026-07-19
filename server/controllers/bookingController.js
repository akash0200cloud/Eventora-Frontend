const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendBookingEmail, sendOTPEmail, sendPaymentInstructionsEmail } = require('../utils/email');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const getPaymentDetails = () => ({
    upiId: process.env.UPI_ID || '9431585217-3@ybl',
    upiName: process.env.UPI_NAME || 'Eventora Payments'
});

exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'event_booking' });
        await OTP.create({ email: req.user.email, otp, action: 'event_booking' });
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp, persons = 1 } = req.body;
        const numPersons = Math.max(1, parseInt(persons) || 1);

        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.availableSeats < numPersons) return res.status(400).json({ message: `Only ${event.availableSeats} seat(s) available` });

        const existingBooking = await Booking.findOne({ userId: req.user.id, eventId });
        if (existingBooking && existingBooking.status !== 'cancelled') {
            return res.status(400).json({ message: 'Already booked or pending' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId,
            status: 'pending',
            paymentStatus: 'not_paid',
            persons: numPersons,
            amount: event.ticketPrice * numPersons
        });

        await OTP.deleteOne({ _id: validOTP._id });

        res.status(201).json({ message: 'Booking request submitted', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    try {
        const { paymentStatus } = req.body; // 'paid' or 'not_paid'
        const booking = await Booking.findById(req.params.id).populate('userId').populate('eventId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'confirmed') return res.status(400).json({ message: 'Booking is already confirmed' });

        const event = await Event.findById(booking.eventId._id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const paymentDetails = getPaymentDetails();

        if (booking.amount === 0 || paymentStatus === 'paid') {
            const seatsNeeded = booking.persons || 1;
            if (event.availableSeats < seatsNeeded) {
                return res.status(400).json({ message: 'Not enough seats available to confirm this booking' });
            }

            booking.status = 'confirmed';
            booking.paymentStatus = 'paid';
            booking.txnId = booking.txnId || 'FREE_EVENT';
            await booking.save();

            event.availableSeats -= seatsNeeded;
            await event.save();

            await sendBookingEmail(booking.userId.email, booking.userId.name, booking.eventId.title, booking.amount, booking.paymentStatus, paymentDetails);
            return res.json({ message: 'Booking confirmed successfully', booking: { ...booking.toObject(), paymentDetails } });
        }

        booking.status = 'awaiting_payment';
        booking.paymentStatus = 'not_paid';
        booking.txnId = '';
        await booking.save();

        await sendPaymentInstructionsEmail(booking.userId.email, booking.userId.name, booking.eventId.title, booking.amount, paymentDetails);

        res.json({ message: 'Payment instructions sent to the user', booking: { ...booking.toObject(), paymentDetails } });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const paymentDetails = getPaymentDetails();
        const bookings = req.user.role === 'admin'
            ? await Booking.find().populate('eventId').populate('userId', 'name email').sort({ createdAt: -1 })
            : await Booking.find({ userId: req.user.id }).populate('eventId').sort({ createdAt: -1 });
        res.json(bookings.map((booking) => ({ ...booking.toObject(), paymentDetails })));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.sendPaymentOTP = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.paymentStatus === 'paid')
            return res.status(400).json({ message: 'Already paid' });
        if (booking.status !== 'awaiting_payment' && !(booking.status === 'confirmed' && booking.paymentStatus === 'not_paid'))
            return res.status(400).json({ message: 'Booking not eligible for payment' });

        const otp = generateOTP();
        await OTP.findOneAndDelete({ email: req.user.email, action: 'payment_confirm' });
        await OTP.create({ email: req.user.email, otp, action: 'payment_confirm' });
        await sendOTPEmail(req.user.email, otp, 'payment_confirm');
        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.payBooking = async (req, res) => {
    try {
        const { txnId, otp } = req.body;
        if (!txnId) return res.status(400).json({ message: 'Transaction ID is required' });
        if (!otp) return res.status(400).json({ message: 'OTP is required' });

        const validOTP = await OTP.findOne({ email: req.user.email, otp, action: 'payment_confirm' });
        if (!validOTP) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.userId.toString() !== req.user.id)
            return res.status(403).json({ message: 'Not authorized' });
        if (booking.paymentStatus === 'paid')
            return res.status(400).json({ message: 'Already paid' });
        if (booking.status !== 'awaiting_payment' && !(booking.status === 'confirmed' && booking.paymentStatus === 'not_paid'))
            return res.status(400).json({ message: 'Booking must be approved for payment before paying' });

        const event = await Event.findById(booking.eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (booking.status !== 'confirmed' && event.availableSeats < (booking.persons || 1))
            return res.status(400).json({ message: 'Not enough seats available for this booking right now' });

        await OTP.deleteOne({ _id: validOTP._id });

        booking.paymentStatus = 'paid';
        booking.txnId = txnId;
        if (booking.status !== 'confirmed') {
            booking.status = 'confirmed';
            event.availableSeats -= (booking.persons || 1);
            await event.save();
        }
        await booking.save();

        const paymentDetails = getPaymentDetails();
        const user = await User.findById(booking.userId);
        if (user) {
            await sendBookingEmail(user.email, user.name, (await Event.findById(booking.eventId))?.title || 'Event', booking.amount, 'paid', paymentDetails);
        }

        res.json({ message: 'Payment confirmed successfully', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Admin can cancel anyone's booking, user can only cancel their own
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });

        const wasConfirmed = booking.status === 'confirmed';
        booking.status = 'cancelled';
        await booking.save();

        // Restore seat only if booking was confirmed
        if (wasConfirmed) {
            await Event.findByIdAndUpdate(booking.eventId, { $inc: { availableSeats: 1 } });
        }

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
