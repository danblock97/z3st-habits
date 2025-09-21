import { createServerClient, createServiceRoleClient } from './supabase/server';

export type EntitlementTier = 'free' | 'pro' | 'plus';

export interface UserEntitlements {
  tier: EntitlementTier;
  source: Record<string, unknown>;
  updatedAt: string;
}

export interface EntitlementLimits {
  maxActiveHabits: number;
  maxReminders: number;
  maxGroups: number;
  maxGroupMembers: number;
}

export const TIER_LIMITS: Record<EntitlementTier, EntitlementLimits> = {
  free: {
    maxActiveHabits: 3,
    maxReminders: -1, // Unlimited
    maxGroups: 1,
    maxGroupMembers: 5,
  },
  pro: {
    maxActiveHabits: 15,
    maxReminders: -1, // Unlimited
    maxGroups: 3,
    maxGroupMembers: 15,
  },
  plus: {
    maxActiveHabits: -1, // Unlimited
    maxReminders: -1, // Unlimited
    maxGroups: -1, // Unlimited
    maxGroupMembers: -1, // Unlimited
  },
};

export async function fetchUserEntitlements(userId: string): Promise<UserEntitlements | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('entitlements')
    .select('tier, source, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching entitlements:', error);
    return null;
  }

  if (!data) {
    // Return default free tier for users without explicit entitlements
    return {
      tier: 'free',
      source: {},
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    tier: data.tier as EntitlementTier,
    source: data.source,
    updatedAt: data.updated_at,
  };
}

export async function updateUserEntitlements(
  userId: string,
  tier: EntitlementTier,
  source: Record<string, unknown> = {},
  useServiceRole: boolean = false
): Promise<boolean> {
  try {
    // Use service role client for webhook operations to bypass RLS
    const supabase = useServiceRole ? createServiceRoleClient() : await createServerClient();

    console.log(`Updating entitlements for user ${userId} to tier ${tier} using service role: ${useServiceRole}`);

    const { error } = await supabase
      .from('entitlements')
      .upsert({
        user_id: userId,
        tier,
        source,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating entitlements:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log(`✅ Successfully updated entitlements for user ${userId} to tier ${tier}`);
    return true;
  } catch (error) {
    console.error('Exception updating entitlements:', error);
    return false;
  }
}

export function getEntitlementLimits(tier: EntitlementTier): EntitlementLimits {
  return TIER_LIMITS[tier];
}

// Helper function to format limits for display
export function formatLimit(limit: number): string {
  return limit === -1 ? 'Unlimited' : limit.toString();
}

// Check functions for server-side usage
export function canCreateHabit(entitlements: UserEntitlements, currentCount: number): boolean {
  const limits = getEntitlementLimits(entitlements.tier);
  return limits.maxActiveHabits === -1 || currentCount < limits.maxActiveHabits;
}

export function canCreateReminder(entitlements: UserEntitlements, currentCount: number): boolean {
  const limits = getEntitlementLimits(entitlements.tier);
  return limits.maxReminders === -1 || currentCount < limits.maxReminders;
}

export function canCreateGroup(entitlements: UserEntitlements, currentCount: number): boolean {
  const limits = getEntitlementLimits(entitlements.tier);
  return limits.maxGroups === -1 || currentCount < limits.maxGroups;
}

export function canAddGroupMember(entitlements: UserEntitlements, currentCount: number): boolean {
  const limits = getEntitlementLimits(entitlements.tier);
  return limits.maxGroupMembers === -1 || currentCount < limits.maxGroupMembers;
}

// Types for usage checking
export interface UsageStats {
  habits: number;
  groups: number;
  groupMemberCounts: Record<string, number>;
  reminders: number;
}

export interface DowngradeRequirements {
  canDowngrade: boolean;
  issues: {
    habits: { current: number; limit: number; needsReduction: number };
    groups: { current: number; limit: number; needsReduction: number };
    groupMembers: { groupId: string; groupName: string; current: number; limit: number; needsReduction: number }[];
  };
}

// Get current usage stats for a user
export async function getUserUsage(userId: string): Promise<UsageStats> {
  const supabase = await createServerClient();

  // Get active habits count
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id')
    .eq('owner_id', userId)
    .eq('is_archived', false);

  if (habitsError) {
    console.error('Error fetching habits:', habitsError);
  }

  // Get groups and member counts
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select(`
      id,
      name,
      group_members!inner(count)
    `)
    .eq('owner_id', userId);

  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
  }

  // Get reminders count
  const { data: reminders, error: remindersError } = await supabase
    .from('reminders')
    .select('id')
    .eq('user_id', userId);

  if (remindersError) {
    console.error('Error fetching reminders:', remindersError);
  }

  // Process group member counts
  const groupMemberCounts: Record<string, number> = {};
  if (groups) {
    groups.forEach((group: { id: string; group_members: unknown[] }) => {
      groupMemberCounts[group.id] = group.group_members.length || 0;
    });
  }

  return {
    habits: habits?.length || 0,
    groups: groups?.length || 0,
    groupMemberCounts,
    reminders: reminders?.length || 0,
  };
}

// Check if user can downgrade to a specific tier
export function canDowngradeToTier(
  currentEntitlements: UserEntitlements,
  targetTier: EntitlementTier,
  currentUsage: UsageStats
): DowngradeRequirements {
  const targetLimits = getEntitlementLimits(targetTier);

  // Check habits
  const habitsIssue = {
    current: currentUsage.habits,
    limit: targetLimits.maxActiveHabits,
    needsReduction: Math.max(0, currentUsage.habits - targetLimits.maxActiveHabits),
  };

  // Check groups
  const groupsIssue = {
    current: currentUsage.groups,
    limit: targetLimits.maxGroups,
    needsReduction: Math.max(0, currentUsage.groups - targetLimits.maxGroups),
  };

  // Check group members
  const groupMembersIssues: { groupId: string; groupName: string; current: number; limit: number; needsReduction: number }[] = [];

  if (targetLimits.maxGroupMembers !== -1) {
    Object.entries(currentUsage.groupMemberCounts).forEach(([groupId, memberCount]) => {
      const needsReduction = Math.max(0, memberCount - targetLimits.maxGroupMembers);
      if (needsReduction > 0) {
        groupMembersIssues.push({
          groupId,
          groupName: `Group ${groupId}`, // We'll need to get the actual name
          current: memberCount,
          limit: targetLimits.maxGroupMembers,
          needsReduction,
        });
      }
    });
  }

  const canDowngrade = habitsIssue.needsReduction === 0 &&
                      groupsIssue.needsReduction === 0 &&
                      groupMembersIssues.length === 0;

  return {
    canDowngrade,
    issues: {
      habits: habitsIssue,
      groups: groupsIssue,
      groupMembers: groupMembersIssues,
    },
  };
}
