import { createServerClient } from '@/lib/supabase/server';
import { computeAccountStreak, type StreakEntry } from '@/lib/streak';

export type BadgeCheckContext = {
  userId: string;
  habitId?: string;
  groupId?: string;
  action: 'habit_created' | 'habit_completed' | 'group_joined' | 'group_created' | 'profile_updated' | 'subscription_updated';
  metadata?: Record<string, unknown>;
};

export type BadgeResult = {
  awarded: boolean;
  badgeKind?: string;
  message?: string;
};

/**
 * Check and award badges based on user actions
 */
export async function checkAndAwardBadges(context: BadgeCheckContext): Promise<BadgeResult[]> {
  const supabase = await createServerClient();
  const results: BadgeResult[] = [];

  try {
    switch (context.action) {
      case 'habit_created':
        results.push(...await checkHabitCreatedBadges(supabase, context));
        break;
      case 'habit_completed':
        results.push(...await checkHabitCompletedBadges(supabase, context));
        break;
      case 'group_joined':
        results.push(...await checkGroupJoinedBadges(supabase, context));
        break;
      case 'group_created':
        results.push(...await checkGroupCreatedBadges(supabase, context));
        break;
      case 'profile_updated':
        results.push(...await checkProfileUpdatedBadges(supabase, context));
        break;
      case 'subscription_updated':
        results.push(...await checkSubscriptionBadges(supabase, context));
        break;
    }

    // Check streak-based badges after any habit completion
    if (context.action === 'habit_completed') {
      results.push(...await checkStreakBadges(supabase, context));
    }

  } catch (error) {
    console.error('Error checking badges:', error);
  }

  return results;
}

async function checkHabitCreatedBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, context: BadgeCheckContext): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Check if user has any habits (first habit created)
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('owner_id', context.userId)
    .eq('is_archived', false);

  if (habits && habits.length === 1) {
    const awarded = await awardBadge(supabase, context.userId, 'habit_creator');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'habit_creator',
        message: '🏆 Badge unlocked: Habit Creator!'
      });
    }
  }

  // Check for habit collector (5 habits)
  if (habits && habits.length === 5) {
    const awarded = await awardBadge(supabase, context.userId, 'habit_collector');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'habit_collector',
        message: '🏆 Badge unlocked: Habit Collector!'
      });
    }
  }

  // Check for habit master (10 habits)
  if (habits && habits.length === 10) {
    const awarded = await awardBadge(supabase, context.userId, 'habit_master');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'habit_master',
        message: '🏆 Badge unlocked: Habit Master!'
      });
    }
  }

  return results;
}

async function checkHabitCompletedBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, context: BadgeCheckContext): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Check total check-ins
  const { data: checkins } = await supabase
    .from('checkins')
    .select('id')
    .eq('user_id', context.userId);

  const totalCheckins = checkins?.length || 0;

  // Daily dedication (50 check-ins)
  if (totalCheckins === 50) {
    const awarded = await awardBadge(supabase, context.userId, 'daily_dedication');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'daily_dedication',
        message: '🏆 Badge unlocked: Daily Dedication!'
      });
    }
  }

  // Consistency king (500 check-ins)
  if (totalCheckins === 500) {
    const awarded = await awardBadge(supabase, context.userId, 'consistency_king');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'consistency_king',
        message: '🏆 Badge unlocked: Consistency King!'
      });
    }
  }

  return results;
}

async function checkStreakBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, context: BadgeCheckContext): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Get user's profile for timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', context.userId)
    .single();

  if (!profile) return results;

  // Get all habits and their checkins
  const { data: habits } = await supabase
    .from('habits')
    .select(`
      id,
      checkins (local_date, count)
    `)
    .eq('owner_id', context.userId)
    .eq('is_archived', false);

  if (!habits || habits.length === 0) return results;

  // Calculate account streak
  const allHabitEntries: StreakEntry[][] = habits.map(habit => 
    (habit.checkins || []).map((checkin: { count: number; local_date: string }) => ({
      count: checkin.count,
      localDate: checkin.local_date,
    }))
  );

  const streakResult = computeAccountStreak({
    timezone: profile.timezone || 'UTC',
    allHabitEntries,
  });

  // Check streak milestones
  const streakMilestones = [
    { days: 1, badge: 'first_streak' },
    { days: 7, badge: 'week_warrior' },
    { days: 30, badge: 'month_master' },
    { days: 100, badge: 'century_club' },
    { days: 365, badge: 'streak_legend' },
  ];

  for (const milestone of streakMilestones) {
    if (streakResult.current === milestone.days) {
      const awarded = await awardBadge(supabase, context.userId, milestone.badge);
      if (awarded) {
        results.push({
          awarded: true,
          badgeKind: milestone.badge,
          message: `🏆 Badge unlocked: ${getBadgeName(milestone.badge)}!`
        });
      }
    }
  }

  return results;
}

async function checkGroupJoinedBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, context: BadgeCheckContext): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Check group joiner (first group joined)
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', context.userId);

  if (memberships && memberships.length === 1) {
    const awarded = await awardBadge(supabase, context.userId, 'group_joiner');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'group_joiner',
        message: '🏆 Badge unlocked: Group Joiner!'
      });
    }
  }

  // Check social butterfly (3 groups)
  if (memberships && memberships.length === 3) {
    const awarded = await awardBadge(supabase, context.userId, 'social_butterfly');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'social_butterfly',
        message: '🏆 Badge unlocked: Social Butterfly!'
      });
    }
  }

  return results;
}

