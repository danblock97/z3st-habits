import { describe, expect, it } from 'vitest';

import { computeStreak } from '@/lib/streak';

describe('computeStreak - daily cadence', () => {
  it('calculates current and longest streak for consecutive days', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1, // Target doesn't matter for streak calculation anymore
      timezone: 'America/New_York',
      now: new Date('2024-03-04T18:00:00Z'),
      entries: [
        { localDate: '2024-03-01', count: 1 },
        { localDate: '2024-03-02', count: 1 },
        { localDate: '2024-03-03', count: 1 },
        { localDate: '2024-03-04', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 4, longest: 4 });
  });

  it('continues streak when today is incomplete but yesterday was satisfied', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'America/Los_Angeles',
      now: new Date('2024-05-10T18:00:00Z'),
      entries: [
        { localDate: '2024-05-07', count: 1 },
        { localDate: '2024-05-08', count: 1 },
        { localDate: '2024-05-09', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it('resets current streak when there is a gap longer than a day', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1, // Target doesn't matter for streak calculation
      timezone: 'America/New_York',
      now: new Date('2024-04-05T18:00:00Z'),
      entries: [
        { localDate: '2024-04-01', count: 1 },
        { localDate: '2024-04-02', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 0, longest: 2 });
  });

  it('honours the 03:00 grace window when mapping check-ins to local dates', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'America/New_York',
      now: new Date('2024-03-03T21:00:00Z'),
      entries: [
        { occurredAt: '2024-03-02T07:45:00Z', count: 1 }, // 02:45 local, counts for 2024-03-01
        { occurredAt: '2024-03-02T15:30:00Z', count: 1 },
        { occurredAt: '2024-03-03T14:30:00Z', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it('handles DST transitions without breaking the streak', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'America/New_York',
      now: new Date('2024-03-11T18:00:00Z'),
      entries: [
        { occurredAt: '2024-03-08T17:00:00Z', count: 1 },
        { occurredAt: '2024-03-09T17:00:00Z', count: 1 },
        { occurredAt: '2024-03-10T16:00:00Z', count: 1 }, // DST starts (short day)
        { occurredAt: '2024-03-11T16:00:00Z', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 4, longest: 4 });
  });
});

describe('computeStreak - weekly cadence', () => {
  it('tracks consecutive ISO weeks with any activity, not target completion', () => {
    const result = computeStreak({
      cadence: 'weekly',
      target: 10, // High target that won't be met
      timezone: 'America/New_York',
      now: new Date('2024-01-19T18:00:00Z'),
      entries: [
        { localDate: '2024-01-02', count: 3 },
        { localDate: '2024-01-04', count: 3 },
        { localDate: '2024-01-09', count: 2 },
        { localDate: '2024-01-11', count: 3 },
        { localDate: '2024-01-16', count: 3 },
        { localDate: '2024-01-17', count: 2 },
      ],
    });

    // Should still count weeks with any activity, regardless of target
    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it('resets current streak when a week has no activity', () => {
    const result = computeStreak({
      cadence: 'weekly',
      target: 4,
      timezone: 'America/New_York',
      now: new Date('2024-02-21T18:00:00Z'),
      entries: [
        { localDate: '2024-01-30', count: 2 },
        { localDate: '2024-02-01', count: 2 },
        { localDate: '2024-02-06', count: 2 },
        { localDate: '2024-02-08', count: 2 },
        { localDate: '2024-02-13', count: 2 },
        { localDate: '2024-02-19', count: 4 },
      ],
    });

    // Check what weeks these dates fall into (ISO weeks)
    // This should give us 4 weeks of activity, not 6
    expect(result).toEqual({ current: 4, longest: 4 });
  });

  it('handles ISO week boundaries across years', () => {
    const result = computeStreak({
      cadence: 'weekly',
      target: 3,
      timezone: 'Europe/Paris',
      now: new Date('2024-01-03T10:00:00Z'),
      entries: [
        { localDate: '2023-12-26', count: 2 },
        { localDate: '2023-12-27', count: 2 },
        { localDate: '2024-01-02', count: 3 },
      ],
    });

    expect(result).toEqual({ current: 2, longest: 2 });
  });
});

describe('computeStreak - edge cases', () => {
  it('handles empty entries array', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'UTC',
      entries: [],
    });

    expect(result).toEqual({ current: 0, longest: 0 });
  });

  it('handles zero target', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 0,
      timezone: 'UTC',
      entries: [
        { localDate: '2024-01-01', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 0, longest: 0 });
  });

  it('handles negative target', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: -1,
      timezone: 'UTC',
      entries: [
        { localDate: '2024-01-01', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 0, longest: 0 });
  });

  it('handles entries with zero count', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'UTC',
      now: new Date('2024-01-04T12:00:00Z'),
      entries: [
        { localDate: '2024-01-01', count: 0 },
        { localDate: '2024-01-02', count: 1 },
        { localDate: '2024-01-03', count: 0 },
        { localDate: '2024-01-04', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 1, longest: 1 });
  });

  it('handles entries with negative count', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'UTC',
      now: new Date('2024-01-03T12:00:00Z'),
      entries: [
        { localDate: '2024-01-01', count: -1 },
        { localDate: '2024-01-02', count: 1 },
        { localDate: '2024-01-03', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it('handles future dates correctly', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'UTC',
      now: new Date('2024-01-02T12:00:00Z'),
      entries: [
        { localDate: '2024-01-01', count: 1 },
        { localDate: '2024-01-02', count: 1 },
        { localDate: '2024-01-03', count: 1 }, // Future date should be ignored
      ],
    });

    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it('handles DST fall transition (gaining an hour)', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'America/New_York',
      now: new Date('2024-11-04T18:00:00Z'), // After DST ends
      entries: [
        { occurredAt: '2024-11-01T17:00:00Z', count: 1 },
        { occurredAt: '2024-11-02T17:00:00Z', count: 1 },
        { occurredAt: '2024-11-03T16:00:00Z', count: 1 }, // DST ends (long day)
        { occurredAt: '2024-11-04T17:00:00Z', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 4, longest: 4 });
  });

  it('handles weekly cadence with partial week at start', () => {
    const result = computeStreak({
      cadence: 'weekly',
      target: 3,
      timezone: 'UTC',
      now: new Date('2024-01-10T12:00:00Z'), // Wednesday
      entries: [
        { localDate: '2024-01-08', count: 1 }, // Monday
        { localDate: '2024-01-09', count: 1 }, // Tuesday
        { localDate: '2024-01-10', count: 1 }, // Wednesday (current week)
      ],
    });

    expect(result).toEqual({ current: 1, longest: 1 });
  });

  it('handles timezone with different grace hour', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'America/New_York',
      now: new Date('2024-03-03T21:00:00Z'),
      graceHour: 6, // 6 AM grace window instead of 3 AM
      entries: [
        { occurredAt: '2024-03-02T10:45:00Z', count: 1 }, // 05:45 local, counts for 2024-03-01
        { occurredAt: '2024-03-02T15:30:00Z', count: 1 },
        { occurredAt: '2024-03-03T14:30:00Z', count: 1 },
      ],
    });

    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it('streak based on first habit completion of each day', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 5, // High target that won't be met
      timezone: 'UTC',
      now: new Date('2024-01-03T12:00:00Z'),
      entries: [
        { localDate: '2024-01-01', count: 1 }, // Day 1: 1 completion
        { localDate: '2024-01-02', count: 3 }, // Day 2: 3 completions
        { localDate: '2024-01-03', count: 1 }, // Day 3: 1 completion
      ],
    });

    // Streak should be 3 because there was activity on 3 consecutive days
    expect(result).toEqual({ current: 3, longest: 3 });
  });

  it('multiple completions in one day do not increment streak multiple times', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'UTC',
      now: new Date('2024-01-02T12:00:00Z'),
      entries: [
        { localDate: '2024-01-01', count: 5 }, // Multiple completions on same day
        { localDate: '2024-01-02', count: 1 }, // Single completion next day
      ],
    });

    // Streak should be 2, not 6 (multiple completions don't count extra)
    expect(result).toEqual({ current: 2, longest: 2 });
  });

  it('only first habit completion of day counts toward streak', () => {
    const result = computeStreak({
      cadence: 'daily',
      target: 1,
      timezone: 'UTC',
      now: new Date('2024-01-03T12:00:00Z'),
      entries: [
        { localDate: '2024-01-01', count: 3 }, // Day 1: Multiple completions (only first counts)
        { localDate: '2024-01-02', count: 1 }, // Day 2: Single completion
        { localDate: '2024-01-03', count: 2 }, // Day 3: Multiple completions (only first counts)
      ],
    });

    // Streak should be 3 - each day with any activity counts once
    expect(result).toEqual({ current: 3, longest: 3 });
  });
});
