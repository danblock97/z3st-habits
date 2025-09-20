import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareButton } from '@/components/ui/share-button';
import { createServerClient } from '@/lib/supabase/server';
import { computeStreak } from '@/lib/streak';

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

  if (habits) {
    for (const habit of habits) {
      const { data: checkins } = await supabase
        .from('checkins')
        .select('count, local_date')
        .eq('habit_id', habit.id)
        .eq('user_id', profile.id)
        .order('local_date', { ascending: true });

      const entries = checkins?.map(c => ({ count: c.count, localDate: c.local_date })) || [];
      const streak = computeStreak({
        cadence: habit.cadence,
        target: habit.target_per_period,
        timezone: habit.timezone,
        entries,
        now: new Date(),
      });

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
        current_streak: streak.current,
        longest_streak: streak.longest,
        total_checkins: totalCheckins,
      });
    }
  }

  // Calculate overall stats
  const totalHabits = habitsWithStats.length;
  const totalCurrentStreaks = habitsWithStats.reduce((sum, habit) => sum + habit.current_streak, 0);
  const totalLongestStreaks = habitsWithStats.reduce((sum, habit) => sum + habit.longest_streak, 0);
  const totalCheckins = habitsWithStats.reduce((sum, habit) => sum + habit.total_checkins, 0);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
            {profile.emoji || '👤'}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            {profile.bio && (
              <p className="text-muted-foreground">{profile.bio}</p>
            )}
          </div>
        </div>
        <ShareButton title={`${profile.username}'s profile`} />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHabits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCurrentStreaks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLongestStreaks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Habits List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Habits</h2>
        {habitsWithStats.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No habits yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {habitsWithStats.map((habit) => (
              <Card key={habit.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {habit.emoji && (
                      <div className="text-2xl">{habit.emoji}</div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{habit.title}</CardTitle>
                      <CardDescription>
                        {habit.cadence === 'daily' ? 'Daily' : 'Weekly'} habit
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {habit.current_streak} day{habit.current_streak !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Best streak:</span>
                      <div className="font-medium">
                        {habit.longest_streak} day{habit.longest_streak !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total check-ins:</span>
                      <div className="font-medium">{habit.total_checkins}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
