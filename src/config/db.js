const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure_notes';
  
  try {
    // Attempt standard connection first with 3 second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${uri}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to MongoDB at ${uri}: ${err.message}`);
    console.log('[Database] Initializing fallback in-memory MongoDB server for testing/evaluation...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] In-memory MongoDB connected successfully at ${inMemoryUri}`);
    } catch (memErr) {
      console.error(`[Database] Failed to start in-memory MongoDB: ${memErr.message}`);
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
