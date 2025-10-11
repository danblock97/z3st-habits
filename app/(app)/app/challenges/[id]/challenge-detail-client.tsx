'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useToast } from '@/lib/toast';
import { joinChallenge, leaveChallenge, deleteChallenge, importChallengeHabit } from '../actions';
import type { ChallengeWithCreator, LeaderboardEntry, ChallengeStats } from '../types';

type ChallengeDetailClientProps = {
	challenge: ChallengeWithCreator;
	leaderboard: LeaderboardEntry[];
	stats: ChallengeStats | null;
};

export function ChallengeDetailClient({
	challenge,
	leaderboard,
	stats,
}: ChallengeDetailClientProps) {
	const router = useRouter();
	const { showToast } = useToast();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleJoinChallenge = () => {
		setError(null);
		startTransition(async () => {
			const result = await joinChallenge(challenge.id);
			if (!result.success) {
				setError(result.message);
			} else {
				router.refresh();
			}
		});
	};

	const handleLeaveChallenge = () => {
		setError(null);
		startTransition(async () => {
			const result = await leaveChallenge(challenge.id);
			if (!result.success) {
				setError(result.message);
			} else {
				router.refresh();
			}
		});
	};

	const handleDeleteChallenge = () => {
		setError(null);
		startTransition(async () => {
			const result = await deleteChallenge(challenge.id);
			if (result.success) {
				router.push(`/app/groups/${challenge.groupId}`);
			} else {
				setError(result.message);
			}
		});
	};

	const handleImportHabit = () => {
		setError(null);
		startTransition(async () => {
			const result = await importChallengeHabit(challenge.id);
			if (!result.success) {
				showToast({
					title: 'Error',
					description: result.message,
					type: 'error',
				});
			} else {
				showToast({
					title: 'Success',
					description: result.message,
					type: 'success',
				});
				router.refresh();
			}
		});
	};

	const startDate = new Date(challenge.startDate);
	const endDate = new Date(challenge.endDate);
	const now = new Date();

	const canJoin =
		!challenge.userParticipation &&
		(challenge.status === 'upcoming' || challenge.status === 'active');
	const canLeave =
		challenge.userParticipation &&
		(challenge.status === 'upcoming' || challenge.status === 'active');

	const statusColors = {
		upcoming: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
		active: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
		completed: 'bg-secondary text-foreground border-border',
		cancelled: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
	};

	const statusLabels = {
		upcoming: 'Upcoming',
		active: 'Active',
		completed: 'Completed',
		cancelled: 'Cancelled',
	};

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-8">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-4">
					{challenge.emoji && <span className="text-5xl">{challenge.emoji}</span>}
					<div>
						<h1 className="text-3xl font-bold mb-1">{challenge.title}</h1>
						<Link
							href={`/app/groups/${challenge.groupId}`}
							className="text-blue-600 hover:underline text-sm"
						>
							← Back to {challenge.groupName}
						</Link>
					</div>
				</div>
				<span
					className={`px-4 py-1.5 rounded-full text-sm font-medium border ${statusColors[challenge.status]}`}
				>
					{statusLabels[challenge.status]}
				</span>
			</div>

			{/* Error Message */}
			{error && (
				<div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
					{error}
				</div>
			)}

			{/* Actions */}
			<div className="flex gap-3 flex-wrap">
				{canJoin && (
					<button
						onClick={handleJoinChallenge}
						disabled={isPending}
						className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium shadow-sm hover:shadow-md"
					>
						{isPending ? 'Joining...' : '🎯 Join Challenge'}
					</button>
				)}
				{challenge.userParticipation && (
					<button
						onClick={handleImportHabit}
						disabled={isPending}
						className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-xl hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 transition-all font-medium shadow-sm hover:shadow-md"
					>
						{isPending ? 'Importing...' : '📥 Import as Habit'}
					</button>
				)}
				{canLeave && (
					<button
						onClick={handleLeaveChallenge}
						disabled={isPending}
						className="px-6 py-2.5 border border-input bg-background rounded-xl hover:bg-accent disabled:opacity-50 transition-colors font-medium"
					>
						{isPending ? 'Leaving...' : 'Leave Challenge'}
					</button>
				)}
				<button
					onClick={() => setShowDeleteConfirm(true)}
					className="ml-auto px-4 py-2.5 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
				>
					Delete Challenge
				</button>
			</div>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
						<h3 className="text-xl font-bold mb-4">Delete Challenge?</h3>
						<p className="text-muted-foreground mb-6">
							Are you sure you want to delete this challenge? This action cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="px-4 py-2 border border-input rounded-xl hover:bg-accent transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteChallenge}
								disabled={isPending}
								className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
							>
								{isPending ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}

			<div className="grid md:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="md:col-span-2 space-y-6">
					{/* Description */}
					{challenge.description && (
						<div className="bg-card/50 backdrop-blur-sm p-6 border border-border/50 rounded-2xl shadow-sm">
							<h2 className="text-xl font-bold mb-3 flex items-center gap-2">
								<span className="text-2xl">📖</span>
								About This Challenge
							</h2>
							<p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{challenge.description}</p>
						</div>
					)}

					{/* Challenge Rules */}
					<div className="bg-gradient-to-br from-card to-card/50 p-6 border border-border/50 rounded-2xl shadow-sm">
						<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
							<span className="text-2xl">📋</span>
							Challenge Rules
						</h2>
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
								<span className="text-muted-foreground">Type</span>
								<span className="font-semibold">
									{challenge.rules.challenge_type === 'total_checkins' && '✅ Total Check-ins'}
									{challenge.rules.challenge_type === 'streak' && '🔥 Longest Streak'}
									{challenge.rules.challenge_type === 'specific_habit' && '🎯 Specific Habit'}
								</span>
							</div>
							<div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
								<span className="text-muted-foreground">Scoring</span>
								<span className="font-semibold capitalize">{challenge.rules.scoring}</span>
							</div>
							{challenge.rules.target_value && (
								<div className="flex items-center justify-between p-3 bg-accent/30 rounded-xl">
									<span className="text-muted-foreground">Target</span>
									<span className="font-semibold">{challenge.rules.target_value} points</span>
								</div>
							)}
						</div>
					</div>

					{/* Leaderboard */}
					<div className="bg-card/50 backdrop-blur-sm p-6 border border-border/50 rounded-2xl shadow-sm">
						<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
							<span className="text-2xl">🏆</span>
							Leaderboard
						</h2>
						{leaderboard.length === 0 ? (
							<p className="text-center text-muted-foreground py-12">
								No participants yet. Be the first to join!
							</p>
						) : (
							<div className="space-y-3">
								{leaderboard.map((entry) => (
									<LeaderboardRow key={entry.userId} entry={entry} />
								))}
							</div>
						)}
					</div>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Stats */}
					{stats && (
						<div className="bg-gradient-to-br from-card via-card to-accent/10 p-6 border border-border/50 rounded-2xl shadow-sm">
							<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
								<span className="text-2xl">📊</span>
								Stats
							</h2>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
									<div className="text-sm text-muted-foreground">👥 Participants</div>
									<div className="text-2xl font-bold">{stats.totalParticipants}</div>
								</div>
								<div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
									<div className="text-sm text-muted-foreground">📈 Avg Score</div>
									<div className="text-2xl font-bold">{stats.averageScore}</div>
								</div>
								<div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
									<div className="text-sm text-muted-foreground">⭐ Top Score</div>
									<div className="text-2xl font-bold">{stats.topScore}</div>
								</div>
								<div className="flex items-center justify-between p-3 bg-background/50 rounded-xl">
									<div className="text-sm text-muted-foreground">✅ Check-ins</div>
									<div className="text-2xl font-bold">{stats.totalCheckins}</div>
								</div>
								{challenge.status === 'active' && stats.daysRemaining > 0 && (
									<div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
										<div className="text-sm text-blue-600 dark:text-blue-400 font-medium">⏳ Days Left</div>
										<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
											{stats.daysRemaining}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Timeline */}
					<div className="bg-card/50 backdrop-blur-sm p-6 border border-border/50 rounded-2xl shadow-sm">
						<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
							<span className="text-2xl">📅</span>
							Timeline
						</h2>
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 bg-accent/20 rounded-xl">
								<div className="text-sm text-muted-foreground">Start</div>
								<div className="font-semibold">{startDate.toLocaleDateString()}</div>
							</div>
							<div className="flex items-center justify-between p-3 bg-accent/20 rounded-xl">
								<div className="text-sm text-muted-foreground">End</div>
								<div className="font-semibold">{endDate.toLocaleDateString()}</div>
							</div>
							<div className="flex items-center justify-between p-3 bg-accent/20 rounded-xl">
								<div className="text-sm text-muted-foreground">Duration</div>
								<div className="font-semibold">
									{Math.ceil(
										(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
									)}{' '}
									days
								</div>
							</div>
						</div>
					</div>

					{/* Your Progress (if participating) */}
					{challenge.userParticipation && (
						<div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 p-6 border border-blue-500/30 dark:border-blue-500/40 rounded-2xl shadow-lg">
							<h2 className="text-xl font-bold mb-4 flex items-center gap-2">
								<span className="text-2xl">🎯</span>
								Your Progress
							</h2>
							<div className="space-y-4">
								<div className="text-center p-4 bg-white/50 dark:bg-black/20 rounded-xl">
									<div className="text-sm text-muted-foreground mb-1">Score</div>
									<div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
										{challenge.userParticipation.currentScore}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
										<div className="text-xs text-muted-foreground mb-1">Current</div>
										<div className="text-2xl font-bold flex items-center justify-center gap-1">
											🔥 {challenge.userParticipation.currentStreak}
										</div>
									</div>
									<div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
										<div className="text-xs text-muted-foreground mb-1">Best</div>
										<div className="text-2xl font-bold flex items-center justify-center gap-1">
											⭐ {challenge.userParticipation.bestStreak}
										</div>
									</div>
								</div>
								<div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-xl">
									<div className="text-sm text-muted-foreground mb-1">Total Check-ins</div>
									<div className="text-xl font-bold">
										{challenge.userParticipation.totalCheckins}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

type LeaderboardRowProps = {
	entry: LeaderboardEntry;
};

function LeaderboardRow({ entry }: LeaderboardRowProps) {
	const rankColors = {
		1: 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-950 dark:to-yellow-900/50 border-yellow-400 dark:border-yellow-600',
		2: 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900/50 border-gray-400 dark:border-gray-600',
		3: 'bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-950 dark:to-orange-900/50 border-orange-400 dark:border-orange-600',
	};

	const rankEmojis = {
		1: '🥇',
		2: '🥈',
		3: '🥉',
	};

	const borderClass =
		entry.rank <= 3
			? rankColors[entry.rank as keyof typeof rankColors]
			: 'bg-card/50 border-border/50';

	return (
		<div className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all hover:shadow-md ${borderClass}`}>
			<div className="flex items-center justify-center w-12 h-12 font-bold text-lg shrink-0">
				{entry.rank <= 3 ? (
					<span className="text-3xl">{rankEmojis[entry.rank as keyof typeof rankEmojis]}</span>
				) : (
					<span className="text-muted-foreground">#{entry.rank}</span>
				)}
			</div>

			<div className="flex items-center gap-3 flex-1 min-w-0">
				{entry.emoji && <span className="text-2xl shrink-0">{entry.emoji}</span>}
				<div className="flex-1 min-w-0">
					<div className="font-semibold truncate">{entry.username || 'Anonymous'}</div>
					<div className="text-sm text-muted-foreground flex items-center gap-3">
						<span>🔥 {entry.currentStreak}</span>
						<span>✅ {entry.totalCheckins}</span>
					</div>
				</div>
			</div>

			<div className="text-right shrink-0">
				<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{entry.currentScore}</div>
				<div className="text-xs text-muted-foreground">points</div>
			</div>

			{entry.badges.length > 0 && (
				<div className="flex gap-1 shrink-0">
					{entry.badges.map((badge) => (
						<span key={badge.id} className="text-xl" title={badge.badgeType}>
							{badge.badgeType === 'winner' && '👑'}
							{badge.badgeType === 'top_3' && '🏆'}
							{badge.badgeType === 'streak_master' && '🔥'}
							{badge.badgeType === 'participant' && '⭐'}
						</span>
					))}
				</div>
			)}
		</div>
	);
}
