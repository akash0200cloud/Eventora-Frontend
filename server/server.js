const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(cors({
    origin: '*',
    credentials: false
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    const pingUrl = process.env.RENDER_EXTERNAL_URL || `https://eventora-backend-locv.onrender.com`;
    setInterval(() => {
        const https = require('https');
        https.get(`${pingUrl}/api/health`, () => console.log('🏓 Keep-alive ping sent'))
            .on('error', () => {});
    }, 14 * 60 * 1000);
});
