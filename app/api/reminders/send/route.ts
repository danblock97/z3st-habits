import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
	computeStreak,
	computeCurrentPeriodCount,
	computeAccountStreak,
	type StreakEntry,
} from "@/lib/streak";
import { getLocalDateForTZ } from "@/lib/dates";
import type { HabitSummary } from "@/app/(app)/app/habits/types";

// Initialize Supabase client with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Email service configuration - using Supabase SMTP
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@z3st.app";
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface UserWithHabits {
	id: string;
	email: string;
	timezone: string;
	habits: Array<{
		id: string;
		title: string;
		emoji: string | null;
		cadence: "daily" | "weekly";
		targetPerPeriod: number;
		timezone: string;
		createdAt: string;
		currentPeriodCount: number;
		currentStreak: number;
		longestStreak: number;
		todayCount: number;
	}>;
}

async function sendEmail(to: string, subject: string, html: string) {
	try {
		// For local development, we'll simulate email sending
		// In production, you would integrate with your actual email service (Resend SMTP via Supabase)

		// Check if we're in development mode
		const isDevelopment =
			process.env.NODE_ENV === "development" ||
			process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost");

		if (isDevelopment) {
			// In development, just log the email details
			console.log(`📧 EMAIL WOULD BE SENT (Local Development):`);
			console.log(`   To: ${to}`);
			console.log(`   Subject: ${subject}`);
			console.log(`   Content Preview: ${html.substring(0, 200)}...`);
			console.log(`   📬 Check Inbucket at: http://localhost:54324`);
			console.log(`   🔗 Full email would be sent to: ${to}`);
			return { success: true };
		}

		if (!resend) {
			throw new Error("Resend API key is not configured");
		}

		const { data, error } = await resend.emails.send({
			from: FROM_EMAIL,
			to,
			subject,
			html,
		});

		if (error) {
			throw error;
		}

		console.log(
			`📧 Email sent to ${to} via Resend${data?.id ? ` (id: ${data.id})` : ""}`
		);
		return { success: true, id: data?.id };
	} catch (error) {
		console.error("Failed to send email:", error);
		// Fallback: just log the email for debugging
		console.log(`📧 EMAIL WOULD BE SENT (Error Fallback):`);
		console.log(`   To: ${to}`);
		console.log(`   Subject: ${subject}`);
		console.log(`   Content: ${html.substring(0, 200)}...`);
		return { success: false };
	}
}

