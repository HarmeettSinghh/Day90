const express = require('express');
const router = express.Router();
const TimelineContent = require('../models/TimelineContent');
const { CATEGORIES } = require('../config/thresholds');

// GET /api/timeline/:category — public (no auth needed for basic timeline info)
// But still validates category to avoid DB injection
router.get('/:category', async (req, res, next) => {
  try {
    const { category } = req.params;

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category.' });
    }

    const content = await TimelineContent.findOne({ category });
    if (!content) {
      return res.status(404).json({ error: 'Timeline content not found for this category.' });
    }

    res.json({ timeline: content });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
