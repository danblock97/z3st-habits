import { createServerClient } from '@/lib/supabase/server';

/**
 * Challenge completion tracking and badge awarding logic
 * This should be called periodically (e.g., daily cron job)
 */

export type ChallengeCompletionResult = {
	challengesProcessed: number;
	challengesCompleted: number;
	badgesAwarded: number;
	errors: string[];
};

/**
 * Process all active challenges and update their status
 * Award badges for completed challenges
 */
export async function processActiveChallenges(): Promise<ChallengeCompletionResult> {
	const supabase = await createServerClient();
	const result: ChallengeCompletionResult = {
		challengesProcessed: 0,
		challengesCompleted: 0,
		badgesAwarded: 0,
		errors: [],
	};

	try {
		// Update challenge statuses based on current date
		const { error: statusError } = await supabase.rpc('update_challenge_status');

		if (statusError) {
			result.errors.push(`Failed to update challenge statuses: ${statusError.message}`);
			return result;
		}

		// Get all challenges that just completed (status changed to completed today)
		const { data: completedChallenges, error: fetchError } = await supabase
			.from('group_challenges')
			.select('id, title, end_date')
			.eq('status', 'completed')
			.gte('end_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
			.lte('end_date', new Date().toISOString());

		if (fetchError) {
			result.errors.push(`Failed to fetch completed challenges: ${fetchError.message}`);
			return result;
		}

		if (!completedChallenges || completedChallenges.length === 0) {
			return result;
		}

		result.challengesProcessed = completedChallenges.length;

		// Award badges for each completed challenge
		for (const challenge of completedChallenges) {
			try {
				const { error: badgeError } = await supabase.rpc('award_challenge_badges', {
					p_challenge_id: challenge.id,
				});

				if (badgeError) {
					result.errors.push(
						`Failed to award badges for challenge ${challenge.title}: ${badgeError.message}`
					);
				} else {
					result.challengesCompleted++;
					result.badgesAwarded++; // This is simplified - actual count would need to be tracked
				}
			} catch (error) {
				result.errors.push(
					`Error processing challenge ${challenge.title}: ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		return result;
	} catch (error) {
		result.errors.push(
			`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
		return result;
	}
}

/**
 * Update challenge participant streaks
 * This should be called after check-ins are processed
 */
export async function updateChallengeParticipantStreaks(
	userId: string,
	checkInDate: string
): Promise<void> {
	const supabase = await createServerClient();

	try {
		// Get all active challenges the user is participating in
		const { data: participations, error: fetchError } = await supabase
			.from('challenge_participants')
			.select(
				`
				challenge_id,
				current_streak,
				best_streak,
				last_checkin_date,
				group_challenges!inner(id, status, start_date, end_date)
			`
			)
			.eq('user_id', userId);

		if (fetchError || !participations) {
			console.error('Failed to fetch user challenge participations:', fetchError);
			return;
		}

		const checkInDateObj = new Date(checkInDate);

		for (const participation of participations) {
			const challenge = Array.isArray(participation.group_challenges)
				? participation.group_challenges[0]
				: participation.group_challenges;

			if (!challenge || challenge.status !== 'active') {
				continue;
			}

			// Check if check-in is within challenge period
			const startDate = new Date(challenge.start_date);
			const endDate = new Date(challenge.end_date);

			if (checkInDateObj < startDate || checkInDateObj > endDate) {
				continue;
			}

			// Calculate new streak
			let newStreak = 1;
			const lastCheckInDate = participation.last_checkin_date
				? new Date(participation.last_checkin_date)
				: null;

			if (lastCheckInDate) {
				const daysDiff = Math.floor(
					(checkInDateObj.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
				);

				if (daysDiff === 1) {
					// Consecutive day
					newStreak = participation.current_streak + 1;
				} else if (daysDiff === 0) {
					// Same day - keep current streak
					newStreak = participation.current_streak;
				}
				// daysDiff > 1 means streak is broken, reset to 1
			}

			const newBestStreak = Math.max(newStreak, participation.best_streak);

			// Update participant streak
			await supabase
				.from('challenge_participants')
				.update({
					current_streak: newStreak,
					best_streak: newBestStreak,
					last_checkin_date: checkInDate,
				})
				.eq('challenge_id', participation.challenge_id)
				.eq('user_id', userId);
		}
	} catch (error) {
		console.error('Error updating challenge participant streaks:', error);
	}
}

/**
 * Check if a user has completed a challenge target
 */
export async function checkChallengeCompletion(
	userId: string,
	challengeId: string
): Promise<boolean> {
	const supabase = await createServerClient();

	try {
		// Get challenge and participant data
		const { data: challenge } = await supabase
			.from('group_challenges')
			.select('rules')
			.eq('id', challengeId)
			.single();

		const { data: participant } = await supabase
			.from('challenge_participants')
			.select('current_score, completed')
			.eq('challenge_id', challengeId)
			.eq('user_id', userId)
			.single();

		if (!challenge || !participant || participant.completed) {
			return false;
		}

		// Check if target is met
		const targetValue = challenge.rules.target_value;
		if (!targetValue) {
			return false;
		}

		const hasCompletedTarget = participant.current_score >= targetValue;

		if (hasCompletedTarget) {
			// Mark as completed
			await supabase
				.from('challenge_participants')
				.update({
					completed: true,
					completed_at: new Date().toISOString(),
				})
				.eq('challenge_id', challengeId)
				.eq('user_id', userId);

			// Award milestone badge
			await supabase.from('challenge_badges').insert({
				challenge_id: challengeId,
				user_id: userId,
				badge_type: 'milestone',
				badge_data: {
					target_value: targetValue,
					score: participant.current_score,
				},
			});

			return true;
		}

		return false;
	} catch (error) {
		console.error('Error checking challenge completion:', error);
		return false;
	}
}

/**
 * Get challenge summary for a group
 */
export async function getGroupChallengeSummary(groupId: string) {
	const supabase = await createServerClient();

	const { data: challenges } = await supabase
		.from('group_challenges')
		.select('id, status')
		.eq('group_id', groupId)
		.eq('is_active', true);

	const total = challenges?.length || 0;
	const active = challenges?.filter((c) => c.status === 'active').length || 0;
	const upcoming = challenges?.filter((c) => c.status === 'upcoming').length || 0;
	const completed = challenges?.filter((c) => c.status === 'completed').length || 0;

	return {
		total,
		active,
		upcoming,
		completed,
	};
}

/**
 * Get user's challenge badges
 */
export async function getUserChallengeBadges(userId: string) {
	const supabase = await createServerClient();

	const { data: badges } = await supabase
		.from('challenge_badges')
		.select(
			`
			*,
			group_challenges!inner(id, title, emoji)
		`
		)
		.eq('user_id', userId)
		.order('awarded_at', { ascending: false });

	return badges || [];
}
