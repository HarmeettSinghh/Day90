const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
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
    // YYYY-MM-DD, client local date
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 280,
      default: '',
    },
  },
  { timestamps: true }
);

// Unique compound index — prevents double check-in atomically
checkInSchema.index({ routineId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('CheckIn', checkInSchema);
