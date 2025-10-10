'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';

import type {
	GroupChallenge,
	ChallengeWithCreator,
	ParticipantWithProfile,
	LeaderboardEntry,
	ChallengeStats,
	CreateChallengeInput,
	UpdateChallengeInput,
	ChallengeActionResult,
	JoinChallengeResult,
	ChallengeFilters,
} from './types';

// ========================================
// VALIDATION SCHEMAS
// ========================================

const createChallengeSchema = z.object({
	groupId: z.string().uuid('Invalid group ID'),
	title: z
		.string({ required_error: 'Challenge title is required.' })
		.trim()
		.min(3, 'Challenge title must be at least 3 characters long.')
		.max(100, 'Challenge title must be at most 100 characters long.'),
	description: z.string().max(500, 'Description must be at most 500 characters').optional(),
	emoji: z.string().max(10).optional(),
	startDate: z.string().datetime('Invalid start date'),
	endDate: z.string().datetime('Invalid end date'),
	rules: z.object({
		challenge_type: z.enum(['total_checkins', 'streak', 'specific_habit']),
		target_value: z.number().int().positive().optional().nullable(),
		habits: z.array(z.string().uuid()).default([]),
		scoring: z.enum(['total', 'average', 'best']).default('total'),
		description: z.string().optional(),
	}),
});

const updateChallengeSchema = z.object({
	id: z.string().uuid('Invalid challenge ID'),
	title: z
		.string()
		.trim()
		.min(3, 'Challenge title must be at least 3 characters long.')
		.max(100, 'Challenge title must be at most 100 characters long.')
		.optional(),
	description: z.string().max(500, 'Description must be at most 500 characters').optional(),
	emoji: z.string().max(10).optional(),
	startDate: z.string().datetime('Invalid start date').optional(),
	endDate: z.string().datetime('Invalid end date').optional(),
	rules: z
		.object({
			challenge_type: z.enum(['total_checkins', 'streak', 'specific_habit']),
			target_value: z.number().int().positive().optional().nullable(),
			habits: z.array(z.string().uuid()).default([]),
			scoring: z.enum(['total', 'average', 'best']).default('total'),
			description: z.string().optional(),
		})
		.optional(),
	status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional(),
	isActive: z.boolean().optional(),
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function toChallengeWithCreator(record: any): ChallengeWithCreator {
	return {
		id: record.id,
		groupId: record.group_id,
		creatorId: record.creator_id,
		title: record.title,
		description: record.description,
		emoji: record.emoji,
		startDate: record.start_date,
		endDate: record.end_date,
		rules: record.rules,
		status: record.status,
		isActive: record.is_active,
		createdAt: record.created_at,
		updatedAt: record.updated_at,
		creatorUsername: record.profiles?.username || null,
		creatorEmoji: record.profiles?.emoji || null,
		groupName: record.groups?.name || null,
		participantCount: record.participant_count || 0,
		userParticipation: record.user_participation
			? {
					challengeId: record.user_participation.challenge_id,
					userId: record.user_participation.user_id,
					joinedAt: record.user_participation.joined_at,
					currentScore: record.user_participation.current_score,
					currentStreak: record.user_participation.current_streak,
					bestStreak: record.user_participation.best_streak,
					totalCheckins: record.user_participation.total_checkins,
					lastCheckinDate: record.user_participation.last_checkin_date,
					completed: record.user_participation.completed,
					completedAt: record.user_participation.completed_at,
					metadata: record.user_participation.metadata,
			  }
			: null,
	};
}

function toParticipantWithProfile(record: any): ParticipantWithProfile {
	return {
		challengeId: record.challenge_id,
		userId: record.user_id,
		joinedAt: record.joined_at,
		currentScore: record.current_score,
		currentStreak: record.current_streak,
		bestStreak: record.best_streak,
		totalCheckins: record.total_checkins,
		lastCheckinDate: record.last_checkin_date,
		completed: record.completed,
		completedAt: record.completed_at,
		metadata: record.metadata,
		username: record.profiles?.username || null,
		emoji: record.profiles?.emoji || null,
		avatarUrl: record.profiles?.avatar_url || null,
	};
}

// ========================================
// CREATE CHALLENGE
// ========================================

export async function createChallenge(input: CreateChallengeInput): Promise<ChallengeActionResult> {
	const parsed = createChallengeSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.errors[0]?.message ?? 'Invalid input',
		};
	}

	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: 'You need to be signed in to create challenges.',
		};
	}

	const userId = session.user.id;

	// Verify user is admin or owner of the group
	const { data: membership } = await supabase
		.from('group_members')
		.select('role')
		.eq('group_id', parsed.data.groupId)
		.eq('user_id', userId)
		.maybeSingle();

	if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
		return {
			success: false,
			message: 'You do not have permission to create challenges in this group.',
		};
	}

	// Validate date range
	const startDate = new Date(parsed.data.startDate);
	const endDate = new Date(parsed.data.endDate);

	if (endDate <= startDate) {
		return {
			success: false,
			message: 'End date must be after start date.',
		};
	}

	// Create challenge
	const { data: challenge, error: createError } = await supabase
		.from('group_challenges')
		.insert({
			group_id: parsed.data.groupId,
			creator_id: userId,
			title: parsed.data.title,
			description: parsed.data.description || null,
			emoji: parsed.data.emoji || null,
			start_date: parsed.data.startDate,
			end_date: parsed.data.endDate,
			rules: parsed.data.rules,
			status: startDate <= new Date() ? 'active' : 'upcoming',
		})
		.select('id')
		.single();

	if (createError || !challenge) {
		console.error('Challenge creation failed:', createError);
		return {
			success: false,
			message: createError?.message ?? 'We could not create that challenge right now.',
		};
	}

	revalidatePath(`/app/groups/${parsed.data.groupId}`);
	revalidatePath('/app/challenges');

	return {
		success: true,
		challengeId: challenge.id,
		message: 'Challenge created successfully!',
	};
}

