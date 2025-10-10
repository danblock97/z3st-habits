"use client";

import { useState, useTransition, useMemo } from "react";
import {
	Search,
	Star,
	TrendingUp,
	Clock,
	Heart,
	Filter,
	Sparkles,
	Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/lib/toast";
import { importTemplate, rateTemplate } from "./actions";
import type {
	HabitTemplate,
	TemplateWithRating,
	TemplateCategory,
} from "./types";

type TemplatesClientProps = {
	initialTemplates: TemplateWithRating[];
	featuredTemplates: HabitTemplate[];
};

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
	{ value: "fitness", label: "Fitness" },
	{ value: "health", label: "Health" },
	{ value: "productivity", label: "Productivity" },
	{ value: "mindfulness", label: "Mindfulness" },
	{ value: "learning", label: "Learning" },
	{ value: "social", label: "Social" },
	{ value: "finance", label: "Finance" },
	{ value: "creative", label: "Creative" },
	{ value: "other", label: "Other" },
];

export function TemplatesClient({
	initialTemplates,
	featuredTemplates,
}: TemplatesClientProps) {
	const [templates, setTemplates] =
		useState<TemplateWithRating[]>(initialTemplates);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("recent");
	const [isPending, startTransition] = useTransition();
	const { showToast } = useToast();

	// Filter and sort templates
	const filteredTemplates = useMemo(() => {
		let result = templates;

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(t) =>
					t.title.toLowerCase().includes(query) ||
					t.description?.toLowerCase().includes(query) ||
					t.tags.some((tag) => tag.toLowerCase().includes(query)),
			);
		}

		// Filter by category
		if (selectedCategory !== "all") {
			result = result.filter((t) => t.category === selectedCategory);
		}

		// Sort
		result = [...result].sort((a, b) => {
			switch (sortBy) {
				case "popular":
					return b.timesUsed - a.timesUsed;
				case "rating":
					return (
						(b.averageRating ?? 0) - (a.averageRating ?? 0) ||
						b.ratingCount - a.ratingCount
					);
				case "recent":
				default:
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
			}
		});

		return result;
	}, [templates, searchQuery, selectedCategory, sortBy]);

	const handleImport = async (templateId: string) => {
		startTransition(async () => {
			const result = await importTemplate(templateId);

			if (result.success) {
				showToast({
					title: "Success",
					description: result.message,
					variant: "success",
				});
				// Update the template to mark as used
				setTemplates((prev) =>
					prev.map((t) =>
						t.id === templateId
							? { ...t, userHasUsed: true, timesUsed: t.timesUsed + 1 }
							: t,
					),
				);
			} else {
				showToast({
					title: "Error",
					description: result.message,
					variant: "error",
				});
			}
		});
	};

	return (
		<div className="space-y-8">
			{/* Featured Templates */}
			{featuredTemplates.length > 0 && (
				<section>
					<div className="flex items-center gap-2 mb-4">
						<Sparkles className="h-5 w-5 text-yellow-500" />
						<h2 className="text-2xl font-semibold">Featured Templates</h2>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{featuredTemplates.slice(0, 3).map((template) => (
							<TemplateCard
								key={template.id}
								template={template}
								onImport={handleImport}
								isPending={isPending}
								isFeatured
							/>
						))}
					</div>
				</section>
			)}

			{/* Search and Filters */}
			<section>
				<div className="flex flex-col md:flex-row gap-4 mb-6">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search templates..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>

					<Select value={selectedCategory} onValueChange={setSelectedCategory}>
						<SelectTrigger className="w-full md:w-48">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{CATEGORIES.map((cat) => (
								<SelectItem key={cat.value} value={cat.value}>
									{cat.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={sortBy} onValueChange={setSortBy}>
						<SelectTrigger className="w-full md:w-48">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="recent">
								<div className="flex items-center gap-2">
									<Clock className="h-4 w-4" />
									Recent
								</div>
							</SelectItem>
							<SelectItem value="popular">
								<div className="flex items-center gap-2">
									<TrendingUp className="h-4 w-4" />
									Popular
								</div>
							</SelectItem>
							<SelectItem value="rating">
								<div className="flex items-center gap-2">
									<Star className="h-4 w-4" />
									Top Rated
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Results Count */}
				<p className="text-sm text-muted-foreground mb-4">
					{filteredTemplates.length} template
					{filteredTemplates.length !== 1 ? "s" : ""} found
				</p>

				{/* Templates Grid */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{filteredTemplates.map((template) => (
						<TemplateCard
							key={template.id}
							template={template}
							onImport={handleImport}
							isPending={isPending}
						/>
					))}
				</div>

				{filteredTemplates.length === 0 && (
					<div className="text-center py-12">
						<p className="text-muted-foreground">
							No templates found. Try adjusting your filters.
						</p>
					</div>
				)}
			</section>
		</div>
	);
}

// Template Card Component
type TemplateCardProps = {
	template: TemplateWithRating | HabitTemplate;
	onImport: (templateId: string) => void;
	isPending: boolean;
	isFeatured?: boolean;
};

function TemplateCard({
	template,
	onImport,
	isPending,
	isFeatured,
}: TemplateCardProps) {
	const userHasUsed = "userHasUsed" in template ? template.userHasUsed : false;

	return (
		<Card className={isFeatured ? "border-yellow-500 border-2" : ""}>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						<span className="text-2xl">{template.emoji || "📌"}</span>
						<div>
							<CardTitle className="text-lg">{template.title}</CardTitle>
							{template.creatorUsername && (
								<p className="text-xs text-muted-foreground">
									by {template.creatorEmoji} {template.creatorUsername}
								</p>
							)}
						</div>
					</div>
					{isFeatured && (
						<Badge variant="secondary" className="text-xs">
							<Sparkles className="h-3 w-3 mr-1" />
							Featured
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="space-y-3">
				{template.description && (
					<p className="text-sm text-muted-foreground line-clamp-2">
						{template.description}
					</p>
				)}

				<div className="flex flex-wrap gap-2">
					{template.category && (
						<Badge variant="outline" className="text-xs">
							{template.category}
						</Badge>
					)}
					<Badge variant="secondary" className="text-xs">
						{template.cadence}
					</Badge>
				</div>

				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					<div className="flex items-center gap-1">
						<Download className="h-4 w-4" />
						<span>{template.timesUsed}</span>
					</div>
					{template.averageRating && (
						<div className="flex items-center gap-1">
							<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span>{template.averageRating.toFixed(1)}</span>
							<span className="text-xs">({template.ratingCount})</span>
						</div>
					)}
				</div>

				{template.tags.length > 0 && (
					<div className="flex flex-wrap gap-1">
						{template.tags.slice(0, 3).map((tag) => (
							<Badge key={tag} variant="outline" className="text-xs">
								#{tag}
							</Badge>
						))}
					</div>
				)}
			</CardContent>

			<CardFooter>
				<Button
					onClick={() => onImport(template.id)}
					disabled={isPending || userHasUsed}
					className="w-full"
					variant={userHasUsed ? "outline" : "default"}
				>
					{userHasUsed ? (
						<>
							<Heart className="h-4 w-4 mr-2 fill-current" />
							Already Using
						</>
					) : (
						<>
							<Download className="h-4 w-4 mr-2" />
							Import Habit
						</>
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
