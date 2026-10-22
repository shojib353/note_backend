const app = require('../src/server');
const { connectDB } = require('../src/config/db');

// Ensure DB is connected for serverless invocations
let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};
