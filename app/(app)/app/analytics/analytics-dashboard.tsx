'use client';

import React, { useState, useEffect } from 'react';
import { fetchEntitlementsFromAPI } from '@/lib/entitlements';
import BasicAnalytics from './basic-analytics';
import AdvancedAnalytics from './advanced-analytics';

interface AnalyticsDashboardProps {
  habitId?: string;
}

export default function AnalyticsDashboard({ habitId }: AnalyticsDashboardProps) {
  const [entitlements, setEntitlements] = useState<{ tier: string; source: Record<string, unknown>; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntitlements = async () => {
      try {
        const data = await fetchEntitlementsFromAPI();
        setEntitlements(data);
      } catch (error) {
        console.error('Failed to load entitlements:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntitlements();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Show appropriate analytics based on tier
  if (!entitlements || entitlements.tier === 'free') {
    return <BasicAnalytics habitId={habitId} entitlements={entitlements} />;
  }

  if (entitlements.tier === 'pro') {
    return <BasicAnalytics habitId={habitId} entitlements={entitlements} />;
  }

  if (entitlements.tier === 'plus') {
    return <AdvancedAnalytics habitId={habitId} entitlements={entitlements} />;
  }

  return <BasicAnalytics habitId={habitId} entitlements={entitlements} />;
}
