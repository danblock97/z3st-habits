'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { createChallenge } from './actions';
import type { CreateChallengeInput, ChallengeType, ScoringType } from './types';

type CreateChallengeFormProps = {
	groupId: string;
	groupName: string;
	onSuccess?: () => void;
	onCancel?: () => void;
};

export function CreateChallengeForm({
	groupId,
	groupName,
	onSuccess,
	onCancel,
}: CreateChallengeFormProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState<CreateChallengeInput>({
		groupId,
		title: '',
		description: '',
		emoji: '🏆',
		startDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
		endDate: '',
		rules: {
			challenge_type: 'total_checkins',
			target_value: null,
			habits: [],
			scoring: 'total',
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			const result = await createChallenge(formData);

			if (result.success) {
				if (onSuccess) {
					onSuccess();
				} else if (result.challengeId) {
					router.push(`/app/challenges/${result.challengeId}`);
				}
			} else {
				setError(result.message);
			}
		});
	};

	const handleChallengeTypeChange = (type: ChallengeType) => {
		setFormData((prev) => ({
			...prev,
			rules: {
				...prev.rules,
				challenge_type: type,
			},
		}));
	};

	const handleScoringChange = (scoring: ScoringType) => {
		setFormData((prev) => ({
			...prev,
			rules: {
				...prev.rules,
				scoring,
			},
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">Create Challenge</h2>
				<p className="text-muted-foreground">
					Create a time-bound challenge for <span className="font-semibold">{groupName}</span>
				</p>
			</div>

			{error && (
				<div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
					{error}
				</div>
			)}

			<div className="space-y-4">
				{/* Title and Emoji */}
				<div className="flex gap-3">
					<div className="w-20">
						<label htmlFor="emoji" className="block text-sm font-medium mb-1">
							Emoji
						</label>
						<input
							type="text"
							id="emoji"
							value={formData.emoji || ''}
							onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
							className="w-full px-3 py-2 border border-input bg-background rounded-lg text-center text-2xl"
							maxLength={10}
							placeholder="🏆"
						/>
					</div>
					<div className="flex-1">
						<label htmlFor="title" className="block text-sm font-medium mb-1">
							Challenge Title *
						</label>
						<input
							type="text"
							id="title"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							className="w-full px-3 py-2 border border-input bg-background rounded-lg"
							placeholder="30-Day Meditation Challenge"
							required
							maxLength={100}
						/>
					</div>
				</div>

				{/* Description */}
				<div>
					<label htmlFor="description" className="block text-sm font-medium mb-1">
						Description
					</label>
					<textarea
						id="description"
						value={formData.description}
						onChange={(e) => setFormData({ ...formData, description: e.target.value })}
						className="w-full px-3 py-2 border border-input bg-background rounded-lg"
						placeholder="Meditate every day for 30 days..."
						rows={3}
						maxLength={500}
					/>
				</div>

				{/* Date Range */}
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label htmlFor="startDate" className="block text-sm font-medium mb-1">
							Start Date *
						</label>
						<input
							type="date"
							id="startDate"
							value={formData.startDate.split('T')[0]}
							onChange={(e) =>
								setFormData({
									...formData,
									startDate: new Date(e.target.value).toISOString(),
								})
							}
							className="w-full px-3 py-2 border border-input bg-background rounded-lg"
							required
						/>
					</div>
					<div>
						<label htmlFor="endDate" className="block text-sm font-medium mb-1">
							End Date *
						</label>
						<input
							type="date"
							id="endDate"
							value={formData.endDate.split('T')[0]}
							onChange={(e) =>
								setFormData({
									...formData,
									endDate: new Date(e.target.value).toISOString(),
								})
							}
							className="w-full px-3 py-2 border border-input bg-background rounded-lg"
							required
						/>
					</div>
				</div>

				{/* Challenge Type */}
				<div>
					<label className="block text-sm font-medium mb-2">Challenge Type *</label>
					<div className="space-y-2">
						<label className="flex items-center gap-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent">
							<input
								type="radio"
								name="challengeType"
								value="total_checkins"
								checked={formData.rules.challenge_type === 'total_checkins'}
								onChange={() => handleChallengeTypeChange('total_checkins')}
								className="w-4 h-4"
							/>
							<div>
								<div className="font-medium">Total Check-ins</div>
								<div className="text-sm text-muted-foreground">
									Track total number of habit check-ins during the challenge period
								</div>
							</div>
						</label>

						<label className="flex items-center gap-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent">
							<input
								type="radio"
								name="challengeType"
								value="streak"
								checked={formData.rules.challenge_type === 'streak'}
								onChange={() => handleChallengeTypeChange('streak')}
								className="w-4 h-4"
							/>
							<div>
								<div className="font-medium">Longest Streak</div>
								<div className="text-sm text-muted-foreground">
									Compete for the longest consecutive check-in streak
								</div>
							</div>
						</label>

						<label className="flex items-center gap-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent">
							<input
								type="radio"
								name="challengeType"
								value="specific_habit"
								checked={formData.rules.challenge_type === 'specific_habit'}
								onChange={() => handleChallengeTypeChange('specific_habit')}
								className="w-4 h-4"
							/>
							<div>
								<div className="font-medium">Specific Habit</div>
								<div className="text-sm text-muted-foreground">
									Focus on check-ins for specific habits only
								</div>
							</div>
						</label>
					</div>
				</div>

				{/* Target Value (Optional) */}
				<div>
					<label htmlFor="targetValue" className="block text-sm font-medium mb-1">
						Target Value (Optional)
					</label>
					<input
						type="number"
						id="targetValue"
						value={formData.rules.target_value || ''}
						onChange={(e) =>
							setFormData({
								...formData,
								rules: {
									...formData.rules,
									target_value: e.target.value ? parseInt(e.target.value) : null,
								},
							})
						}
						className="w-full px-3 py-2 border border-input bg-background rounded-lg"
						placeholder="e.g., 30 check-ins"
						min={1}
					/>
					<p className="text-sm text-muted-foreground mt-1">
						Set a target score for participants to achieve
					</p>
				</div>

				{/* Scoring Method */}
				<div>
					<label className="block text-sm font-medium mb-2">Scoring Method *</label>
					<div className="grid grid-cols-3 gap-2">
						<label className="flex items-center gap-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent">
							<input
								type="radio"
								name="scoring"
								value="total"
								checked={formData.rules.scoring === 'total'}
								onChange={() => handleScoringChange('total')}
								className="w-4 h-4"
							/>
							<span className="text-sm font-medium">Total</span>
						</label>

						<label className="flex items-center gap-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent">
							<input
								type="radio"
								name="scoring"
								value="average"
								checked={formData.rules.scoring === 'average'}
								onChange={() => handleScoringChange('average')}
								className="w-4 h-4"
							/>
							<span className="text-sm font-medium">Average</span>
						</label>

						<label className="flex items-center gap-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-accent">
							<input
								type="radio"
								name="scoring"
								value="best"
								checked={formData.rules.scoring === 'best'}
								onChange={() => handleScoringChange('best')}
								className="w-4 h-4"
							/>
							<span className="text-sm font-medium">Best</span>
						</label>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3 justify-end pt-4 border-t border-border">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						disabled={isPending}
						className="px-4 py-2 border border-input rounded-lg hover:bg-accent disabled:opacity-50"
					>
						Cancel
					</button>
				)}
				<button
					type="submit"
					disabled={isPending}
					className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
				>
					{isPending ? 'Creating...' : 'Create Challenge'}
				</button>
			</div>
		</form>
	);
}
