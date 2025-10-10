import { Suspense } from "react";
import { TemplatesClient } from "./templates-client";
import { getTemplates, getFeaturedTemplates } from "./actions";

export const metadata = {
	title: "Habit Templates | Z3st Habits",
	description:
		"Browse and import successful habit templates shared by the community.",
};

export default async function TemplatesPage() {
	const [templates, featuredTemplates] = await Promise.all([
		getTemplates({ sortBy: "recent" }),
		getFeaturedTemplates(),
	]);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">Habit Templates</h1>
				<p className="text-muted-foreground">
					Discover and import successful habits from the community
				</p>
			</div>

			<Suspense fallback={<div>Loading templates...</div>}>
				<TemplatesClient
					initialTemplates={templates}
					featuredTemplates={featuredTemplates}
				/>
			</Suspense>
		</div>
	);
}
