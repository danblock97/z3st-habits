// import { redirect } from 'next/navigation'; // Unused import
import { createServerClient } from '@/lib/supabase/server';
import { computeAccountStreak } from '@/lib/streak';
import { LeaderboardClient } from './leaderboard-client';

export type LeaderboardEntry = {
  id: string;
  username: string;
  emoji: string | null;
  currentStreak: number;
  longestStreak: number;
  totalHabits: number;
  avatar_url: string | null;
  badgeCount: number;
  badges: Array<{
    kind: string;
    awarded_at: string;
  }>;
};

export default async function LeaderboardPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get all public profiles with their habits, checkins, and badges
  const { data: publicProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      emoji,
      avatar_url,
      timezone,
      habits!inner (
        id,
        cadence,
        target_per_period,
        timezone,
        checkins (
          local_date,
          count
        )
      ),
      badges (
        kind,
        awarded_at
      )
    `)
    .eq('is_public', true)
    .not('username', 'is', null);

  if (profilesError) {
    console.error('Error fetching public profiles:', profilesError);
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Failed to load leaderboard. Please try again.</p>
      </div>
    );
  }

  // Process each profile to calculate their account streak
  const leaderboardEntries: LeaderboardEntry[] = [];

  for (const profile of publicProfiles || []) {
    if (!profile.habits || profile.habits.length === 0) continue;

    // Group habits by user and calculate streaks
    const habits = Array.isArray(profile.habits) ? profile.habits : [profile.habits];
    const allHabitEntries = habits.map(habit => 
      (habit.checkins || []).map((checkin: { count: number; local_date: string }) => ({
        count: checkin.count,
        localDate: checkin.local_date,
      }))
    );

    // Calculate account streak
    const streakResult = computeAccountStreak({
      timezone: profile.timezone || 'UTC',
      allHabitEntries,
    });

    // Only include users with ongoing streaks (currentStreak > 0)
    if (streakResult.current > 0) {
      const badges = Array.isArray(profile.badges) ? profile.badges : [];
      
      leaderboardEntries.push({
        id: profile.id,
        username: profile.username,
        emoji: profile.emoji,
        currentStreak: streakResult.current,
        longestStreak: streakResult.longest,
        totalHabits: habits.length,
        avatar_url: profile.avatar_url,
        badgeCount: badges.length,
        badges: badges,
      });
    }
  }

  // Sort by current streak (descending), then by longest streak (descending), then by badge count (descending)
  leaderboardEntries.sort((a, b) => {
    if (a.currentStreak !== b.currentStreak) {
      return b.currentStreak - a.currentStreak;
    }
    if (a.longestStreak !== b.longestStreak) {
      return b.longestStreak - a.longestStreak;
    }
    return b.badgeCount - a.badgeCount;
  });

  return (
    <LeaderboardClient 
      entries={leaderboardEntries} 
      currentUserId={session?.user?.id} 
    />
  );
}
