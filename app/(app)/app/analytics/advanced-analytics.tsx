"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
	Download,
	TrendingUp,
	Target,
	Flame,
	BarChart3,
	FileText,
} from "lucide-react";
import {
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	AreaChart,
	Area,
	ComposedChart,
	Legend,
} from "recharts";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DependencyGraph } from "./dependency-graph";
import EnhancedAnalyticsView from "./enhanced-analytics-view";

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

interface AdvancedAnalyticsProps {
	habitId?: string;
	entitlements?: {
		tier: string;
		source: Record<string, unknown>;
		updatedAt: string;
	} | null;
}

export default function AdvancedAnalytics({
	habitId,
	entitlements,
}: AdvancedAnalyticsProps) {
	const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [period, setPeriod] = useState("30d");
	const [customDateRange, setCustomDateRange] = useState({ from: "", to: "" });
	const [periodInfo, setPeriodInfo] = useState<{
		start: string;
		end: string;
		type: string;
	} | null>(null);

	const fetchAnalytics = useCallback(
		async (selectedPeriod: string, dateFrom?: string, dateTo?: string) => {
			setLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams();

				if (selectedPeriod === "custom" && dateFrom && dateTo) {
					params.set("period", "custom");
					params.set("dateFrom", dateFrom);
					params.set("dateTo", dateTo);
				} else {
					params.set("period", selectedPeriod);
				}

				if (habitId) {
					params.set("habitId", habitId);
				}

				const response = await fetch(`/api/analytics/habits?${params}`);
				const result = await response.json();

				if (!response.ok) {
					throw new Error(result.error || "Failed to fetch analytics");
				}

				setAnalyticsData(result.data);
				if (result.period) {
					setPeriodInfo(result.period);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setLoading(false);
			}
		},
		[habitId]
	);

	useEffect(() => {
		if (period === "custom" && customDateRange.from && customDateRange.to) {
			fetchAnalytics(period, customDateRange.from, customDateRange.to);
		} else if (period !== "custom") {
			fetchAnalytics(period);
		}
	}, [period, customDateRange, habitId, fetchAnalytics]);

	const handleExportCSV = async () => {
		try {
			const params = new URLSearchParams();

			if (period === "custom" && customDateRange.from && customDateRange.to) {
				params.set("dateFrom", customDateRange.from);
				params.set("dateTo", customDateRange.to);
			} else {
				// For predefined periods, use last 30 days as default for export
				const endDate = new Date();
				const startDate = new Date();
				startDate.setDate(startDate.getDate() - 30);

				params.set("dateFrom", startDate.toISOString().split("T")[0]);
				params.set("dateTo", endDate.toISOString().split("T")[0]);
			}

			const response = await fetch(`/api/analytics/export?${params}`);
			const blob = await response.blob();

			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download =
				response.headers.get("Content-Disposition")?.split("filename=")[1] ||
				"habits-export.csv";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err) {
			console.error("Export error:", err);
		}
	};

	if (!entitlements || entitlements.tier !== "plus") {
		return (
			<Card className="border-dashed">
				<CardHeader className="text-center">
					<CardTitle className="flex items-center justify-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Advanced Analytics
					</CardTitle>
					<CardDescription>
						Upgrade to Plus to unlock advanced analytics and CSV export
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center">
					<Button asChild>
						<a href="/pricing">Upgrade to Plus</a>
					</Button>
				</CardContent>
			</Card>
		);
	}

	// If user has Plus but no data, show encouragement to add habits
	if (
		analyticsData === null ||
		(analyticsData && analyticsData.dailyStats.length === 0)
	) {
		return (
			<Card className="border-dashed">
				<CardHeader className="text-center">
					<CardTitle className="flex items-center justify-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Advanced Analytics
					</CardTitle>
					<CardDescription>
						Advanced analytics and CSV export ready!
					</CardDescription>
				</CardHeader>
				<CardContent className="text-center space-y-4">
					<p className="text-muted-foreground">
						Add some habits and start tracking to unlock powerful insights and
						export your data!
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
						<p className="text-muted-foreground">
							Loading advanced analytics...
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Error loading analytics</AlertTitle>
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	if (!analyticsData) {
		return (
			<Alert>
				<AlertTitle>No data available</AlertTitle>
				<AlertDescription>
					No habit data found for the selected period. Complete some habits to
					see analytics!
				</AlertDescription>
			</Alert>
		);
	}

	const { summary, dailyStats, habitBreakdown, trends } = analyticsData;

	return (
		<div className="space-y-6">
			{/* Header with Export */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Advanced Analytics</h2>
					<p className="text-muted-foreground">
						Insights from {periodInfo?.start || "N/A"} to{" "}
						{periodInfo?.end || "N/A"}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handleExportCSV}>
						<Download className="mr-2 h-4 w-4" />
						Export CSV
					</Button>
				</div>
			</div>

			{/* Period Selector */}
			<div className="flex flex-wrap gap-2">
				{["7d", "30d", "custom"].map((p) => (
					<Button
						key={p}
						variant={period === p ? "default" : "outline"}
						size="sm"
						onClick={() => setPeriod(p)}
					>
						{p === "7d"
							? "Last 7 days"
							: p === "30d"
								? "Last 30 days"
								: "Custom range"}
					</Button>
				))}

				{period === "custom" && (
					<div className="flex gap-2 ml-4">
						<input
							type="date"
							value={customDateRange.from}
							onChange={(e) =>
								setCustomDateRange((prev) => ({
									...prev,
									from: e.target.value,
								}))
							}
							className="px-3 py-1 border rounded text-sm"
						/>
						<input
							type="date"
							value={customDateRange.to}
							onChange={(e) =>
								setCustomDateRange((prev) => ({ ...prev, to: e.target.value }))
							}
							className="px-3 py-1 border rounded text-sm"
						/>
					</div>
				)}
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Check-ins
						</CardTitle>
						<Target className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.totalCheckins}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Habits</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.totalHabits}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Completion Rate
						</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{summary.averageCompletionRate}%
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Consistency</CardTitle>
						<Flame className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{trends.consistencyScore}%</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Best Streak</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{summary.streakDays}</div>
						<p className="text-xs text-muted-foreground">days</p>
					</CardContent>
				</Card>
			</div>

			{/* Advanced Charts */}
			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="habits">Habit Analysis</TabsTrigger>
					<TabsTrigger value="trends">Trends</TabsTrigger>
					<TabsTrigger value="comparisons">Comparisons</TabsTrigger>
					<TabsTrigger value="enhanced">Enhanced Insights</TabsTrigger>
					<TabsTrigger value="dependencies">Dependencies</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Daily Activity Trend</CardTitle>
								<CardDescription>
									Check-ins and completion rate over time
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<ComposedChart data={dailyStats}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="date"
											tickFormatter={(value) =>
												new Date(value).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												})
											}
										/>
										<YAxis yAxisId="left" />
										<YAxis yAxisId="right" orientation="right" />
										<Tooltip
											labelFormatter={(value) =>
												new Date(value).toLocaleDateString()
											}
										/>
										<Legend />
										<Bar
											yAxisId="left"
											dataKey="totalCheckins"
											fill="#8884d8"
											name="Check-ins"
										/>
										<Line
											yAxisId="right"
											type="monotone"
											dataKey="completionRate"
											stroke="#82ca9d"
											strokeWidth={2}
											name="Completion %"
										/>
									</ComposedChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Habit Performance Distribution</CardTitle>
								<CardDescription>
									Check-ins by habit with performance metrics
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={habitBreakdown.slice(0, 8)}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="title"
											angle={-45}
											textAnchor="end"
											height={80}
											fontSize={12}
										/>
										<YAxis />
										<Tooltip />
										<Bar dataKey="totalCheckins" fill="#8884d8" />
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="habits" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Detailed Habit Analysis</CardTitle>
							<CardDescription>
								Comprehensive breakdown of habit performance
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{habitBreakdown.map((habit) => (
									<div key={habit.habitId} className="border rounded-lg p-4">
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
													<span className="text-xl">{habit.emoji}</span>
												</div>
												<div>
													<p className="font-semibold">{habit.title}</p>
													<p className="text-sm text-muted-foreground">
														{habit.streakDays} days active
													</p>
												</div>
											</div>
											<Badge
												variant={
													habit.completionRate >= 80
														? "default"
														: habit.completionRate >= 60
															? "secondary"
															: "destructive"
												}
											>
												{habit.completionRate}%
											</Badge>
										</div>

										<div className="grid grid-cols-3 gap-4 text-sm">
											<div>
												<p className="font-medium">Total Check-ins</p>
												<p className="text-2xl font-bold">
													{habit.totalCheckins}
												</p>
											</div>
											<div>
												<p className="font-medium">Daily Average</p>
												<p className="text-2xl font-bold">
													{(
														habit.totalCheckins / Math.max(1, habit.streakDays)
													).toFixed(1)}
												</p>
											</div>
											<div>
												<p className="font-medium">Performance</p>
												<p
													className={`text-lg font-bold ${
														habit.completionRate >= 80
															? "text-green-600 dark:text-emerald-300"
															: habit.completionRate >= 60
																? "text-amber-600 dark:text-amber-300"
																: "text-red-600 dark:text-rose-300"
													}`}
												>
													{habit.completionRate >= 80
														? "Excellent"
														: habit.completionRate >= 60
															? "Good"
															: "Needs Work"}
												</p>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="trends" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Weekly Trends</CardTitle>
								<CardDescription>Activity patterns over time</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={250}>
									<AreaChart data={dailyStats}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="date"
											tickFormatter={(value) =>
												new Date(value).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												})
											}
										/>
										<YAxis />
										<Tooltip
											labelFormatter={(value) =>
												new Date(value).toLocaleDateString()
											}
										/>
										<Area
											type="monotone"
											dataKey="totalCheckins"
											stroke="#8884d8"
											fill="#8884d8"
											fillOpacity={0.6}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Performance Metrics</CardTitle>
								<CardDescription>Key performance indicators</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex justify-between items-center">
									<span>Daily Average</span>
									<span className="font-bold">
										{trends.dailyAverage} check-ins
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span>Weekly Average</span>
									<span className="font-bold">
										{Math.round(trends.weeklyAverage)} check-ins
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span>Consistency Score</span>
									<span className="font-bold">{trends.consistencyScore}%</span>
								</div>
								<div className="flex justify-between items-center">
									<span>Best Day</span>
									<span className="font-bold">
										{trends.bestDay
											? new Date(trends.bestDay).toLocaleDateString("en-US", {
													weekday: "long",
												})
											: "N/A"}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="comparisons" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Habit Comparisons</CardTitle>
							<CardDescription>
								Compare habit performance across different metrics
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={400}>
								<ComposedChart data={habitBreakdown}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="title"
										angle={-45}
										textAnchor="end"
										height={80}
									/>
									<YAxis yAxisId="left" />
									<YAxis yAxisId="right" orientation="right" />
									<Tooltip />
									<Legend />
									<Bar
										yAxisId="left"
										dataKey="totalCheckins"
										fill="#8884d8"
										name="Total Check-ins"
									/>
									<Line
										yAxisId="right"
										type="monotone"
										dataKey="completionRate"
										stroke="#82ca9d"
										strokeWidth={2}
										name="Completion %"
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="enhanced" className="space-y-4">
					<EnhancedAnalyticsView entitlements={entitlements} />
				</TabsContent>

				<TabsContent value="dependencies" className="space-y-4">
					<DependencyGraph />
				</TabsContent>
			</Tabs>
		</div>
	);
}