async function checkGroupCreatedBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, context: BadgeCheckContext): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Check group leader (first group created)
  const { data: ownedGroups } = await supabase
    .from('groups')
    .select('id')
    .eq('owner_id', context.userId);

  if (ownedGroups && ownedGroups.length === 1) {
    const awarded = await awardBadge(supabase, context.userId, 'group_leader');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'group_leader',
        message: '🏆 Badge unlocked: Group Leader!'
      });
    }
  }

  return results;
}

async function checkProfileUpdatedBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, context: BadgeCheckContext): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Check if profile was made public
  if (context.metadata?.is_public === true) {
    const awarded = await awardBadge(supabase, context.userId, 'public_profile');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'public_profile',
        message: '🏆 Badge unlocked: Public Profile!'
      });
    }
  }

  return results;
}

async function checkSubscriptionBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, context: BadgeCheckContext): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Check subscription tier badges
  if (context.metadata?.tier === 'pro') {
    const awarded = await awardBadge(supabase, context.userId, 'pro_upgrade');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'pro_upgrade',
        message: '🏆 Badge unlocked: Pro Upgrade!'
      });
    }
  }

  if (context.metadata?.tier === 'plus') {
    const awarded = await awardBadge(supabase, context.userId, 'plus_upgrade');
    if (awarded) {
      results.push({
        awarded: true,
        badgeKind: 'plus_upgrade',
        message: '🏆 Badge unlocked: Plus Upgrade!'
      });
    }
  }

  return results;
}

async function awardBadge(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string, badgeKind: string): Promise<boolean> {
  try {
    // Check if badge already exists
    const { data: existing } = await supabase
      .from('badges')
      .select('id')
      .eq('user_id', userId)
      .eq('kind', badgeKind)
      .maybeSingle();

    if (existing) {
      return false; // Already awarded
    }

    // Award the badge
    const { error } = await supabase
      .from('badges')
      .insert({
        user_id: userId,
        kind: badgeKind,
      });

    return !error;
  } catch (error) {
    console.error('Error awarding badge:', error);
    return false;
  }
}

function getBadgeName(badgeKind: string): string {
  const names: Record<string, string> = {
    'first_streak': 'Getting Started',
    'week_warrior': 'Week Warrior',
    'month_master': 'Month Master',
    'century_club': 'Century Club',
    'streak_legend': 'Streak Legend',
  };
  return names[badgeKind] || badgeKind;
}

/**
 * Check for special badges that require more complex logic
 */
export async function checkSpecialBadges(userId: string): Promise<BadgeResult[]> {
  const supabase = await createServerClient();
  const results: BadgeResult[] = [];

  try {
    // Check comeback kid badge (restart streak after break)
    const comebackAwarded = await checkComebackKidBadge(supabase, userId);
    if (comebackAwarded) {
      results.push({
        awarded: true,
        badgeKind: 'comeback_kid',
        message: '🏆 Badge unlocked: Comeback Kid!'
      });
    }

    // Check early bird / night owl badges
    const timeBasedBadges = await checkTimeBasedBadges(supabase, userId);
    results.push(...timeBasedBadges);

  } catch (error) {
    console.error('Error checking special badges:', error);
  }

  return results;
}

async function checkComebackKidBadge(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string): Promise<boolean> {
  // Check if user has broken and restarted streaks
  // This is a simplified version - in a real implementation you'd track streak breaks
  
  // Get user's current streak
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  // Get all habits and their checkins
  const { data: habits } = await supabase
    .from('habits')
    .select(`
      id,
      checkins (local_date, count)
    `)
    .eq('owner_id', userId)
    .eq('is_archived', false);

  if (!habits || habits.length === 0) return false;

  // Calculate account streak
  const allHabitEntries: StreakEntry[][] = habits.map(habit => 
    (habit.checkins || []).map((checkin: { count: number; local_date: string }) => ({
      count: checkin.count,
      localDate: checkin.local_date,
    }))
  );

  const streakResult = computeAccountStreak({
    timezone: profile.timezone || 'UTC',
    allHabitEntries,
  });

  // If user has a current streak but it's less than their longest, they've had a comeback
  if (streakResult.current > 0 && streakResult.current < streakResult.longest) {
    const awarded = await awardBadge(supabase, userId, 'comeback_kid');
    return awarded;
  }

  return false;
}

async function checkTimeBasedBadges(supabase: Awaited<ReturnType<typeof createServerClient>>, userId: string): Promise<BadgeResult[]> {
  const results: BadgeResult[] = [];

  // Check for early bird (habits completed before 6 AM)
  const { data: earlyCheckins } = await supabase
    .from('checkins')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

  if (earlyCheckins) {
    const hasEarlyBird = earlyCheckins.some(checkin => {
      const hour = new Date(checkin.created_at).getHours();
      return hour < 6;
    });

    if (hasEarlyBird) {
      const awarded = await awardBadge(supabase, userId, 'early_bird');
      if (awarded) {
        results.push({
          awarded: true,
          badgeKind: 'early_bird',
          message: '🏆 Badge unlocked: Early Bird!'
        });
      }
    }

    const hasNightOwl = earlyCheckins.some(checkin => {
      const hour = new Date(checkin.created_at).getHours();
      return hour >= 22;
    });

    if (hasNightOwl) {
      const awarded = await awardBadge(supabase, userId, 'night_owl');
      if (awarded) {
        results.push({
          awarded: true,
          badgeKind: 'night_owl',
          message: '🏆 Badge unlocked: Night Owl!'
        });
      }
    }
  }

  return results;
}