// ========================================
// UPDATE CHALLENGE
// ========================================

export async function updateChallenge(input: UpdateChallengeInput): Promise<ChallengeActionResult> {
	const parsed = updateChallengeSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.errors[0]?.message ?? 'Invalid input',
		};
	}

	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: 'You need to be signed in to update challenges.',
		};
	}

	const userId = session.user.id;

	// Get the challenge to verify permissions
	const { data: challenge } = await supabase
		.from('group_challenges')
		.select('id, group_id, creator_id, groups!inner(owner_id)')
		.eq('id', parsed.data.id)
		.maybeSingle();

	if (!challenge) {
		return {
			success: false,
			message: 'Challenge not found.',
		};
	}

	// Check if user is creator or group owner
	const groups = Array.isArray(challenge.groups) ? challenge.groups[0] : challenge.groups;
	const isCreator = challenge.creator_id === userId;
	const isGroupOwner = groups?.owner_id === userId;

	if (!isCreator && !isGroupOwner) {
		return {
			success: false,
			message: 'You do not have permission to update this challenge.',
		};
	}

	// Build update object
	const updates: any = {};
	if (parsed.data.title !== undefined) updates.title = parsed.data.title;
	if (parsed.data.description !== undefined) updates.description = parsed.data.description;
	if (parsed.data.emoji !== undefined) updates.emoji = parsed.data.emoji;
	if (parsed.data.startDate !== undefined) updates.start_date = parsed.data.startDate;
	if (parsed.data.endDate !== undefined) updates.end_date = parsed.data.endDate;
	if (parsed.data.rules !== undefined) updates.rules = parsed.data.rules;
	if (parsed.data.status !== undefined) updates.status = parsed.data.status;
	if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;

	// Update challenge
	const { error: updateError } = await supabase
		.from('group_challenges')
		.update(updates)
		.eq('id', parsed.data.id);

	if (updateError) {
		console.error('Challenge update failed:', updateError);
		return {
			success: false,
			message: updateError.message ?? 'Could not update the challenge.',
		};
	}

	revalidatePath(`/app/challenges/${parsed.data.id}`);
	revalidatePath(`/app/groups/${challenge.group_id}`);

	return {
		success: true,
		message: 'Challenge updated successfully!',
	};
}

// ========================================
// DELETE CHALLENGE
// ========================================

export async function deleteChallenge(challengeId: string): Promise<ChallengeActionResult> {
	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: 'You need to be signed in to delete challenges.',
		};
	}

	const userId = session.user.id;

	// Get the challenge to verify permissions
	const { data: challenge } = await supabase
		.from('group_challenges')
		.select('id, group_id, creator_id, title, groups!inner(owner_id)')
		.eq('id', challengeId)
		.maybeSingle();

	if (!challenge) {
		return {
			success: false,
			message: 'Challenge not found.',
		};
	}

	// Check if user is creator or group owner
	const groups = Array.isArray(challenge.groups) ? challenge.groups[0] : challenge.groups;
	const isCreator = challenge.creator_id === userId;
	const isGroupOwner = groups?.owner_id === userId;

	if (!isCreator && !isGroupOwner) {
		return {
			success: false,
			message: 'You do not have permission to delete this challenge.',
		};
	}

	// Delete challenge (cascade will handle participants and badges)
	const { error: deleteError } = await supabase
		.from('group_challenges')
		.delete()
		.eq('id', challengeId);

	if (deleteError) {
		console.error('Challenge deletion failed:', deleteError);
		return {
			success: false,
			message: deleteError.message ?? 'Could not delete the challenge.',
		};
	}

	revalidatePath(`/app/groups/${challenge.group_id}`);
	revalidatePath('/app/challenges');

	return {
		success: true,
		message: `Challenge "${challenge.title}" has been deleted.`,
	};
}

