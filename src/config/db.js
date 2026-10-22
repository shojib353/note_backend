const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure_notes';
  
  try {
    // Standard connection with 10s timeout for cloud Atlas connections
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB connected successfully to database!`);
  } catch (err) {
    console.error(`\n[Database Error] Could not connect to MongoDB: ${err.message}`);
    
    // Check if in production or cloud environment
    if (process.env.NODE_ENV === 'production' || uri.includes('mongodb+srv://')) {
      console.error('\n======================================================');
      console.error('🚨 MONGODB ATLAS CONNECTION FAILED');
      console.error('Most common fix:');
      console.error('1. Go to MongoDB Atlas (cloud.mongodb.com)');
      console.error('2. Navigate to "Network Access"');
      console.error('3. Click "Add IP Address" and select "Allow Access from Anywhere" (0.0.0.0/0)');
      console.error('4. Ensure your username and password in MONGODB_URI are correct');
      console.error('======================================================\n');
    }

    console.log('[Database] Attempting fallback in-memory MongoDB server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] In-memory MongoDB connected successfully at ${inMemoryUri}`);
    } catch (memErr) {
      console.error(`[Database] In-memory MongoDB not available: ${memErr.message}`);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
