'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Network,
  BarChart4,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface EnhancedAnalyticsData {
  bestWorstDays?: Record<
    string,
    {
      bestDay: { dayOfWeek: number; dayName: string; completionRate: number };
      worstDay: { dayOfWeek: number; dayName: string; completionRate: number };
      allDays: Array<{ dayOfWeek: number; dayName: string; completionRate: number }>;
    } | null
  >;
  predictions?: Record<
    string,
    {
      currentStreak: number;
      survivalProbability: number;
      confidence: number;
      riskLevel: 'low' | 'medium' | 'high';
      contributingFactors: string[];
    } | null
  >;
  correlations?: Array<{
    habitATitle: string;
    habitBTitle: string;
    correlationCoefficient: number;
    correlationType: 'positive' | 'negative' | 'none';
    strength: 'strong' | 'moderate' | 'weak';
    insight: string;
  }>;
  trends?: Record<
    string,
    {
      monthly: Array<{ period: string; completionRate: number; completions: number }>;
      yearly: Array<{ period: string; completionRate: number; completions: number }>;
      trendDirection: 'improving' | 'stable' | 'declining';
      averageGrowthRate: number;
    }
  >;
  habits: Array<{ id: string; title: string; emoji: string | null }>;
}

interface EnhancedAnalyticsViewProps {
  entitlements?: { tier: string } | null;
}

