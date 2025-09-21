'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getLocalDateForTZ } from '@/lib/dates';
import {
  computeCurrentPeriodCount,
  computeStreak,
  type StreakEntry,
} from '@/lib/streak';
import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements, getEntitlementLimits, canCreateHabit } from '@/lib/entitlements-server';

import { habitFormInitialState, type HabitFormState } from './form-state';
import type { HabitCadence, HabitSummary } from './types';

const createHabitSchema = z.object({
  title: z
    .string({ required_error: 'Title is required.' })
    .trim()
    .min(3, 'Title must be at least 3 characters long.')
    .max(80, 'Title must be at most 80 characters long.'),
  emoji: z
    .string()
    .trim()
    .max(8, 'Emoji must be short and sweet.')
    .optional(),
  cadence: z.enum(['daily', 'weekly', 'custom'], {
    required_error: 'Select a cadence.',
    invalid_type_error: 'Select a valid cadence.',
  }),
  targetPerPeriod: z
    .string({ required_error: 'Target is required.' })
    .trim()
    .min(1, 'Target is required.')
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isFinite(value), 'Enter a valid whole number.')
    .pipe(z.number().int().min(1, 'Target must be at least 1.').max(24, 'Target must be 24 or less.')),
  timezone: z
    .string()
    .trim()
    .max(64, 'Timezone name is too long.')
    .optional(),
});

function toHabitSummary(record: {
  id: string;
  title: string;
  emoji: string | null;
  cadence: string;
  target_per_period: number;
  timezone: string;
  created_at: string;
}): HabitSummary {
  return {
    id: record.id,
    title: record.title,
    emoji: record.emoji,
    cadence: record.cadence as HabitSummary['cadence'],
    targetPerPeriod: record.target_per_period,
    timezone: record.timezone,
    createdAt: record.created_at,
    currentPeriodCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    todayCount: 0,
  };
}

export async function createHabit(
  _prevState: HabitFormState,
  formData: FormData,
): Promise<HabitFormState> {
  const parsed = createHabitSchema.safeParse({
    title: formData.get('title'),
    emoji: formData.get('emoji') ?? undefined,
    cadence: formData.get('cadence'),
    targetPerPeriod: formData.get('targetPerPeriod'),
    timezone: formData.get('timezone') ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: HabitFormState['fieldErrors'] = {};
    const flattened = parsed.error.flatten().fieldErrors;

    (Object.keys(flattened) as Array<keyof typeof flattened>).forEach((key) => {
      const message = flattened[key]?.[0];
      if (message) {
        if (key === 'targetPerPeriod') {
          fieldErrors.targetPerPeriod = message;
        } else if (key === 'title' || key === 'emoji' || key === 'cadence' || key === 'timezone') {
          fieldErrors[key] = message;
        }
      }
    });

    return {
      ...habitFormInitialState,
      status: 'error',
      message: 'Please fix the highlighted fields.',
      fieldErrors,
    };
  }

  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      ...habitFormInitialState,
      status: 'error',
      message: 'You need to be signed in to create habits.',
    };
  }

  const userId = session.user.id;

  // Check entitlements before proceeding
  const entitlements = await fetchUserEntitlements(userId);
  const { data: habitCount } = await supabase
    .from('habits')
    .select('id', { count: 'exact' })
    .eq('owner_id', userId)
    .eq('is_archived', false);

  if (!canCreateHabit(entitlements, habitCount?.length ?? 0)) {
    const upgradeMessage = entitlements?.tier === 'free'
      ? 'You\'ve reached your free tier limit of 3 habits. Upgrade to Pro for more habits!'
      : 'You\'ve reached your current tier limit. Upgrade to Plus for unlimited habits!';

    return {
      ...habitFormInitialState,
      status: 'error',
      message: upgradeMessage,
      fieldErrors: {
        title: 'Upgrade required to create more habits',
      },
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone, emoji')
    .eq('id', userId)
    .maybeSingle();

  const timezone = parsed.data.timezone && parsed.data.timezone.length > 0
    ? parsed.data.timezone
    : profile?.timezone ?? 'UTC';

  const emoji = parsed.data.emoji && parsed.data.emoji.length > 0
    ? parsed.data.emoji
    : profile?.emoji ?? '🍋';

  const { data, error } = await supabase
    .from('habits')
    .insert({
      owner_id: userId,
      title: parsed.data.title,
      emoji,
      cadence: parsed.data.cadence,
      target_per_period: parsed.data.targetPerPeriod,
      timezone,
    })
    .select('id, title, emoji, cadence, target_per_period, timezone, created_at')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      return {
        ...habitFormInitialState,
        status: 'error',
        message: 'You already have a habit with that title.',
        fieldErrors: {
          title: 'Choose a different title. Each habit needs a unique name.',
        },
      };
    }

    return {
      ...habitFormInitialState,
      status: 'error',
      message: error?.message ?? 'We could not create that habit right now.',
    };
  }

  const habit = toHabitSummary(data);

  revalidatePath('/app/habits');

  return {
    status: 'success',
    message: 'Habit saved. Momentum unlocked!',
    habit,
  };
}

