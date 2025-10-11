import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { TemplateFilters } from "@/app/(app)/app/templates/types";

// GET /api/templates - Public API endpoint for fetching templates
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;

	// Parse query parameters
	const filters: TemplateFilters = {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		category: (searchParams.get("category") as any) ?? undefined,
		search: searchParams.get("search") ?? undefined,
		tags: searchParams.get("tags")?.split(",").filter(Boolean) ?? undefined,
		minRating: searchParams.get("minRating")
			? Number(searchParams.get("minRating"))
			: undefined,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		sortBy: (searchParams.get("sortBy") as any) ?? "recent",
	};

	const supabase = await createServerClient();

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
	if (filters.category) {
		query = query.eq("category", filters.category);
	}

	if (filters.search) {
		// Use text search on title and description
		query = query.or(
			`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
		);
	}

	if (filters.tags && filters.tags.length > 0) {
		query = query.contains("tags", filters.tags);
	}

	if (filters.minRating) {
		query = query.gte("average_rating", filters.minRating);
	}

	// Apply sorting
	switch (filters.sortBy) {
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
			// Sort by combination of rating and usage
			query = query
				.order("average_rating", { ascending: false, nullsFirst: false })
				.order("times_used", { ascending: false });
			break;
		case "recent":
		default:
			query = query.order("created_at", { ascending: false });
			break;
	}

	const limit = searchParams.get("limit")
		? Math.min(Number(searchParams.get("limit")), 100)
		: 50;
	query = query.limit(limit);

	const { data, error } = await query;

	if (error) {
		console.error("Error fetching templates:", error);
		return NextResponse.json(
			{ error: "Failed to fetch templates" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ templates: data ?? [] });
}