export default function EnhancedAnalyticsView({ entitlements }: EnhancedAnalyticsViewProps) {
  const [data, setData] = useState<EnhancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/enhanced');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch enhanced analytics');
        }

        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (entitlements?.tier === 'plus') {
      fetchData();
    }
  }, [entitlements]);

  if (!entitlements || entitlements.tier !== 'plus') {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5" />
            Enhanced Analytics
          </CardTitle>
          <CardDescription>
            Unlock advanced insights with patterns, predictions, and correlations
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="p-4 border rounded-lg bg-muted/50">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Best/Worst Days</p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Streak Predictions</p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <Network className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Habit Correlations</p>
            </div>
            <div className="p-4 border rounded-lg bg-muted/50">
              <BarChart4 className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Trend Reports</p>
            </div>
          </div>
          <Button asChild>
            <a href="/pricing">Upgrade to Plus</a>
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
            <p className="text-muted-foreground">Analyzing your habits...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading enhanced analytics</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.habits || data.habits.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <CardTitle>Enhanced Analytics</CardTitle>
          <CardDescription>Start tracking habits to unlock powerful insights</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild>
            <a href="/app/habits">Add Your First Habit</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const habitToAnalyze = selectedHabit || data.habits[0]?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Analytics</h2>
          <p className="text-muted-foreground">Patterns, predictions, and correlations</p>
        </div>
      </div>

      {/* Habit Selector */}
      {data.habits.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Select Habit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.habits.map((habit) => (
                <Button
                  key={habit.id}
                  variant={selectedHabit === habit.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedHabit(habit.id)}
                >
                  <span className="mr-2">{habit.emoji}</span>
                  {habit.title}
                </Button>
              ))}
              <Button
                variant={selectedHabit === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedHabit(null)}
              >
                All Habits
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="best-worst" className="space-y-4">
        <TabsList>
          <TabsTrigger value="best-worst">Best/Worst Days</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Best/Worst Days Tab */}
        <TabsContent value="best-worst" className="space-y-4">
          {data.bestWorstDays && habitToAnalyze && data.bestWorstDays[habitToAnalyze] && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      Best Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <p className="text-3xl font-bold">
                        {data.bestWorstDays[habitToAnalyze].bestDay.dayName}
                      </p>
                      <div className="text-5xl font-bold text-green-600 dark:text-emerald-400">
                        {Math.round(data.bestWorstDays[habitToAnalyze].bestDay.completionRate)}%
                      </div>
                      <p className="text-sm text-muted-foreground">completion rate</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-5 w-5" />
                      Worst Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <p className="text-3xl font-bold">
                        {data.bestWorstDays[habitToAnalyze].worstDay.dayName}
                      </p>
                      <div className="text-5xl font-bold text-amber-600 dark:text-amber-400">
                        {Math.round(data.bestWorstDays[habitToAnalyze].worstDay.completionRate)}%
                      </div>
                      <p className="text-sm text-muted-foreground">completion rate</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Performance Pattern</CardTitle>
                  <CardDescription>Completion rate by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={data.bestWorstDays[habitToAnalyze].allDays}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="dayName" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Completion Rate"
                        dataKey="completionRate"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                      />
                      <Tooltip formatter={(value: number) => `${Math.round(value)}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {data.predictions &&
            Object.entries(data.predictions).map(([habitId, prediction]) => {
              if (!prediction) return null;
              const habit = data.habits.find((h) => h.id === habitId);
              if (!habit) return null;

              const riskColor =
                prediction.riskLevel === 'low'
                  ? 'text-green-600 dark:text-emerald-400'
                  : prediction.riskLevel === 'medium'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-rose-400';

              const riskBg =
                prediction.riskLevel === 'low'
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : prediction.riskLevel === 'medium'
                    ? 'bg-amber-100 dark:bg-amber-900/20'
                    : 'bg-red-100 dark:bg-red-900/20';

              return (
                <Card key={habitId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{habit.emoji}</span>
                      {habit.title}
                    </CardTitle>
                    <CardDescription>Streak survival analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Current Streak</p>
                        <div className="text-4xl font-bold">{prediction.currentStreak}</div>
                        <p className="text-xs text-muted-foreground">days</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Survival Probability</p>
                        <div className={`text-4xl font-bold ${riskColor}`}>
                          {prediction.survivalProbability}%
                        </div>
                        <p className="text-xs text-muted-foreground">confidence: {prediction.confidence}%</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Risk Level</p>
                        <Badge
                          className={`${riskBg} ${riskColor} text-lg px-4 py-2`}
                          variant="outline"
                        >
                          {prediction.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Survival Probability</span>
                        <span className="text-sm text-muted-foreground">
                          {prediction.survivalProbability}%
                        </span>
                      </div>
                      <Progress value={prediction.survivalProbability} className="h-3" />
                    </div>

                    {prediction.contributingFactors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3">Contributing Factors</p>
                        <div className="space-y-2">
                          {prediction.contributingFactors.map((factor, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/50"
                            >
                              <Zap className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                              <span>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations" className="space-y-4">
          {data.correlations && data.correlations.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Habit Relationships</CardTitle>
                  <CardDescription>
                    How your habits influence each other
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.correlations.map((corr, idx) => {
                    const strengthColor =
                      corr.strength === 'strong'
                        ? 'text-primary'
                        : corr.strength === 'moderate'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground';

                    const typeIcon =
                      corr.correlationType === 'positive' ? (
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-emerald-400" />
                      ) : corr.correlationType === 'negative' ? (
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-rose-400" />
                      ) : (
                        <Minus className="h-5 w-5 text-muted-foreground" />
                      );

                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {typeIcon}
                            <div>
                              <p className="font-medium">
                                {corr.habitATitle} ↔ {corr.habitBTitle}
                              </p>
                              <p className={`text-sm ${strengthColor}`}>
                                {corr.strength} {corr.correlationType} correlation
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            r = {corr.correlationCoefficient.toFixed(3)}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">{corr.insight}</p>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Progress
                              value={Math.abs(corr.correlationCoefficient) * 100}
                              className="h-2"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(Math.abs(corr.correlationCoefficient) * 100)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Track multiple habits for at least a week to see correlations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {data.trends &&
            Object.entries(data.trends).map(([habitId, trend]) => {
              const habit = data.habits.find((h) => h.id === habitId);
              if (!habit) return null;

              const trendIcon =
                trend.trendDirection === 'improving' ? (
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-emerald-400" />
                ) : trend.trendDirection === 'declining' ? (
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-rose-400" />
                ) : (
                  <Minus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                );

              const trendColor =
                trend.trendDirection === 'improving'
                  ? 'text-green-600 dark:text-emerald-400'
                  : trend.trendDirection === 'declining'
                    ? 'text-red-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400';

              return (
                <Card key={habitId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{habit.emoji}</span>
                      {habit.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {trendIcon}
                      <span className={trendColor}>
                        {trend.trendDirection.charAt(0).toUpperCase() + trend.trendDirection.slice(1)}
                      </span>
                      {trend.averageGrowthRate !== 0 && (
                        <span className="text-xs">
                          ({trend.averageGrowthRate > 0 ? '+' : ''}
                          {trend.averageGrowthRate.toFixed(1)}% avg growth)
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="monthly">
                      <TabsList>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                      </TabsList>

                      <TabsContent value="monthly">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={trend.monthly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip
                              formatter={(value: number, name: string) => {
                                if (name === 'completionRate') return `${value.toFixed(1)}%`;
                                return value;
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="completions"
                              stroke="hsl(var(--chart-1))"
                              strokeWidth={2}
                              name="Completions"
                            />
                            <Line
                              type="monotone"
                              dataKey="completionRate"
                              stroke="hsl(var(--chart-2))"
                              strokeWidth={2}
                              name="Rate %"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </TabsContent>

                      <TabsContent value="yearly">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={trend.yearly}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="period" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="completions" fill="hsl(var(--chart-1))" name="Completions" />
                          </BarChart>
                        </ResponsiveContainer>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
