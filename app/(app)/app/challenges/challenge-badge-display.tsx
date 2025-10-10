'use client';

import type { ChallengeBadge } from './types';

type ChallengeBadgeDisplayProps = {
	badges: ChallengeBadge[];
	size?: 'sm' | 'md' | 'lg';
	showLabel?: boolean;
};

export function ChallengeBadgeDisplay({
	badges,
	size = 'md',
	showLabel = true,
}: ChallengeBadgeDisplayProps) {
	if (badges.length === 0) {
		return null;
	}

	const sizeClasses = {
		sm: 'text-xl',
		md: 'text-2xl',
		lg: 'text-4xl',
	};

	return (
		<div className="flex flex-wrap gap-3">
			{badges.map((badge) => (
				<ChallengeBadgeItem
					key={badge.id}
					badge={badge}
					size={size}
					showLabel={showLabel}
				/>
			))}
		</div>
	);
}

type ChallengeBadgeItemProps = {
	badge: ChallengeBadge;
	size: 'sm' | 'md' | 'lg';
	showLabel: boolean;
};

function ChallengeBadgeItem({ badge, size, showLabel }: ChallengeBadgeItemProps) {
	const { emoji, label, color } = getBadgeInfo(badge);

	const sizeClasses = {
		sm: 'text-xl p-2',
		md: 'text-2xl p-3',
		lg: 'text-4xl p-4',
	};

	return (
		<div
			className={`inline-flex flex-col items-center gap-1 ${sizeClasses[size]} bg-white border-2 ${color} rounded-lg shadow-sm hover:shadow-md transition-shadow`}
			title={label}
		>
			<span>{emoji}</span>
			{showLabel && (
				<span className="text-xs font-medium text-gray-700 text-center">{label}</span>
			)}
		</div>
	);
}

function getBadgeInfo(badge: ChallengeBadge): { emoji: string; label: string; color: string } {
	switch (badge.badgeType) {
		case 'winner':
			return {
				emoji: '👑',
				label: 'Winner',
				color: 'border-yellow-400 bg-yellow-50',
			};
		case 'top_3':
			const rank = (badge.badgeData.rank as number) || 2;
			return {
				emoji: rank === 2 ? '🥈' : '🥉',
				label: `${rank}${rank === 2 ? 'nd' : 'rd'} Place`,
				color: rank === 2 ? 'border-gray-400 bg-gray-50' : 'border-orange-400 bg-orange-50',
			};
		case 'participant':
			return {
				emoji: '⭐',
				label: 'Participant',
				color: 'border-blue-400 bg-blue-50',
			};
		case 'streak_master':
			return {
				emoji: '🔥',
				label: 'Streak Master',
				color: 'border-red-400 bg-red-50',
			};
		case 'milestone':
			return {
				emoji: '🎯',
				label: 'Milestone',
				color: 'border-green-400 bg-green-50',
			};
		case 'perfect_score':
			return {
				emoji: '💯',
				label: 'Perfect Score',
				color: 'border-purple-400 bg-purple-50',
			};
		case 'most_improved':
			return {
				emoji: '📈',
				label: 'Most Improved',
				color: 'border-indigo-400 bg-indigo-50',
			};
		default:
			return {
				emoji: '🏆',
				label: 'Badge',
				color: 'border-gray-400 bg-gray-50',
			};
	}
}

type UserBadgesProps = {
	userId: string;
	badges: ChallengeBadge[];
	compact?: boolean;
};

export function UserChallengeBadges({ badges, compact = false }: UserBadgesProps) {
	if (badges.length === 0) {
		return compact ? null : (
			<div className="text-center py-8 text-gray-500">
				<p>No challenge badges yet</p>
				<p className="text-sm mt-2">Join challenges and compete to earn badges!</p>
			</div>
		);
	}

	// Group badges by type
	const badgesByType = badges.reduce(
		(acc, badge) => {
			if (!acc[badge.badgeType]) {
				acc[badge.badgeType] = [];
			}
			acc[badge.badgeType].push(badge);
			return acc;
		},
		{} as Record<string, ChallengeBadge[]>
	);

	if (compact) {
		return (
			<div className="flex flex-wrap gap-2">
				{Object.entries(badgesByType).map(([type, typeBadges]) => (
					<div
						key={type}
						className="relative inline-flex"
						title={`${typeBadges.length} ${type} badge${typeBadges.length > 1 ? 's' : ''}`}
					>
						<ChallengeBadgeItem badge={typeBadges[0]} size="sm" showLabel={false} />
						{typeBadges.length > 1 && (
							<span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
								{typeBadges.length}
							</span>
						)}
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{Object.entries(badgesByType).map(([type, typeBadges]) => (
				<div key={type}>
					<h3 className="text-lg font-semibold mb-3 capitalize">
						{type.replace('_', ' ')} ({typeBadges.length})
					</h3>
					<ChallengeBadgeDisplay badges={typeBadges} size="md" showLabel={true} />
				</div>
			))}
		</div>
	);
}
