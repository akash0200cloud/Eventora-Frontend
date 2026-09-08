const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  persons: { type: Number, default: 1, min: 1 },
  amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'awaiting_payment'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['not_paid', 'paid'],
    default: 'not_paid'
  },
  txnId: { type: String, default: '' },
  bookedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
