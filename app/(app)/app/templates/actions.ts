"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createServerClient } from "@/lib/supabase/server";
import type {
	HabitTemplate,
	TemplateFilters,
	CreateTemplateInput,
	UpdateTemplateInput,
	RateTemplateInput,
	TemplateWithRating,
} from "./types";

// ========================================
// VALIDATION SCHEMAS
// ========================================

const createTemplateSchema = z.object({
	habitId: z.string().uuid("Invalid habit ID"),
	description: z
		.string()
		.max(500, "Description must be at most 500 characters")
		.optional(),
	category: z
		.enum([
			"fitness",
			"health",
			"productivity",
			"mindfulness",
			"learning",
			"social",
			"finance",
			"creative",
			"other",
		])
		.optional(),
	tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional(),
});

const updateTemplateSchema = z.object({
	id: z.string().uuid("Invalid template ID"),
	description: z
		.string()
		.max(500, "Description must be at most 500 characters")
		.optional(),
	category: z
		.enum([
			"fitness",
			"health",
			"productivity",
			"mindfulness",
			"learning",
			"social",
			"finance",
			"creative",
			"other",
		])
		.optional(),
	tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional(),
	isActive: z.boolean().optional(),
});

const rateTemplateSchema = z.object({
	templateId: z.string().uuid("Invalid template ID"),
	rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
	review: z
		.string()
		.max(300, "Review must be at most 300 characters")
		.optional(),
});

// ========================================
// HELPER FUNCTIONS
// ========================================

function toHabitTemplate(record: any): HabitTemplate {
	return {
		id: record.id,
		creatorId: record.creator_id,
		creatorUsername: record.profiles?.username,
		creatorEmoji: record.profiles?.emoji,
		title: record.title,
		description: record.description,
		emoji: record.emoji,
		color: record.color,
		cadence: record.cadence,
		rrule: record.rrule,
		targetPerPeriod: record.target_per_period,
		category: record.category,
		tags: record.tags ?? [],
		timesUsed: record.times_used,
		averageRating: record.average_rating ? Number(record.average_rating) : null,
		ratingCount: record.rating_count,
		isFeatured: record.is_featured,
		isActive: record.is_active,
		createdAt: record.created_at,
		updatedAt: record.updated_at,
	};
}

// ========================================
// TEMPLATE MARKETPLACE
// ========================================

export async function getTemplates(
	filters?: TemplateFilters,
): Promise<TemplateWithRating[]> {
	const supabase = await createServerClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	let query = supabase
		.from("habit_templates")
		.select(
			`
      *,
      profiles!habit_templates_creator_id_fkey (
        username,
        emoji
      )
    `,
		)
		.eq("is_active", true);

	// Apply filters
	if (filters?.category) {
		query = query.eq("category", filters.category);
	}

	if (filters?.search) {
		query = query.textSearch(
			"title_description_search",
			filters.search.trim().split(" ").join(" & "),
		);
	}

	if (filters?.tags && filters.tags.length > 0) {
		query = query.contains("tags", filters.tags);
	}

	if (filters?.minRating) {
		query = query.gte("average_rating", filters.minRating);
	}

	// Apply sorting
	switch (filters?.sortBy) {
		case "popular":
			query = query.order("times_used", { ascending: false });
			break;
		case "rating":
			query = query.order("average_rating", {
				ascending: false,
				nullsFirst: false,
			});
			break;
		case "trending":
			// Trending = high usage in recent period + good rating
			// For now, sort by combination of times_used and rating
			query = query
				.order("average_rating", { ascending: false, nullsFirst: false })
				.order("times_used", { ascending: false });
			break;
		case "recent":
		default:
			query = query.order("created_at", { ascending: false });
			break;
	}

	query = query.limit(50);

	const { data, error } = await query;

	if (error || !data) {
		console.error("Error fetching templates:", error);
		return [];
	}

	const templates = data.map(toHabitTemplate);

	// If user is authenticated, fetch their ratings and usage
	if (session?.user) {
		const userId = session.user.id;
		const templateIds = templates.map((t) => t.id);

		// Fetch user ratings
		const { data: ratings } = await supabase
			.from("template_ratings")
			.select("template_id, rating")
			.eq("user_id", userId)
			.in("template_id", templateIds);

		// Fetch user usage
		const { data: usage } = await supabase
			.from("template_usage")
			.select("template_id")
			.eq("user_id", userId)
			.in("template_id", templateIds);

		const userRatings = new Map(
			ratings?.map((r) => [r.template_id, r.rating]) ?? [],
		);
		const usedTemplates = new Set(usage?.map((u) => u.template_id) ?? []);

		return templates.map((template) => ({
			...template,
			userRating: userRatings.get(template.id),
			userHasUsed: usedTemplates.has(template.id),
		}));
	}

	return templates;
}

