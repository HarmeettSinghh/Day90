/**
 * Verdict and adherence computation service.
 * Pure functions — no database access, fully unit-testable.
 */

const {
  MIN_ADHERENCE,
  TOO_EARLY_WEEKS,
  CONSIDER_DOCTOR_WEEKS,
  MIN_RATINGS_FOR_TREND,
  ADHERENCE_WINDOW_DAYS,
  VERDICTS,
} = require('../config/thresholds');

/**
 * Compute how many days elapsed since startDate up to today (inclusive).
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} todayDate - YYYY-MM-DD
 * @returns {number}
 */
function getDaysElapsed(startDate, todayDate) {
  const start = new Date(startDate + 'T00:00:00Z');
  const today = new Date(todayDate + 'T00:00:00Z');
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff + 1); // inclusive
}

/**
 * Compute adherence over trailing ADHERENCE_WINDOW_DAYS (or since start).
 * adherence = checkInDays / daysElapsedInWindow
 *
 * @param {string[]} checkInDates - sorted YYYY-MM-DD strings
 * @param {string} startDate - routine start date YYYY-MM-DD
 * @param {string} todayDate - YYYY-MM-DD
 * @returns {{ adherence: number, daysUsed: number, daysElapsed: number, windowDays: number }}
 */
function computeAdherence(checkInDates, startDate, todayDate) {
  const today = new Date(todayDate + 'T00:00:00Z');
  const start = new Date(startDate + 'T00:00:00Z');

  // Window start: max(startDate, today - ADHERENCE_WINDOW_DAYS + 1)
  const windowStart = new Date(
    Math.max(start.getTime(), today.getTime() - (ADHERENCE_WINDOW_DAYS - 1) * 86400000)
  );

  const windowDays =
    Math.floor((today.getTime() - windowStart.getTime()) / 86400000) + 1;

  const daysUsedInWindow = checkInDates.filter((d) => {
    const date = new Date(d + 'T00:00:00Z');
    return date >= windowStart && date <= today;
  }).length;

  const adherence = windowDays > 0 ? daysUsedInWindow / windowDays : 0;

  const totalDaysElapsed = getDaysElapsed(startDate, todayDate);
  const totalDaysUsed = checkInDates.filter((d) => {
    const date = new Date(d + 'T00:00:00Z');
    return date >= start && date <= today;
  }).length;

  return {
    adherence: Math.min(1, adherence),
    daysUsed: totalDaysUsed,
    daysElapsed: totalDaysElapsed,
    windowDays,
    daysUsedInWindow,
  };
}

/**
 * Compute trend from weekly ratings.
 * Uses first-half vs second-half comparison.
 * Returns 'improving' | 'flat' | 'worsening' | 'insufficient_data'
 *
 * @param {{ weekNumber: number, rating: number }[]} weeklyLogs
 * @returns {{ trend: string, slope: number | null }}
 */
function computeRatingTrend(weeklyLogs) {
  const sorted = [...weeklyLogs].sort((a, b) => a.weekNumber - b.weekNumber);

  if (sorted.length < MIN_RATINGS_FOR_TREND) {
    return { trend: 'insufficient_data', slope: null };
  }

  const half = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, half);
  const secondHalf = sorted.slice(sorted.length - half);

  const avg = (arr) => arr.reduce((s, x) => s + x.rating, 0) / arr.length;

  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);
  const diff = secondAvg - firstAvg;

  // Also compute linear regression slope for more precision
  const n = sorted.length;
  const sumX = sorted.reduce((s, _, i) => s + i, 0);
  const sumY = sorted.reduce((s, x) => s + x.rating, 0);
  const sumXY = sorted.reduce((s, x, i) => s + i * x.rating, 0);
  const sumX2 = sorted.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  let trend;
  if (diff > 0.3) {
    trend = 'improving';
  } else if (diff < -0.3) {
    trend = 'worsening';
  } else {
    trend = 'flat';
  }

  return { trend, slope: Math.round(slope * 100) / 100 };
}

/**
 * Compute deterministic verdict from stats.
 * Evaluated in priority order.
 *
 * @param {{ weeksElapsed: number, adherence: number, trend: string }} params
 * @returns {{ verdict: string, trendImproving: boolean }}
 */
function computeVerdict({ weeksElapsed, adherence, trend }) {
  // a) Too early
  if (weeksElapsed < TOO_EARLY_WEEKS) {
    return {
      verdict: VERDICTS.TOO_EARLY,
      trendImproving: trend === 'improving',
    };
  }

  // b) Not a fair test (inconsistent use)
  if (adherence < MIN_ADHERENCE) {
    return {
      verdict: VERDICTS.NOT_FAIR_TEST,
      trendImproving: trend === 'improving',
    };
  }

  // c) Consider doctor
  if (
    weeksElapsed >= CONSIDER_DOCTOR_WEEKS &&
    adherence >= MIN_ADHERENCE &&
    (trend === 'flat' || trend === 'worsening')
  ) {
    return {
      verdict: VERDICTS.CONSIDER_DOCTOR,
      trendImproving: false,
    };
  }

  // d) Keep going
  return {
    verdict: VERDICTS.KEEP_GOING,
    trendImproving: trend === 'improving',
  };
}

/**
 * Build a 90-day strip array of day states.
 * Each day: { dayNumber, date (YYYY-MM-DD), state: 'checked_in' | 'missed' | 'future' | 'today' }
 *
 * @param {string} startDate
 * @param {string} todayDate
 * @param {string[]} checkInDates
 * @returns {Array}
 */
function buildDayStrip(startDate, todayDate, checkInDates) {
  const start = new Date(startDate + 'T00:00:00Z');
  const today = new Date(todayDate + 'T00:00:00Z');
  const checkInSet = new Set(checkInDates);
  const days = [];

  for (let i = 0; i < 90; i++) {
    const date = new Date(start.getTime() + i * 86400000);
    const dateStr = date.toISOString().split('T')[0];
    const dayNumber = i + 1;

    let state;
    if (date > today) {
      state = 'future';
    } else if (dateStr === todayDate) {
      state = checkInSet.has(dateStr) ? 'checked_in' : 'today';
    } else if (checkInSet.has(dateStr)) {
      state = 'checked_in';
    } else {
      state = 'missed';
    }

    days.push({ dayNumber, date: dateStr, state });

    // Milestone markers
    const milestoneWeeks = [4, 8, 12];
    const weekNumber = Math.floor(i / 7) + 1;
    if (i % 7 === 6 && milestoneWeeks.includes(weekNumber)) {
      days[days.length - 1].isMilestone = true;
      days[days.length - 1].milestoneWeek = weekNumber;
    }
  }

  return days;
}

/**
 * Validate that a date string is within the allowed window:
 * today or yesterday (server UTC, allowing for IST timezone).
 * Allows ±1 day of server UTC.
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
function isDateInAllowedWindow(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  const now = new Date();
  const todayUtc = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');
  const diffDays = Math.round((date - todayUtc) / 86400000);
  // Allow -1 (yesterday) to +1 (tomorrow, for IST users ahead of UTC)
  return diffDays >= -1 && diffDays <= 1;
}

module.exports = {
  getDaysElapsed,
  computeAdherence,
  computeRatingTrend,
  computeVerdict,
  buildDayStrip,
  isDateInAllowedWindow,
};
