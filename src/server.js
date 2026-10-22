require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const aggregationRoutes = require('./routes/aggregationRoutes');
const { setupSwagger } = require('./config/swagger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
setupSwagger(app);

// API Root / Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Secure Note-Taking API',
    documentation: {
      swaggerUi: '/api/docs',
      openApiJson: '/api/docs.json',
    },
    endpoints: {
      auth: '/api/auth',
      notes: '/api/notes',
      users: '/api/users',
      posts: '/api/posts',
      aggregations: '/api/aggregations',
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/aggregations', aggregationRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

if (require.main === module) {
  // Connect to DB and start listening
  connectDB().then(async () => {
    try {
      const User = require('./models/User');
      const count = await User.countDocuments();
      if (count === 0) {
        console.log('[Server] Database is empty. Seeding initial demo records...');
        const { seedData } = require('./scripts/seed');
        await seedData(false);
      }
    } catch (seedErr) {
      console.warn('[Server] Auto-seed check notice:', seedErr.message);
    }

    server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Secure Notes Server running on port ${PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`======================================================\n`);
    });
  });
}

module.exports = app;
