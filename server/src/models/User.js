const mongoose = require('mongoose');
const { DEMO_TTL_SECONDS } = require('../config/thresholds');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    // TTL field: only set for demo users (expires in 24h)
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB auto-deletes documents when expiresAt is in the past
// Only applies when expiresAt is set (demo users)
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('User', userSchema);
