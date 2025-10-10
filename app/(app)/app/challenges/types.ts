// ========================================
// CHALLENGE TYPES
// ========================================

export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export type ChallengeType = 'total_checkins' | 'streak' | 'specific_habit';

export type ScoringType = 'total' | 'average' | 'best';

export type BadgeType =
	| 'winner'
	| 'top_3'
	| 'participant'
	| 'streak_master'
	| 'milestone'
	| 'perfect_score'
	| 'most_improved';

// ========================================
// CHALLENGE RULES
// ========================================

export type ChallengeRules = {
	challenge_type: ChallengeType;
	target_value?: number | null;
	habits: string[]; // Array of habit IDs
	scoring: ScoringType;
	description?: string;
};

// ========================================
// DATABASE TYPES
// ========================================

export type GroupChallenge = {
	id: string;
	groupId: string;
	creatorId: string;
	title: string;
	description: string | null;
	emoji: string | null;
	startDate: string; // ISO date string
	endDate: string; // ISO date string
	rules: ChallengeRules;
	status: ChallengeStatus;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type ChallengeParticipant = {
	challengeId: string;
	userId: string;
	joinedAt: string;
	currentScore: number;
	currentStreak: number;
	bestStreak: number;
	totalCheckins: number;
	lastCheckinDate: string | null;
	completed: boolean;
	completedAt: string | null;
	metadata: Record<string, unknown>;
};

export type ChallengeBadge = {
	id: string;
	challengeId: string;
	userId: string;
	badgeType: BadgeType;
	badgeData: Record<string, unknown>;
	awardedAt: string;
};

// ========================================
// ENRICHED TYPES (with joins)
// ========================================

export type ChallengeWithCreator = GroupChallenge & {
	creatorUsername: string | null;
	creatorEmoji: string | null;
	groupName: string | null;
	participantCount?: number;
	userParticipation?: ChallengeParticipant | null;
};

export type ParticipantWithProfile = ChallengeParticipant & {
	username: string | null;
	emoji: string | null;
	avatarUrl: string | null;
};

export type LeaderboardEntry = {
	userId: string;
	username: string | null;
	emoji: string | null;
	avatarUrl: string | null;
	currentScore: number;
	currentStreak: number;
	bestStreak: number;
	totalCheckins: number;
	rank: number;
	badges: ChallengeBadge[];
};

export type ChallengeStats = {
	totalParticipants: number;
	averageScore: number;
	topScore: number;
	totalCheckins: number;
	daysRemaining: number;
	daysElapsed: number;
	completionRate: number; // Percentage of participants who completed
};

// ========================================
// FORM TYPES
// ========================================

export type CreateChallengeInput = {
	groupId: string;
	title: string;
	description?: string;
	emoji?: string;
	startDate: string; // ISO date string
	endDate: string; // ISO date string
	rules: ChallengeRules;
};

export type UpdateChallengeInput = {
	id: string;
	title?: string;
	description?: string;
	emoji?: string;
	startDate?: string;
	endDate?: string;
	rules?: ChallengeRules;
	status?: ChallengeStatus;
	isActive?: boolean;
};

export type JoinChallengeInput = {
	challengeId: string;
};

export type LeaveChallengeInput = {
	challengeId: string;
};

// ========================================
// FILTER AND SORT TYPES
// ========================================

export type ChallengeFilters = {
	status?: ChallengeStatus;
	groupId?: string;
	participating?: boolean;
	search?: string;
};

export type ChallengeSortBy = 'start_date' | 'end_date' | 'participants' | 'created_at';

// ========================================
// RESPONSE TYPES
// ========================================

export type ChallengeActionResult =
	| {
			success: true;
			challengeId?: string;
			message: string;
	  }
	| {
			success: false;
			message: string;
	  };

export type JoinChallengeResult =
	| {
			success: true;
			message: string;
	  }
	| {
			success: false;
			message: string;
	  };