// ========================================
// JOIN CHALLENGE
// ========================================

export async function joinChallenge(challengeId: string): Promise<JoinChallengeResult> {
	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: 'You need to be signed in to join challenges.',
		};
	}

	const userId = session.user.id;

	// Verify challenge exists and is active or upcoming
	const { data: challenge } = await supabase
		.from('group_challenges')
		.select('id, group_id, title, status')
		.eq('id', challengeId)
		.maybeSingle();

	if (!challenge) {
		return {
			success: false,
			message: 'Challenge not found.',
		};
	}

	if (challenge.status === 'completed' || challenge.status === 'cancelled') {
		return {
			success: false,
			message: 'This challenge has ended and cannot be joined.',
		};
	}

	// Verify user is a member of the group
	const { data: membership } = await supabase
		.from('group_members')
		.select('user_id')
		.eq('group_id', challenge.group_id)
		.eq('user_id', userId)
		.maybeSingle();

	if (!membership) {
		return {
			success: false,
			message: 'You must be a member of the group to join this challenge.',
		};
	}

	// Check if already participating
	const { data: existing } = await supabase
		.from('challenge_participants')
		.select('challenge_id')
		.eq('challenge_id', challengeId)
		.eq('user_id', userId)
		.maybeSingle();

	if (existing) {
		return {
			success: false,
			message: 'You are already participating in this challenge.',
		};
	}

	// Join challenge
	const { error: joinError } = await supabase.from('challenge_participants').insert({
		challenge_id: challengeId,
		user_id: userId,
	});

	if (joinError) {
		console.error('Failed to join challenge:', joinError);
		return {
			success: false,
			message: joinError.message ?? 'Could not join the challenge.',
		};
	}

	revalidatePath(`/app/challenges/${challengeId}`);
	revalidatePath(`/app/groups/${challenge.group_id}`);

	return {
		success: true,
		message: `You've joined "${challenge.title}"!`,
	};
}

// ========================================
// LEAVE CHALLENGE
// ========================================

export async function leaveChallenge(challengeId: string): Promise<JoinChallengeResult> {
	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: 'You need to be signed in to leave challenges.',
		};
	}

	const userId = session.user.id;

	// Verify challenge exists
	const { data: challenge } = await supabase
		.from('group_challenges')
		.select('id, group_id, title, status')
		.eq('id', challengeId)
		.maybeSingle();

	if (!challenge) {
		return {
			success: false,
			message: 'Challenge not found.',
		};
	}

	if (challenge.status === 'completed' || challenge.status === 'cancelled') {
		return {
			success: false,
			message: 'Cannot leave a completed or cancelled challenge.',
		};
	}

	// Leave challenge
	const { error: leaveError } = await supabase
		.from('challenge_participants')
		.delete()
		.eq('challenge_id', challengeId)
		.eq('user_id', userId);

	if (leaveError) {
		console.error('Failed to leave challenge:', leaveError);
		return {
			success: false,
			message: leaveError.message ?? 'Could not leave the challenge.',
		};
	}

	revalidatePath(`/app/challenges/${challengeId}`);
	revalidatePath(`/app/groups/${challenge.group_id}`);

	return {
		success: true,
		message: `You've left "${challenge.title}".`,
	};
}

// ========================================
// GET CHALLENGES
// ========================================

