// ══════════════════════════════════════════════════
//  config/seed.js — Seed Default Services to MongoDB
//  Run once: node config/seed.js
// ══════════════════════════════════════════════════
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Service  = require('../models/Service');
const User     = require('../models/User');

const services = [
  {
    serviceName: 'Velverse AI Starter',
    description: 'Free forever plan. Access to 1 AI squad, 10 messages/day.',
    price:       { monthly: 0, annual: 0 },
    currency:    'INR',
    category:    'subscription',
    features:    ['1 AI Squad', '10 messages/day', 'Community support'],
    squads:      ['Software Dev'],
    isActive:    true,
  },
  {
    serviceName: 'Velverse AI Pro',
    description: 'Full access to all 5 AI squads. 500 messages/day.',
    price:       { monthly: 2499, annual: 23990 },
    currency:    'INR',
    category:    'subscription',
    features:    ['All 5 AI Squads', '500 messages/day', 'Priority support', 'Output downloads', 'Chat history'],
    squads:      ['Software Dev', 'Web Dev', 'UI/UX Design', 'Digital Marketing', 'Data Analysis'],
    isActive:    true,
  },
  {
    serviceName: 'Velverse AI Enterprise',
    description: 'Unlimited squads, custom Flowise endpoints, dedicated support.',
    price:       { monthly: 20999, annual: 199990 },
    currency:    'INR',
    category:    'subscription',
    features:    ['Unlimited messages', 'Custom AI endpoints', 'Dedicated support', 'SLA 99.9%', 'Team management', 'API access'],
    squads:      ['Software Dev', 'Web Dev', 'UI/UX Design', 'Digital Marketing', 'Data Analysis'],
    isActive:    true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️   Cleared existing services');

    // Insert new services
    const inserted = await Service.insertMany(services);
    console.log(`✅  Inserted ${inserted.length} services`);

    // Create a default admin user (if not exists)
    const adminExists = await User.findOne({ email: 'admin@velverse.ai' });
    if (!adminExists) {
      await User.create({
        name:     'Velverse Admin',
        email:    'admin@velverse.ai',
        password: 'Admin@123456',
        role:     'admin',
        plan:     'Enterprise',
      });
      console.log('✅  Admin user created → admin@velverse.ai / Admin@123456');
    } else {
      console.log('ℹ️   Admin user already exists');
    }

    console.log('\n🎉  Seed complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
