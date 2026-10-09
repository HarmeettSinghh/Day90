const mongoose = require('mongoose');
const { CATEGORIES, GOALS, STATUS } = require('../config/thresholds');

const routineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    goal: {
      type: String,
      enum: GOALS,
      required: true,
    },
    // YYYY-MM-DD string — client's local date
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    productPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    packDays: {
      type: Number,
      min: 1,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Routine', routineSchema);
