require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[Server] MONGODB_URI is not set. Please configure your .env file.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('[Server] JWT_SECRET is not set. Please configure your .env file.');
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('[Server] Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`[Server] Day90 API running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('[Server] MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received. Closing gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received. Closing gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});