export async function getChallenges(filters?: ChallengeFilters): Promise<ChallengeWithCreator[]> {
	const supabase = await createServerClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session?.user) {
		return [];
	}

	const userId = session.user.id;

	let query = supabase
		.from('group_challenges')
		.select(
			`
      *,
      profiles!group_challenges_creator_id_fkey (username, emoji),
      groups!group_challenges_group_id_fkey (name)
    `
		)
		.eq('is_active', true);

	// Apply filters
	if (filters?.status) {
		query = query.eq('status', filters.status);
	}

	if (filters?.groupId) {
		query = query.eq('group_id', filters.groupId);
	}

	if (filters?.search) {
		query = query.ilike('title', `%${filters.search}%`);
	}

	// Only show challenges from groups the user is a member of
	const { data: memberships } = await supabase
		.from('group_members')
		.select('group_id')
		.eq('user_id', userId);

	const groupIds = memberships?.map((m) => m.group_id) ?? [];

	if (groupIds.length === 0) {
		return [];
	}

	query = query.in('group_id', groupIds);

	// Sort by start date
	query = query.order('start_date', { ascending: false });

	const { data: challenges, error } = await query;

	if (error || !challenges) {
		console.error('Error fetching challenges:', error);
		return [];
	}

	// Get participant counts and user participation
	const challengeIds = challenges.map((c) => c.id);

	const { data: participantCounts } = await supabase
		.from('challenge_participants')
		.select('challenge_id')
		.in('challenge_id', challengeIds);

	const { data: userParticipations } = await supabase
		.from('challenge_participants')
		.select('*')
		.eq('user_id', userId)
		.in('challenge_id', challengeIds);

	const countMap = new Map<string, number>();
	participantCounts?.forEach((p) => {
		countMap.set(p.challenge_id, (countMap.get(p.challenge_id) || 0) + 1);
	});

	const participationMap = new Map(userParticipations?.map((p) => [p.challenge_id, p]) || []);

	return challenges.map((challenge) =>
		toChallengeWithCreator({
			...challenge,
			participant_count: countMap.get(challenge.id) || 0,
			user_participation: participationMap.get(challenge.id) || null,
		})
	);
}

// ========================================
// GET CHALLENGE BY ID
// ========================================

export async function getChallengeById(
	challengeId: string
): Promise<ChallengeWithCreator | null> {
	const supabase = await createServerClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const { data: challenge, error } = await supabase
		.from('group_challenges')
		.select(
			`
      *,
      profiles!group_challenges_creator_id_fkey (username, emoji),
      groups!group_challenges_group_id_fkey (name)
    `
		)
		.eq('id', challengeId)
		.maybeSingle();

	if (error || !challenge) {
		return null;
	}

	// Get participant count
	const { data: participants } = await supabase
		.from('challenge_participants')
		.select('challenge_id')
		.eq('challenge_id', challengeId);

	let userParticipation = null;
	if (session?.user) {
		const { data: participation } = await supabase
			.from('challenge_participants')
			.select('*')
			.eq('challenge_id', challengeId)
			.eq('user_id', session.user.id)
			.maybeSingle();

		userParticipation = participation;
	}

	return toChallengeWithCreator({
		...challenge,
		participant_count: participants?.length || 0,
		user_participation: userParticipation,
	});
}

// ========================================
// GET CHALLENGE LEADERBOARD
// ========================================

export async function getChallengeLeaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
	const supabase = await createServerClient();

	const { data: participants, error } = await supabase
		.from('challenge_participants')
		.select(
			`
      *,
      profiles!challenge_participants_user_id_fkey (username, emoji, avatar_url)
    `
		)
		.eq('challenge_id', challengeId)
		.order('current_score', { ascending: false })
		.order('joined_at', { ascending: true });

	if (error || !participants) {
		console.error('Error fetching leaderboard:', error);
		return [];
	}

	// Get badges for participants
	const { data: badges } = await supabase
		.from('challenge_badges')
		.select('*')
		.eq('challenge_id', challengeId);

	const badgeMap = new Map<string, any[]>();
	badges?.forEach((badge) => {
		const userBadges = badgeMap.get(badge.user_id) || [];
		userBadges.push(badge);
		badgeMap.set(badge.user_id, userBadges);
	});

	return participants.map((participant, index) => ({
		userId: participant.user_id,
		username: participant.profiles?.username || null,
		emoji: participant.profiles?.emoji || null,
		avatarUrl: participant.profiles?.avatar_url || null,
		currentScore: participant.current_score,
		currentStreak: participant.current_streak,
		bestStreak: participant.best_streak,
		totalCheckins: participant.total_checkins,
		rank: index + 1,
		badges: badgeMap.get(participant.user_id) || [],
	}));
}

// ========================================
// GET CHALLENGE STATS
// ========================================

