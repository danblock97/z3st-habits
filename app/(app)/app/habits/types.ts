export type HabitCadence = 'daily' | 'weekly' | 'custom';

export type HabitSummary = {
  id: string;
  title: string;
  emoji: string | null;
  cadence: HabitCadence;
  targetPerPeriod: number;
  timezone: string;
  createdAt: string;
  currentPeriodCount: number;
  currentStreak: number;
  longestStreak: number;
  todayCount: number;
};