export async function getTemplateById(
	templateId: string,
): Promise<TemplateWithRating | null> {
	const supabase = await createServerClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const { data, error } = await supabase
		.from("habit_templates")
		.select(
			`
      *,
      profiles!habit_templates_creator_id_fkey (
        username,
        emoji
      )
    `,
		)
		.eq("id", templateId)
		.eq("is_active", true)
		.maybeSingle();

	if (error || !data) {
		return null;
	}

	const template = toHabitTemplate(data);

	// If user is authenticated, fetch their rating and usage
	if (session?.user) {
		const userId = session.user.id;

		const { data: rating } = await supabase
			.from("template_ratings")
			.select("rating")
			.eq("template_id", templateId)
			.eq("user_id", userId)
			.maybeSingle();

		const { data: usage } = await supabase
			.from("template_usage")
			.select("id")
			.eq("template_id", templateId)
			.eq("user_id", userId)
			.maybeSingle();

		return {
			...template,
			userRating: rating?.rating,
			userHasUsed: !!usage,
		};
	}

	return template;
}

export async function getMyTemplates(): Promise<HabitTemplate[]> {
	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return [];
	}

	const userId = session.user.id;

	const { data, error } = await supabase
		.from("habit_templates")
		.select(
			`
      *,
      profiles!habit_templates_creator_id_fkey (
        username,
        emoji
      )
    `,
		)
		.eq("creator_id", userId)
		.order("created_at", { ascending: false });

	if (error || !data) {
		console.error("Error fetching user templates:", error);
		return [];
	}

	return data.map(toHabitTemplate);
}

// ========================================
// CREATE TEMPLATE FROM HABIT
// ========================================

type CreateTemplateResult =
	| { success: true; templateId: string; message: string }
	| { success: false; message: string };

export async function createTemplate(
	input: CreateTemplateInput,
): Promise<CreateTemplateResult> {
	const parsed = createTemplateSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.errors[0]?.message ?? "Invalid input",
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
			message: "You must be signed in to create templates.",
		};
	}

	const userId = session.user.id;

	// Fetch the habit
	const { data: habit, error: habitError } = await supabase
		.from("habits")
		.select("*")
		.eq("id", parsed.data.habitId)
		.eq("owner_id", userId)
		.maybeSingle();

	if (habitError || !habit) {
		return {
			success: false,
			message: "Habit not found or you do not have permission to share it.",
		};
	}

	// Check if template already exists for this habit
	const { data: existingTemplate } = await supabase
		.from("habit_templates")
		.select("id")
		.eq("creator_id", userId)
		.eq("title", habit.title)
		.maybeSingle();

	if (existingTemplate) {
		return {
			success: false,
			message:
				"You already have a template with this title. Update the existing one instead.",
		};
	}

	// Create the template
	const { data: template, error: createError } = await supabase
		.from("habit_templates")
		.insert({
			creator_id: userId,
			title: habit.title,
			description: parsed.data.description ?? null,
			emoji: habit.emoji,
			color: habit.color,
			cadence: habit.cadence,
			rrule: habit.rrule,
			target_per_period: habit.target_per_period,
			category: parsed.data.category ?? null,
			tags: parsed.data.tags ?? [],
		})
		.select("id")
		.single();

	if (createError || !template) {
		console.error("Error creating template:", createError);
		return {
			success: false,
			message: createError?.message ?? "Could not create template.",
		};
	}

	revalidatePath("/app/templates");
	revalidatePath("/app/habits");

	return {
		success: true,
		templateId: template.id,
		message: "Template created successfully!",
	};
}

// ========================================
// UPDATE TEMPLATE
// ========================================

type UpdateTemplateResult =
	| { success: true; message: string }
	| { success: false; message: string };

export async function updateTemplate(
	input: UpdateTemplateInput,
): Promise<UpdateTemplateResult> {
	const parsed = updateTemplateSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.errors[0]?.message ?? "Invalid input",
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
			message: "You must be signed in to update templates.",
		};
	}

	const userId = session.user.id;

	// Build update object (only include defined fields)
	const updates: any = {};
	if (parsed.data.description !== undefined)
		updates.description = parsed.data.description;
	if (parsed.data.category !== undefined)
		updates.category = parsed.data.category;
	if (parsed.data.tags !== undefined) updates.tags = parsed.data.tags;
	if (parsed.data.isActive !== undefined)
		updates.is_active = parsed.data.isActive;

	const { error } = await supabase
		.from("habit_templates")
		.update(updates)
		.eq("id", parsed.data.id)
		.eq("creator_id", userId);

	if (error) {
		console.error("Error updating template:", error);
		return {
			success: false,
			message: error.message ?? "Could not update template.",
		};
	}

	revalidatePath("/app/templates");

	return {
		success: true,
		message: "Template updated successfully!",
	};
}

// ========================================
// DELETE TEMPLATE
// ========================================

type DeleteTemplateResult =
	| { success: true; message: string }
	| { success: false; message: string };

export async function deleteTemplate(
	templateId: string,
): Promise<DeleteTemplateResult> {
	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: "You must be signed in to delete templates.",
		};
	}

	const userId = session.user.id;

	const { error } = await supabase
		.from("habit_templates")
		.delete()
		.eq("id", templateId)
		.eq("creator_id", userId);

	if (error) {
		console.error("Error deleting template:", error);
		return {
			success: false,
			message: error.message ?? "Could not delete template.",
		};
	}

	revalidatePath("/app/templates");

	return {
		success: true,
		message: "Template deleted successfully!",
	};
}

