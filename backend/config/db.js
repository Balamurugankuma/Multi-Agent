// ══════════════════════════════════════════════════
//  config/db.js — MongoDB Connection (Mongoose)
// ══════════════════════════════════════════════════
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8 no longer needs these flags but shown for clarity
    });

    console.log(`✅  MongoDB connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Retrying...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅  MongoDB reconnected.');
    });

  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    process.exit(1); // Exit process on DB failure
  }
};

module.exports = connectDB;
