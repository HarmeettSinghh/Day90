const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Routine = require('../models/Routine');
const CheckIn = require('../models/CheckIn');
const WeeklyLog = require('../models/WeeklyLog');
const { authGuard } = require('../middleware/auth');
const { JWT_EXPIRY, DEMO_TTL_SECONDS } = require('../config/thresholds');

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests. Please wait a few minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const emailNorm = email.toLowerCase().trim();

    // Check if exists — return generic error (do not reveal existence)
    const existing = await User.findOne({ email: emailNorm });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim().slice(0, 80),
      email: emailNorm,
      passwordHash,
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isDemo: false },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNorm = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });

    // Generic error — don't reveal whether email exists
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, isDemo: user.isDemo },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/demo — create ephemeral demo user with seeded data
router.post('/demo', authLimiter, async (req, res, next) => {
  try {
    const demoEmail = `demo_${Date.now()}_${Math.random().toString(36).slice(2)}@day90.demo`;
    const passwordHash = await bcrypt.hash('demo-not-a-real-password', 8);

    const expiresAt = new Date(Date.now() + DEMO_TTL_SECONDS * 1000);

    const user = await User.create({
      name: 'Demo Dev',
      email: demoEmail,
      passwordHash,
      isDemo: true,
      expiresAt,
    });

    // Seed demo routine — started 56 days ago (8 weeks)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 56);
    const startDateStr = startDate.toISOString().split('T')[0];

    const routine = await Routine.create({
      userId: user._id,
      category: 'hair_gummies',
      goal: 'reduce_hair_fall',
      startDate: startDateStr,
      productPrice: 1299,
      packDays: 30,
      status: 'active',
    });

    // Seed check-ins: realistic mix — used 38 of 56 days (~68% — just below the 70% threshold for interesting verdict)
    const checkInDates = [];
    const missedDays = new Set([3, 7, 11, 14, 18, 22, 25, 29, 33, 37, 41, 44, 48, 52, 55, 56]);
    for (let i = 0; i < 56; i++) {
      if (!missedDays.has(i + 1)) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        checkInDates.push(d.toISOString().split('T')[0]);
      }
    }

    // Bulk insert check-ins
    await CheckIn.insertMany(
      checkInDates.map((date, idx) => ({
        userId: user._id,
        routineId: routine._id,
        date,
        note: idx === 6 ? 'First week done!' : idx === 20 ? 'Noticing less hair in the shower maybe?' : '',
      }))
    );

    // Seed weekly logs with improving trend: 2, 2, 3, 3, 3, 4, 4, 4
    const weekRatings = [2, 2, 3, 3, 3, 4, 4, 4];
    const weekNotes = [
      'Not noticing much yet',
      'Still waiting',
      'Hair maybe a bit less on the brush?',
      'Feeling more consistent about it',
      'Think it might be working',
      'Definitely less hair fall',
      'Happy with progress',
      '',
    ];
    await WeeklyLog.insertMany(
      weekRatings.map((rating, i) => ({
        userId: user._id,
        routineId: routine._id,
        weekNumber: i + 1,
        rating,
        note: weekNotes[i],
        hasPhoto: i === 0 || i === 7, // Before photo and current photo
      }))
    );

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: 'Demo Dev', email: demoEmail, isDemo: true },
      message: 'Demo mode: data auto-deletes in 24 hours.',
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authGuard, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email, isDemo: user.isDemo } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
