const express = require('express');
const router = express.Router();
const { authGuard } = require('../middleware/auth');
const User = require('../models/User');
const Routine = require('../models/Routine');
const CheckIn = require('../models/CheckIn');
const WeeklyLog = require('../models/WeeklyLog');
const AiCache = require('../models/AiCache');

// DELETE /api/account — delete all server data for this user
router.delete('/', authGuard, async (req, res, next) => {
  try {
    const userId = req.userId;

    // Find all routines for cascade delete
    const routines = await Routine.find({ userId }).select('_id');
    const routineIds = routines.map((r) => r._id);

    // Delete in parallel
    await Promise.all([
      CheckIn.deleteMany({ routineId: { $in: routineIds } }),
      WeeklyLog.deleteMany({ routineId: { $in: routineIds } }),
      AiCache.deleteMany({ userId }),
      Routine.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.json({
      message:
        'All your account data has been permanently deleted from our servers. On-device photos (stored in your browser\'s IndexedDB) can be cleared separately from the app settings.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
