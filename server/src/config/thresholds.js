// Verdict and adherence thresholds - easy to tune
module.exports = {
  // Adherence threshold (0-1)
  MIN_ADHERENCE: 0.70,

  // Weeks before we can give a verdict
  TOO_EARLY_WEEKS: 4,

  // Weeks after which we suggest doctor if not improving
  CONSIDER_DOCTOR_WEEKS: 12,

  // Minimum weekly ratings needed to compute trend
  MIN_RATINGS_FOR_TREND: 3,

  // Trailing days window for adherence
  ADHERENCE_WINDOW_DAYS: 28,

  // Demo user TTL in seconds (24 hours)
  DEMO_TTL_SECONDS: 86400,

  // JWT expiry
  JWT_EXPIRY: '7d',

  // AI response cache TTL in seconds (24 hours)
  AI_CACHE_TTL_SECONDS: 86400,

  // Groq request timeout in ms
  GROQ_TIMEOUT_MS: 8000,

  // Max AI calls per user per hour
  AI_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000,
  AI_RATE_LIMIT_MAX: 20,

  // Product categories enum
  CATEGORIES: ['hair_gummies', 'hair_serum', 'beard_minoxidil', 'recovery_gummies'],

  // Goal options
  GOALS: ['reduce_hair_fall', 'improve_density', 'beard_growth', 'recovery_energy'],

  // Routine statuses
  STATUS: {
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
  },

  // Verdict types
  VERDICTS: {
    TOO_EARLY: 'TOO_EARLY',
    NOT_FAIR_TEST: 'NOT_FAIR_TEST',
    CONSIDER_DOCTOR: 'CONSIDER_DOCTOR',
    KEEP_GOING: 'KEEP_GOING',
  },
};
