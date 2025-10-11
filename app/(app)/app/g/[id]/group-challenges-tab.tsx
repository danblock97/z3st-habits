'use client';

import { useState } from 'react';
import Link from 'next/link';

import { CreateChallengeForm } from '@/app/(app)/app/challenges/create-challenge-form';
import { ChallengeList } from '@/app/(app)/app/challenges/challenge-list';
import type { ChallengeWithCreator } from '@/app/(app)/app/challenges/types';

type GroupChallengesTabProps = {
	groupId: string;
	groupName: string;
	challenges: ChallengeWithCreator[];
	userRole: 'owner' | 'admin' | 'member';
};

export function GroupChallengesTab({
	groupId,
	groupName,
	challenges,
	userRole,
}: GroupChallengesTabProps) {
	const [showCreateForm, setShowCreateForm] = useState(false);

	const canCreateChallenge = userRole === 'owner' || userRole === 'admin';

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Group Challenges</h2>
					<p className="text-muted-foreground mt-1">
						Compete in time-bound challenges with your group members
					</p>
				</div>
				{canCreateChallenge && (
					<button
						onClick={() => setShowCreateForm(!showCreateForm)}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						{showCreateForm ? 'Cancel' : '+ Create Challenge'}
					</button>
				)}
			</div>

			{/* Create Challenge Form */}
			{showCreateForm && (
				<div className="bg-card p-6 border border-border rounded-lg">
					<CreateChallengeForm
						groupId={groupId}
						groupName={groupName}
						onSuccess={() => {
							setShowCreateForm(false);
							window.location.reload();
						}}
						onCancel={() => setShowCreateForm(false)}
					/>
				</div>
			)}

			{/* Challenges List */}
			{challenges.length === 0 && !showCreateForm ? (
				<div className="text-center py-12 bg-card border border-border rounded-lg">
					<div className="text-6xl mb-4">🏆</div>
					<h3 className="text-xl font-semibold mb-2">No Challenges Yet</h3>
					<p className="text-muted-foreground mb-6">
						{canCreateChallenge
							? 'Create the first challenge for your group!'
							: 'No challenges have been created for this group yet.'}
					</p>
					{canCreateChallenge && (
						<button
							onClick={() => setShowCreateForm(true)}
							className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
						>
							Create Challenge
						</button>
					)}
				</div>
			) : (
				<ChallengeList challenges={challenges} showGroupName={false} />
			)}

			{/* Quick Stats */}
			{challenges.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-card p-4 border border-border rounded-lg">
						<div className="text-sm text-muted-foreground">Total Challenges</div>
						<div className="text-2xl font-bold">{challenges.length}</div>
					</div>
					<div className="bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800 rounded-lg">
						<div className="text-sm text-green-700 dark:text-green-300">Active</div>
						<div className="text-2xl font-bold text-green-700 dark:text-green-300">
							{challenges.filter((c) => c.status === 'active').length}
						</div>
					</div>
					<div className="bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800 rounded-lg">
						<div className="text-sm text-blue-700 dark:text-blue-300">Upcoming</div>
						<div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
							{challenges.filter((c) => c.status === 'upcoming').length}
						</div>
					</div>
					<div className="bg-secondary p-4 border border-border rounded-lg">
						<div className="text-sm text-muted-foreground">Completed</div>
						<div className="text-2xl font-bold">
							{challenges.filter((c) => c.status === 'completed').length}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
