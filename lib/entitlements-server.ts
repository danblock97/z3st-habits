import { createServerClient, createServiceRoleClient } from './supabase/server';

export type EntitlementTier = 'free' | 'pro' | 'plus';

export interface UserEntitlements {
  tier: EntitlementTier;
  source: Record<string, unknown>;
  updatedAt: string;
  [key: string]: unknown;
}

export interface EntitlementLimits {
  maxActiveHabits: number;
  maxReminders: number;
  maxGroups: number;
  maxGroupMembers: number;
  [key: string]: unknown;
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

// Fetch user entitlements with service role client (for server-side operations)
export async function fetchUserEntitlementsServiceRole(userId: string): Promise<UserEntitlements | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('entitlements')
    .select('tier, source, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching entitlements with service role:', error);
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

    console.log(`🔄 Updating entitlements for user ${userId} to tier ${tier}`);
    console.log(`📋 Source data:`, source);
    console.log(`🛡️ Using service role: ${useServiceRole}`);

    // First check if user already has entitlements
    const { data: existingEntitlements } = await supabase
      .from('entitlements')
      .select('tier, source')
      .eq('user_id', userId)
      .maybeSingle();

    console.log(`📊 Existing entitlements:`, existingEntitlements);

    const { error } = await supabase
      .from('entitlements')
      .upsert({
        user_id: userId,
        tier,
        source,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Error updating entitlements:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    // Verify the update worked
    const { data: updatedEntitlements } = await supabase
      .from('entitlements')
      .select('tier, source, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    console.log(`✅ Database updated successfully:`, updatedEntitlements);
    console.log(`🎯 Tier change: ${existingEntitlements?.tier || 'none'} → ${tier}`);

    return true;
  } catch (error) {
    console.error('❌ Exception updating entitlements:', error);
    return false;
  }
}

export function getEntitlementLimits(tier: EntitlementTier): EntitlementLimits {
  return TIER_LIMITS[tier];
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

// Analytics feature checks
export function canAccessAnalytics(entitlements: UserEntitlements): boolean {
  return entitlements.tier === 'pro' || entitlements.tier === 'plus';
}

export function canAccessAdvancedAnalytics(entitlements: UserEntitlements): boolean {
  return entitlements.tier === 'plus';
}

export function canExportData(entitlements: UserEntitlements): boolean {
  return entitlements.tier === 'plus';
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

  // Get all habits count (since we delete them, not archive)
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, title')
    .eq('owner_id', userId);

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

// Get user usage with service role client (for auto-cleanup)
export async function getUserUsageWithServiceRole(userId: string): Promise<UsageStats> {
  const supabase = createServiceRoleClient();

  // Get all habits count (since we delete them, not archive)
  const { data: habits, error: habitsError } = await supabase
    .from('habits')
    .select('id, title')
    .eq('owner_id', userId);

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

// Auto-cleanup resources when downgrading
export async function autoCleanupResources(userId: string, newTier: EntitlementTier): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const limits = getEntitlementLimits(newTier);

  console.log(`🚀 Starting auto-cleanup for user ${userId} to ${newTier} tier`);
  console.log(`📊 Tier limits:`, limits);

  try {
    // Get current usage with service role client to ensure accurate counts
    const usage = await getUserUsageWithServiceRole(userId);
    console.log(`📊 Current usage for user ${userId}:`, usage);
    console.log(`📈 Tier limits:`, limits);

    // Check if any cleanup is needed
    const habitCleanupNeeded = limits.maxActiveHabits !== -1 && usage.habits > limits.maxActiveHabits;
    const groupCleanupNeeded = limits.maxGroups !== -1 && usage.groups > limits.maxGroups;

    console.log(`🧹 Cleanup needed - Habits: ${habitCleanupNeeded}, Groups: ${groupCleanupNeeded}`);

    // 1. Clean up excess habits
    if (limits.maxActiveHabits !== -1 && usage.habits > limits.maxActiveHabits) {
      console.log(`🗑️ Starting habit cleanup: ${usage.habits} habits, limit ${limits.maxActiveHabits}, need to delete ${usage.habits - limits.maxActiveHabits}`);

      // Get all habits ordered by creation date (oldest first)
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, created_at, title')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (habitsError) {
        console.error('❌ Error fetching habits for cleanup:', habitsError);
        return false;
      }

      if (!habits || habits.length === 0) {
        console.log('⚠️ No habits found for cleanup');
        return true; // No cleanup needed is still success
      }

      console.log(`📋 Found ${habits.length} habits to process`);
      const excessHabits = habits.slice(limits.maxActiveHabits);
      console.log(`🗑️ Excess habits to delete: ${excessHabits.length}`);

      for (const habit of excessHabits) {
        console.log(`🗑️ Deleting habit: ${habit.title || 'Unknown'} (${habit.id})`);
        // Delete the habit (consistent with group deletion)
        const { error: deleteError } = await supabase
          .from('habits')
          .delete()
          .eq('id', habit.id);

        if (deleteError) {
          console.error(`❌ Error deleting habit ${habit.id}:`, deleteError);
          return false;
        } else {
          console.log(`✅ Deleted habit ${habit.id} (was: ${habit.title || 'Unknown'})`);
        }
      }
    }

    // 2. Clean up excess groups
    if (limits.maxGroups !== -1 && usage.groups > limits.maxGroups) {
      console.log(`🗑️ Starting group cleanup: ${usage.groups} groups, limit ${limits.maxGroups}, need to delete ${usage.groups - limits.maxGroups}`);

      // Get all groups ordered by creation date (oldest first)
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, created_at')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (groupsError) {
        console.error('❌ Error fetching groups for cleanup:', groupsError);
        return false;
      }

      if (!groups || groups.length === 0) {
        console.log('⚠️ No groups found for cleanup');
        return true; // No cleanup needed is still success
      }

      console.log(`📋 Found ${groups.length} groups to process`);
      const excessGroups = groups.slice(limits.maxGroups);
      console.log(`🗑️ Excess groups to delete: ${excessGroups.length}`);

      for (const group of excessGroups) {
        console.log(`🗑️ Deleting group: ${group.name} (${group.id})`);
        // Delete group and all related data (members, invites, etc.)
        await deleteGroupCascade(supabase, group.id, userId);
        console.log(`✅ Deleted group ${group.name} (${group.id})`);
      }
    }

    // 3. Clean up excess group members
    if (limits.maxGroupMembers !== -1) {
      // Get all groups and their member counts
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          group_members(count)
        `)
        .eq('owner_id', userId);

      if (groupsError) {
        console.error('Error fetching groups for member cleanup:', groupsError);
      } else {
        for (const group of groups || []) {
          const memberCount = (group.group_members as unknown[]).length;

          if (memberCount > limits.maxGroupMembers) {
            console.log(`Cleaning up excess members in group ${group.name}: ${memberCount - limits.maxGroupMembers} members need to be removed`);

            // Get members ordered by join date (oldest first)
            const { data: members, error: membersError } = await supabase
              .from('group_members')
              .select('id, user_id, joined_at')
              .eq('group_id', group.id)
              .order('joined_at', { ascending: true });

            if (membersError) {
              console.error(`Error fetching members for group ${group.id}:`, membersError);
            } else {
              const excessMembers = members?.slice(limits.maxGroupMembers) || [];

              for (const member of excessMembers) {
                const { error: removeError } = await supabase
                  .from('group_members')
                  .delete()
                  .eq('id', member.id);

                if (removeError) {
                  console.error(`Error removing member ${member.id} from group ${group.id}:`, removeError);
                } else {
                  console.log(`Removed member ${member.user_id} from group ${group.name}`);
                }
              }
            }
          }
        }
      }
    }

    console.log(`✅ Auto-cleanup completed for user ${userId}`);
    console.log(`🎉 Final state - Habits: ${usage.habits - (habitCleanupNeeded ? usage.habits - limits.maxActiveHabits : 0)}, Groups: ${usage.groups - (groupCleanupNeeded ? usage.groups - limits.maxGroups : 0)}`);
    return true; // Success
  } catch (error) {
    console.error('❌ Error during auto-cleanup:', error);
    return false; // Failure
  }
}

// Helper function to delete a group and all related data
async function deleteGroupCascade(supabase: ReturnType<typeof createServiceRoleClient>, groupId: string, userId: string) {
  try {
    // 1. Delete invites
    const { error: invitesError } = await supabase
      .from('invites')
      .delete()
      .eq('group_id', groupId);

    if (invitesError) {
      console.error('Error deleting invites:', invitesError);
    }

    // 2. Delete group members
    const { error: membersError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error deleting group members:', membersError);
    }

    // 3. Delete the group
    const { error: groupError } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('owner_id', userId);

    if (groupError) {
      console.error('Error deleting group:', groupError);
    }

  } catch (error) {
    console.error(`Error in deleteGroupCascade for group ${groupId}:`, error);
  }
}