function generateReminderEmail(
	user: UserWithHabits,
	atRiskHabits: HabitSummary[],
	accountStreak?: { current: number; longest: number }
) {
	const mostAtRiskHabit = atRiskHabits[0];
	const habitEmoji = mostAtRiskHabit?.emoji || "🎯";
	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://z3st.app";
	const streakCount =
		accountStreak?.current ?? mostAtRiskHabit?.currentStreak ?? 0;

	return {
		subject: `${habitEmoji} Don't break your ${streakCount}-day streak!`,
		html: `
<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Streak Reminder</title>
<style>
/* Dark mode support (best-effort) */
@media (prefers-color-scheme: dark) {
body, .body-bg { background: #0b0b0b !important; }
.card { background: #121212 !important; color: #f6f6f6 !important; border-color: #1e1e1e !important; }
.muted { color: #b5b5b5 !important; }
.habit-item { background: #1e1e1e !important; border-color: #2a2a2a !important; }
}
/* Mobile tweaks */
@media screen and (max-width: 600px) {
.container { width: 100% !important; }
.px-md { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body class="body-bg" style="margin:0; padding:0; background:#FFFBEA;">
<!-- Preheader (hidden in most clients) -->
<div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">Don't break your ${mostAtRiskHabit.currentStreak}-day streak! Complete your habits now.</div>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
<tr>
<!-- Citrus gradient bar (fallback to solid color) -->
<td style="height:10px; background:#FFF7C2; background-image:linear-gradient(90deg,#FFF7C2 0%, #FFE066 35%, #FFD84D 60%, #FFFFFF 100%);"></td>
</tr>
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="border-collapse:separate; width:600px; max-width:600px;">
<tr>
<td class="card px-md" style="background:#ffffff; border:1px solid #F7EFC3; border-radius:16px; padding:32px; box-shadow:0 6px 24px rgba(255,216,77,0.18); font-family:Segoe UI, Roboto, Arial, sans-serif; color:#1a1a1a;">
<h1 style="margin:0 0 12px; font-size:24px; line-height:1.25;">${habitEmoji} Streak Alert!</h1>
<p style="margin:0 0 20px; font-size:16px; line-height:1.6;">You're about to break your ${streakCount}-day streak. Don't let all that progress go to waste!</p>

${
	mostAtRiskHabit
		? `
<!-- Main habit card -->
<div style="background:#FFF7C2; border:1px solid #FFE066; border-radius:12px; padding:20px; margin:20px 0;">
<h2 style="margin:0 0 8px; font-size:18px; color:#7a5b00;">${mostAtRiskHabit.title}</h2>
<div style="font-size:32px; font-weight:bold; color:#FFD84D; margin:8px 0;">${mostAtRiskHabit.currentStreak} days</div>
<p style="margin:8px 0 0; font-size:14px; color:#7a5b00;">You've been crushing this habit for ${mostAtRiskHabit.currentStreak} days straight! Keep the momentum going.</p>
</div>
`
		: ""
}

${
	atRiskHabits.length > 1
		? `
<!-- Additional at-risk habits -->
<div style="margin:20px 0;">
<p style="margin:0 0 12px; font-size:14px; font-weight:600; color:#7a5b00;">You have ${atRiskHabits.length} habits at risk:</p>
${atRiskHabits
	.slice(1)
	.map(
		(habit) => `
<div class="habit-item" style="background:#f8f9fa; border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin:8px 0;">
<span style="font-size:16px; margin-right:8px;">${habit.emoji || "🎯"}</span>
<span style="font-weight:500;">${habit.title}</span>
<span style="color:#6b7280; font-size:14px;">(${habit.currentStreak} days)</span>
</div>
`
	)
	.join("")}
</div>
`
		: ""
}

<!-- Button (bulletproof) -->
<div style="margin:24px 0 8px;">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${appUrl}/app/habits" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="12%" stroke="f" fillcolor="#FFD84D">
<w:anchorlock/>
<center style="color:#111111;font-family:Segoe UI, Arial, sans-serif;font-size:16px;font-weight:700;">Complete Your Habits</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${appUrl}/app/habits" style="display:inline-block; text-decoration:none; font-weight:700; font-size:16px; line-height:48px; padding:0 28px; border-radius:12px; background:#FFD84D; background-image:linear-gradient(180deg,#FFE66D 0%, #FFD84D 70%, #FFF5C2 100%); color:#111111; box-shadow:0 4px 12px rgba(255,216,77,0.45);">Complete Your Habits →</a>
<!--<![endif]-->
</div>

<hr style="margin:28px 0; border:none; height:1px; background:linear-gradient(90deg, rgba(255,216,77,0.2), rgba(0,0,0,0));" />

<p class="muted" style="margin:0 0 8px; font-size:12px; color:#6b6b6b;">This reminder was sent because you haven't completed any habits today and you have a ${streakCount}-day streak.</p>
<p class="muted" style="margin:0; font-size:12px; color:#6b6b6b;">You can manage your reminder preferences in your account settings.</p>
<p class="muted" style="margin:8px 0 0; font-size:12px; color:#6b6b6b;">Sent from ${appUrl}</p>
</td>
</tr>
<tr>
<td style="height:18px;"></td>
</tr>
<tr>
<!-- Bottom citrus fade -->
<td style="height:10px; background:#FFFFFF; background-image:linear-gradient(90deg,#FFFFFF 0%, #FFF7C2 50%, #FFE066 100%);"></td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
    `,
	};
}

