// Re-export types from server file for client components
export type { EntitlementTier, UserEntitlements, EntitlementLimits } from './entitlements-server';

// Import types for use in this file
import type { UserEntitlements } from './entitlements-server';

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
