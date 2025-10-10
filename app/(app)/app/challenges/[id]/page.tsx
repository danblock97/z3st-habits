import { notFound } from 'next/navigation';

import { getChallengeById, getChallengeLeaderboard, getChallengeStats } from '../actions';
import { ChallengeDetailClient } from './challenge-detail-client';

type PageProps = {
	params: {
		id: string;
	};
};

export default async function ChallengePage({ params }: PageProps) {
	const challenge = await getChallengeById(params.id);

	if (!challenge) {
		notFound();
	}

	const [leaderboard, stats] = await Promise.all([
		getChallengeLeaderboard(params.id),
		getChallengeStats(params.id),
	]);

	return (
		<ChallengeDetailClient
			challenge={challenge}
			leaderboard={leaderboard}
			stats={stats}
		/>
	);
}
