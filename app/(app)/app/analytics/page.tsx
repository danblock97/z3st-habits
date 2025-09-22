import { Suspense } from 'react';
import { BarChart3 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AnalyticsDashboard from './analytics-dashboard';
import { fetchUserEntitlements } from '@/lib/entitlements-server';

type AnalyticsPageProps = {
  searchParams: Promise<{ habit?: string }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { habit } = await searchParams;
  const habitId = habit;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your progress and discover insights about your habits
          </p>
        </div>
      </div>

      <Suspense fallback={<AnalyticsLoading />}>
        <AnalyticsDashboard habitId={habitId} />
      </Suspense>
    </div>
  );
}

function AnalyticsLoading() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </CardContent>
    </Card>
  );
}
