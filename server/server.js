require('dotenv').config();

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes     = require('./routes/auth');
const eventRoutes    = require('./routes/events');
const bookingRoutes  = require('./routes/bookings');
const paymentRoutes  = require('./routes/payment');
const enquiryRoutes  = require('./routes/enquiries');

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/events',    eventRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/payment',   paymentRoutes);
app.use('/api/enquiries', enquiryRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing in server/.env');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
        app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    } catch (err) {
        console.error('❌ Server startup failed:', err.message);
        process.exit(1);
    }
}

startServer();
