"use client";

import {
	useActionState,
	useCallback,
	useEffect,
	useMemo,
	useOptimistic,
	useRef,
	startTransition,
	useState,
	type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import {
	AlertTriangle,
	CalendarClock,
	CircleDot,
	ListChecks,
	Plus,
	Share2,
	Sparkles,
	Trash2,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { checkStreakRisk } from "@/lib/streak-risk";
import { useEntitlements } from "@/lib/entitlements";
import { useToast } from "@/lib/toast";
import type { StreakResult } from "@/lib/streak";

import { completeHabitToday, createHabit, deleteHabit } from "./actions";
import { habitFormInitialState } from "./form-state";
import type { HabitCadence, HabitSummary } from "./types";
import { GoPlusModal } from "@/components/ui/go-plus-modal";
import { createTemplate } from "../templates/actions";

type HabitListItem = HabitSummary & { isOptimistic?: boolean };

type OptimisticAction =
	| { type: "replace"; habits: HabitListItem[] }
	| { type: "add"; habit: HabitListItem }
	| { type: "remove"; id: string }
	| { type: "increment"; id: string }
	| { type: "setCount"; id: string; count: number; isOptimistic?: boolean };

type HabitsClientProps = {
	habits: HabitSummary[];
	timezone: string;
	defaultEmoji: string;
	accountStreak: StreakResult;
};

const EMOJI_CHOICES = [
	"🍋",
	"🍊",
	"🍉",
	"🍇",
	"🍓",
	"🍑",
	"🥝",
	"🥥",
	"🌿",
	"⭐",
	"🔥",
	"⚡",
];

const EXAMPLE_HABITS = [
	// Daily habits
	{
		title: "Morning meditation",
		emoji: "🧘",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Drink 8 glasses of water",
		emoji: "💧",
		cadence: "daily" as const,
		targetPerPeriod: 8,
	},
	{
		title: "Read for 30 minutes",
		emoji: "📚",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Take a 10-minute walk",
		emoji: "🚶",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Write in journal",
		emoji: "📝",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Practice gratitude",
		emoji: "🙏",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Do 20 push-ups",
		emoji: "💪",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Eat 5 servings of vegetables",
		emoji: "🥗",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "No phone before 8 AM",
		emoji: "📱",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Floss teeth",
		emoji: "🦷",
		cadence: "daily" as const,
		targetPerPeriod: 1,
	},

	// Weekly habits
	{
		title: "Call family member",
		emoji: "📞",
		cadence: "weekly" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Cook a new recipe",
		emoji: "👨‍🍳",
		cadence: "weekly" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Go to the gym",
		emoji: "🏋️",
		cadence: "weekly" as const,
		targetPerPeriod: 3,
	},
	{
		title: "Review weekly goals",
		emoji: "🎯",
		cadence: "weekly" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Declutter one area",
		emoji: "🧹",
		cadence: "weekly" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Learn something new",
		emoji: "🎓",
		cadence: "weekly" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Have a digital detox day",
		emoji: "🌱",
		cadence: "weekly" as const,
		targetPerPeriod: 1,
	},
	{
		title: "Plan next week",
		emoji: "📅",
		cadence: "weekly" as const,
		targetPerPeriod: 1,
	},
];

export function HabitsClient({
	habits,
	timezone,
	defaultEmoji,
	accountStreak,
}: HabitsClientProps) {
	const { showToast } = useToast();
	const [optimisticHabits, sendOptimistic] = useOptimistic<
		HabitListItem[],
		OptimisticAction
	>(habits, (state, action) => {
		switch (action.type) {
			case "replace":
				return action.habits.map((habit) => ({
					...habit,
					isOptimistic: habit.isOptimistic ?? false,
				}));
			case "add": {
				const filtered = state.filter((habit) => habit.id !== action.habit.id);
				return [...filtered, action.habit];
			}
			case "remove":
				return state.filter((habit) => habit.id !== action.id);
			case "increment":
				return state.map((habit) =>
					habit.id === action.id
						? { ...habit, todayCount: habit.todayCount + 1 }
						: habit
				);
			case "setCount":
				return state.map((habit) =>
					habit.id === action.id
						? {
								...habit,
								todayCount: action.count,
								isOptimistic: action.isOptimistic ?? habit.isOptimistic,
							}
						: habit
				);
			default:
				return state;
		}
	});

	useEffect(() => {
		const cleanHabits = habits.map<HabitListItem>((habit) => ({
			...habit,
			isOptimistic: false,
		}));
		startTransition(() => {
			sendOptimistic({ type: "replace", habits: cleanHabits });
		});
	}, [habits, sendOptimistic]);

	const handleOptimisticAdd = useCallback(
		(habit: HabitListItem) => {
			startTransition(() => {
				sendOptimistic({ type: "add", habit });
			});
		},
		[sendOptimistic]
	);

	const handleOptimisticRemove = useCallback(
		(id: string) => {
			startTransition(() => {
				sendOptimistic({ type: "remove", id });
			});
		},
		[sendOptimistic]
	);

	const handleOptimisticIncrement = useCallback(
		(id: string) => {
			startTransition(() => {
				sendOptimistic({ type: "increment", id });
			});
		},
		[sendOptimistic]
	);

	const handleSetTodayCount = useCallback(
		(id: string, count: number, isOptimistic = false) => {
			startTransition(() => {
				sendOptimistic({ type: "setCount", id, count, isOptimistic });
			});
		},
		[sendOptimistic]
	);

	const [pendingCheckins, setPendingCheckins] = useState<
		Record<string, boolean>
	>({});
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [showUpsellModal, setShowUpsellModal] = useState(false);
	const [upsellFeature, setUpsellFeature] = useState<string | undefined>();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [habitToDelete, setHabitToDelete] = useState<HabitListItem | null>(
		null
	);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const entitlements = useEntitlements();

	// Determine target plan based on current tier
	const targetPlan = useMemo(() => {
		if (!entitlements) return "pro"; // Default to pro if entitlements not loaded
		return entitlements.tier === "free" ? "pro" : "plus";
	}, [entitlements]);

	// Streak risk detection
	const streakRisk = useMemo(() => {
		return checkStreakRisk(optimisticHabits);
	}, [optimisticHabits]);

	const sortedHabits = useMemo(() => {
		return [...optimisticHabits].sort(
			(a, b) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		);
	}, [optimisticHabits]);

	// Create refs for each habit to enable scrolling
	const habitRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	const scrollToMostAtRiskHabit = useCallback(() => {
		if (streakRisk.mostAtRiskHabit) {
			const element = habitRefs.current.get(streakRisk.mostAtRiskHabit.id);
			if (element) {
				element.scrollIntoView({
					behavior: "smooth",
					block: "center",
				});
				// Add a subtle highlight effect
				element.classList.add("ring-2", "ring-primary", "ring-offset-2");
				setTimeout(() => {
					element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
				}, 2000);
			}
		}
	}, [streakRisk.mostAtRiskHabit]);

	const handleTodayClick = useCallback(
		async (habit: HabitListItem) => {
			if (habit.isOptimistic || pendingCheckins[habit.id]) {
				return;
			}

			const originalCount = habit.todayCount;

			handleOptimisticIncrement(habit.id);
			setPendingCheckins((prev) => ({ ...prev, [habit.id]: true }));

			try {
				const result = await completeHabitToday({ habitId: habit.id });
				if (result.success) {
					handleSetTodayCount(habit.id, result.periodCount);

					// Show badge notifications if any were awarded
					if (result.badges && result.badges.length > 0) {
						result.badges.forEach((badge) => {
							if (badge.awarded && badge.message) {
								showToast({
									title: "🏆 Badge Unlocked!",
									description: badge.message,
									type: "success",
									duration: 6000,
								});
							}
						});
					}
				} else {
					handleSetTodayCount(habit.id, originalCount);
				}
			} catch {
				handleSetTodayCount(habit.id, originalCount);
			} finally {
				setPendingCheckins((prev) => {
					const next = { ...prev };
					delete next[habit.id];
					return next;
				});
			}
		},
		[pendingCheckins, handleOptimisticIncrement, handleSetTodayCount, showToast]
	);

	const hasHabits = sortedHabits.length > 0;

	const handleDeleteHabit = (habit: HabitListItem) => {
		setHabitToDelete(habit);
		setShowDeleteDialog(true);
		setDeleteError(null);
	};

	const handleConfirmDelete = async () => {
		if (!habitToDelete) return;

		// Optimistically remove the habit
		handleOptimisticRemove(habitToDelete.id);

		try {
			const result = await deleteHabit(habitToDelete.id);

			if (result.success) {
				setShowDeleteDialog(false);
				setHabitToDelete(null);
				// The page will revalidate automatically
			} else {
				setDeleteError(result.message || "Could not delete the habit.");
				// Re-add the habit if deletion failed
				const habitToReAdd: HabitListItem = {
					...habitToDelete,
					isOptimistic: false,
				};
				startTransition(() => {
					sendOptimistic({ type: "add", habit: habitToReAdd });
				});
			}
		} catch {
			setDeleteError("Could not delete the habit.");
			// Re-add the habit if deletion failed
			const habitToReAdd: HabitListItem = {
				...habitToDelete,
				isOptimistic: false,
			};
			startTransition(() => {
				sendOptimistic({ type: "add", habit: habitToReAdd });
			});
		}
	};

	return (
		<section className="space-y-10">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight">Habits</h1>
					<p className="text-muted-foreground">
						Keep rituals aligned with your {timezone} rhythm. Build them once
						and let Z3st keep the streak alive.
					</p>
					{accountStreak.current > 0 && (
						<div className="flex items-center gap-2 text-sm text-primary">
							<Sparkles className="h-4 w-4" />
							<span className="font-medium">
								{accountStreak.current} day
								{accountStreak.current !== 1 ? "s" : ""} streak
							</span>
							{accountStreak.longest > accountStreak.current && (
								<span className="text-muted-foreground">
									(Best: {accountStreak.longest} day
									{accountStreak.longest !== 1 ? "s" : ""})
								</span>
							)}
						</div>
					)}
				</div>
				<Button size="lg" onClick={() => setIsDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" aria-hidden="true" />
					New Habit
				</Button>
			</div>

			{/* Streak Risk Banner */}
			{streakRisk.isAtRisk && streakRisk.mostAtRiskHabit && (
				<Alert
					variant="warning"
					className="cursor-pointer"
					onClick={scrollToMostAtRiskHabit}
				>
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>
						Streak at Risk! 🔥
						{streakRisk.riskCount > 1 && ` (${streakRisk.riskCount} habits)`}
					</AlertTitle>
					<AlertDescription>
						You have a {accountStreak.current}-day account streak. Your{" "}
						<strong>{streakRisk.mostAtRiskHabit.title}</strong> streak of{" "}
						<strong>{streakRisk.mostAtRiskHabit.currentStreak} days</strong> is
						at risk — complete it today to keep the momentum going!
					</AlertDescription>
				</Alert>
			)}

			{hasHabits ? (
				<HabitGrid
					habits={sortedHabits}
					onCheckIn={handleTodayClick}
					onDeleteHabit={handleDeleteHabit}
					pendingCheckins={pendingCheckins}
					habitRefs={habitRefs}
				/>
			) : (
				<EmptyHabitsState onCreate={() => setIsDialogOpen(true)} />
			)}

			<NewHabitDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				defaultEmoji={defaultEmoji}
				timezone={timezone}
				onOptimisticAdd={handleOptimisticAdd}
				onOptimisticRemove={handleOptimisticRemove}
				onShowUpsell={setShowUpsellModal}
				onSetUpsellFeature={setUpsellFeature}
			/>

			<GoPlusModal
				open={showUpsellModal}
				onOpenChange={setShowUpsellModal}
				feature={upsellFeature}
				targetPlan={targetPlan}
			/>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete Habit</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &ldquo;{habitToDelete?.title}
							&rdquo;? This action cannot be undone and will remove all
							check-ins and progress history.
						</DialogDescription>
					</DialogHeader>
					{deleteError && (
						<p className="text-sm text-destructive">{deleteError}</p>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
							disabled={false} // Don't disable cancel during optimistic updates
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmDelete}
							disabled={false} // Don't disable confirm during optimistic updates
						>
							Delete Habit
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}

function HabitGrid({
	habits,
	onCheckIn,
	onDeleteHabit,
	pendingCheckins,
	habitRefs,
}: {
	habits: HabitListItem[];
	onCheckIn: (habit: HabitListItem) => void;
	onDeleteHabit: (habit: HabitListItem) => void;
	pendingCheckins: Record<string, boolean>;
	habitRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
	const [showShareDialog, setShowShareDialog] = useState(false);
	const [habitToShare, setHabitToShare] = useState<HabitListItem | null>(null);
	const [shareDescription, setShareDescription] = useState("");
	const [shareCategory, setShareCategory] = useState<string>("");
	const [shareTags, setShareTags] = useState("");
	const [isSharing, setIsSharing] = useState(false);
	const { showToast } = useToast();

	const handleShareClick = (habit: HabitListItem) => {
		setHabitToShare(habit);
		setShowShareDialog(true);
		setShareDescription("");
		setShareCategory("");
		setShareTags("");
	};

	const handleConfirmShare = async () => {
		if (!habitToShare) return;

		setIsSharing(true);
		const tags = shareTags
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		const result = await createTemplate({
			habitId: habitToShare.id,
			description: shareDescription || undefined,
			category: shareCategory || undefined,
			tags: tags.length > 0 ? tags : undefined,
		});

		setIsSharing(false);

		if (result.success) {
			showToast({
				title: "Success",
				description: result.message,
				variant: "success",
			});
			setShowShareDialog(false);
			setHabitToShare(null);
		} else {
			showToast({
				title: "Error",
				description: result.message,
				variant: "error",
			});
		}
	};
	if (!habits.length) {
		return null;
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{habits.map((habit) => (
				<Card
					key={habit.id}
					ref={(el) => {
						if (el) {
							habitRefs.current.set(habit.id, el);
						} else {
							habitRefs.current.delete(habit.id);
						}
					}}
					className={cn(
						"border-border/60 bg-card/80 shadow-sm transition",
						habit.isOptimistic
							? "ring-2 ring-primary/40"
							: "hover:border-border"
					)}
				>
					<CardHeader className="space-y-3">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
									<span role="img" aria-label="Habit emoji">
										{habit.emoji ?? "🍋"}
									</span>
								</div>
								<div>
									<CardTitle className="text-lg leading-tight">
										{habit.title}
									</CardTitle>
									<p className="text-xs text-muted-foreground">
										{getCadenceLabel(habit.cadence, habit.targetPerPeriod)}
									</p>
								</div>
							</div>
							{habit.isOptimistic ? (
								<Badge variant="secondary" className="text-xs">
									Saving…
								</Badge>
							) : pendingCheckins[habit.id] ? (
								<Badge variant="secondary" className="text-xs">
									Syncing…
								</Badge>
							) : null}
						</div>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<CalendarClock
								className="h-4 w-4 text-primary"
								aria-hidden="true"
							/>
							<span>{habit.timezone}</span>
						</div>
						<div className="flex items-center gap-2">
							<ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
							<span>
								Target {habit.targetPerPeriod} per{" "}
								{habit.cadence === "daily"
									? "day"
									: habit.cadence === "weekly"
										? "week"
										: "period"}
							</span>
						</div>
						<div className="flex items-center gap-2 text-xs">
							<CircleDot className="h-4 w-4 text-primary" aria-hidden="true" />
							<span>
								Created {new Date(habit.createdAt).toLocaleDateString("en-US")}
							</span>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between text-xs font-medium text-foreground/80">
								<span>Today</span>
								<span>
									{habit.todayCount} / {habit.targetPerPeriod}
								</span>
							</div>
							<Progress
								value={Math.min(
									100,
									(habit.todayCount / habit.targetPerPeriod) * 100
								)}
								aria-label={`Today's progress for ${habit.title}`}
							/>
						</div>
						<Button
							size="lg"
							className="w-full"
							onClick={() => onCheckIn(habit)}
							disabled={habit.isOptimistic || pendingCheckins[habit.id]}
						>
							{pendingCheckins[habit.id] ? "Logging…" : "Today"}
						</Button>
					</CardContent>
					<div className="border-t bg-muted/30 p-4 space-y-2">
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={() => handleShareClick(habit)}
							disabled={habit.isOptimistic}
						>
							<Share2 className="mr-2 h-4 w-4" />
							Share as Template
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="w-full text-destructive hover:text-destructive"
							onClick={() => onDeleteHabit(habit)}
							disabled={habit.isOptimistic}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete Habit
						</Button>
					</div>
				</Card>
				))}
			</div>

			{/* Share Template Dialog */}
			<Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Share Habit as Template</DialogTitle>
						<DialogDescription>
							Share &ldquo;{habitToShare?.title}&rdquo; with the community.
							Others will be able to import it as their own habit.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="share-description"
								className="text-sm font-medium mb-2 block"
							>
								Description (optional)
							</label>
							<Input
								id="share-description"
								placeholder="What makes this habit successful?"
								value={shareDescription}
								onChange={(e) => setShareDescription(e.target.value)}
								maxLength={500}
							/>
							<p className="text-xs text-muted-foreground mt-1">
								{shareDescription.length}/500
							</p>
						</div>
						<div>
							<label
								htmlFor="share-category"
								className="text-sm font-medium mb-2 block"
							>
								Category (optional)
							</label>
							<select
								id="share-category"
								className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								value={shareCategory}
								onChange={(e) => setShareCategory(e.target.value)}
							>
								<option value="">Select a category</option>
								<option value="fitness">Fitness</option>
								<option value="health">Health</option>
								<option value="productivity">Productivity</option>
								<option value="mindfulness">Mindfulness</option>
								<option value="learning">Learning</option>
								<option value="social">Social</option>
								<option value="finance">Finance</option>
								<option value="creative">Creative</option>
								<option value="other">Other</option>
							</select>
						</div>
						<div>
							<label
								htmlFor="share-tags"
								className="text-sm font-medium mb-2 block"
							>
								Tags (optional)
							</label>
							<Input
								id="share-tags"
								placeholder="morning, wellness, energy (comma separated)"
								value={shareTags}
								onChange={(e) => setShareTags(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Maximum 5 tags, comma separated
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowShareDialog(false)}
							disabled={isSharing}
						>
							Cancel
						</Button>
						<Button onClick={handleConfirmShare} disabled={isSharing}>
							{isSharing ? "Sharing..." : "Share Template"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function EmptyHabitsState({ onCreate }: { onCreate: () => void }) {
	return (
		<Card className="border-dashed border-border/70 bg-card/70">
			<CardHeader className="items-center text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
					<Sparkles className="h-5 w-5" aria-hidden="true" />
				</div>
				<CardTitle className="text-2xl">Plant your first ritual</CardTitle>
				<CardDescription>
					No habits yet. Kick things off with your first focus loop and
					we&apos;ll track the momentum from there.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center gap-6 pb-12">
				<ul className="grid gap-3 text-sm text-muted-foreground">
					<li className="flex items-center gap-2">
						<ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
						Capture the actions you repeat to stay energized.
					</li>
					<li className="flex items-center gap-2">
						<CalendarClock
							className="h-4 w-4 text-primary"
							aria-hidden="true"
						/>
						Stay anchored to the rhythm that fits your life.
					</li>
					<li className="flex items-center gap-2">
						<Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
						Supabase will sync streaks live once the habit is active.
					</li>
				</ul>
				<Button size="lg" onClick={onCreate}>
					<Plus className="mr-2 h-4 w-4" aria-hidden="true" />
					New Habit
				</Button>
			</CardContent>
		</Card>
	);
}

type NewHabitDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultEmoji: string;
	timezone: string;
	onOptimisticAdd: (habit: HabitListItem) => void;
	onOptimisticRemove: (id: string) => void;
	onShowUpsell: (show: boolean) => void;
	onSetUpsellFeature: (feature: string | undefined) => void;
};

function NewHabitDialog({
	open,
	onOpenChange,
	defaultEmoji,
	timezone,
	onOptimisticAdd,
	onOptimisticRemove,
	onShowUpsell,
	onSetUpsellFeature,
}: NewHabitDialogProps) {
	const [formState, formAction] = useActionState(
		createHabit,
		habitFormInitialState
	);
	const formRef = useRef<HTMLFormElement>(null);
	const optimisticIdRef = useRef<string | null>(null);
	const handledHabitIdRef = useRef<string | null>(null);

	const [title, setTitle] = useState("");
	const [emoji, setEmoji] = useState(defaultEmoji || "🍋");
	const [cadence, setCadence] = useState<HabitCadence>("daily");
	const [targetPerPeriod, setTargetPerPeriod] = useState(1);
	const [showExamples, setShowExamples] = useState(false);

	const handleSelectExample = useCallback(
		(example: (typeof EXAMPLE_HABITS)[0]) => {
			setTitle(example.title);
			setEmoji(example.emoji);
			setCadence(example.cadence);
			setTargetPerPeriod(example.targetPerPeriod);
			setShowExamples(false);
		},
		[]
	);

	useEffect(() => {
		setEmoji(defaultEmoji || "🍋");
	}, [defaultEmoji]);

	// Handle upgrade errors
	useEffect(() => {
		if (
			formState.status === "error" &&
			formState.message?.includes("Upgrade")
		) {
			onSetUpsellFeature("habit");
			onShowUpsell(true);
			onOpenChange(false);
		}
	}, [
		formState.status,
		formState.message,
		onSetUpsellFeature,
		onShowUpsell,
		onOpenChange,
	]);

	useEffect(() => {
		if (!open) {
			optimisticIdRef.current = null;
			handledHabitIdRef.current = null;
			setTitle("");
			setCadence("daily");
			setTargetPerPeriod(1);
			setEmoji(defaultEmoji || "🍋");
			setShowExamples(false);
			formRef.current?.reset();
		}
	}, [open, defaultEmoji]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		const formData = new FormData(event.currentTarget);
		const submittedTitle = String(formData.get("title") ?? "").trim();
		const submittedCadence =
			(formData.get("cadence") as HabitCadence) ?? "daily";
		const submittedTarget = Number.parseInt(
			String(formData.get("targetPerPeriod") ?? "1"),
			10
		);
		const submittedEmoji =
			String(formData.get("emoji") ?? "").trim() ||
			emoji ||
			defaultEmoji ||
			"🍋";

		const optimisticHabit: HabitListItem = {
			id: `optimistic-${Date.now()}`,
			title: submittedTitle || "New habit",
			emoji: submittedEmoji,
			cadence: submittedCadence,
			targetPerPeriod: Number.isFinite(submittedTarget)
				? Math.max(1, submittedTarget)
				: 1,
			timezone,
			createdAt: new Date().toISOString(),
			currentPeriodCount: 0,
			currentStreak: 0,
			longestStreak: 0,
			todayCount: 0,
			isOptimistic: true,
		};

		optimisticIdRef.current = optimisticHabit.id;
		onOptimisticAdd(optimisticHabit);
	};

	useEffect(() => {
		if (formState.status === "error" && optimisticIdRef.current) {
			startTransition(() => {
				onOptimisticRemove(optimisticIdRef.current!);
			});
			optimisticIdRef.current = null;
		}
	}, [formState.status, onOptimisticRemove]);

	useEffect(() => {
		if (
			formState.status === "success" &&
			formState.habit &&
			formState.habit.id
		) {
			const successId = formState.habit.id;
			if (handledHabitIdRef.current === successId) {
				return;
			}

			if (optimisticIdRef.current) {
				startTransition(() => {
					onOptimisticRemove(optimisticIdRef.current!);
				});
				optimisticIdRef.current = null;
			}

			if (formState.habit) {
				const habitWithOptimisticFlag: HabitListItem = {
					...formState.habit,
					isOptimistic: false,
				};
				startTransition(() => {
					onOptimisticAdd(habitWithOptimisticFlag);
				});
			}
			handledHabitIdRef.current = successId;

			formRef.current?.reset();
			setTitle("");
			setCadence("daily");
			setTargetPerPeriod(1);
			setEmoji(defaultEmoji || "🍋");
			setShowExamples(false);
			onOpenChange(false);
		}
	}, [
		formState,
		defaultEmoji,
		onOpenChange,
		onOptimisticAdd,
		onOptimisticRemove,
	]);

	const showError = formState.status === "error" && formState.message;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					{!showExamples ? (
						<>
							<DialogTitle>Create a habit</DialogTitle>
							<DialogDescription>
								Give your ritual a title, cadence, and daily target. We&apos;ll
								wire automations as the schema matures.
							</DialogDescription>
						</>
					) : (
						<>
							<DialogTitle>Choose an example habit</DialogTitle>
							<DialogDescription>
								Select from these proven habits to get started quickly, or
								create your own custom ritual.
							</DialogDescription>
						</>
					)}
				</DialogHeader>

				{!showExamples ? (
					<form
						ref={formRef}
						action={formAction}
						onSubmit={handleSubmit}
						className="grid gap-5"
					>
						<input type="hidden" name="timezone" value={timezone} />
						{showError ? (
							<p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{formState.message}
							</p>
						) : null}

						<div className="flex justify-center">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowExamples(true)}
								className="text-sm"
							>
								<Sparkles className="mr-2 h-4 w-4" />
								Browse examples
							</Button>
						</div>

						<div className="grid gap-2">
							<label
								htmlFor="habit-title"
								className="text-sm font-medium text-foreground"
							>
								Title
							</label>
							<Input
								id="habit-title"
								name="title"
								value={title}
								onChange={(event) => setTitle(event.target.value)}
								placeholder="Sunrise mobility primer"
								minLength={3}
								maxLength={80}
								aria-invalid={Boolean(formState.fieldErrors?.title)}
							/>
							{formState.fieldErrors?.title ? (
								<p className="text-xs text-destructive">
									{formState.fieldErrors.title}
								</p>
							) : null}
						</div>
						<div className="grid gap-2">
							<span className="text-sm font-medium text-foreground">Emoji</span>
							<div className="flex flex-wrap gap-2">
								{EMOJI_CHOICES.map((choice) => {
									const isSelected = emoji === choice;
									return (
										<button
											key={choice}
											type="button"
											onClick={() => setEmoji(choice)}
											className={cn(
												"flex h-10 w-10 items-center justify-center rounded-full border text-xl transition",
												isSelected
													? "border-primary bg-primary/10 text-primary"
													: "border-border/60 bg-background hover:border-primary/50"
											)}
											aria-pressed={isSelected}
										>
											<span role="img" aria-label={`Use ${choice}`}>
												{choice}
											</span>
										</button>
									);
								})}
								<button
									type="button"
									onClick={() => setEmoji(defaultEmoji || "🍋")}
									className="flex h-10 items-center rounded-full border border-border/60 px-3 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-primary"
								>
									Reset
								</button>
							</div>
							<Input
								id="habit-emoji"
								name="emoji"
								value={emoji}
								onChange={(event) => setEmoji(event.target.value)}
								maxLength={8}
								aria-invalid={Boolean(formState.fieldErrors?.emoji)}
							/>
							{formState.fieldErrors?.emoji ? (
								<p className="text-xs text-destructive">
									{formState.fieldErrors.emoji}
								</p>
							) : null}
						</div>
						<div className="grid gap-2">
							<label
								htmlFor="habit-cadence"
								className="text-sm font-medium text-foreground"
							>
								Cadence
							</label>
							<select
								id="habit-cadence"
								name="cadence"
								value={cadence}
								onChange={(event) =>
									setCadence(event.target.value as HabitCadence)
								}
								className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
							>
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="custom">Custom</option>
							</select>
							{formState.fieldErrors?.cadence ? (
								<p className="text-xs text-destructive">
									{formState.fieldErrors.cadence}
								</p>
							) : null}
						</div>
						<div className="grid gap-2">
							<label
								htmlFor="habit-target"
								className="text-sm font-medium text-foreground"
							>
								Target per period
							</label>
							<Input
								id="habit-target"
								name="targetPerPeriod"
								type="number"
								min={1}
								max={24}
								step={1}
								value={targetPerPeriod}
								onChange={(event) =>
									setTargetPerPeriod(Number(event.target.value))
								}
								aria-invalid={Boolean(formState.fieldErrors?.targetPerPeriod)}
							/>
							{formState.fieldErrors?.targetPerPeriod ? (
								<p className="text-xs text-destructive">
									{formState.fieldErrors.targetPerPeriod}
								</p>
							) : null}
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button type="button" variant="outline">
									Cancel
								</Button>
							</DialogClose>
							<SubmitButton />
						</DialogFooter>
					</form>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								Select a habit to get started, or create your own
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setShowExamples(false)}
							>
								Create custom
							</Button>
						</div>

						<div className="grid max-h-64 gap-2 overflow-y-auto">
							{EXAMPLE_HABITS.map((example, index) => (
								<button
									key={index}
									type="button"
									onClick={() => handleSelectExample(example)}
									className="flex items-center gap-3 rounded-lg border border-border/60 p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
								>
									<span className="text-xl" role="img" aria-label="Habit emoji">
										{example.emoji}
									</span>
									<div className="flex-1">
										<p className="text-sm font-medium">{example.title}</p>
										<p className="text-xs text-muted-foreground">
											{getCadenceLabel(
												example.cadence,
												example.targetPerPeriod
											)}
										</p>
									</div>
									<div className="text-xs text-muted-foreground">
										{example.cadence === "daily"
											? "Daily"
											: example.cadence === "weekly"
												? "Weekly"
												: "Custom"}
									</div>
								</button>
							))}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

function SubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending}>
			{pending ? "Saving…" : "Save habit"}
		</Button>
	);
}

function getCadenceLabel(cadence: HabitCadence, target: number) {
	const formattedTarget = target === 1 ? "once" : `${target} times`;
	switch (cadence) {
		case "daily":
			return `${formattedTarget} per day`;
		case "weekly":
			return `${formattedTarget} each week`;
		default:
			return `${formattedTarget} per custom rhythm`;
	}
}