export async function GET(request: NextRequest) {
	try {
		// Verify this is a legitimate cron request
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("Starting reminder check...");

		// Get all users with their habits and checkins
		const { data: users, error: usersError } = await supabase.from("profiles")
			.select(`
        id,
        timezone,
        reminder_preferences
      `);

		if (usersError) {
			console.error("Error fetching users:", usersError);
			return NextResponse.json({ error: "Database error" }, { status: 500 });
		}

		if (!users || users.length === 0) {
			return NextResponse.json({ message: "No users found" });
		}

		// Get user emails from auth.users
		const userIds = users.map((u) => u.id);
		const { data: authUsers, error: authError } =
			await supabase.auth.admin.listUsers();

		if (authError) {
			console.error("Error fetching auth users:", authError);
			return NextResponse.json({ error: "Auth error" }, { status: 500 });
		}

		// Create a map of user ID to email
		const userEmailMap = new Map<string, string>();
		authUsers.users.forEach((authUser) => {
			if (authUser.email && userIds.includes(authUser.id)) {
				userEmailMap.set(authUser.id, authUser.email);
			}
		});

		let emailsSent = 0;
		let usersProcessed = 0;

		// Process users in batches to avoid timeouts
		for (const user of users.slice(0, 50)) {
			// Limit to 50 users per run
			const userEmail = userEmailMap.get(user.id);
			if (!userEmail) {
				continue; // Skip users without email
			}
			try {
				usersProcessed++;

				// Get user's habits
				const { data: habits, error: habitsError } = await supabase
					.from("habits")
					.select("id, title, emoji, cadence, target_per_period, timezone")
					.eq("owner_id", user.id)
					.eq("is_archived", false);

				if (habitsError || !habits || habits.length === 0) {
					continue;
				}

				// Get checkins for all habits
				const habitIds = habits.map((h) => h.id);
				const { data: checkins, error: checkinsError } = await supabase
					.from("checkins")
					.select("habit_id, local_date, count")
					.eq("user_id", user.id)
					.in("habit_id", habitIds);

				if (checkinsError) {
					continue;
				}

				// Group checkins by habit
				const checkinsByHabit = new Map();
				(checkins || []).forEach((checkin) => {
					const existing = checkinsByHabit.get(checkin.habit_id) || [];
					checkinsByHabit.set(checkin.habit_id, [...existing, checkin]);
				});

				// Calculate streaks and identify at-risk habits
				const userTimezone = user.timezone || "UTC";
				const now = new Date();
				const today = getLocalDateForTZ(userTimezone, now);

				const habitsWithStreaks = habits.map((habit) => {
					const habitCheckins = checkinsByHabit.get(habit.id) || [];
					const streakEntries: StreakEntry[] = habitCheckins.map(
						(c: { local_date: string; count: number }) => ({
							localDate: c.local_date,
							count: c.count,
						})
					);

					const streak = computeStreak({
						cadence: habit.cadence as "daily" | "weekly",
						target: habit.target_per_period,
						timezone: habit.timezone || userTimezone,
						entries: streakEntries,
						now,
					});

					const currentPeriodCount = computeCurrentPeriodCount(
						habit.cadence as "daily" | "weekly",
						habit.timezone || userTimezone,
						habit.target_per_period,
						streakEntries,
						now
					);

					return {
						id: habit.id,
						title: habit.title,
						emoji: habit.emoji,
						cadence: habit.cadence as "daily" | "weekly",
						targetPerPeriod: habit.target_per_period,
						timezone: habit.timezone || userTimezone,
						createdAt: new Date().toISOString(),
						currentPeriodCount,
						currentStreak: streak.current,
						longestStreak: streak.longest,
						todayCount: currentPeriodCount,
					};
				});

				// Compute account-level streak (combine all habit entries)
				const allHabitEntries = (habitIds || []).map((id: string) => {
					const rows = checkinsByHabit.get(id) || [];
					return rows.map((r: { local_date: string; count: number }) => ({
						localDate: r.local_date,
						count: r.count,
					}));
				});

				const accountStreak = computeAccountStreak({
					timezone: userTimezone,
					allHabitEntries,
					now,
				});

				// Compute accountTodayCount (sum of today's counts across habits)
				const accountTodayCount = habitsWithStreaks.reduce(
					(sum, h) => sum + (h.todayCount || 0),
					0
				);

				// Only send if the account has an active streak and the user hasn't completed any habits today
				if (!(accountStreak.current > 0 && accountTodayCount === 0)) {
					continue;
				}

				// Check user reminder preferences
				const preferences = user.reminder_preferences || {
					email_reminders_enabled: true,
					streak_reminders_enabled: true,
					reminder_frequency: "daily",
					quiet_hours: {
						enabled: false,
						start: "22:00",
						end: "08:00",
					},
				};

				// Skip if email reminders are disabled
				if (!preferences.email_reminders_enabled) {
					console.log(`Skipping user ${user.id}: email reminders disabled`);
					continue;
				}

				// Skip if streak reminders are disabled
				if (!preferences.streak_reminders_enabled) {
					console.log(`Skipping user ${user.id}: streak reminders disabled`);
					continue;
				}

				// Skip if frequency is 'never'
				if (preferences.reminder_frequency === "never") {
					console.log(
						`Skipping user ${user.id}: reminder frequency set to never`
					);
					continue;
				}

				// Check quiet hours
				if (preferences.quiet_hours.enabled) {
					const now = new Date();
					const userTimezone = user.timezone || "UTC";
					const userTime = new Date(
						now.toLocaleString("en-US", { timeZone: userTimezone })
					);
					const currentHour = userTime.getHours();
					const currentMinute = userTime.getMinutes();
					const currentTimeMinutes = currentHour * 60 + currentMinute;

					const [startHour, startMinute] = preferences.quiet_hours.start
						.split(":")
						.map(Number);
					const [endHour, endMinute] = preferences.quiet_hours.end
						.split(":")
						.map(Number);
					const startTimeMinutes = startHour * 60 + startMinute;
					const endTimeMinutes = endHour * 60 + endMinute;

					// Handle quiet hours that cross midnight
					const isInQuietHours =
						startTimeMinutes <= endTimeMinutes
							? currentTimeMinutes >= startTimeMinutes &&
								currentTimeMinutes < endTimeMinutes
							: currentTimeMinutes >= startTimeMinutes ||
								currentTimeMinutes < endTimeMinutes;

					if (isInQuietHours) {
						console.log(`Skipping user ${user.id}: currently in quiet hours`);
						continue;
					}
				}

				// Check if we should send a reminder (avoid spam)
				const { data: lastReminder } = await supabase
					.from("reminders")
					.select("last_sent")
					.eq("user_id", user.id)
					.eq("channel", "email")
					.order("last_sent", { ascending: false })
					.limit(1)
					.maybeSingle();

				// Don't send more than one reminder per day
				if (lastReminder?.last_sent) {
					const lastSentDate = new Date(lastReminder.last_sent);
					const todayDate = new Date(today);
					if (lastSentDate.toDateString() === todayDate.toDateString()) {
						continue;
					}
				}

				// Get at-risk habits sorted by streak length (for content/action items)
				const atRiskHabits = habitsWithStreaks
					.filter((h) => h.currentStreak > 0 && h.todayCount === 0)
					.sort((a, b) => b.currentStreak - a.currentStreak);

				// Don't send account-level reminder if there are no at-risk habits to act on
				if (atRiskHabits.length === 0) {
					continue;
				}

				// Send email
				const emailContent = generateReminderEmail(
					{ ...user, email: userEmail, habits: habitsWithStreaks },
					atRiskHabits,
					accountStreak
				);

				const sendResult = await sendEmail(
					userEmail,
					emailContent.subject,
					emailContent.html
				);

				if (!sendResult.success) {
					console.log(
						`Skipping reminder update for ${userEmail}: email send failed`
					);
					continue;
				}

				// Update reminder timestamp
				await supabase.from("reminders").upsert({
					user_id: user.id,
					habit_id: atRiskHabits[0]?.id ?? null,
					channel: "email",
					rrule: "FREQ=DAILY",
					tz: userTimezone,
					last_sent: new Date().toISOString(),
				});

				emailsSent++;
				console.log(
					`Sent reminder to ${userEmail} for ${atRiskHabits.length} at-risk habits`
				);
			} catch (error) {
				console.error(`Error processing user ${user.id}:`, error);
				continue;
			}
		}

		return NextResponse.json({
			message: "Reminder check completed",
			usersProcessed,
			emailsSent,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Reminder check failed:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
