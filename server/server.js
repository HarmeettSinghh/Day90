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

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Server] Connected to MongoDB Atlas');
  } catch (err) {
    console.error('[Server] MongoDB Atlas connection failed:', err.message);
    if (err.message.includes('whitelisted') || err.message.includes('Could not connect')) {
      console.error('\n👉 Action Required in MongoDB Atlas:');
      console.error('1. Go to cloud.mongodb.com → Security → Network Access');
      console.error('2. Click "+ Add IP Address" and select "Allow Access from Anywhere" (0.0.0.0/0)');
      console.error('3. Click Confirm (takes ~30 seconds to apply).\n');
    }

    // In local development, fall back to local MongoDB if Atlas IP is not yet whitelisted
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Server] Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/day90)...');
        await mongoose.connect('mongodb://127.0.0.1:27017/day90');
        console.log('[Server] Connected to local MongoDB fallback for development.');
      } catch (localErr) {
        console.error('[Server] Local fallback also failed:', localErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  app.listen(PORT, () => {
    console.log(`[Server] Day90 API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

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
