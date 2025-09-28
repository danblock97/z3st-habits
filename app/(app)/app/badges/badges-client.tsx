"use client";

import { useState } from "react";
import { Trophy, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BadgeDefinition } from "./page";

type BadgesClientProps = {
	badges: BadgeDefinition[];
};

const rarityColors = {
	common:
		"bg-gray-100 text-gray-800 border-gray-300 dark:bg-slate-800/60 dark:text-slate-100 dark:border-slate-600/60",
	rare: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-400/40",
	epic: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-400/40",
	legendary:
		"bg-amber-100 text-amber-800 border-amber-300 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-400/40",
} as const;

const categoryIcons = {
	streak: "🔥",
	habits: "📝",
	social: "👥",
	milestone: "🏅",
	special: "✨",
};

export function BadgesClient({ badges }: BadgesClientProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

	const categories = [
		"all",
		...Array.from(new Set(badges.map((b) => b.category))),
	];

	const filteredBadges = badges.filter((badge) => {
		const matchesSearch =
			badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			badge.description.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory =
			selectedCategory === "all" || badge.category === selectedCategory;
		const matchesUnlocked = !showUnlockedOnly || badge.unlocked;

		return matchesSearch && matchesCategory && matchesUnlocked;
	});

	const unlockedCount = badges.filter((b) => b.unlocked).length;
	const totalCount = badges.length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<Trophy className="h-6 w-6 text-primary" />
				</div>
				<div>
					<h1 className="text-3xl font-bold">Badges</h1>
					<p className="text-muted-foreground">
						Unlock achievements as you build better habits
					</p>
				</div>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Trophy className="h-4 w-4 text-primary" />
							<div>
								<p className="text-sm text-muted-foreground">Unlocked</p>
								<p className="text-2xl font-bold">{unlockedCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-primary" />
							<div>
								<p className="text-sm text-muted-foreground">Total</p>
								<p className="text-2xl font-bold">{totalCount}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center gap-2">
							<div className="h-4 w-4 rounded-full bg-primary" />
							<div>
								<p className="text-sm text-muted-foreground">Progress</p>
								<p className="text-2xl font-bold">
									{Math.round((unlockedCount / totalCount) * 100)}%
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search badges..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex gap-2">
					<select
						value={selectedCategory}
						onChange={(e) => setSelectedCategory(e.target.value)}
						className="rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						{categories.map((category) => (
							<option key={category} value={category}>
								{category === "all"
									? "All Categories"
									: category.charAt(0).toUpperCase() + category.slice(1)}
							</option>
						))}
					</select>
					<Button
						variant={showUnlockedOnly ? "default" : "outline"}
						onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
						size="sm"
					>
						{showUnlockedOnly ? "Show All" : "Unlocked Only"}
					</Button>
				</div>
			</div>

			{/* Badges Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{filteredBadges.map((badge) => (
					<Card
						key={badge.id}
						className={cn(
							"transition-all duration-200 hover:shadow-md",
							badge.unlocked ? "opacity-100" : "opacity-60"
						)}
					>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="text-4xl">{badge.emoji}</div>
								<Badge
									variant="outline"
									className={cn("text-xs", rarityColors[badge.rarity])}
								>
									{badge.rarity}
								</Badge>
							</div>
							<div className="space-y-1">
								<CardTitle className="text-lg">{badge.name}</CardTitle>
								<div className="flex items-center gap-2">
									<span className="text-sm text-muted-foreground">
										{categoryIcons[badge.category]} {badge.category}
									</span>
								</div>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<CardDescription className="text-sm">
								{badge.description}
							</CardDescription>
							{badge.unlocked && badge.unlockedAt && (
								<div className="mt-3 pt-3 border-t">
									<p className="text-xs text-muted-foreground">
										Unlocked {new Date(badge.unlockedAt).toLocaleDateString()}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{filteredBadges.length === 0 && (
				<div className="text-center py-12">
					<Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 className="text-lg font-semibold mb-2">No badges found</h3>
					<p className="text-muted-foreground">
						Try adjusting your search or filter criteria
					</p>
				</div>
			)}
		</div>
	);
}
