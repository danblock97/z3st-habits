import { createServerClient, createServiceRoleClient } from './supabase/server';

export type EntitlementTier = 'free' | 'pro' | 'plus';

export interface UserEntitlements {
  tier: EntitlementTier;
  source: Record<string, any>;
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
  source: Record<string, any> = {},
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
