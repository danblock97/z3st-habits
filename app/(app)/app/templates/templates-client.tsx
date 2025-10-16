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
	MoreHorizontal,
	Pencil,
	Trash2,
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
import { importTemplate, updateTemplate, deleteTemplate } from "./actions";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
	HabitTemplate,
	TemplateWithRating,
	TemplateCategory,
} from "./types";

type TemplatesClientProps = {
	initialTemplates: TemplateWithRating[];
	featuredTemplates: HabitTemplate[];
 	currentUserId: string | null;
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
	currentUserId,
}: TemplatesClientProps) {
	const [templates, setTemplates] =
		useState<TemplateWithRating[]>(initialTemplates);
	const [featured, setFeatured] = useState<HabitTemplate[]>(featuredTemplates);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("recent");
	const [isPending, startTransition] = useTransition();
	const { showToast } = useToast();
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [templateBeingEdited, setTemplateBeingEdited] =
		useState<TemplateWithRating | HabitTemplate | null>(null);
	const [editDescription, setEditDescription] = useState("");
	const [editCategory, setEditCategory] = useState<TemplateCategory | "">("");
	const [editTags, setEditTags] = useState("");
	const [editIsActive, setEditIsActive] = useState(true);
	const [isSavingEdit, setIsSavingEdit] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] =
		useState<TemplateWithRating | HabitTemplate | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

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
					type: "success",
				});
				// Update the template to mark as used
				setTemplates((prev) =>
					prev.map((t) =>
						t.id === templateId
							? { ...t, userHasUsed: true, timesUsed: t.timesUsed + 1 }
							: t,
					),
				);
				setFeatured((prev) =>
					prev.map((t) =>
						t.id === templateId
							? { ...t, timesUsed: t.timesUsed + 1 }
							: t,
					),
				);
			} else {
				showToast({
					title: "Error",
					description: result.message,
					type: "error",
				});
			}
		});
	};

	const openEditDialog = (template: TemplateWithRating | HabitTemplate) => {
		setTemplateBeingEdited(template);
		setEditDescription(template.description ?? "");
		setEditCategory((template.category as TemplateCategory | null) ?? "");
		setEditTags(template.tags.join(", "));
		setEditIsActive(template.isActive);
		setIsEditDialogOpen(true);
	};

	const handleSaveEdit = async () => {
		if (!templateBeingEdited) return;

		const trimmedDescription = editDescription.trim();
		const rawTags = editTags
			.split(",")
			.map((tag) => tag.trim())
			.filter(Boolean);
		const uniqueTags = Array.from(new Set(rawTags)).slice(0, 5);

		setIsSavingEdit(true);
		const result = await updateTemplate({
			id: templateBeingEdited.id,
			description: trimmedDescription || undefined,
			category: editCategory || undefined,
			tags: uniqueTags,
			isActive: editIsActive,
		});
		setIsSavingEdit(false);

		if (!result.success) {
			showToast({
				title: "Error",
				description: result.message,
				type: "error",
			});
			return;
		}

		showToast({
			title: "Template updated",
			description: result.message,
			type: "success",
		});

		setTemplates((prev) => {
			const updated = prev.map((t) =>
				t.id === templateBeingEdited.id
					? {
						...t,
						description: trimmedDescription || null,
						category: (editCategory as TemplateCategory) || null,
						tags: uniqueTags,
						isActive: editIsActive,
					}
					: t,
			);
			if (!editIsActive) {
				return updated.filter((t) => t.id !== templateBeingEdited.id);
			}
			return updated;
		});

		setFeatured((prev) => {
			const updated = prev.map((t) =>
				t.id === templateBeingEdited.id
					? {
						...t,
						description: trimmedDescription || null,
						category: (editCategory as TemplateCategory) || null,
						tags: uniqueTags,
						isActive: editIsActive,
					}
					: t,
			);
			if (!editIsActive) {
				return updated.filter((t) => t.id !== templateBeingEdited.id);
			}
			return updated;
		});

		setIsEditDialogOpen(false);
		setTemplateBeingEdited(null);
	};

	const openDeleteDialog = (template: TemplateWithRating | HabitTemplate) => {
		setTemplateToDelete(template);
		setIsDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!templateToDelete) return;

		setIsDeleting(true);
		const result = await deleteTemplate(templateToDelete.id);
		setIsDeleting(false);

		if (!result.success) {
			showToast({
				title: "Error",
				description: result.message,
				type: "error",
			});
			return;
		}

		showToast({
			title: "Template deleted",
			description: result.message,
			type: "success",
		});

		setTemplates((prev) =>
			prev.filter((t) => t.id !== templateToDelete.id),
		);
		setFeatured((prev) =>
			prev.filter((t) => t.id !== templateToDelete.id),
		);

		setIsDeleteDialogOpen(false);
		setTemplateToDelete(null);
	};

	return (
		<div className="space-y-8">
			{/* Featured Templates */}
		{featured.length > 0 && (
				<section>
					<div className="flex items-center gap-2 mb-4">
						<Sparkles className="h-5 w-5 text-yellow-500" />
						<h2 className="text-2xl font-semibold">Featured Templates</h2>
					</div>
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{featured.slice(0, 3).map((template) => (
							<TemplateCard
								key={template.id}
								template={template}
								onImport={handleImport}
								isPending={isPending}
								isFeatured
								canManage={template.creatorId === currentUserId}
								onEdit={openEditDialog}
								onDelete={openDeleteDialog}
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
							canManage={template.creatorId === currentUserId}
							onEdit={openEditDialog}
							onDelete={openDeleteDialog}
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

		{/* Edit Template Dialog */}
		<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>Edit Template</DialogTitle>
					<DialogDescription>
						Update how your template appears in the marketplace.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<Label htmlFor="template-description">Description</Label>
						<Textarea
							id="template-description"
							value={editDescription}
							onChange={(event) => setEditDescription(event.target.value)}
							placeholder="Share what makes this habit template effective..."
							rows={4}
							maxLength={500}
							className="mt-2 resize-none"
						/>
						<p className="mt-1 text-xs text-muted-foreground">
							{editDescription.length}/500 characters
						</p>
					</div>
					<div className="space-y-2">
						<Label>Category</Label>
						<Select
							value={editCategory || "none"}
							onValueChange={(value) =>
									setEditCategory(value === "none" ? "" : (value as TemplateCategory))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No category</SelectItem>
								{CATEGORIES.map((cat) => (
									<SelectItem key={cat.value} value={cat.value}>
										{cat.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div>
						<Label htmlFor="template-tags">Tags</Label>
						<Input
							id="template-tags"
							value={editTags}
							onChange={(event) => setEditTags(event.target.value)}
							placeholder="habit, morning, focus"
							className="mt-2"
						/>
						<p className="mt-1 text-xs text-muted-foreground">
							Separate with commas. Maximum of 5 tags.
						</p>
					</div>
					<div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
						<div>
							<p className="text-sm font-medium">Visible in marketplace</p>
							<p className="text-xs text-muted-foreground">
								Turn off to temporarily hide this template.
							</p>
						</div>
						<Switch
							checked={editIsActive}
							onCheckedChange={setEditIsActive}
						/>
					</div>
				</div>
				<DialogFooter className="mt-6">
					<Button
						variant="outline"
						onClick={() => {
							setIsEditDialogOpen(false);
							setTemplateBeingEdited(null);
						}}
						disabled={isSavingEdit}
					>
						Cancel
					</Button>
					<Button onClick={handleSaveEdit} disabled={isSavingEdit}>
						{isSavingEdit ? "Saving..." : "Save changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		{/* Delete Template Dialog */}
		<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
			<DialogContent className="sm:max-w-[420px]">
				<DialogHeader>
					<DialogTitle>Delete Template</DialogTitle>
					<DialogDescription>
						This will remove the template from the marketplace. This action
						cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2 text-sm text-muted-foreground">
					<p>
						Template: <strong>{templateToDelete?.title}</strong>
					</p>
					<p>Your habit data remains untouched.</p>
				</div>
				<DialogFooter className="mt-6">
					<Button
						variant="outline"
						onClick={() => {
							setIsDeleteDialogOpen(false);
							setTemplateToDelete(null);
						}}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleConfirmDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
	);
}

// Template Card Component
type TemplateCardProps = {
	template: TemplateWithRating | HabitTemplate;
	onImport: (templateId: string) => void;
	isPending: boolean;
	isFeatured?: boolean;
	canManage: boolean;
	onEdit: (template: TemplateWithRating | HabitTemplate) => void;
	onDelete: (template: TemplateWithRating | HabitTemplate) => void;
};

function TemplateCard({
	template,
	onImport,
	isPending,
	isFeatured,
	canManage,
	onEdit,
	onDelete,
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
					<div className="flex items-center gap-2">
						{isFeatured && (
							<Badge variant="secondary" className="text-xs">
								<Sparkles className="h-3 w-3 mr-1" />
								Featured
							</Badge>
						)}
						{canManage && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-8 w-8"
									>
										<MoreHorizontal className="h-4 w-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-40">
									<DropdownMenuItem onClick={() => onEdit(template)}>
										<Pencil className="mr-2 h-4 w-4" />
										Edit template
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => onDelete(template)}
										className="text-destructive focus:text-destructive"
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</div>
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
