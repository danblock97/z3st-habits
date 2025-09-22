// Client-safe types and utilities
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

// Client-side hook for components that need entitlements
export function useEntitlements(): UserEntitlements | null {
  // For now, return a default free tier
  // This will be updated when we have the actual entitlement fetching logic
  // TODO: Implement actual API call to fetch user entitlements
  return {
    tier: 'free',
    source: {},
    updatedAt: new Date().toISOString(),
  };
}

// Temporary function to fetch entitlements from API
// This will be replaced with a proper React hook once we implement the real fetching logic
export async function fetchEntitlementsFromAPI(): Promise<UserEntitlements | null> {
  try {
    const response = await fetch('/api/entitlements');
    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to fetch entitlements:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching entitlements:', error);
    return null;
  }
}

// Client-side analytics feature checks (these are simple tier checks)
export function canAccessAnalytics(entitlements: UserEntitlements): boolean {
  return entitlements.tier === 'pro' || entitlements.tier === 'plus';
}

export function canAccessAdvancedAnalytics(entitlements: UserEntitlements): boolean {
  return entitlements.tier === 'plus';
}

export function canExportData(entitlements: UserEntitlements): boolean {
  return entitlements.tier === 'plus';
}
