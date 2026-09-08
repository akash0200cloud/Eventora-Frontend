const express = require('express');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');

const router = express.Router();
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

router.post('/send-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    user.bookingOtpCode = otp;
    user.bookingOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTPEmail(user.email, otp, 'booking_verification');
    return res.json({ message: 'Booking OTP sent successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send booking OTP', error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { eventId, otp, persons = 1 } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event is required' });
    }

    const count = Number(persons || 1);
    if (Number.isNaN(count) || count < 1) {
      return res.status(400).json({ message: 'Persons must be at least 1' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    if (!user.bookingOtpCode || !user.bookingOtpExpires || user.bookingOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Booking OTP expired or missing.' });
    }

    if (user.bookingOtpCode !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid booking OTP' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableSeats < count) {
      return res.status(400).json({ message: 'Not enough seats available' });
    }

    const amount = event.ticketPrice * count;
    const booking = await Booking.create({
      userId: req.user._id,
      eventId: event._id,
      persons: count,
      amount,
      status: event.ticketPrice === 0 ? 'confirmed' : 'pending',
      paymentStatus: event.ticketPrice === 0 ? 'paid' : 'not_paid'
    });

    user.bookingOtpCode = '';
    user.bookingOtpExpires = null;
    await user.save();

    if (event.ticketPrice === 0) {
      event.availableSeats = Math.max(0, event.availableSeats - count);
      await event.save();
      await sendBookingEmail(user.email, user.name, event.title, 0, 'paid');
    }

    return res.status(201).json({ message: event.ticketPrice === 0 ? 'Free booking confirmed.' : 'Booking requested successfully.', booking });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create booking', error: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };

    const bookings = await Booking.find(query)
      .populate('userId', 'name email')
      .populate('eventId')
      .sort({ bookedAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

router.put('/:id/confirm', protect, admin, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id).populate('eventId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const event = booking.eventId;
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const user = await User.findById(booking.userId);

    if (paymentStatus === 'paid') {
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      if (event.availableSeats >= booking.persons && booking.status !== 'confirmed') {
        event.availableSeats -= booking.persons;
      }
      if (event.availableSeats >= booking.persons && booking.paymentStatus !== 'paid') {
        event.availableSeats -= booking.persons;
      }
      if (event.availableSeats >= booking.persons) {
        event.availableSeats -= booking.persons;
      }
      await event.save();
      if (user) {
        await sendBookingEmail(user.email, user.name, event.title, booking.amount, 'paid');
      }
    } else if (paymentStatus === 'not_paid') {
      booking.paymentStatus = 'not_paid';
      booking.status = 'awaiting_payment';
    } else {
      booking.paymentStatus = booking.amount === 0 ? 'paid' : 'not_paid';
      booking.status = booking.amount === 0 ? 'confirmed' : 'awaiting_payment';
    }

    booking.txnId = booking.txnId || `TXN-${Date.now()}`;
    await booking.save();

    return res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to confirm booking', error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('eventId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isOwner = booking.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'confirmed' && booking.paymentStatus === 'paid' && booking.eventId) {
      const event = booking.eventId;
      event.availableSeats = Math.min(event.totalSeats, event.availableSeats + booking.persons);
      await event.save();
    }

    booking.status = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'not_paid';
    }
    await booking.save();

    return res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
});

module.exports = router;
