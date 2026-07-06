const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const run = async () => {
    console.log('\n========== EVENTORA DIAGNOSIS ==========');
    console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Found' : '❌ MISSING');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Found' : '❌ MISSING');
    console.log('PORT:', process.env.PORT || 5000);

    try {
        console.log('\nConnecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully!');

        const users = await User.find({});
        console.log(`\nTotal users in DB: ${users.length}`);

        if (users.length === 0) {
            console.log('❌ NO USERS FOUND — Run: node seed.js');
        } else {
            users.forEach(u => {
                console.log(`  - ${u.email} | role: ${u.role} | verified: ${u.isVerified}`);
            });

            // Test password match for admin
            const admin = users.find(u => u.role === 'admin');
            if (admin) {
                const match = await bcrypt.compare('password123', admin.password);
                console.log(`\nAdmin password test (password123): ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
            }
        }

    } catch (err) {
        console.log('❌ MongoDB Error:', err.message);
        if (err.message.includes('ENOTFOUND') || err.message.includes('connect')) {
            console.log('   → Check your MONGO_URI in .env file');
            console.log('   → Check MongoDB Atlas Network Access (allow 0.0.0.0/0)');
        }
    }

    console.log('\n========================================\n');
    process.exit();
};

run();
