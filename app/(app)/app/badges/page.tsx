import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BadgesClient } from './badges-client';

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'streak' | 'habits' | 'social' | 'milestone' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
};

export default async function BadgesPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get user's unlocked badges
  const { data: userBadges } = await supabase
    .from('badges')
    .select('kind, awarded_at')
    .eq('user_id', userId);

  const unlockedBadgeKinds = new Set(userBadges?.map(b => b.kind) || []);

  // Define all possible badges
  const allBadges: BadgeDefinition[] = [
    // Streak Badges
    {
      id: 'first_streak',
      name: 'Getting Started',
      description: 'Complete your first habit streak',
      emoji: '🌱',
      category: 'streak',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('first_streak'),
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      emoji: '⚔️',
      category: 'streak',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('week_warrior'),
    },
    {
      id: 'month_master',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      emoji: '👑',
      category: 'streak',
      rarity: 'rare',
      unlocked: unlockedBadgeKinds.has('month_master'),
    },
    {
      id: 'century_club',
      name: 'Century Club',
      description: 'Maintain a 100-day streak',
      emoji: '💯',
      category: 'streak',
      rarity: 'epic',
      unlocked: unlockedBadgeKinds.has('century_club'),
    },
    {
      id: 'streak_legend',
      name: 'Streak Legend',
      description: 'Maintain a 365-day streak',
      emoji: '🏆',
      category: 'streak',
      rarity: 'legendary',
      unlocked: unlockedBadgeKinds.has('streak_legend'),
    },

    // Habit Badges
    {
      id: 'habit_creator',
      name: 'Habit Creator',
      description: 'Create your first habit',
      emoji: '✨',
      category: 'habits',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('habit_creator'),
    },
    {
      id: 'habit_collector',
      name: 'Habit Collector',
      description: 'Create 5 different habits',
      emoji: '📚',
      category: 'habits',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('habit_collector'),
    },
    {
      id: 'habit_master',
      name: 'Habit Master',
      description: 'Create 10 different habits',
      emoji: '🎓',
      category: 'habits',
      rarity: 'rare',
      unlocked: unlockedBadgeKinds.has('habit_master'),
    },
    {
      id: 'daily_dedication',
      name: 'Daily Dedication',
      description: 'Complete 50 daily habit check-ins',
      emoji: '📅',
      category: 'habits',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('daily_dedication'),
    },
    {
      id: 'consistency_king',
      name: 'Consistency King',
      description: 'Complete 500 habit check-ins',
      emoji: '🎯',
      category: 'habits',
      rarity: 'rare',
      unlocked: unlockedBadgeKinds.has('consistency_king'),
    },

    // Social Badges
    {
      id: 'group_joiner',
      name: 'Group Joiner',
      description: 'Join your first group',
      emoji: '🤝',
      category: 'social',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('group_joiner'),
    },
    {
      id: 'group_leader',
      name: 'Group Leader',
      description: 'Create your first group',
      emoji: '👑',
      category: 'social',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('group_leader'),
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Join 3 different groups',
      emoji: '🦋',
      category: 'social',
      rarity: 'rare',
      unlocked: unlockedBadgeKinds.has('social_butterfly'),
    },
    {
      id: 'public_profile',
      name: 'Public Profile',
      description: 'Make your profile public',
      emoji: '🌍',
      category: 'social',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('public_profile'),
    },

    // Milestone Badges
    {
      id: 'early_adopter',
      name: 'Early Adopter',
      description: 'Join within the first month',
      emoji: '🚀',
      category: 'milestone',
      rarity: 'rare',
      unlocked: unlockedBadgeKinds.has('early_adopter'),
    },
    {
      id: 'pro_upgrade',
      name: 'Pro Upgrade',
      description: 'Upgrade to Pro tier',
      emoji: '⭐',
      category: 'milestone',
      rarity: 'rare',
      unlocked: unlockedBadgeKinds.has('pro_upgrade'),
    },
    {
      id: 'plus_upgrade',
      name: 'Plus Upgrade',
      description: 'Upgrade to Plus tier',
      emoji: '💎',
      category: 'milestone',
      rarity: 'epic',
      unlocked: unlockedBadgeKinds.has('plus_upgrade'),
    },

    // Special Badges
    {
      id: 'perfect_week',
      name: 'Perfect Week',
      description: 'Complete all habits for 7 consecutive days',
      emoji: '🌟',
      category: 'special',
      rarity: 'rare',
      unlocked: unlockedBadgeKinds.has('perfect_week'),
    },
    {
      id: 'comeback_kid',
      name: 'Comeback Kid',
      description: 'Restart a streak after it breaks',
      emoji: '🔄',
      category: 'special',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('comeback_kid'),
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Complete habits after 10 PM',
      emoji: '🦉',
      category: 'special',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('night_owl'),
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Complete habits before 6 AM',
      emoji: '🐦',
      category: 'special',
      rarity: 'common',
      unlocked: unlockedBadgeKinds.has('early_bird'),
    },
  ];

  // Add unlock dates for unlocked badges
  const badgesWithDates = allBadges.map(badge => {
    if (badge.unlocked) {
      const badgeData = userBadges?.find(b => b.kind === badge.id);
      return {
        ...badge,
        unlockedAt: badgeData?.awarded_at,
      };
    }
    return badge;
  });

  return <BadgesClient badges={badgesWithDates} />;
}
