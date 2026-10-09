const mongoose = require('mongoose');

const weeklyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routine',
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    // 1-5 self-rating
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    // Photo stored on-device (IndexedDB) only — server just tracks if one exists
    hasPhoto: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Unique compound index — one log per week
weeklyLogSchema.index({ routineId: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyLog', weeklyLogSchema);
