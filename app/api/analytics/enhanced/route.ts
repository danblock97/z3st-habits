'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements } from '@/lib/entitlements-server';
import {
  calculateBestWorstDays,
  predictStreakSurvival,
  calculateHabitCorrelation,
  calculateMonthlyYearlyTrends,
  getDayOfWeekFactor,
  extractHistoricalStreaks,
  type BestWorstDays,
  type StreakPrediction,
  type HabitCorrelation,
  type MonthlyYearlyTrends,
} from '@/lib/enhanced-analytics';

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check entitlements - Enhanced analytics requires Plus tier
  const entitlements = await fetchUserEntitlements(userId);
  if (!entitlements || entitlements.tier !== 'plus') {
    return NextResponse.json(
      { error: 'Enhanced analytics requires Plus subscription' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const habitId = searchParams.get('habitId');
  const analysisType = searchParams.get('type'); // 'all', 'best-worst-days', 'predictions', 'correlations', 'trends'

  try {
    // Fetch user's habits
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id, title, emoji, cadence, target_per_period')
      .eq('owner_id', userId)
      .eq('is_archived', false);

    if (habitsError) {
      console.error('Error fetching habits:', habitsError);
      return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
    }

    if (!habits || habits.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No habits found. Start tracking to see enhanced analytics!',
        },
      });
    }

    // Filter to specific habit if requested
    const targetHabits = habitId ? habits.filter((h) => h.id === habitId) : habits;

    if (targetHabits.length === 0) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Fetch checkins for all target habits (last 90 days for analysis)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('id, local_date, count, habit_id')
      .eq('user_id', userId)
      .in(
        'habit_id',
        targetHabits.map((h) => h.id)
      )
      .gte('local_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('local_date', { ascending: true });

    if (checkinsError) {
      console.error('Error fetching checkins:', checkinsError);
      return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 });
    }

    // Group checkins by habit
    const checkinsByHabit = new Map<string, Array<{ local_date: string; count: number }>>();
    targetHabits.forEach((habit) => {
      checkinsByHabit.set(
        habit.id,
        checkins?.filter((c) => c.habit_id === habit.id) || []
      );
    });

    // Calculate analytics based on type
    const results: {
      bestWorstDays?: Record<string, BestWorstDays | null>;
      predictions?: Record<string, StreakPrediction | null>;
      correlations?: HabitCorrelation[];
      trends?: Record<string, MonthlyYearlyTrends>;
    } = {};

    if (!analysisType || analysisType === 'all' || analysisType === 'best-worst-days') {
      results.bestWorstDays = {};
      targetHabits.forEach((habit) => {
        const habitCheckins = checkinsByHabit.get(habit.id) || [];
        results.bestWorstDays![habit.id] = calculateBestWorstDays(
          habitCheckins,
          habit.target_per_period
        );
      });
    }

    if (!analysisType || analysisType === 'all' || analysisType === 'predictions') {
      results.predictions = {};
      targetHabits.forEach((habit) => {
        const habitCheckins = checkinsByHabit.get(habit.id) || [];
        if (habitCheckins.length === 0) {
          results.predictions![habit.id] = null;
          return;
        }

        // Calculate recent completion rate (last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        const recentCheckins = habitCheckins.filter(
          (c) => new Date(c.local_date) >= fourteenDaysAgo
        );
        const recentCompletions = recentCheckins.filter(
          (c) => c.count >= habit.target_per_period
        ).length;
        const recentCompletionRate = recentCheckins.length > 0
          ? (recentCompletions / recentCheckins.length) * 100
          : 0;

        // Get historical streaks
        const historicalStreaks = extractHistoricalStreaks(habitCheckins, habit.target_per_period);
        const currentStreak = historicalStreaks[historicalStreaks.length - 1] || 0;

        // Get day of week factor
        const bestWorstDays = calculateBestWorstDays(habitCheckins, habit.target_per_period);
        const today = new Date().getDay();
        const dayOfWeekFactor = getDayOfWeekFactor(today, bestWorstDays);

        results.predictions![habit.id] = predictStreakSurvival(
          currentStreak,
          historicalStreaks,
          recentCompletionRate,
          dayOfWeekFactor
        );
      });
    }

    if (!analysisType || analysisType === 'all' || analysisType === 'correlations') {
      results.correlations = [];

      // Calculate correlations between all habit pairs
      for (let i = 0; i < targetHabits.length; i++) {
        for (let j = i + 1; j < targetHabits.length; j++) {
          const habitA = targetHabits[i];
          const habitB = targetHabits[j];

          const habitACheckins = checkinsByHabit.get(habitA.id) || [];
          const habitBCheckins = checkinsByHabit.get(habitB.id) || [];

          const correlation = calculateHabitCorrelation(
            habitACheckins,
            habitBCheckins,
            habitA.title,
            habitB.title,
            habitA.id,
            habitB.id
          );

          if (correlation) {
            results.correlations.push(correlation);
          }
        }
      }

      // Sort by absolute correlation strength
      results.correlations.sort(
        (a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient)
      );
    }

    if (!analysisType || analysisType === 'all' || analysisType === 'trends') {
      results.trends = {};
      targetHabits.forEach((habit) => {
        const habitCheckins = checkinsByHabit.get(habit.id) || [];
        results.trends![habit.id] = calculateMonthlyYearlyTrends(
          habitCheckins,
          habit.target_per_period
        );
      });
    }

    // Add habit metadata to results
    const habitsMetadata = targetHabits.map((h) => ({
      id: h.id,
      title: h.title,
      emoji: h.emoji,
      target: h.target_per_period,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        habits: habitsMetadata,
        analysisDate: new Date().toISOString(),
        periodCovered: {
          start: ninetyDaysAgo.toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    console.error('Enhanced analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
