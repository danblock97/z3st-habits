import type { HabitCadence } from "../habits/types";

export type TemplateCategory =
	| "fitness"
	| "health"
	| "productivity"
	| "mindfulness"
	| "learning"
	| "social"
	| "finance"
	| "creative"
	| "other";

export type HabitTemplate = {
	id: string;
	creatorId: string;
	creatorUsername?: string;
	creatorEmoji?: string;
	title: string;
	description: string | null;
	emoji: string | null;
	color: string | null;
	cadence: HabitCadence;
	rrule: string | null;
	targetPerPeriod: number;
	category: TemplateCategory | null;
	tags: string[];
	timesUsed: number;
	averageRating: number | null;
	ratingCount: number;
	isFeatured: boolean;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
};

export type TemplateRating = {
	id: string;
	templateId: string;
	userId: string;
	rating: number;
	review: string | null;
	createdAt: string;
	updatedAt: string;
};

export type TemplateUsage = {
	id: string;
	templateId: string;
	userId: string;
	habitId: string | null;
	createdAt: string;
};

export type TemplateWithRating = HabitTemplate & {
	userRating?: number;
	userHasUsed?: boolean;
};

export type TemplateFilters = {
	category?: TemplateCategory;
	search?: string;
	tags?: string[];
	minRating?: number;
	sortBy?: "popular" | "recent" | "rating" | "trending";
};

export type CreateTemplateInput = {
	habitId: string;
	description?: string;
	category?: TemplateCategory;
	tags?: string[];
};

export type UpdateTemplateInput = {
	id: string;
	description?: string;
	category?: TemplateCategory;
	tags?: string[];
	isActive?: boolean;
};

export type RateTemplateInput = {
	templateId: string;
	rating: number;
	review?: string;
};
