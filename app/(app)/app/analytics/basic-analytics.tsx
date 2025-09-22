'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, TrendingUp, Target, Flame, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useEntitlements } from '@/lib/entitlements';

interface AnalyticsData {
  summary: {
    totalCheckins: number;
    totalHabits: number;
    averageCompletionRate: number;
    streakDays: number;
    mostActiveHabit: {
      id: string;
      title: string;
      totalCheckins: number;
    } | null;
  };
  dailyStats: Array<{
    date: string;
    totalCheckins: number;
    completionRate: number;
    habitsCompleted: number;
  }>;
  habitBreakdown: Array<{
    habitId: string;
    title: string;
    emoji: string;
    totalCheckins: number;
    completionRate: number;
    streakDays: number;
  }>;
  trends: {
    dailyAverage: number;
    weeklyAverage: number;
    bestDay: string | null;
    consistencyScore: number;
  };
  period: {
    start: string;
    end: string;
    type: string;
  };
}

interface BasicAnalyticsProps {
  habitId?: string;
  entitlements?: { tier: string; source: any; updatedAt: string } | null;
}

export default function BasicAnalytics({ habitId, entitlements }: BasicAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const [periodInfo, setPeriodInfo] = useState<{ start: string; end: string; type: string } | null>(null);

  const fetchAnalytics = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);

    console.log('📊 BasicAnalytics - Entitlements received:', entitlements);
    console.log('📊 BasicAnalytics - Analytics data received:', analyticsData);

    try {
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);

      if (habitId) {
        params.append('habitId', habitId);
      }

      const response = await fetch(`/api/analytics/habits?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      console.log('📊 API Response structure:', {
        success: result.success,
        hasData: !!result.data,
        hasPeriod: !!result.period,
        dataKeys: result.data ? Object.keys(result.data) : 'no data'
      });

      setAnalyticsData(result.data);
      if (result.period) {
        setPeriodInfo(result.period);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, habitId]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  if (!entitlements || entitlements.tier === 'free') {
    console.log('🔒 Showing upgrade prompt - Entitlements:', entitlements);
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Upgrade to Pro to unlock habit analytics and insights
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <a href="/pricing">Upgrade to Pro</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If user has Pro/Plus but no data, show encouragement to add habits
  if (analyticsData === null || (analyticsData && analyticsData.dailyStats.length === 0)) {
    console.log('📈 Showing no-data message - analyticsData:', analyticsData);
    console.log('📈 Showing no-data message - dailyStats length:', analyticsData?.dailyStats?.length || 0);
    console.log('📈 Showing no-data message - Entitlements:', entitlements);
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </CardTitle>
          <CardDescription>
            {entitlements?.tier === 'pro' ? 'Ready to track your progress!' : 'Advanced analytics ready!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Add some habits and start tracking to see your analytics come to life!
          </p>
          <Button asChild>
            <a href="/app/habits">Add Your First Habit</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
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

  if (error) {
    console.log('❌ Analytics error:', error);
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading analytics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analyticsData) {
    console.log('📊 No analytics data - Entitlements:', entitlements);
    console.log('📊 Showing no-data Alert - analyticsData is null');
    return (
      <Alert>
        <AlertTitle>No data available</AlertTitle>
        <AlertDescription>
          No habit data found for the selected period. Complete some habits to see analytics!
        </AlertDescription>
      </Alert>
    );
  }

  const { summary, dailyStats, habitBreakdown, trends } = analyticsData;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Insights from {periodInfo?.start || 'N/A'} to {periodInfo?.end || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCheckins}</div>
            <p className="text-xs text-muted-foreground">
              Across {summary.totalHabits} habits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Daily average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistency</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trends.consistencyScore}%</div>
            <p className="text-xs text-muted-foreground">
              Days with check-ins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.bestDay ? new Date(trends.bestDay).toLocaleDateString('en-US', { weekday: 'short' }) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Most active day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Progress</CardTitle>
                <CardDescription>Check-ins over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [value, 'Check-ins']}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCheckins"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Habit Distribution</CardTitle>
                <CardDescription>Check-ins by habit</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={habitBreakdown.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ title, percent }) => `${title} (${((percent as number) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalCheckins"
                    >
                      {habitBreakdown.slice(0, 6).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Check-ins']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit Performance</CardTitle>
              <CardDescription>Detailed breakdown of each habit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {habitBreakdown.map((habit, index) => (
                  <div key={habit.habitId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-lg">{habit.emoji}</span>
                      </div>
                      <div>
                        <p className="font-medium">{habit.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {habit.streakDays} days active
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{habit.totalCheckins}</p>
                      <Badge variant={habit.completionRate >= 80 ? 'default' : habit.completionRate >= 60 ? 'secondary' : 'destructive'}>
                        {habit.completionRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Daily Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{trends.dailyAverage}</div>
                <p className="text-sm text-muted-foreground">check-ins per day</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{trends.weeklyAverage}</div>
                <p className="text-sm text-muted-foreground">check-ins per week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consistency Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{trends.consistencyScore}%</div>
                <p className="text-sm text-muted-foreground">days with activity</p>
              </CardContent>
            </Card>
          </div>

          {summary.mostActiveHabit && (
            <Card>
              <CardHeader>
                <CardTitle>🏆 Most Active Habit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">{summary.mostActiveHabit.title.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-lg">{summary.mostActiveHabit.title}</p>
                    <p className="text-muted-foreground">
                      {summary.mostActiveHabit.totalCheckins} total check-ins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
