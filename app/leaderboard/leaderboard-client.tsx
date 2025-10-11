"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import "./leaderboard.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Search,
	Trophy,
	Flame,
	Users,
	Settings,
	Crown,
	Medal,
	Star,
	Award,
} from "lucide-react";
import type { LeaderboardEntry } from "./page";

interface LeaderboardClientProps {
	entries: LeaderboardEntry[];
	currentUserId?: string;
}

export function LeaderboardClient({
	entries,
	currentUserId,
}: LeaderboardClientProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const leaderboardRef = useRef<HTMLDivElement>(null);

	// Filter entries based on search term
	const filteredEntries = entries.filter((entry) =>
		entry.username.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Find current user's entry
	const currentUserEntry = currentUserId
		? entries.find((entry) => entry.id === currentUserId)
		: null;
	const currentUserRank = currentUserEntry
		? entries.indexOf(currentUserEntry) + 1
		: null;

	const findMyAccount = useCallback(() => {
		if (currentUserEntry) {
			const element = document.getElementById(`entry-${currentUserEntry.id}`);
			if (element) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
				setHighlightedUser(currentUserEntry.id);
				setTimeout(() => setHighlightedUser(null), 3000);
			}
		}
	}, [currentUserEntry]);

	const getRankIcon = (rank: number) => {
		if (rank === 1) return <Crown className="w-5 h-5 text-primary" />;
		if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
		if (rank === 3)
			return <Medal className="w-5 h-5 text-amber-600 dark:text-amber-300" />;
		return (
			<span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
				{rank}
			</span>
		);
	};

	const getRankBadgeColor = (rank: number) => {
		if (rank === 1) return "rank-badge-1 text-white";
		if (rank === 2) return "rank-badge-2 text-white";
		if (rank === 3) return "rank-badge-3 text-white";
		if (rank <= 10) return "bg-primary text-primary-foreground";
		return "bg-muted text-muted-foreground";
	};

	const getStreakEmoji = (streak: number) => {
		if (streak >= 100) return "🔥🔥🔥";
		if (streak >= 50) return "🔥🔥";
		if (streak >= 30) return "🔥";
		if (streak >= 14) return "⚡";
		if (streak >= 7) return "💪";
		return "⭐";
	};

	const getStreakClass = (streak: number) => {
		if (streak >= 100) return "streak-emoji fire-effect";
		if (streak >= 50) return "streak-emoji";
		if (streak >= 30) return "streak-emoji";
		return "";
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-zest-50 to-accent">
			<div className="w-full px-4 py-8">
				<div className="max-w-4xl mx-auto">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="flex items-center justify-center gap-3 mb-4">
							<Trophy className="w-8 h-8 text-primary leaderboard-float" />
							<h1 className="text-4xl font-bold gradient-text">
								Streak Leaderboard
							</h1>
							<Trophy
								className="w-8 h-8 text-primary leaderboard-float"
								style={{ animationDelay: "1s" }}
							/>
						</div>
						<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
							See who&apos;s on fire! 🔥 These amazing people are crushing their
							habits with ongoing streaks and earning badges.
						</p>
					</div>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
							<CardContent className="p-6">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-primary/10 rounded-lg">
										<Users className="w-5 h-5 text-primary" />
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Active Streakers
										</p>
										<p className="text-2xl font-bold">{entries.length}</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-zest-300/20 bg-gradient-to-br from-zest-100/50 to-transparent">
							<CardContent className="p-6">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-zest-200/50 rounded-lg">
										<Flame className="w-5 h-5 text-zest-600" />
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Highest Streak
										</p>
										<p className="text-2xl font-bold text-zest-700">
											{entries.length > 0
												? `${entries[0].currentStreak} days`
												: "0 days"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-purple-200/20 bg-gradient-to-br from-purple-100/50 to-transparent">
							<CardContent className="p-6">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-purple-200/50 rounded-lg">
										<Award className="w-5 h-5 text-purple-600" />
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Most Badges</p>
										<p className="text-2xl font-bold text-purple-700">
											{entries.length > 0
												? `${Math.max(...entries.map((e) => e.badgeCount))}`
												: "0"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-chart-2/20 bg-gradient-to-br from-chart-2/10 to-transparent">
							<CardContent className="p-6">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-chart-2/20 rounded-lg">
										<Star className="w-5 h-5 text-chart-2" />
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Your Rank</p>
										<p className="text-2xl font-bold text-chart-2">
											{currentUserRank ? `#${currentUserRank}` : "Not ranked"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Search and Actions */}
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
							<input
								type="text"
								placeholder="Search by username..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
							/>
						</div>

						{currentUserEntry && (
							<Button
								onClick={findMyAccount}
								variant="outline"
								className="bg-primary/10 border-primary/20 hover:bg-primary/20"
							>
								<Search className="w-4 h-4 mr-2" />
								Find My Account
							</Button>
						)}

						<Button asChild variant="outline">
							<Link href="/app/badges">
								<Award className="w-4 h-4 mr-2" />
								View Badges
							</Link>
						</Button>

						<Button asChild variant="outline">
							<Link href="/app/me">
								<Settings className="w-4 h-4 mr-2" />
								Make Public
							</Link>
						</Button>
					</div>

					{/* Public Profile Notice */}
					{!currentUserEntry && currentUserId && (
						<Card className="mb-6 border-chart-3/20 bg-gradient-to-r from-chart-3/5 to-transparent">
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="p-2 bg-chart-3/20 rounded-lg">
										<Users className="w-5 h-5 text-chart-3" />
									</div>
									<div>
										<p className="text-sm font-medium">
											Don&apos;t see your account?
										</p>
										<p className="text-sm text-muted-foreground">
											Make sure your profile is public to appear on the
											leaderboard.
										</p>
									</div>
									<Button asChild size="sm" className="ml-auto">
										<Link href="/app/me">Update Profile</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Leaderboard */}
					<div
						ref={leaderboardRef}
						className="space-y-3 leaderboard-scroll max-h-[600px] overflow-y-auto"
						style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
					>
						{filteredEntries.length === 0 ? (
							<Card className="p-8 text-center">
								<div className="flex flex-col items-center gap-4">
									<div className="p-4 bg-muted rounded-full">
										<Trophy className="w-8 h-8 text-muted-foreground" />
									</div>
									<div>
										<h3 className="text-lg font-semibold mb-2">
											{searchTerm ? "No users found" : "No active streaks yet"}
										</h3>
										<p className="text-muted-foreground">
											{searchTerm
												? "Try adjusting your search terms."
												: "Be the first to start a streak and claim the top spot!"}
										</p>
									</div>
								</div>
							</Card>
						) : (
							filteredEntries.map((entry) => {
								const rank = entries.indexOf(entry) + 1;
								const isCurrentUser = entry.id === currentUserId;
								const isHighlighted = highlightedUser === entry.id;

								return (
									<Link
										key={entry.id}
										href={`/u/${entry.username}`}
										className="block"
									>
										<Card
											id={`entry-${entry.id}`}
											className={`leaderboard-card transition-all duration-500 cursor-pointer ${
												isHighlighted
													? "leaderboard-highlight ring-4 ring-primary/50 shadow-2xl scale-105 bg-gradient-to-r from-primary/10 to-zest-100/50"
													: isCurrentUser
														? "border-primary/30 bg-gradient-to-r from-primary/5 to-transparent"
														: "hover:shadow-lg hover:scale-102"
											}`}
											style={
												isHighlighted
													? {
															transform: "scale(1.01)",
															transition: "all 0.3s ease-in-out",
														}
													: undefined
											}
										>
											<CardContent className="p-4">
											<div className="flex items-center gap-4">
												{/* Rank */}
												<div
													className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(rank)}`}
												>
													{getRankIcon(rank)}
												</div>

												{/* Avatar */}
												<Avatar className="w-12 h-12 border-2 border-border">
													<AvatarImage
														src={entry.avatar_url || undefined}
														alt={entry.username}
													/>
													<AvatarFallback className="bg-primary/10 text-primary font-semibold">
														{entry.emoji || "🍋"}
													</AvatarFallback>
												</Avatar>

												{/* User Info */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<h3 className="font-semibold truncate">
															{entry.username}
														</h3>
														{isCurrentUser && (
															<Badge variant="secondary" className="text-xs">
																You
															</Badge>
														)}
													</div>
													<div className="flex items-center gap-2">
														<p className="text-sm text-muted-foreground">
															{entry.totalHabits} habit
															{entry.totalHabits !== 1 ? "s" : ""}
														</p>
														{entry.badgeCount > 0 && (
															<div className="flex items-center gap-1">
																<Award className="w-3 h-3 text-purple-500" />
																<span className="text-xs text-purple-600 font-medium">
																	{entry.badgeCount} badge
																	{entry.badgeCount !== 1 ? "s" : ""}
																</span>
															</div>
														)}
													</div>
												</div>

												{/* Streak Info */}
												<div className="text-right">
													<div className="flex items-center gap-1 mb-1">
														<span
															className={`text-2xl ${getStreakClass(entry.currentStreak)}`}
														>
															{getStreakEmoji(entry.currentStreak)}
														</span>
														<span className="text-2xl font-bold text-primary">
															{entry.currentStreak}
														</span>
													</div>
													<p className="text-sm text-muted-foreground">
														day{entry.currentStreak !== 1 ? "s" : ""} streak
													</p>
													{entry.longestStreak > entry.currentStreak && (
														<p className="text-xs text-muted-foreground">
															Best: {entry.longestStreak}
														</p>
													)}

													{/* Recent Badges */}
													{entry.badges.length > 0 && (
														<div className="mt-2 flex flex-wrap gap-1">
															{entry.badges.slice(0, 3).map((badge) => (
																<div
																	key={badge.kind}
																	className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
																	title={`${badge.kind.replace("_", " ")} - ${new Date(badge.awarded_at).toLocaleDateString()}`}
																>
																	{badge.kind === "first_streak" && "🌱"}
																	{badge.kind === "week_warrior" && "⚔️"}
																	{badge.kind === "month_master" && "👑"}
																	{badge.kind === "century_club" && "💯"}
																	{badge.kind === "streak_legend" && "🏆"}
																	{badge.kind === "habit_creator" && "✨"}
																	{badge.kind === "habit_collector" && "📚"}
																	{badge.kind === "habit_master" && "🎓"}
																	{badge.kind === "daily_dedication" && "📅"}
																	{badge.kind === "consistency_king" && "🎯"}
																	{badge.kind === "group_joiner" && "🤝"}
																	{badge.kind === "group_leader" && "👑"}
																	{badge.kind === "social_butterfly" && "🦋"}
																	{badge.kind === "public_profile" && "🌍"}
																	{badge.kind === "early_adopter" && "🚀"}
																	{badge.kind === "pro_upgrade" && "⭐"}
																	{badge.kind === "plus_upgrade" && "💎"}
																	{badge.kind === "perfect_week" && "🌟"}
																	{badge.kind === "comeback_kid" && "🔄"}
																	{badge.kind === "night_owl" && "🦉"}
																	{badge.kind === "early_bird" && "🐦"}
																	{![
																		"first_streak",
																		"week_warrior",
																		"month_master",
																		"century_club",
																		"streak_legend",
																		"habit_creator",
																		"habit_collector",
																		"habit_master",
																		"daily_dedication",
																		"consistency_king",
																		"group_joiner",
																		"group_leader",
																		"social_butterfly",
																		"public_profile",
																		"early_adopter",
																		"pro_upgrade",
																		"plus_upgrade",
																		"perfect_week",
																		"comeback_kid",
																		"night_owl",
																		"early_bird",
																	].includes(badge.kind) && "🏅"}
																</div>
															))}
															{entry.badges.length > 3 && (
																<div className="text-xs text-purple-600 px-2 py-1">
																	+{entry.badges.length - 3} more
																</div>
															)}
														</div>
													)}
												</div>
											</div>
											</CardContent>
										</Card>
									</Link>
								);
							})
						)}
					</div>

					{/* Footer */}
					<div className="mt-12 text-center">
						<Card className="inline-block border-primary/20 bg-gradient-to-r from-primary/5 to-zest-100/50">
							<CardContent className="p-6">
								<div className="flex items-center justify-center gap-2 mb-2">
									<Flame className="w-5 h-5 text-primary" />
									<span className="font-semibold">
										Keep the momentum going!
									</span>
									<Flame className="w-5 h-5 text-primary" />
								</div>
								<p className="text-sm text-muted-foreground">
									Every streak counts. Stay consistent and watch yourself climb
									the ranks! 🚀
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
