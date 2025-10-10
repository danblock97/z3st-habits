'use client';

import { useState } from 'react';
import Link from 'next/link';

import type { ChallengeWithCreator, ChallengeStatus } from './types';

type ChallengeListProps = {
	challenges: ChallengeWithCreator[];
	showGroupName?: boolean;
};

export function ChallengeList({ challenges, showGroupName = false }: ChallengeListProps) {
	const [filter, setFilter] = useState<ChallengeStatus | 'all'>('all');

	const filteredChallenges =
		filter === 'all' ? challenges : challenges.filter((c) => c.status === filter);

	return (
		<div className="space-y-4">
			{/* Filter Tabs */}
			<div className="flex gap-2 border-b border-border">
				<button
					onClick={() => setFilter('all')}
					className={`px-4 py-2 font-medium border-b-2 transition-colors ${
						filter === 'all'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					All ({challenges.length})
				</button>
				<button
					onClick={() => setFilter('active')}
					className={`px-4 py-2 font-medium border-b-2 transition-colors ${
						filter === 'active'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					Active ({challenges.filter((c) => c.status === 'active').length})
				</button>
				<button
					onClick={() => setFilter('upcoming')}
					className={`px-4 py-2 font-medium border-b-2 transition-colors ${
						filter === 'upcoming'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					Upcoming ({challenges.filter((c) => c.status === 'upcoming').length})
				</button>
				<button
					onClick={() => setFilter('completed')}
					className={`px-4 py-2 font-medium border-b-2 transition-colors ${
						filter === 'completed'
							? 'border-blue-600 text-blue-600'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					Completed ({challenges.filter((c) => c.status === 'completed').length})
				</button>
			</div>

			{/* Challenge Cards */}
			<div className="grid gap-4">
				{filteredChallenges.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						<p className="text-lg">No {filter !== 'all' ? filter : ''} challenges found</p>
						<p className="text-sm mt-2">Create a challenge to get started!</p>
					</div>
				) : (
					filteredChallenges.map((challenge) => (
						<ChallengeCard
							key={challenge.id}
							challenge={challenge}
							showGroupName={showGroupName}
						/>
					))
				)}
			</div>
		</div>
	);
}

type ChallengeCardProps = {
	challenge: ChallengeWithCreator;
	showGroupName?: boolean;
};

function ChallengeCard({ challenge, showGroupName = false }: ChallengeCardProps) {
	const startDate = new Date(challenge.startDate);
	const endDate = new Date(challenge.endDate);
	const now = new Date();

	const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
	const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
	const daysElapsed = Math.max(
		0,
		Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
	);
	const progress = Math.min(100, (daysElapsed / totalDays) * 100);

	const statusColors = {
		upcoming: 'bg-blue-100 text-blue-800',
		active: 'bg-green-100 text-green-800',
		completed: 'bg-gray-100 text-gray-800',
		cancelled: 'bg-red-100 text-red-800',
	};

	const statusLabels = {
		upcoming: 'Upcoming',
		active: 'Active',
		completed: 'Completed',
		cancelled: 'Cancelled',
	};

	return (
		<Link
			href={`/app/challenges/${challenge.id}`}
			className="block p-6 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow"
		>
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					{challenge.emoji && <span className="text-3xl">{challenge.emoji}</span>}
					<div>
						<h3 className="text-xl font-bold">{challenge.title}</h3>
						{showGroupName && challenge.groupName && (
							<p className="text-sm text-muted-foreground">in {challenge.groupName}</p>
						)}
					</div>
				</div>
				<span
					className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[challenge.status]}`}
				>
					{statusLabels[challenge.status]}
				</span>
			</div>

			{challenge.description && (
				<p className="text-foreground mb-4 line-clamp-2">{challenge.description}</p>
			)}

			<div className="space-y-3">
				{/* Date Range */}
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span>📅</span>
					<span>
						{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
					</span>
					{challenge.status === 'active' && daysRemaining > 0 && (
						<span className="ml-auto font-medium text-blue-600">
							{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
						</span>
					)}
				</div>

				{/* Progress Bar (for active challenges) */}
				{challenge.status === 'active' && (
					<div className="space-y-1">
						<div className="h-2 bg-secondary rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-600 transition-all"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<div className="flex justify-between text-xs text-muted-foreground">
							<span>
								Day {daysElapsed} of {totalDays}
							</span>
							<span>{Math.round(progress)}%</span>
						</div>
					</div>
				)}

				{/* Participants and Creator */}
				<div className="flex items-center justify-between text-sm">
					<div className="flex items-center gap-2 text-muted-foreground">
						<span>👥</span>
						<span>
							{challenge.participantCount || 0}{' '}
							{challenge.participantCount === 1 ? 'participant' : 'participants'}
						</span>
					</div>

					{challenge.userParticipation ? (
						<div className="flex items-center gap-2 text-green-600 font-medium">
							<span>✓</span>
							<span>Joined</span>
						</div>
					) : (
						<div className="text-muted-foreground">Not participating</div>
					)}
				</div>

				{/* User Score (if participating) */}
				{challenge.userParticipation && (
					<div className="pt-3 border-t border-border">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">Your Score</span>
							<span className="text-2xl font-bold text-blue-600">
								{challenge.userParticipation.currentScore}
							</span>
						</div>
						<div className="flex gap-4 mt-2 text-xs text-muted-foreground">
							<span>Streak: {challenge.userParticipation.currentStreak}</span>
							<span>Total: {challenge.userParticipation.totalCheckins} check-ins</span>
						</div>
					</div>
				)}
			</div>
		</Link>
	);
}