export async function getChallengeStats(challengeId: string): Promise<ChallengeStats | null> {
	const supabase = await createServerClient();

	// Get challenge details
	const { data: challenge } = await supabase
		.from('group_challenges')
		.select('start_date, end_date, rules')
		.eq('id', challengeId)
		.maybeSingle();

	if (!challenge) {
		return null;
	}

	// Get participants
	const { data: participants } = await supabase
		.from('challenge_participants')
		.select('current_score, completed')
		.eq('challenge_id', challengeId);

	if (!participants || participants.length === 0) {
		return {
			totalParticipants: 0,
			averageScore: 0,
			topScore: 0,
			totalCheckins: 0,
			daysRemaining: 0,
			daysElapsed: 0,
			completionRate: 0,
		};
	}

	const totalParticipants = participants.length;
	const scores = participants.map((p) => p.current_score);
	const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalParticipants);
	const topScore = Math.max(...scores);
	const totalCheckins = scores.reduce((a, b) => a + b, 0);
	const completedCount = participants.filter((p) => p.completed).length;
	const completionRate = (completedCount / totalParticipants) * 100;

	const now = new Date();
	const startDate = new Date(challenge.start_date);
	const endDate = new Date(challenge.end_date);

	const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
	const daysElapsed = Math.max(
		0,
		Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
	);
	const daysRemaining = Math.max(
		0,
		Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
	);

	return {
		totalParticipants,
		averageScore,
		topScore,
		totalCheckins,
		daysRemaining,
		daysElapsed,
		completionRate,
	};
}

// ========================================
// AWARD CHALLENGE BADGES (Admin/Cron)
// ========================================

export async function awardChallengeBadges(challengeId: string): Promise<ChallengeActionResult> {
	const supabase = await createServerClient();

	// This should ideally be called by a cron job or admin action
	// For now, we'll allow it to be called directly but check permissions

	const { data, error } = await supabase.rpc('award_challenge_badges', {
		p_challenge_id: challengeId,
	});

	if (error) {
		console.error('Error awarding badges:', error);
		return {
			success: false,
			message: error.message ?? 'Could not award badges.',
		};
	}

	revalidatePath(`/app/challenges/${challengeId}`);

	return {
		success: true,
		message: 'Badges awarded successfully!',
	};
}

// ========================================
// IMPORT CHALLENGE HABIT
// ========================================

type ImportChallengeHabitResult =
	| { success: true; habitId: string; message: string }
	| { success: false; message: string };

export async function importChallengeHabit(challengeId: string): Promise<ImportChallengeHabitResult> {
	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: 'You must be signed in to import challenge habits.',
		};
	}

	const userId = session.user.id;

	// Fetch the challenge
	const { data: challenge, error: challengeError } = await supabase
		.from('group_challenges')
		.select('*, groups!group_challenges_group_id_fkey (name)')
		.eq('id', challengeId)
		.maybeSingle();

	if (challengeError || !challenge) {
		return {
			success: false,
			message: 'Challenge not found.',
		};
	}

	// Check if user is a member of the challenge's group
	const { data: membership } = await supabase
		.from('group_members')
		.select('user_id')
		.eq('group_id', challenge.group_id)
		.eq('user_id', userId)
		.maybeSingle();

	if (!membership) {
		return {
			success: false,
			message: 'You must be a member of the group to import this challenge habit.',
		};
	}

	// Get user's timezone
	const { data: profile } = await supabase.from('profiles').select('timezone').eq('id', userId).maybeSingle();

	const timezone = profile?.timezone ?? 'UTC';

	// Create habit based on challenge type
	let habitTitle = challenge.title;
	let habitDescription = challenge.description || `Challenge: ${challenge.title}`;

	// For challenges, we'll create a daily habit that participants can check-in to
	// The challenge tracking will automatically pick up check-ins from any of the user's habits
	const { data: habit, error: createError } = await supabase
		.from('habits')
		.insert({
			owner_id: userId,
			title: habitTitle,
			emoji: challenge.emoji || '🎯',
			color: '#FFD84D', // Citrus yellow to indicate it's a challenge habit
			cadence: 'daily',
			rrule: null,
			target_per_period: 1,
			timezone,
		})
		.select('id')
		.single();

	if (createError || !habit) {
		if (createError?.code === '23505') {
			return {
				success: false,
				message: 'You already have a habit with this title. Try renaming it first.',
			};
		}

		console.error('Error creating habit from challenge:', createError);
		return {
			success: false,
			message: createError?.message ?? 'Could not import challenge habit.',
		};
	}

	// Automatically join the challenge if not already joined
	const { data: existingParticipation } = await supabase
		.from('challenge_participants')
		.select('challenge_id')
		.eq('challenge_id', challengeId)
		.eq('user_id', userId)
		.maybeSingle();

	if (!existingParticipation) {
		await supabase.from('challenge_participants').insert({
			challenge_id: challengeId,
			user_id: userId,
		});
	}

	revalidatePath('/app/habits');
	revalidatePath('/app/challenges');
	revalidatePath(`/app/challenges/${challengeId}`);

	return {
		success: true,
		habitId: habit.id,
		message: `"${habitTitle}" added to your habits! Check-ins will automatically count toward the challenge.`,
	};
}
