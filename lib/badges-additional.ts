import { createServerClient } from '@/lib/supabase/server';
import { getLocalDateForTZ } from '@/lib/dates';
import type { BadgeResult } from './badges';

/**
 * Check for perfect week badge (complete all habits for 7 consecutive days)
 */
export async function checkPerfectWeekBadge(userId: string): Promise<BadgeResult[]> {
  const supabase = await createServerClient();
  const results: BadgeResult[] = [];

  try {
    // Get user's profile for timezone
    const { data: profile } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .single();

    if (!profile) return results;

    // Get all habits
    const { data: habits } = await supabase
      .from('habits')
      .select(`
        id,
        cadence,
        target_per_period,
        checkins (local_date, count)
      `)
      .eq('owner_id', userId)
      .eq('is_archived', false);

    if (!habits || habits.length === 0) return results;

    // Check if user completed all habits for 7 consecutive days
    const now = new Date();
    const timezone = profile.timezone || 'UTC';
    
    // Get the last 7 days
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const localDate = getLocalDateForTZ(timezone, date);
      last7Days.push(localDate);
    }

    // Check if all habits were completed on all 7 days
    let perfectWeek = true;
    for (const habit of habits) {
      if (habit.cadence !== 'daily') continue; // Only check daily habits
      
      const habitCheckins = habit.checkins || [];
      const checkinDates = new Set(habitCheckins.map((c: { local_date: string }) => c.local_date));
      
      // Check if habit was completed on all 7 days
      for (const day of last7Days) {
        if (!checkinDates.has(day)) {
          perfectWeek = false;
          break;
        }
      }
      
      if (!perfectWeek) break;
    }

    if (perfectWeek) {
      // Award the badge
      const { error } = await supabase
        .from('badges')
        .insert({
          user_id: userId,
          kind: 'perfect_week',
        });

      if (!error) {
        results.push({
          awarded: true,
          badgeKind: 'perfect_week',
          message: '🏆 Badge unlocked: Perfect Week!'
        });
      }
    }

  } catch (error) {
    console.error('Error checking perfect week badge:', error);
  }

  return results;
}
