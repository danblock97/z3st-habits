import { ShareButton } from '@/components/ui/share-button';
import { createServerClient } from '@/lib/supabase/server';
import { computeAccountStreak } from '@/lib/streak';
import type { StreakEntry } from '@/lib/streak';
import { Sparkles, Flame, Target, Calendar, TrendingUp } from 'lucide-react';

type PublicProfile = {
  id: string;
  username: string;
  emoji: string | null;
  bio: string | null;
  is_public: boolean | null;
};

type HabitWithStats = {
  id: string;
  title: string;
  emoji: string | null;
  color: string | null;
  cadence: 'daily' | 'weekly';
  target_per_period: number;
  timezone: string;
  start_date: string;
  current_streak: number;
  longest_streak: number;
  total_checkins: number;
};

export async function PublicProfilePage({ profile }: { profile: PublicProfile }) {
  const supabase = await createServerClient();

  // Fetch user's public habits (not archived)
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, title, emoji, color, cadence, target_per_period, timezone, start_date')
    .eq('owner_id', profile.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (habitsError) {
    console.error('Error fetching habits:', habitsError);
  }

  // Calculate stats for each habit
  const habitsWithStats: HabitWithStats[] = [];
  const allHabitEntries: StreakEntry[][] = [];

  if (habits) {
    for (const habit of habits) {
      const { data: checkins } = await supabase
        .from('checkins')
        .select('count, local_date')
        .eq('habit_id', habit.id)
        .eq('user_id', profile.id)
        .order('local_date', { ascending: true });

      const entries = checkins?.map(c => ({ count: c.count, localDate: c.local_date })) || [];
      allHabitEntries.push(entries);

      const totalCheckins = entries.reduce((sum, entry) => sum + entry.count, 0);

      habitsWithStats.push({
        id: habit.id,
        title: habit.title,
        emoji: habit.emoji,
        color: habit.color,
        cadence: habit.cadence,
        target_per_period: habit.target_per_period,
        timezone: habit.timezone,
        start_date: habit.start_date,
        current_streak: 0, // No longer per-habit streaks
        longest_streak: 0, // No longer per-habit streaks
        total_checkins: totalCheckins,
      });
    }
  }

  // Calculate account-level streak
  const accountStreak = computeAccountStreak({
    timezone: habits?.[0]?.timezone || 'UTC',
    allHabitEntries,
    now: new Date(),
  });

  // Calculate overall stats
  const totalHabits = habitsWithStats.length;
  const totalCheckins = habitsWithStats.reduce((sum, habit) => sum + habit.total_checkins, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zest-50 via-background to-zest-100">
      {/* Hero Section with Citrus Background */}
      <div className="relative overflow-hidden">
        {/* Decorative citrus elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-zest-200/30 to-zest-300/20 rounded-full blur-xl"></div>
        <div className="absolute top-10 -left-10 w-32 h-32 bg-gradient-to-br from-chart-2/20 to-chart-3/20 rounded-full blur-lg"></div>
        <div className="absolute bottom-10 right-1/4 w-24 h-24 bg-gradient-to-br from-zest-400/20 to-zest-500/20 rounded-full blur-md"></div>
        
        <div className="relative mx-auto max-w-6xl px-4 py-16">
          {/* Profile Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* Profile Avatar with citrus styling */}
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-zest-200 to-zest-300 text-4xl shadow-lg ring-4 ring-zest-100">
                  {profile.emoji || '🍋'}
                </div>
                {/* Decorative ring */}
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-zest-400/20 to-chart-2/20 blur-sm"></div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-zest-800 to-zest-600 bg-clip-text text-transparent">
                  {profile.username}
                </h1>
                {profile.bio && (
                  <p className="text-lg text-zest-700 max-w-md">{profile.bio}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ShareButton title={`${profile.username}'s profile`} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section with Creative Layout */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Habits Count - Citrus Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zest-400 to-zest-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-zest-100 to-zest-200 rounded-2xl p-6 border border-zest-300/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-zest-300/50 rounded-xl">
                  <Target className="h-5 w-5 text-zest-700" />
                </div>
                <h3 className="text-sm font-semibold text-zest-800">Active Habits</h3>
              </div>
              <div className="text-3xl font-bold text-zest-900">{totalHabits}</div>
            </div>
          </div>

          {/* Check-ins - Green Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-chart-2 to-chart-4 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-chart-2/10 to-chart-4/20 rounded-2xl p-6 border border-chart-2/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-chart-2/30 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-chart-4" />
                </div>
                <h3 className="text-sm font-semibold text-chart-4">Total Check-ins</h3>
              </div>
              <div className="text-3xl font-bold text-chart-4">{totalCheckins}</div>
            </div>
          </div>

          {/* Streak - Fire Card */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-chart-3 to-zest-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-chart-3/10 to-zest-400/20 rounded-2xl p-6 border border-chart-3/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-chart-3/30 rounded-xl">
                  <Flame className="h-5 w-5 text-chart-3" />
                </div>
                <h3 className="text-sm font-semibold text-chart-3">Current Streak</h3>
              </div>
              <div className="text-3xl font-bold text-chart-3">{accountStreak.current}</div>
              {accountStreak.longest > accountStreak.current && (
                <p className="text-xs text-chart-3/70 mt-1">
                  Best: {accountStreak.longest} days
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Habits Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-zest-800 to-zest-600 bg-clip-text text-transparent mb-2">
              Habit Collection
            </h2>
            <p className="text-zest-600">Building consistency, one day at a time</p>
          </div>

          {habitsWithStats.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-zest-200 to-zest-300 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-12 w-12 text-zest-600" />
              </div>
              <h3 className="text-xl font-semibold text-zest-700 mb-2">No habits yet</h3>
              <p className="text-zest-500">This user hasn&apos;t started their habit journey yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habitsWithStats.map((habit) => (
                <div key={habit.id} className="group">
                  <div className="relative h-full bg-gradient-to-br from-card to-zest-50/50 rounded-2xl p-6 border border-zest-200/50 hover:border-zest-300/70 transition-all duration-300 hover:shadow-lg hover:shadow-zest-200/20">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-zest-200/20 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                    
                    <div className="relative">
                      <div className="flex items-start gap-4 mb-4">
                        {habit.emoji && (
                          <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                            {habit.emoji}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-zest-900 mb-1 truncate">
                            {habit.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-zest-600">
                            <Calendar className="h-4 w-4" />
                            <span>{habit.cadence === 'daily' ? 'Daily' : 'Weekly'} habit</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zest-600">Total check-ins</span>
                          <span className="text-lg font-bold text-zest-800">{habit.total_checkins}</span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-zest-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-zest-400 to-zest-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (habit.total_checkins / Math.max(1, totalCheckins)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
