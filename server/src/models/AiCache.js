const mongoose = require('mongoose');
const { AI_CACHE_TTL_SECONDS } = require('../config/thresholds');

const aiCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routine',
      required: true,
    },
    // 'verdict_explanation' | 'weekly_reflection' | 'ask'
    kind: {
      type: String,
      required: true,
    },
    // A string key representing the "state" that generated this response
    // e.g. "TOO_EARLY:45:23" (verdict:daysElapsed:daysUsed)
    stateKey: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    // TTL field for auto-deletion after 24h
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + AI_CACHE_TTL_SECONDS * 1000),
    },
  },
  { timestamps: true }
);

// TTL index
aiCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast lookup
aiCacheSchema.index({ userId: 1, routineId: 1, kind: 1, stateKey: 1 });

module.exports = mongoose.model('AiCache', aiCacheSchema);
