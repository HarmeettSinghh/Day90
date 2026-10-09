/**
 * Unit tests for verdict and adherence logic.
 * Covers every branch, edge case, and threshold.
 */

const {
  getDaysElapsed,
  computeAdherence,
  computeRatingTrend,
  computeVerdict,
  buildDayStrip,
  isDateInAllowedWindow,
} = require('../src/services/verdictService');

const { VERDICTS } = require('../src/config/thresholds');

// ─────────────────────────────────────────────
// getDaysElapsed
// ─────────────────────────────────────────────
describe('getDaysElapsed', () => {
  test('same day returns 1', () => {
    expect(getDaysElapsed('2024-01-01', '2024-01-01')).toBe(1);
  });

  test('next day returns 2', () => {
    expect(getDaysElapsed('2024-01-01', '2024-01-02')).toBe(2);
  });

  test('30 days', () => {
    expect(getDaysElapsed('2024-01-01', '2024-01-31')).toBe(31);
  });

  test('today before start returns 0', () => {
    expect(getDaysElapsed('2024-01-10', '2024-01-09')).toBe(0);
  });
});

// ─────────────────────────────────────────────
// computeAdherence
// ─────────────────────────────────────────────
describe('computeAdherence', () => {
  test('100% adherence (all days checked in)', () => {
    const start = '2024-01-01';
    const today = '2024-01-07';
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'];
    const result = computeAdherence(dates, start, today);
    expect(result.adherence).toBe(1);
    expect(result.daysUsed).toBe(7);
    expect(result.daysElapsed).toBe(7);
  });

  test('0% adherence (no check-ins)', () => {
    const result = computeAdherence([], '2024-01-01', '2024-01-07');
    expect(result.adherence).toBe(0);
    expect(result.daysUsed).toBe(0);
  });

  test('~70% adherence', () => {
    const start = '2024-01-01';
    const today = '2024-01-10';
    // 7 of 10 days
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'];
    const result = computeAdherence(dates, start, today);
    expect(result.adherence).toBeCloseTo(0.7);
  });

  test('trailing 28-day window ignores earlier check-ins', () => {
    const start = '2023-12-01';
    // Today is 60 days after start
    const today = '2024-01-29';
    // Only recent 28 days have check-ins (all 28)
    const dates = [];
    for (let i = 32; i <= 59; i++) {
      const d = new Date('2023-12-01');
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    const result = computeAdherence(dates, start, today);
    // 28 days checked in within window of 28
    expect(result.adherence).toBeCloseTo(1, 1);
    expect(result.daysUsedInWindow).toBe(28);
  });

  test('adherence capped at 1.0', () => {
    const dates = Array.from({ length: 10 }, (_, i) => {
      const d = new Date('2024-01-01');
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    const result = computeAdherence(dates, '2024-01-01', '2024-01-10');
    expect(result.adherence).toBeLessThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────
// computeRatingTrend
// ─────────────────────────────────────────────
describe('computeRatingTrend', () => {
  test('insufficient data (< 3 ratings)', () => {
    const result = computeRatingTrend([{ weekNumber: 1, rating: 3 }, { weekNumber: 2, rating: 4 }]);
    expect(result.trend).toBe('insufficient_data');
  });

  test('empty ratings', () => {
    expect(computeRatingTrend([]).trend).toBe('insufficient_data');
  });

  test('improving trend', () => {
    const logs = [
      { weekNumber: 1, rating: 2 },
      { weekNumber: 2, rating: 2 },
      { weekNumber: 3, rating: 3 },
      { weekNumber: 4, rating: 4 },
    ];
    expect(computeRatingTrend(logs).trend).toBe('improving');
  });

  test('worsening trend', () => {
    const logs = [
      { weekNumber: 1, rating: 5 },
      { weekNumber: 2, rating: 4 },
      { weekNumber: 3, rating: 3 },
      { weekNumber: 4, rating: 2 },
    ];
    expect(computeRatingTrend(logs).trend).toBe('worsening');
  });

  test('flat trend (no significant change)', () => {
    const logs = [
      { weekNumber: 1, rating: 3 },
      { weekNumber: 2, rating: 3 },
      { weekNumber: 3, rating: 3 },
      { weekNumber: 4, rating: 3 },
    ];
    expect(computeRatingTrend(logs).trend).toBe('flat');
  });

  test('handles unsorted input', () => {
    const logs = [
      { weekNumber: 4, rating: 4 },
      { weekNumber: 1, rating: 2 },
      { weekNumber: 3, rating: 3 },
      { weekNumber: 2, rating: 2 },
    ];
    expect(computeRatingTrend(logs).trend).toBe('improving');
  });
});

// ─────────────────────────────────────────────
// computeVerdict
// ─────────────────────────────────────────────
describe('computeVerdict', () => {
  // a) TOO_EARLY: weeksElapsed < 4
  test('TOO_EARLY: week 0', () => {
    const result = computeVerdict({ weeksElapsed: 0, adherence: 1.0, trend: 'improving' });
    expect(result.verdict).toBe(VERDICTS.TOO_EARLY);
  });

  test('TOO_EARLY: week 3 (boundary)', () => {
    const result = computeVerdict({ weeksElapsed: 3, adherence: 1.0, trend: 'improving' });
    expect(result.verdict).toBe(VERDICTS.TOO_EARLY);
  });

  test('NOT TOO_EARLY: week 4', () => {
    const result = computeVerdict({ weeksElapsed: 4, adherence: 0.9, trend: 'improving' });
    expect(result.verdict).not.toBe(VERDICTS.TOO_EARLY);
  });

  // b) NOT_FAIR_TEST: adherence < 70%
  test('NOT_FAIR_TEST: week 4, adherence 65%', () => {
    const result = computeVerdict({ weeksElapsed: 4, adherence: 0.65, trend: 'improving' });
    expect(result.verdict).toBe(VERDICTS.NOT_FAIR_TEST);
  });

  test('NOT_FAIR_TEST: adherence exactly 69%', () => {
    const result = computeVerdict({ weeksElapsed: 6, adherence: 0.69, trend: 'flat' });
    expect(result.verdict).toBe(VERDICTS.NOT_FAIR_TEST);
  });

  test('NOT NOT_FAIR_TEST: adherence exactly 70%', () => {
    const result = computeVerdict({ weeksElapsed: 4, adherence: 0.70, trend: 'improving' });
    expect(result.verdict).not.toBe(VERDICTS.NOT_FAIR_TEST);
  });

  // c) CONSIDER_DOCTOR: week >= 12, adherence >= 70%, flat or worsening
  test('CONSIDER_DOCTOR: week 12, good adherence, flat trend', () => {
    const result = computeVerdict({ weeksElapsed: 12, adherence: 0.85, trend: 'flat' });
    expect(result.verdict).toBe(VERDICTS.CONSIDER_DOCTOR);
  });

  test('CONSIDER_DOCTOR: week 15, good adherence, worsening trend', () => {
    const result = computeVerdict({ weeksElapsed: 15, adherence: 0.75, trend: 'worsening' });
    expect(result.verdict).toBe(VERDICTS.CONSIDER_DOCTOR);
  });

  test('NOT CONSIDER_DOCTOR: week 12 but improving trend → KEEP_GOING', () => {
    const result = computeVerdict({ weeksElapsed: 12, adherence: 0.85, trend: 'improving' });
    expect(result.verdict).toBe(VERDICTS.KEEP_GOING);
  });

  test('NOT CONSIDER_DOCTOR: week 11 (just under) → KEEP_GOING', () => {
    const result = computeVerdict({ weeksElapsed: 11, adherence: 0.85, trend: 'flat' });
    expect(result.verdict).toBe(VERDICTS.KEEP_GOING);
  });

  // d) KEEP_GOING: everything else
  test('KEEP_GOING: week 6, good adherence, improving', () => {
    const result = computeVerdict({ weeksElapsed: 6, adherence: 0.8, trend: 'improving' });
    expect(result.verdict).toBe(VERDICTS.KEEP_GOING);
    expect(result.trendImproving).toBe(true);
  });

  test('KEEP_GOING: week 8, good adherence, insufficient_data trend', () => {
    const result = computeVerdict({ weeksElapsed: 8, adherence: 0.75, trend: 'insufficient_data' });
    expect(result.verdict).toBe(VERDICTS.KEEP_GOING);
  });

  // Priority order: TOO_EARLY checked before NOT_FAIR_TEST
  test('TOO_EARLY takes priority over low adherence', () => {
    const result = computeVerdict({ weeksElapsed: 2, adherence: 0.3, trend: 'worsening' });
    expect(result.verdict).toBe(VERDICTS.TOO_EARLY);
  });

  // Priority order: NOT_FAIR_TEST checked before CONSIDER_DOCTOR
  test('NOT_FAIR_TEST takes priority over 12-week worsening if low adherence', () => {
    const result = computeVerdict({ weeksElapsed: 14, adherence: 0.5, trend: 'worsening' });
    expect(result.verdict).toBe(VERDICTS.NOT_FAIR_TEST);
  });
});

// ─────────────────────────────────────────────
// isDateInAllowedWindow
// ─────────────────────────────────────────────
describe('isDateInAllowedWindow', () => {
  test('today (UTC) is allowed', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isDateInAllowedWindow(today)).toBe(true);
  });

  test('yesterday is allowed', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    expect(isDateInAllowedWindow(yesterday)).toBe(true);
  });

  test('tomorrow is allowed (IST offset)', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    expect(isDateInAllowedWindow(tomorrow)).toBe(true);
  });

  test('2 days ago is NOT allowed', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    expect(isDateInAllowedWindow(twoDaysAgo)).toBe(false);
  });

  test('2 days in future is NOT allowed', () => {
    const future = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
    expect(isDateInAllowedWindow(future)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// buildDayStrip
// ─────────────────────────────────────────────
describe('buildDayStrip', () => {
  test('returns 90 days', () => {
    const strip = buildDayStrip('2024-01-01', '2024-01-15', []);
    expect(strip).toHaveLength(90);
  });

  test('checked_in state for check-in dates', () => {
    const strip = buildDayStrip('2024-01-01', '2024-01-05', ['2024-01-01', '2024-01-03']);
    expect(strip[0].state).toBe('checked_in');
    expect(strip[2].state).toBe('checked_in');
  });

  test('missed state for past days without check-in', () => {
    const strip = buildDayStrip('2024-01-01', '2024-01-05', []);
    expect(strip[0].state).toBe('missed');
    expect(strip[1].state).toBe('missed');
  });

  test('future state for days after today', () => {
    const strip = buildDayStrip('2024-01-01', '2024-01-05', []);
    expect(strip[5].state).toBe('future');
    expect(strip[89].state).toBe('future');
  });

  test('today state when not checked in', () => {
    const today = new Date().toISOString().split('T')[0];
    const strip = buildDayStrip(today, today, []);
    expect(strip[0].state).toBe('today');
  });

  test('today shows checked_in if checked in', () => {
    const today = new Date().toISOString().split('T')[0];
    const strip = buildDayStrip(today, today, [today]);
    expect(strip[0].state).toBe('checked_in');
  });

  test('milestone markers at week 4 boundary', () => {
    const strip = buildDayStrip('2024-01-01', '2024-12-31', []);
    const week4end = strip[27]; // day 28 (4*7)
    expect(week4end.isMilestone).toBe(true);
    expect(week4end.milestoneWeek).toBe(4);
  });

  test('day numbers are sequential', () => {
    const strip = buildDayStrip('2024-01-01', '2024-01-01', []);
    strip.forEach((day, i) => {
      expect(day.dayNumber).toBe(i + 1);
    });
  });
});
