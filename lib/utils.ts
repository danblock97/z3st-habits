import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format limits for display (moved from entitlements-server to avoid server/client conflicts)
export function formatLimit(limit: number): string {
  return limit === -1 ? 'Unlimited' : limit.toString();
}