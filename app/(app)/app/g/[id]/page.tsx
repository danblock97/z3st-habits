import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';
import { getChallenges } from '@/app/(app)/app/challenges/actions';

import { GroupDashboardClient } from './group-dashboard-client';
import type { GroupDashboardData } from './types';

type GroupPageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  // In Next.js 15, dynamic params need to be awaited
  const resolvedParams = await params;

  // Get group details and check membership
  const { data: membership, error: membershipError } = await supabase
    .from('group_members')
    .select(`
      role,
      joined_at,
      group:groups (
        id,
        name,
        created_at,
        owner_id,
        owner:profiles!groups_owner_id_fkey (
          username,
          emoji
        )
      )
    `)
    .eq('group_id', resolvedParams.id)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError || !membership?.group) {
    // User is not a member of this group or group doesn't exist
    redirect('/app/groups');
  }

  const group = Array.isArray(membership.group) ? membership.group[0] : membership.group;
  const owner = Array.isArray(group.owner) ? group.owner[0] : group.owner;

  // Get group members
  const { data: membersData } = await supabase
    .from('group_members')
    .select(`
      user_id,
      role,
      joined_at,
      profile:profiles (
        id,
        username,
        emoji
      )
    `)
    .eq('group_id', resolvedParams.id)
    .order('joined_at', { ascending: true });

  const members = (membersData ?? []).map(member => {
    // Handle the profile field properly - it might be null or an array
    let profile = null;
    if (member.profile) {
      profile = Array.isArray(member.profile) ? member.profile[0] : member.profile;
    }

    return {
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
      username: profile?.username ?? 'Unknown',
      emoji: profile?.emoji ?? '🍋',
      currentStreak: 0, // Will be calculated by the client
      longestStreak: 0, // Will be calculated by the client
      lastCheckin: null, // Will be calculated by the client
    };
  });

  // Get recent check-ins for group members' habits
  const { data: checkinsData } = await supabase
    .from('checkins')
    .select(`
      id,
      habit_id,
      user_id,
      local_date,
      count,
      created_at,
      habit:habits (
        id,
        title,
        emoji,
        owner_id,
        owner:profiles (
          username,
          emoji
        )
      )
    `)
    .in('user_id', members.map(m => m.userId))
    .gte('local_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
    .order('created_at', { ascending: false })
    .limit(100);

  const checkins = (checkinsData ?? []).map(checkin => {
    const habit = Array.isArray(checkin.habit) ? checkin.habit[0] : checkin.habit;
    const owner = Array.isArray(habit?.owner) ? habit.owner[0] : habit?.owner;

    return {
      id: checkin.id,
      habitId: checkin.habit_id,
      userId: checkin.user_id,
      localDate: checkin.local_date,
      count: checkin.count,
      createdAt: checkin.created_at,
      habit: {
        id: habit?.id ?? '',
        title: habit?.title ?? '',
        emoji: habit?.emoji ?? '🎯',
      },
      user: {
        username: owner?.username ?? 'Unknown',
        emoji: owner?.emoji ?? '🍋',
      },
    };
  });

  // Get current streaks for leaderboard
  const { data: habitsData } = await supabase
    .from('habits')
    .select(`
      id,
      title,
      emoji,
      owner_id,
      owner:profiles (
        username,
        emoji
      )
    `)
    .in('owner_id', members.map(m => m.userId))
    .eq('is_archived', false);

  const habitsByOwner = new Map<string, Array<{ id: string; title: string; emoji: string; owner: { username: string; emoji: string } }>>();

  (habitsData ?? []).forEach(habit => {
    const owner = Array.isArray(habit.owner) ? habit.owner[0] : habit.owner;
    if (!habitsByOwner.has(habit.owner_id)) {
      habitsByOwner.set(habit.owner_id, []);
    }
    habitsByOwner.get(habit.owner_id)!.push({
      id: habit.id,
      title: habit.title,
      emoji: habit.emoji ?? '🎯',
      owner: {
        username: owner?.username ?? 'Unknown',
        emoji: owner?.emoji ?? '🍋',
      },
    });
  });

  // Calculate streaks for each member
  const memberStreaks = await Promise.all(
    members.map(async (member) => {
      const { data: checkinsForMember } = await supabase
        .from('checkins')
        .select('local_date, count')
        .eq('user_id', member.userId)
        .order('local_date', { ascending: true });

      const entries = (checkinsForMember ?? []).map(checkin => ({
        localDate: checkin.local_date,
        count: checkin.count,
      }));

      // This is a simplified streak calculation - in a real app you'd use the same logic as the main streak calculation
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      const today = new Date().toISOString().split('T')[0];

      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        const daysDiff = Math.floor((new Date(today).getTime() - new Date(entry.localDate).getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === currentStreak) {
          currentStreak++;
          tempStreak = Math.max(tempStreak, currentStreak);
        } else if (daysDiff > currentStreak) {
          break;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      return {
        ...member,
        currentStreak,
        longestStreak,
        lastCheckin: entries[entries.length - 1]?.localDate || null,
      };
    })
  );

  // Get challenges for this group
  const groupChallenges = await getChallenges({ groupId: resolvedParams.id });

  const data: GroupDashboardData = {
    group: {
      id: group.id,
      name: group.name,
      ownerId: group.owner_id,
      ownerUsername: owner?.username ?? 'Unknown',
      ownerEmoji: owner?.emoji ?? '🍋',
      userRole: membership.role,
      createdAt: group.created_at,
    },
    members: memberStreaks,
    checkins,
  };

  return <GroupDashboardClient initialData={data} groupId={resolvedParams.id} challenges={groupChallenges} />;
}