// ========================================
// IMPORT TEMPLATE (Create Habit from Template)
// ========================================

type ImportTemplateResult =
	| { success: true; habitId: string; message: string }
	| { success: false; message: string };

export async function importTemplate(
	templateId: string,
): Promise<ImportTemplateResult> {
	const supabase = await createServerClient();
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	if (sessionError || !session?.user) {
		return {
			success: false,
			message: "You must be signed in to import templates.",
		};
	}

	const userId = session.user.id;

	// Fetch the template
	const { data: template, error: templateError } = await supabase
		.from("habit_templates")
		.select("*")
		.eq("id", templateId)
		.eq("is_active", true)
		.maybeSingle();

	if (templateError || !template) {
		return {
			success: false,
			message: "Template not found or is no longer available.",
		};
	}

	// Get user's timezone
	const { data: profile } = await supabase
		.from("profiles")
		.select("timezone")
		.eq("id", userId)
		.maybeSingle();

	const timezone = profile?.timezone ?? "UTC";

	// Create the habit from template
	const { data: habit, error: createError } = await supabase
		.from("habits")
		.insert({
			owner_id: userId,
			title: template.title,
			emoji: template.emoji,
			color: template.color,
			cadence: template.cadence,
			rrule: template.rrule,
			target_per_period: template.target_per_period,
			timezone,
		})
		.select("id")
		.single();

	if (createError || !habit) {
		if (createError?.code === "23505") {
			return {
				success: false,
				message:
					"You already have a habit with this title. Try editing the template title first.",
			};
		}

		console.error("Error creating habit from template:", createError);
		return {
			success: false,
			message: createError?.message ?? "Could not import template.",
		};
	}

	// Record the template usage
	await supabase.from("template_usage").insert({
		template_id: templateId,
		user_id: userId,
		habit_id: habit.id,
	});

	revalidatePath("/app/habits");
	revalidatePath("/app/templates");

	return {
		success: true,
		habitId: habit.id,
		message: `"${template.title}" added to your habits!`,
	};
}

// ========================================
// RATE TEMPLATE
// ========================================

type RateTemplateResult =
	| { success: true; message: string }
	| { success: false; message: string };

export async function rateTemplate(
	input: RateTemplateInput,
): Promise<RateTemplateResult> {
	const parsed = rateTemplateSchema.safeParse(input);

	if (!parsed.success) {
		return {
			success: false,
			message: parsed.error.errors[0]?.message ?? "Invalid input",
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
			message: "You must be signed in to rate templates.",
		};
	}

	const userId = session.user.id;

	// Check if template exists and is active
	const { data: template } = await supabase
		.from("habit_templates")
		.select("id")
		.eq("id", parsed.data.templateId)
		.eq("is_active", true)
		.maybeSingle();

	if (!template) {
		return {
			success: false,
			message: "Template not found or is no longer available.",
		};
	}

	// Upsert the rating
	const { error } = await supabase.from("template_ratings").upsert(
		{
			template_id: parsed.data.templateId,
			user_id: userId,
			rating: parsed.data.rating,
			review: parsed.data.review ?? null,
		},
		{
			onConflict: "template_id,user_id",
		},
	);

	if (error) {
		console.error("Error rating template:", error);
		return {
			success: false,
			message: error.message ?? "Could not submit rating.",
		};
	}

	revalidatePath("/app/templates");

	return {
		success: true,
		message: "Rating submitted successfully!",
	};
}

// ========================================
// GET TEMPLATE RATINGS
// ========================================

export async function getTemplateRatings(templateId: string) {
	const supabase = await createServerClient();

	const { data, error } = await supabase
		.from("template_ratings")
		.select(
			`
      *,
      profiles!template_ratings_user_id_fkey (
        username,
        emoji
      )
    `,
		)
		.eq("template_id", templateId)
		.order("created_at", { ascending: false })
		.limit(20);

	if (error || !data) {
		console.error("Error fetching template ratings:", error);
		return [];
	}

	return data.map((rating) => ({
		id: rating.id,
		templateId: rating.template_id,
		userId: rating.user_id,
		username: rating.profiles?.username,
		userEmoji: rating.profiles?.emoji,
		rating: rating.rating,
		review: rating.review,
		createdAt: rating.created_at,
		updatedAt: rating.updated_at,
	}));
}

// ========================================
// GET FEATURED TEMPLATES
// ========================================

export async function getFeaturedTemplates(): Promise<HabitTemplate[]> {
	const supabase = await createServerClient();

	const { data, error } = await supabase
		.from("habit_templates")
		.select(
			`
      *,
      profiles!habit_templates_creator_id_fkey (
        username,
        emoji
      )
    `,
		)
		.eq("is_active", true)
		.eq("is_featured", true)
		.order("times_used", { ascending: false })
		.limit(10);

	if (error || !data) {
		console.error("Error fetching featured templates:", error);
		return [];
	}

	return data.map(toHabitTemplate);
}
