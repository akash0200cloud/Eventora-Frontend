const express = require('express');
const Event = require('../models/Event');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const query = {};

    if (search) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } }
      ];
    }

    const events = await Event.find(query).sort({ date: 1 });
    return res.json(events);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;

    if (!title || !description || !date || !location || !category || !totalSeats) {
      return res.status(400).json({ message: 'Missing required event fields' });
    }

    const parsedSeats = Number(totalSeats);
    const parsedPrice = Number(ticketPrice || 0);

    if (Number.isNaN(parsedSeats) || parsedSeats <= 0) {
      return res.status(400).json({ message: 'Total seats must be a positive number' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      category,
      totalSeats: parsedSeats,
      availableSeats: parsedSeats,
      ticketPrice: parsedPrice,
      image: image || '',
      createdBy: req.user._id
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (category) event.category = category;
    if (image !== undefined) event.image = image || '';

    if (totalSeats !== undefined && Number(totalSeats) > 0) {
      const newTotal = Number(totalSeats);
      const difference = newTotal - event.totalSeats;
      event.totalSeats = newTotal;
      event.availableSeats = Math.max(0, (event.availableSeats || 0) + difference);
    }

    if (ticketPrice !== undefined) {
      event.ticketPrice = Number(ticketPrice) || 0;
    }

    await event.save();
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.deleteOne();
    return res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
});

module.exports = router;
