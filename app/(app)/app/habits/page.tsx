import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';
import { computeCurrentPeriodCount, computeStreak, computeAccountStreak } from '@/lib/streak';

import { HabitsClient } from './habits-client';
import type { HabitSummary } from './types';

type HabitRow = {
  id: string;
  title: string;
  emoji: string | null;
  cadence: string;
  target_per_period: number;
  timezone: string;
  created_at: string;
};

type CheckinRow = {
  local_date: string;
  count: number;
};

function toHabitSummary(
  habit: HabitRow,
  checkins: CheckinRow[],
  timezone: string,
): HabitSummary {
  const entries = checkins.map((checkin) => ({
    localDate: checkin.local_date,
    count: checkin.count,
  }));

  const now = new Date();
  
  // Only compute streaks for daily and weekly cadences
  let streak = { current: 0, longest: 0 };
  let currentPeriodCount = 0;

  if (habit.cadence === 'daily' || habit.cadence === 'weekly') {
    streak = computeStreak({
      cadence: habit.cadence as 'daily' | 'weekly',
      target: habit.target_per_period,
      timezone,
      entries,
      now,
    });

    currentPeriodCount = computeCurrentPeriodCount(
      habit.cadence as 'daily' | 'weekly',
      timezone,
      habit.target_per_period,
      entries,
      now,
    );
  }

  return {
    id: habit.id,
    title: habit.title,
    emoji: habit.emoji,
    cadence: habit.cadence as HabitSummary['cadence'],
    targetPerPeriod: habit.target_per_period,
    timezone,
    createdAt: habit.created_at,
    currentPeriodCount,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    todayCount: currentPeriodCount,
  };
}

export default async function HabitsPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get user profile for timezone and emoji defaults
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, emoji')
    .eq('id', userId)
    .maybeSingle();

  const timezone = profile?.timezone ?? 'UTC';
  const defaultEmoji = profile?.emoji ?? '🍋';

  // Get all habits for the user
  const { data: habitsData, error: habitsError } = await supabase
    .from('habits')
    .select('id, title, emoji, cadence, target_per_period, timezone, created_at')
    .eq('owner_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true });

  if (habitsError || !habitsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Failed to load habits. Please try again.</p>
      </div>
    );
  }

  // Get checkins for all habits
  const habitIds = habitsData.map((habit) => habit.id);
  const { data: checkinsData, error: checkinsError } = await supabase
    .from('checkins')
    .select('habit_id, local_date, count')
    .eq('user_id', userId)
    .in('habit_id', habitIds)
    .order('local_date', { ascending: true });

  if (checkinsError) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Failed to load checkins. Please try again.</p>
      </div>
    );
  }

  // Group checkins by habit_id
  const checkinsByHabit = new Map<string, CheckinRow[]>();
  (checkinsData ?? []).forEach((checkin) => {
    const existing = checkinsByHabit.get(checkin.habit_id) ?? [];
    checkinsByHabit.set(checkin.habit_id, [...existing, checkin]);
  });

  // Convert to HabitSummary with computed streaks
  const habits: HabitSummary[] = habitsData.map((habit) => {
    const checkins = checkinsByHabit.get(habit.id) ?? [];
    return toHabitSummary(habit, checkins, timezone);
  });

  // Calculate account-level streak
  const allHabitEntries = habits.map((habit) => {
    const checkins = checkinsByHabit.get(habit.id) ?? [];
    return checkins.map((checkin) => ({
      localDate: checkin.local_date,
      count: checkin.count,
    }));
  });

  const accountStreak = computeAccountStreak({
    timezone,
    allHabitEntries,
    now: new Date(),
  });

  return (
    <HabitsClient
      habits={habits}
      timezone={timezone}
      defaultEmoji={defaultEmoji}
      accountStreak={accountStreak}
    />
  );
}