type CompleteHabitResult =
  | {
      success: true;
      periodCount: number;
      currentStreak: number;
      longestStreak: number;
    }
  | {
      success: false;
      message: string;
    };

export async function completeHabitToday(params: { habitId: string }): Promise<CompleteHabitResult> {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      success: false,
      message: 'You must be signed in to log progress.',
    };
  }

  const userId = session.user.id;
  const habitId = params.habitId;

  const { data: habitRecord } = await supabase
    .from('habits')
    .select('id, cadence, target_per_period, timezone')
    .eq('id', habitId)
    .eq('owner_id', userId)
    .maybeSingle();

  if (!habitRecord) {
    return {
      success: false,
      message: 'Habit not found.',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();

  const timezone = profile?.timezone ?? 'UTC';
  const localDate = getLocalDateForTZ(timezone);

  const { data: existingCheckin } = await supabase
    .from('checkins')
    .select('id, count')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('local_date', localDate)
    .maybeSingle();

  let todayCount = 1;

  if (existingCheckin) {
    const newCount = (existingCheckin.count ?? 0) + 1;
    const { data: updated, error: updateError } = await supabase
      .from('checkins')
      .update({ count: newCount })
      .eq('id', existingCheckin.id)
      .select('count')
      .single();

    if (updateError || !updated) {
      return {
        success: false,
        message: updateError?.message ?? 'Could not log your progress right now.',
      };
    }

    todayCount = updated.count ?? newCount;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('checkins')
      .insert({
        habit_id: habitId,
        user_id: userId,
        local_date: localDate,
        count: 1,
      })
      .select('count')
      .single();

    if (insertError || !inserted) {
      if (insertError?.code === '23505') {
        // Unique constraint hit due to race; retry once for fresh count.
        const { data: retry } = await supabase
          .from('checkins')
          .select('count')
          .eq('habit_id', habitId)
          .eq('user_id', userId)
          .eq('local_date', localDate)
          .maybeSingle();

        if (!retry) {
          return {
            success: false,
            message: 'Could not confirm your streak due to a sync conflict.',
          };
        }

        todayCount = (retry.count ?? 0) + 1;

        const { data: locked, error: lockError } = await supabase
          .from('checkins')
          .update({ count: todayCount })
          .eq('habit_id', habitId)
          .eq('user_id', userId)
          .eq('local_date', localDate)
          .select('count')
          .single();

        if (lockError || !locked) {
          return {
            success: false,
            message: lockError?.message ?? 'Could not complete the check-in.',
          };
        }

        todayCount = locked.count ?? todayCount;
      } else {
        return {
          success: false,
          message: insertError?.message ?? 'Could not log your progress right now.',
        };
      }
    } else {
      todayCount = inserted.count ?? 1;
    }
  }

  const { data: habitCheckins } = await supabase
    .from('checkins')
    .select('local_date, count')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .order('local_date', { ascending: true });

  const entries: StreakEntry[] = (habitCheckins ?? []).map((checkin) => ({
    localDate: checkin.local_date,
    count: checkin.count ?? 0,
  }));

  const cadence = habitRecord.cadence as HabitCadence;
  const now = new Date();

  // Only compute streaks for daily and weekly cadences
  let streak = { current: 0, longest: 0 };
  let periodCount = 0;

  if (cadence === 'daily' || cadence === 'weekly') {
    streak = computeStreak({
      cadence,
      target: habitRecord.target_per_period,
      timezone: habitRecord.timezone,
      entries,
      now,
    });

    periodCount = computeCurrentPeriodCount(
      cadence,
      habitRecord.timezone,
      habitRecord.target_per_period,
      entries,
      now,
    );
  }

  revalidatePath('/app/habits');

  return {
    success: true,
    periodCount,
    currentStreak: streak.current,
    longestStreak: streak.longest,
  };
}
