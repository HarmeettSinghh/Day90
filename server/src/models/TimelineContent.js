const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/thresholds');

const milestoneSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
  },
  { _id: false }
);

const timelineContentSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      unique: true,
    },
    whatMostNoticeFirst: {
      type: String,
      required: true,
    },
    fairToJudgeWeek: {
      type: Number,
      required: true,
    },
    milestones: [milestoneSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimelineContent', timelineContentSchema);
