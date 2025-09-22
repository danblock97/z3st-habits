import { getLocalDateForTZ } from '@/lib/dates';

export type StreakEntry = {
  count: number;
  localDate?: string;
  occurredAt?: string | Date;
};

export type ComputeStreakOptions = {
  cadence: 'daily' | 'weekly';
  target: number;
  timezone: string;
  entries: StreakEntry[];
  now?: Date;
  graceHour?: number;
};

export type StreakResult = {
  current: number;
  longest: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLocalDate(localDate: string): Date {
  const [year, month, day] = localDate.split('-').map((part) => Number.parseInt(part, 10));
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error(`Invalid local date received: ${localDate}`);
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function formatLocalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function previousDay(localDate: string): string {
  const date = parseLocalDate(localDate);
  date.setUTCDate(date.getUTCDate() - 1);
  return formatLocalDate(date);
}

function diffInDays(a: string, b: string): number {
  const dateA = parseLocalDate(a).getTime();
  const dateB = parseLocalDate(b).getTime();
  return Math.round((dateA - dateB) / DAY_MS);
}

function previousWeekStart(localDate: string): string {
  const date = parseLocalDate(localDate);
  date.setUTCDate(date.getUTCDate() - 7);
  return formatLocalDate(date);
}

function diffInWeeks(a: string, b: string): number {
  return Math.round((parseLocalDate(a).getTime() - parseLocalDate(b).getTime()) / (7 * DAY_MS));
}

function getIsoWeekStart(localDate: string): string {
  const date = parseLocalDate(localDate);
  const day = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  const diff = day - 1; // Monday = 1
  date.setUTCDate(date.getUTCDate() - diff);
  return formatLocalDate(date);
}

export function getIsoWeekKey(localDate: string): string {
  return getIsoWeekStart(localDate);
}

function normaliseEntries(
  entries: StreakEntry[],
  timezone: string,
  graceHour: number,
  today: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  const todayTime = parseLocalDate(today).getTime();

  for (const entry of entries) {
    if (entry.count <= 0) {
      continue;
    }

    let localDate = entry.localDate;
    if (!localDate) {
      const occurredAt = entry.occurredAt ? new Date(entry.occurredAt) : null;
      if (!occurredAt) {
        continue;
      }
      localDate = getLocalDateForTZ(timezone, occurredAt, graceHour);
    }

    try {
      const parsedTime = parseLocalDate(localDate).getTime();
      if (parsedTime > todayTime) {
        continue;
      }
    } catch {
      continue;
    }

    const key = localDate;
    const existing = counts.get(key) ?? 0;
    counts.set(key, existing + entry.count);
  }

  return counts;
}

function computeDailyStreak(
  successDates: string[],
  today: string,
): StreakResult {
  if (successDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sorted = [...successDates].sort((a, b) => parseLocalDate(a).getTime() - parseLocalDate(b).getTime());

  // Calculate longest streak (traditional consecutive days)
  let longest = 0;
  let currentRun = 0;
  let previous: string | null = null;

  for (const date of sorted) {
    if (!previous || diffInDays(date, previous) === 1) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }
    if (currentRun > longest) {
      longest = currentRun;
    }
    previous = date;
  }

  // Calculate current streak based on "days with at least one completion"
  // This is a simpler model: count consecutive days that have any activity
  const latest = sorted[sorted.length - 1];
  const daysBetween = diffInDays(today, latest);
  if (daysBetween > 1) {
    return { current: 0, longest };
  }

  // Count consecutive days backwards from the latest activity day
  // This counts days that have ANY activity, not necessarily meeting targets
  let current = 0;
  let cursor = latest;

  while (true) {
    if (sorted.includes(cursor)) {
      current += 1;
      cursor = previousDay(cursor);
    } else {
      break;
    }
  }

  return { current, longest };
}

function computeWeeklyStreak(
  successWeeks: string[],
  todayWeek: string,
): StreakResult {
  if (successWeeks.length === 0) {
    return { current: 0, longest: 0 };
  }

  const sorted = [...successWeeks].sort((a, b) => parseLocalDate(a).getTime() - parseLocalDate(b).getTime());
  let longest = 0;
  let currentRun = 0;
  let previous: string | null = null;

  for (const week of sorted) {
    if (!previous || diffInWeeks(week, previous) === 1) {
      currentRun += 1;
    } else {
      currentRun = 1;
    }
    if (currentRun > longest) {
      longest = currentRun;
    }
    previous = week;
  }

  const latest = sorted[sorted.length - 1];
  const weeksBetween = diffInWeeks(todayWeek, latest);
  if (weeksBetween > 1) {
    return { current: 0, longest };
  }

  const successSet = new Set(sorted);
  let current = 0;
  let cursor = latest;
  while (successSet.has(cursor)) {
    current += 1;
    cursor = previousWeekStart(cursor);
  }

  return { current, longest };
}

export function computeStreak(options: ComputeStreakOptions): StreakResult {
  const {
    cadence,
    target,
    timezone,
    entries,
    now = new Date(),
    graceHour = 3,
  } = options;

  if (target <= 0) {
    return { current: 0, longest: 0 };
  }

  const todayLocalDate = getLocalDateForTZ(timezone, now, graceHour);
  const countsByDate = normaliseEntries(entries, timezone, graceHour, todayLocalDate);

  if (cadence === 'daily') {
    // For streaks, we only count the first habit completion of each day
    // This means streak increments only when someone completes their first habit of the day
    const firstCompletionDates = Array.from(countsByDate.entries())
      .filter(([, count]) => count > 0)
      .map(([date]) => date);

    return computeDailyStreak(firstCompletionDates, todayLocalDate);
  }

  const todayWeekKey = getIsoWeekKey(todayLocalDate);
  const weekCounts = new Map<string, number>();

  for (const [date, count] of countsByDate.entries()) {
    const key = getIsoWeekKey(date);
    weekCounts.set(key, (weekCounts.get(key) ?? 0) + count);
  }

  // For weekly streaks, we use "weeks with at least one completion" rather than meeting targets
  const activityWeeks = Array.from(weekCounts.entries())
    .filter(([, count]) => count > 0)
    .map(([week]) => week);

  return computeWeeklyStreak(activityWeeks, todayWeekKey);
}

export function computeCurrentPeriodCount(
  cadence: 'daily' | 'weekly',
  timezone: string,
  target: number,
  entries: StreakEntry[],
  now: Date = new Date(),
  graceHour = 3,
): number {
  const todayLocalDate = getLocalDateForTZ(timezone, now, graceHour);
  const countsByDate = normaliseEntries(entries, timezone, graceHour, todayLocalDate);

  if (cadence === 'daily') {
    return countsByDate.get(todayLocalDate) ?? 0;
  }

  const weekKey = getIsoWeekKey(todayLocalDate);
  let total = 0;
  for (const [date, count] of countsByDate.entries()) {
    if (getIsoWeekKey(date) === weekKey) {
      total += count;
    }
  }

  return total;
}

export type AccountStreakOptions = {
  timezone: string;
  allHabitEntries: StreakEntry[][]; // Array of entries for each habit
  now?: Date;
  graceHour?: number;
};

export function computeAccountStreak(options: AccountStreakOptions): StreakResult {
  const {
    timezone,
    allHabitEntries,
    now = new Date(),
    graceHour = 3,
  } = options;

  if (allHabitEntries.length === 0) {
    return { current: 0, longest: 0 };
  }

  const todayLocalDate = getLocalDateForTZ(timezone, now, graceHour);
  
  // Combine all habit entries and normalize them
  const allEntries: StreakEntry[] = allHabitEntries.flat();
  const countsByDate = normaliseEntries(allEntries, timezone, graceHour, todayLocalDate);

  // Get dates where user completed at least one habit (any count > 0)
  const activeDates = Array.from(countsByDate.entries())
    .filter(([, count]) => count > 0)
    .map(([date]) => date);

  return computeDailyStreak(activeDates, todayLocalDate);
}
