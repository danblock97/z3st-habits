'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements } from '@/lib/entitlements-server';

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Check entitlements
  const entitlements = await fetchUserEntitlements(userId);
  if (!entitlements || (entitlements.tier !== 'pro' && entitlements.tier !== 'plus')) {
    return NextResponse.json(
      { error: 'Analytics requires Pro or Plus subscription' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const habitId = searchParams.get('habitId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const period = searchParams.get('period') || '30d'; // 7d, 30d, custom

  // Validate date parameters
  let startDate: Date;
  let endDate: Date = new Date();

  if (period === '7d') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === '30d') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  } else if (dateFrom && dateTo) {
    startDate = new Date(dateFrom);
    endDate = new Date(dateTo);
  } else {
    return NextResponse.json(
      { error: 'Invalid period or date range parameters' },
      { status: 400 }
    );
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format' },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from('checkins')
      .select(`
        id,
        local_date,
        count,
        habit_id,
        habits (
          id,
          title,
          emoji,
          cadence,
          target_per_period
        )
      `)
      .eq('user_id', userId)
      .gte('local_date', startDate.toISOString().split('T')[0])
      .lte('local_date', endDate.toISOString().split('T')[0])
      .order('local_date', { ascending: true });

    // Filter by specific habit if provided
    if (habitId) {
      query = query.eq('habit_id', habitId);
    }

    const { data: checkins, error: checkinsError } = await query;

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }

    // Process data for analytics
    const analyticsData = processAnalyticsData(checkins || [], startDate, endDate);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        type: period === 'custom' ? 'custom' : period
      }
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface ProcessedAnalyticsData {
  summary: {
    totalCheckins: number;
    totalHabits: number;
    averageCompletionRate: number;
    streakDays: number;
    mostActiveHabit: {
      id: string;
      title: string;
      totalCheckins: number;
    } | null;
  };
  dailyStats: Array<{
    date: string;
    totalCheckins: number;
    completionRate: number;
    habitsCompleted: number;
  }>;
  habitBreakdown: Array<{
    habitId: string;
    title: string;
    emoji: string;
    totalCheckins: number;
    completionRate: number;
    streakDays: number;
  }>;
  trends: {
    dailyAverage: number;
    weeklyAverage: number;
    bestDay: string | null;
    consistencyScore: number; // 0-100
  };
}

function processAnalyticsData(
  checkins: Array<{
    id: string;
    local_date: string;
    count: number;
    habit_id: string;
    habits: {
      id: string;
      title: string;
      emoji: string | null;
      cadence: string;
      target_per_period: number;
    } | {
      id: string;
      title: string;
      emoji: string | null;
      cadence: string;
      target_per_period: number;
    }[];
  }>,
  startDate: Date,
  endDate: Date
): ProcessedAnalyticsData {
  const dateRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Group checkins by date and habit
  const checkinsByDate = new Map<string, Map<string, number>>();
  const checkinsByHabit = new Map<string, { title: string; emoji: string; total: number; dates: Set<string> }>();

  checkins.forEach((checkin) => {
    const date = checkin.local_date;
    const habitId = checkin.habit_id;
    const count = checkin.count;

    // Handle both object and array cases for habits
    const habits = Array.isArray(checkin.habits) ? checkin.habits[0] : checkin.habits;
    const habitTitle = habits.title;
    const habitEmoji = habits.emoji || '🍋';

    // Track by date
    if (!checkinsByDate.has(date)) {
      checkinsByDate.set(date, new Map());
    }
    checkinsByDate.get(date)!.set(habitId, count);

    // Track by habit
    if (!checkinsByHabit.has(habitId)) {
      checkinsByHabit.set(habitId, {
        title: habitTitle,
        emoji: habitEmoji,
        total: 0,
        dates: new Set()
      });
    }
    const habitData = checkinsByHabit.get(habitId)!;
    habitData.total += count;
    habitData.dates.add(date);
  });

  // Calculate daily stats
  const dailyStats = Array.from(checkinsByDate.entries()).map(([date, habitCounts]) => {
    const totalCheckins = Array.from(habitCounts.values()).reduce((sum, count) => sum + count, 0);
    const habitsCompleted = habitCounts.size;

    // For completion rate, we need to know expected habits per day
    // This is a simplified calculation - in reality we'd need to calculate expected habits based on cadence
    const completionRate = Math.min(100, (totalCheckins / Math.max(1, habitsCompleted)) * 20); // Simplified

    return {
      date,
      totalCheckins,
      completionRate: Math.round(completionRate),
      habitsCompleted
    };
  });

  // Calculate habit breakdown
  const habitBreakdown = Array.from(checkinsByHabit.entries()).map(([habitId, data]) => {
    const streakDays = data.dates.size;
    const completionRate = Math.min(100, (data.total / (streakDays * 1)) * 100); // Simplified

    return {
      habitId,
      title: data.title,
      emoji: data.emoji,
      totalCheckins: data.total,
      completionRate: Math.round(completionRate),
      streakDays
    };
  }).sort((a, b) => b.totalCheckins - a.totalCheckins);

  // Calculate summary stats
  const totalCheckins = checkins.reduce((sum, c) => sum + c.count, 0);
  const totalHabits = checkinsByHabit.size;
  const averageCompletionRate = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.completionRate, 0) / dailyStats.length)
    : 0;

  // Find most active habit
  const mostActiveHabit = habitBreakdown.length > 0
    ? { id: habitBreakdown[0].habitId, title: habitBreakdown[0].title, totalCheckins: habitBreakdown[0].totalCheckins }
    : null;

  // Calculate trends
  const dailyAverage = dailyStats.length > 0
    ? Math.round(dailyStats.reduce((sum, d) => sum + d.totalCheckins, 0) / dailyStats.length * 10) / 10
    : 0;

  const weeklyAverage = dailyAverage * 7;

  const bestDay = dailyStats.length > 0
    ? dailyStats.reduce((best, current) =>
        current.totalCheckins > best.totalCheckins ? current : best
      ).date
    : null;

  const consistencyScore = Math.min(100, Math.round((dailyStats.length / dateRange) * 100));

  return {
    summary: {
      totalCheckins,
      totalHabits,
      averageCompletionRate,
      streakDays: habitBreakdown.length > 0 ? Math.max(...habitBreakdown.map(h => h.streakDays)) : 0,
      mostActiveHabit
    },
    dailyStats,
    habitBreakdown,
    trends: {
      dailyAverage,
      weeklyAverage,
      bestDay,
      consistencyScore
    }
  };
}
