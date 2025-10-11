import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendChallengeEmail } from '@/lib/email';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
	try {
		// Verify this is a legitimate cron request
		const authHeader = request.headers.get('authorization');
		const cronSecret = process.env.CRON_SECRET;

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('Starting challenge email processing...');

		// First, check for halfway emails that need to be queued
		const { data: halfwayResults } = await supabase.rpc('check_and_queue_halfway_emails');

		if (halfwayResults && halfwayResults.length > 0) {
			console.log(`Queued halfway emails for ${halfwayResults.length} challenges`);
		}

		// Get pending emails from queue (limit to 50 to avoid timeouts)
		const { data: pendingEmails, error: queueError } = await supabase
			.from('challenge_email_queue')
			.select(`
				id,
				challenge_id,
				email_type,
				recipient_user_id,
				group_challenges!inner (
					id,
					title,
					emoji,
					start_date,
					end_date,
					group_id,
					groups!inner (
						id,
						name
					)
				)
			`)
			.is('sent_at', null)
			.is('error', null)
			.limit(50);

		if (queueError) {
			console.error('Error fetching email queue:', queueError);
			return NextResponse.json({ error: 'Database error' }, { status: 500 });
		}

		if (!pendingEmails || pendingEmails.length === 0) {
			return NextResponse.json({
				message: 'No pending emails to send',
				timestamp: new Date().toISOString(),
			});
		}

		// Get user emails from auth.users (similar to reminders)
		const userIds = pendingEmails.map((e) => e.recipient_user_id);
		const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

		if (authError) {
			console.error('Error fetching auth users:', authError);
			return NextResponse.json({ error: 'Auth error' }, { status: 500 });
		}

		// Create a map of user ID to email
		const userEmailMap = new Map<string, string>();
		authUsers.users.forEach((authUser) => {
			if (authUser.email && userIds.includes(authUser.id)) {
				userEmailMap.set(authUser.id, authUser.email);
			}
		});

		let emailsSent = 0;
		let emailsFailed = 0;

		for (const emailEntry of pendingEmails) {
			try {
				// Get email from auth.users map
				const recipientEmail = userEmailMap.get(emailEntry.recipient_user_id);
				if (!recipientEmail) {
					console.error(`No email found for user ${emailEntry.recipient_user_id}`);
					// Mark as error
					await supabase
						.from('challenge_email_queue')
						.update({ error: 'User email not found' })
						.eq('id', emailEntry.id);
					emailsFailed++;
					continue;
				}

				const challenge = Array.isArray(emailEntry.group_challenges)
					? emailEntry.group_challenges[0]
					: emailEntry.group_challenges;

				if (!challenge) {
					console.error(`Challenge not found for email ${emailEntry.id}`);
					continue;
				}

				const group = Array.isArray(challenge.groups)
					? challenge.groups[0]
					: challenge.groups;

				const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://z3st.app';
				const challengeUrl = `${appUrl}/app/challenges/${challenge.id}`;

				// For completion emails, we need to fetch the winner
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const emailData: any = {
					challengeTitle: challenge.title,
					challengeEmoji: challenge.emoji,
					groupName: group?.name || 'Unknown Group',
					startDate: challenge.start_date,
					endDate: challenge.end_date,
					challengeUrl,
				};

				if (emailEntry.email_type === 'completed') {
					// Fetch the winner (participant with highest score)
					const { data: winner } = await supabase
						.from('challenge_participants')
						.select(`
							user_id,
							current_score,
							profiles!inner (
								username,
								emoji
							)
						`)
						.eq('challenge_id', challenge.id)
						.order('current_score', { ascending: false })
						.limit(1)
						.maybeSingle();

					if (winner) {
						const profile = Array.isArray(winner.profiles)
							? winner.profiles[0]
							: winner.profiles;

						emailData.winnerUsername = profile?.username || 'Unknown';
						emailData.winnerEmoji = profile?.emoji || '🍋';
						emailData.winnerScore = winner.current_score;
					}
				}

				// Send the email
				const result = await sendChallengeEmail(
					[recipientEmail],
					emailEntry.email_type as 'challenge-created' | 'challenge-halfway' | 'challenge-completed',
					emailData
				);

				if (result.success) {
					// Mark as sent
					await supabase
						.from('challenge_email_queue')
						.update({ sent_at: new Date().toISOString() })
						.eq('id', emailEntry.id);

					emailsSent++;
					console.log(`Sent ${emailEntry.email_type} email to ${recipientEmail}`);
				} else {
					// Mark error
					await supabase
						.from('challenge_email_queue')
						.update({ error: result.error })
						.eq('id', emailEntry.id);

					emailsFailed++;
					console.error(
						`Failed to send ${emailEntry.email_type} email to ${recipientEmail}:`,
						result.error
					);
				}
			} catch (error) {
				console.error(`Error processing email ${emailEntry.id}:`, error);
				emailsFailed++;

				// Mark error in database
				await supabase
					.from('challenge_email_queue')
					.update({
						error: error instanceof Error ? error.message : 'Unknown error',
					})
					.eq('id', emailEntry.id);
			}
		}

		return NextResponse.json({
			message: 'Challenge email processing completed',
			emailsSent,
			emailsFailed,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Challenge email processing failed:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
