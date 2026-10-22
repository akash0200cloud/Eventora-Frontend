const express = require('express');
const Enquiry = require('../models/Enquiry');
const { protect, admin } = require('../middleware/auth');
const { sendEnquiryReplyEmail } = require('../utils/email');

const router = express.Router();

/*
  POST /api/enquiries

  Public route
  User Contact Us form se enquiry submit karega.
*/
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'Name, email, subject, and message are required.',
      });
    }

    const enquiry = await Enquiry.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      message: 'Enquiry submitted successfully.',
      enquiry,
    });
  } catch (error) {
    console.error('Create enquiry error:', error);

    return res.status(500).json({
      message: 'Failed to submit enquiry.',
    });
  }
});


/*
  GET /api/enquiries

  Admin only
  Admin Dashboard mein saari enquiries dikhegi.
*/
router.get('/', protect, admin, async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .sort({ createdAt: -1 });

    return res.json(enquiries);
  } catch (error) {
    console.error('Get enquiries error:', error);

    return res.status(500).json({
      message: 'Failed to fetch enquiries.',
    });
  }
});


/*
  GET /api/enquiries/:id

  Admin only
  Ek particular enquiry dekhne ke liye.
*/
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        message: 'Enquiry not found.',
      });
    }

    return res.json(enquiry);
  } catch (error) {
    console.error('Get enquiry error:', error);

    return res.status(500).json({
      message: 'Failed to fetch enquiry.',
    });
  }
});


/*
  PATCH /api/enquiries/:id/read

  Admin only
  Enquiry ko read mark karega.
*/
router.patch('/:id/read', protect, admin, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        message: 'Enquiry not found.',
      });
    }

    if (enquiry.status === 'pending') {
      enquiry.status = 'read';
      await enquiry.save();
    }

    return res.json({
      message: 'Enquiry marked as read.',
      enquiry,
    });
  } catch (error) {
    console.error('Mark enquiry read error:', error);

    return res.status(500).json({
      message: 'Failed to update enquiry.',
    });
  }
});


/*
  DELETE /api/enquiries/:id

  Admin only
  Admin enquiry delete kar sakta hai.
*/
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        message: 'Enquiry not found.',
      });
    }

    await enquiry.deleteOne();

    return res.json({
      message: 'Enquiry deleted successfully.',
    });
  } catch (error) {
    console.error('Delete enquiry error:', error);

    return res.status(500).json({
      message: 'Failed to delete enquiry.',
    });
  }
});


/*
  POST /api/enquiries/:id/reply

  Admin only
  Admin reply send karega email ke through.
*/
router.post('/:id/reply', protect, admin, async (req, res) => {
  try {
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: 'Reply message is required.' });
    }

    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }

    enquiry.adminReply = reply.trim();
    enquiry.status = 'replied';
    enquiry.repliedAt = new Date();
    await enquiry.save();

    sendEnquiryReplyEmail(
      enquiry.email,
      enquiry.name,
      enquiry.subject,
      enquiry.message,
      reply.trim()
    ).catch(err => console.error('Enquiry reply email error:', err.message));

    return res.json({ message: 'Reply sent successfully.', enquiry });
  } catch (error) {
    console.error('Send enquiry reply error:', error);
    return res.status(500).json({ message: 'Failed to send reply.' });
  }
});


module.exports = router;