'use client';

import Link from 'next/link';
import type { ChallengeWithCreator } from '@/app/(app)/app/challenges/types';

type ActiveChallengeBannerProps = {
	challenges: ChallengeWithCreator[];
};

export function ActiveChallengeBanner({ challenges }: ActiveChallengeBannerProps) {
	const activeChallenges = challenges.filter((c) => c.status === 'active');

	if (activeChallenges.length === 0) {
		return null;
	}

	// Show the most recent active challenge
	const challenge = activeChallenges[0];
	const isParticipating = !!challenge.userParticipation;

	const endDate = new Date(challenge.endDate);
	const now = new Date();
	const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

	return (
		<Link
			href={`/app/challenges/${challenge.id}`}
			className="block mb-6 overflow-hidden group"
		>
			<div className="relative bg-gradient-to-r from-primary via-accent to-primary p-[2px] rounded-2xl">
				<div className="bg-card backdrop-blur-sm p-6 rounded-2xl transition-all group-hover:shadow-lg border border-border">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<div className="flex items-center gap-3 mb-2">
								{challenge.emoji && <span className="text-3xl">{challenge.emoji}</span>}
								<div>
									<h3 className="text-xl font-bold flex items-center gap-2">
										{challenge.title}
										<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary-foreground text-xs font-medium rounded-full border border-primary/30">
											<span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
											Active
										</span>
									</h3>
									<p className="text-sm text-muted-foreground">
										{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
									</p>
								</div>
							</div>

							{challenge.description && (
								<p className="text-sm text-foreground/80 line-clamp-2 mb-3">
									{challenge.description}
								</p>
							)}

							<div className="flex items-center gap-4 text-sm">
								<span className="text-muted-foreground">
									👥 {challenge.participantCount || 0} {challenge.participantCount === 1 ? 'participant' : 'participants'}
								</span>
								{isParticipating && challenge.userParticipation && (
									<span className="flex items-center gap-1.5 text-primary font-medium">
										<span className="text-lg">🎯</span>
										Your Score: {challenge.userParticipation.currentScore}
									</span>
								)}
							</div>
						</div>

						<div className="flex flex-col items-end gap-2">
							{isParticipating ? (
								<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary-foreground text-sm font-medium rounded-full border border-primary/30">
									✓ Participating
								</span>
							) : (
								<span className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl group-hover:opacity-90 transition-opacity shadow-sm">
									Join Challenge →
								</span>
							)}

							{activeChallenges.length > 1 && (
								<span className="text-xs text-muted-foreground">
									+{activeChallenges.length - 1} more active
								</span>
							)}
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}
