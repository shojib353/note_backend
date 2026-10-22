require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');

const seedData = async (shouldDisconnect = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Note.deleteMany({}),
      Post.deleteMany({}),
    ]);

    console.log('[Seed] Syncing indexes declared via schema.index()...');
    await Promise.all([
      User.syncIndexes(),
      Note.syncIndexes(),
      Post.syncIndexes(),
    ]);

    console.log('[Seed] Creating demo users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      interests: ['chess', 'cryptography', 'reading'],
    });

    const alice = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      role: 'user',
      interests: ['reading', 'hiking', 'chess'],
    });

    const bob = await User.create({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      role: 'user',
      interests: ['cooking', 'reading', 'photography'],
    });

    const charlie = await User.create({
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      password: 'password123',
      role: 'user',
      interests: ['hiking', 'cycling', 'chess'],
    });

    console.log('[Seed] Creating demo notes...');
    await Note.create([
      {
        title: 'Admin Infrastructure Note',
        content: 'Review deployment logs, database replicas, and indexing strategy.',
        author: admin._id,
      },
      {
        title: 'Alice First Secure Note',
        content: 'Remember to finalize the quarterly research summary before Friday.',
        author: alice._id,
      },
      {
        title: 'Alice Personal Journal',
        content: 'Weekend hiking plans at Mount Rainier. Bring map and compass.',
        author: alice._id,
      },
      {
        title: 'Bob Recipe Ideas',
        content: 'Authentic sourdough loaf ratio: 500g flour, 350g water, 100g starter, 10g salt.',
        author: bob._id,
      },
      {
        title: 'Bob Camera Settings',
        content: 'Golden hour portraits: f/1.8, 1/250s, ISO 100.',
        author: bob._id,
      },
    ]);

    console.log('[Seed] Creating demo public posts...');
    await Post.create([
      {
        title: 'Getting Started with Secure Web Apps',
        content: 'Security should be designed into the foundation: hash passwords, sign JWTs, and index queries.',
        author: admin._id,
      },
      {
        title: 'Top 5 Books I Read This Spring',
        content: 'Deep Work by Cal Newport, Clean Code by Uncle Bob, and Dune by Frank Herbert.',
        author: alice._id,
      },
      {
        title: 'Hiking Trails in the Cascades',
        content: 'An incredible trail guide through alpine meadows and crystal lakes.',
        author: alice._id,
      },
      {
        title: 'My Journey into Sourdough Baking',
        content: 'Fermentation takes patience, but the crust and aroma make every hour worth it.',
        author: bob._id,
      },
      {
        title: 'Weekend 50km Gravel Ride',
        content: 'Great route through forest gravel roads with 800m elevation gain.',
        author: charlie._id,
      },
    ]);

    console.log('\n======================================================');
    console.log('✅ Demo data seeded successfully!');
    console.log('------------------------------------------------------');
    console.log('Admin Credentials:');
    console.log('  Email:    admin@example.com');
    console.log('  Password: password123');
    console.log('  Role:     admin');
    console.log('------------------------------------------------------');
    console.log('Regular User Credentials:');
    console.log('  Alice:    alice@example.com / password123 (Interests: reading, hiking, chess)');
    console.log('  Bob:      bob@example.com / password123 (Interests: cooking, reading, photography)');
    console.log('  Charlie:  charlie@example.com / password123 (Interests: hiking, cycling, chess)');
    console.log('======================================================\n');

    if (shouldDisconnect) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    if (shouldDisconnect) {
      await disconnectDB();
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = { seedData };
