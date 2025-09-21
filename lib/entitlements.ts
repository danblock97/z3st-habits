// Re-export types from server file for client components
export type { EntitlementTier, UserEntitlements, EntitlementLimits } from './entitlements-server';

// Import types for use in this file
import type { UserEntitlements } from './entitlements-server';

// Client-side hook for components that need entitlements
export function useEntitlements(): UserEntitlements | null {
  // This will be used by the client components
  // For now, return a default free tier
  // This will be updated when we have the actual entitlement fetching logic
  return {
    tier: 'free',
    source: {},
    updatedAt: new Date().toISOString(),
  };
}
