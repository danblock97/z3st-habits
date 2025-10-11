"use client";

import { useState, useMemo } from "react";
import { Calendar, BookOpen, Image as ImageIcon, Filter } from "lucide-react";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { JournalEntry } from "./types";

type JournalClientProps = {
	entries: JournalEntry[];
	timezone: string;
};

export function JournalClient({ entries, timezone }: JournalClientProps) {
	const [filterHabitId, setFilterHabitId] = useState<string>("all");
	const [filterType, setFilterType] = useState<"all" | "notes" | "photos">("all");

	// Get unique habits for filter
	const habits = useMemo(() => {
		const habitMap = new Map<string, { id: string; title: string; emoji: string | null }>();
		entries.forEach((entry) => {
			if (!habitMap.has(entry.habitId)) {
				habitMap.set(entry.habitId, {
					id: entry.habitId,
					title: entry.habitTitle,
					emoji: entry.habitEmoji,
				});
			}
		});
		return Array.from(habitMap.values());
	}, [entries]);

	// Filter entries
	const filteredEntries = useMemo(() => {
		return entries.filter((entry) => {
			if (filterHabitId !== "all" && entry.habitId !== filterHabitId) {
				return false;
			}
			if (filterType === "notes" && !entry.note) {
				return false;
			}
			if (filterType === "photos" && !entry.photoUrl) {
				return false;
			}
			return true;
		});
	}, [entries, filterHabitId, filterType]);

	// Group entries by date
	const entriesByDate = useMemo(() => {
		const grouped = new Map<string, JournalEntry[]>();
		filteredEntries.forEach((entry) => {
			const existing = grouped.get(entry.localDate) ?? [];
			grouped.set(entry.localDate, [...existing, entry]);
		});
		return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
	}, [filteredEntries]);

	return (
		<section className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">Journal</h1>
					<p className="text-muted-foreground">
						Review your check-in history, notes, and reflections.
					</p>
				</div>
			</div>

			{/* Filters */}
			<Card className="border-border/60 bg-card/80">
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Filter className="h-5 w-5" />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-4">
					<div className="flex-1 min-w-[200px]">
						<label className="text-sm font-medium mb-2 block">Habit</label>
						<Select value={filterHabitId} onValueChange={setFilterHabitId}>
							<SelectTrigger>
								<SelectValue placeholder="All habits" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All habits</SelectItem>
								{habits.map((habit) => (
									<SelectItem key={habit.id} value={habit.id}>
										{habit.emoji} {habit.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex-1 min-w-[200px]">
						<label className="text-sm font-medium mb-2 block">Type</label>
						<Select
							value={filterType}
							onValueChange={(value) => setFilterType(value as typeof filterType)}
						>
							<SelectTrigger>
								<SelectValue placeholder="All entries" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All entries</SelectItem>
								<SelectItem value="notes">With notes</SelectItem>
								<SelectItem value="photos">With photos</SelectItem>
							</SelectContent>
						</Select>
					</div>
					{(filterHabitId !== "all" || filterType !== "all") && (
						<div className="flex items-end">
							<Button
								variant="outline"
								onClick={() => {
									setFilterHabitId("all");
									setFilterType("all");
								}}
							>
								Clear filters
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Entries grouped by date */}
			{entriesByDate.length === 0 ? (
				<Card className="border-dashed border-border/70 bg-card/70">
					<CardHeader className="items-center text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
							<BookOpen className="h-5 w-5" aria-hidden="true" />
						</div>
						<CardTitle className="text-2xl">No journal entries yet</CardTitle>
						<CardDescription>
							Check in on your habits with notes or photos to build your journal.
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<div className="space-y-8">
					{entriesByDate.map(([date, dateEntries]) => (
						<div key={date} className="space-y-4">
							<div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
								<Calendar className="h-5 w-5 text-primary" />
								<h2 className="text-xl font-semibold">
									{new Date(date).toLocaleDateString("en-US", {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</h2>
								<Badge variant="secondary" className="ml-2">
									{dateEntries.length} {dateEntries.length === 1 ? "entry" : "entries"}
								</Badge>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{dateEntries.map((entry) => (
									<JournalEntryCard key={entry.id} entry={entry} />
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</section>
	);
}

function JournalEntryCard({ entry }: { entry: JournalEntry }) {
	const hasContent = entry.note || entry.photoUrl;

	return (
		<Card
			className={`border-border/60 bg-card/80 shadow-sm transition hover:border-border ${
				!hasContent ? "opacity-60" : ""
			}`}
		>
			<CardHeader className="space-y-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xl">
						<span role="img" aria-label="Habit emoji">
							{entry.habitEmoji ?? "🍋"}
						</span>
					</div>
					<div className="flex-1">
						<CardTitle className="text-base leading-tight">{entry.habitTitle}</CardTitle>
						<CardDescription className="text-xs">
							{entry.count} check-in{entry.count !== 1 ? "s" : ""}
						</CardDescription>
					</div>
					{hasContent && (
						<div className="flex gap-1">
							{entry.note && <BookOpen className="h-4 w-4 text-primary" />}
							{entry.photoUrl && <ImageIcon className="h-4 w-4 text-primary" />}
						</div>
					)}
				</div>
			</CardHeader>
			{hasContent && (
				<CardContent className="space-y-3">
					{entry.photoUrl && (
						<div className="relative aspect-video w-full overflow-hidden rounded-lg">
							<Image
								src={entry.photoUrl}
								alt="Check-in photo"
								fill
								className="object-cover"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							/>
						</div>
					)}
					{entry.note && (
						<div className="text-sm text-foreground/90">
							<p className="line-clamp-4">{entry.note}</p>
						</div>
					)}
				</CardContent>
			)}
		</Card>
	);
}
