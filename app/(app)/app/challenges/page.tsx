import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';
import { getChallenges } from './actions';
import { ChallengeList } from './challenge-list';

export default async function ChallengesPage() {
	const supabase = await createServerClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (!session?.user) {
		redirect('/login');
	}

	const challenges = await getChallenges();

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Challenges</h1>
					<p className="text-muted-foreground mt-1">
						Compete with your groups in time-bound challenges
					</p>
				</div>
			</div>

			{challenges.length === 0 ? (
				<div className="text-center py-12 bg-card border border-border rounded-lg">
					<div className="text-6xl mb-4">🏆</div>
					<h2 className="text-xl font-semibold mb-2">No Challenges Yet</h2>
					<p className="text-muted-foreground mb-6">
						Join a group to participate in challenges or create your own!
					</p>
				</div>
			) : (
				<ChallengeList challenges={challenges} showGroupName={true} />
			)}
		</div>
	);
}
