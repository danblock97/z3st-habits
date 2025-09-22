"use client";

import { useEffect, useState } from 'react';
import { formatDistanceToNow, startOfWeek, endOfWeek, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Trophy, Users, Activity, Crown, Calendar, Target, UserMinus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

import { createClient } from '@/lib/supabase/client';

import type { GroupDashboardData, GroupMember, GroupCheckin } from './types';
import { removeMember } from '../../groups/actions';

type GroupDashboardClientProps = {
  initialData: GroupDashboardData;
  groupId: string;
};

export function GroupDashboardClient({ initialData, groupId }: GroupDashboardClientProps) {
  const [data, setData] = useState<GroupDashboardData>(initialData);
  const [leaderboardView, setLeaderboardView] = useState<'streaks' | 'volume'>('streaks');
  const [volumeRange, setVolumeRange] = useState<'today' | 'week' | 'month'>('week');
  const [removeMessage, setRemoveMessage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to checkins table for real-time updates
    const checkinsSubscription = supabase
      .channel(`group-${groupId}-checkins`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkins',
          filter: `habit_id=in.(${data.members.map(m => m.userId).join(',')})`,
        },
        async (payload) => {
          // When a checkin is inserted, updated, or deleted, refresh the data
          const { data: updatedCheckins } = await supabase
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
            .in('user_id', data.members.map(m => m.userId))
            .order('created_at', { ascending: false })
            .limit(100);

          if (updatedCheckins) {
            const formattedCheckins = updatedCheckins.map(checkin => {
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

            setData(prev => ({ ...prev, checkins: formattedCheckins }));
          }
        }
      )
      .subscribe();

    // Subscribe to profiles table for real-time updates of usernames/emojis
    const profilesSubscription = supabase
      .channel(`group-${groupId}-profiles`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=in.(${data.members.map(m => m.userId).join(',')})`,
        },
        async (payload) => {
          // Refresh member data when profiles are updated
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
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true });

          if (membersData) {
            const members = membersData.map(member => {
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

            setData(prev => ({ ...prev, members }));
          }
        }
      )
      .subscribe();

    return () => {
      checkinsSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  }, [groupId, data.members, supabase]);

  const handleRemoveMember = async (memberId: string) => {
    const result = await removeMember(groupId, memberId);

    if (result.success) {
      setRemoveMessage(result.message);
      // Refresh data to show updated member list
      const supabase = createClient();
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
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (membersData) {
        const members = membersData.map(member => {
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

        setData(prev => ({ ...prev, members }));
      }

      // Clear message after 3 seconds
      setTimeout(() => setRemoveMessage(null), 3000);
    } else {
      setRemoveMessage(result.message || 'Could not remove member.');
      setTimeout(() => setRemoveMessage(null), 5000);
    }
  };

  // Calculate volume (habits completed in time period) for each member
  const calculateVolume = (memberId: string, range: 'today' | 'week' | 'month' = 'week') => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (range) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = startOfDay(startOfMonth);
        endDate = endOfDay(endOfMonth);
        break;
    }

    return data.checkins.filter(checkin =>
      checkin.userId === memberId &&
      isWithinInterval(new Date(checkin.createdAt), { start: startDate, end: endDate })
    ).length;
  };

  interface MemberWithVolume {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
    username: string;
    emoji: string;
    currentStreak: number;
    longestStreak: number;
    lastCheckin: string | null;
    todayVolume: number;
    weekVolume: number;
    monthVolume: number;
  }

  const getMembersWithMetrics = (): MemberWithVolume[] => {
    return data.members.map(member => ({
      ...member,
      todayVolume: calculateVolume(member.userId, 'today'),
      weekVolume: calculateVolume(member.userId, 'week'),
      monthVolume: calculateVolume(member.userId, 'month'),
    }));
  };

  const sortedMembers = [...getMembersWithMetrics()].sort((a: MemberWithVolume, b: MemberWithVolume) => {
    if (leaderboardView === 'streaks') {
      // Sort by current streak desc, then longest streak desc, then most recent checkin desc
      if (a.currentStreak !== b.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      if (a.longestStreak !== b.longestStreak) {
        return b.longestStreak - a.longestStreak;
      }
      if (a.lastCheckin && b.lastCheckin) {
        return new Date(b.lastCheckin).getTime() - new Date(a.lastCheckin).getTime();
      }
      if (a.lastCheckin) return -1;
      if (b.lastCheckin) return 1;
      return 0;
    } else {
      // Sort by volume desc based on selected range
      const getVolume = (member: MemberWithVolume) => {
        switch (volumeRange) {
          case 'today': return member.todayVolume;
          case 'week': return member.weekVolume;
          case 'month': return member.monthVolume;
        }
      };

      const aVolume = getVolume(a);
      const bVolume = getVolume(b);

      if (aVolume !== bVolume) {
        return bVolume - aVolume;
      }
      // If same volume, fall back to streak sorting
      if (a.currentStreak !== b.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
          {data.group.ownerEmoji}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{data.group.name}</h1>
          <p className="text-muted-foreground">
            Led by {data.group.ownerUsername} • {data.members.length} member{data.members.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">
            <Activity className="mr-2 h-4 w-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <div className="grid gap-4">
            {data.checkins.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground">Check-ins will appear here when group members log progress</p>
                </CardContent>
              </Card>
            ) : (
              data.checkins.slice(0, 20).map((checkin) => (
                <Card key={checkin.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm">
                        {checkin.habit.emoji}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{checkin.user.username}</span>
                          <span className="text-sm text-muted-foreground">
                            completed {checkin.habit.title}
                          </span>
                          {checkin.count > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              ×{checkin.count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(checkin.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          {/* Leaderboard View Toggle */}
          <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-lg">
            <Button
              variant={leaderboardView === 'streaks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLeaderboardView('streaks')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Streaks
            </Button>
            <Button
              variant={leaderboardView === 'volume' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLeaderboardView('volume')}
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Volume
            </Button>
          </div>

          {/* Volume Range Selector */}
          {leaderboardView === 'volume' && (
            <div className="flex items-center justify-center gap-2 p-3 bg-muted/20 rounded-md">
              <span className="text-sm text-muted-foreground">Period:</span>
              <Button
                variant={volumeRange === 'today' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVolumeRange('today')}
              >
                Today
              </Button>
              <Button
                variant={volumeRange === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVolumeRange('week')}
              >
                This Week
              </Button>
              <Button
                variant={volumeRange === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVolumeRange('month')}
              >
                This Month
              </Button>
            </div>
          )}

          <div className="grid gap-4">
            {sortedMembers.map((member, index) => (
              <Card key={member.userId}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {member.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.username}</span>
                          {member.role === 'owner' && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                          {leaderboardView === 'streaks' && index === 0 && member.currentStreak > 0 && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                          {leaderboardView === 'volume' && index === 0 && (member as MemberWithVolume)[volumeRange === 'today' ? 'todayVolume' : volumeRange === 'week' ? 'weekVolume' : 'monthVolume'] > 0 && (
                            <Trophy className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>

                        {leaderboardView === 'streaks' ? (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Current: {member.currentStreak} days</span>
                            <span>Best: {member.longestStreak} days</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {volumeRange === 'today' && `${(member as MemberWithVolume).todayVolume} habits today`}
                              {volumeRange === 'week' && `${(member as MemberWithVolume).weekVolume} habits this week`}
                              {volumeRange === 'month' && `${(member as MemberWithVolume).monthVolume} habits this month`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {leaderboardView === 'streaks' ? (
                      <div className="flex-1 max-w-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Streak Progress</span>
                          <span className="text-xs text-muted-foreground">
                            {member.currentStreak} days
                          </span>
                        </div>
                        <Progress
                          value={Math.min((member.currentStreak / 30) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 max-w-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">
                            {volumeRange === 'today' && 'Daily Volume'}
                            {volumeRange === 'week' && 'Weekly Volume'}
                            {volumeRange === 'month' && 'Monthly Volume'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(member as MemberWithVolume)[volumeRange === 'today' ? 'todayVolume' : volumeRange === 'week' ? 'weekVolume' : 'monthVolume']} habits
                          </span>
                        </div>
                        <Progress
                          value={Math.min(((member as MemberWithVolume)[volumeRange === 'today' ? 'todayVolume' : volumeRange === 'week' ? 'weekVolume' : 'monthVolume'] / (volumeRange === 'today' ? 10 : volumeRange === 'week' ? 50 : 100)) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          {removeMessage && (
            <div className={`p-3 rounded-md text-sm ${
              removeMessage.includes('successfully') || removeMessage.includes('removed')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {removeMessage}
            </div>
          )}

          <div className="grid gap-4">
            {data.members.map((member) => (
              <Card key={member.userId}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg">
                      {member.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.username}</span>
                        {member.role === 'owner' && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="mr-1 h-3 w-3" />
                            Owner
                          </Badge>
                        )}
                        {member.role === 'admin' && (
                          <Badge variant="outline" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                        {member.lastCheckin && (
                          <span>Last active {formatDistanceToNow(new Date(member.lastCheckin), { addSuffix: true })}</span>
                        )}
                      </div>
                    </div>

                    {/* Remove member button for owners and admins */}
                    {(data.group.userRole === 'owner' || data.group.userRole === 'admin') && (
                      <div className="flex items-center gap-2">
                        {member.role !== 'owner' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.userId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="mr-1 h-3 w-3" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
