import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

export type EmailTemplate =
	| 'challenge-created'
	| 'challenge-halfway'
	| 'challenge-completed';

interface ChallengeEmailData {
	challengeTitle: string;
	challengeEmoji?: string;
	groupName: string;
	startDate: string;
	endDate: string;
	challengeUrl: string;
}

interface ChallengeCompletedData extends ChallengeEmailData {
	winnerUsername: string;
	winnerEmoji?: string;
	winnerScore: number;
}

export async function sendChallengeEmail(
	to: string[],
	template: EmailTemplate,
	data: ChallengeEmailData | ChallengeCompletedData
): Promise<{ success: boolean; error?: string }> {
	try {
		const { subject, html } = getEmailContent(template, data);

		await resend.emails.send({
			from: 'z3st Habits <notifications@z3st.app>',
			to,
			subject,
			html,
		});

		return { success: true };
	} catch (error) {
		console.error('Failed to send challenge email:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

function getEmailContent(
	template: EmailTemplate,
	data: ChallengeEmailData | ChallengeCompletedData
): { subject: string; html: string } {
	switch (template) {
		case 'challenge-created':
			return {
				subject: `🏆 New Challenge: ${data.challengeTitle}`,
				html: generateChallengeCreatedEmail(data),
			};
		case 'challenge-halfway':
			return {
				subject: `⏰ Halfway There: ${data.challengeTitle}`,
				html: generateChallengeHalfwayEmail(data),
			};
		case 'challenge-completed':
			return {
				subject: `🎉 Challenge Complete: ${data.challengeTitle}`,
				html: generateChallengeCompletedEmail(data as ChallengeCompletedData),
			};
	}
}

function generateChallengeCreatedEmail(data: ChallengeEmailData): string {
	return `
<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Challenge Created</title>
<style>
/* Dark mode support (best-effort) */
@media (prefers-color-scheme: dark) {
body, .body-bg { background: #0b0b0b !important; }
.card { background: #121212 !important; color: #f6f6f6 !important; border-color: #1e1e1e !important; }
.muted { color: #b5b5b5 !important; }
.challenge-card { background: #1e1e1e !important; border-color: #2a2a2a !important; }
}
/* Mobile tweaks */
@media screen and (max-width: 600px) {
.container { width: 100% !important; }
.px-md { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body class="body-bg" style="margin:0; padding:0; background:#FFFBEA;">
<!-- Preheader -->
<div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">New challenge: ${data.challengeTitle} in ${data.groupName}</div>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
<tr>
<!-- Citrus gradient bar -->
<td style="height:10px; background:#FFF7C2; background-image:linear-gradient(90deg,#FFF7C2 0%, #FFE066 35%, #FFD84D 60%, #FFFFFF 100%);"></td>
</tr>
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="border-collapse:separate; width:600px; max-width:600px;">
<tr>
<td class="card px-md" style="background:#ffffff; border:1px solid #F7EFC3; border-radius:16px; padding:32px; box-shadow:0 6px 24px rgba(255,216,77,0.18); font-family:Segoe UI, Roboto, Arial, sans-serif; color:#1a1a1a;">
<h1 style="margin:0 0 12px; font-size:24px; line-height:1.25;">${data.challengeEmoji || '🏆'} New Challenge Created!</h1>
<p style="margin:0 0 20px; font-size:16px; line-height:1.6;">A new challenge has been created in <strong>${data.groupName}</strong>!</p>

<!-- Challenge details card -->
<div class="challenge-card" style="background:#FFF7C2; border:1px solid #FFE066; border-radius:12px; padding:20px; margin:20px 0;">
<h2 style="margin:0 0 16px; font-size:20px; color:#7a5b00;">${data.challengeTitle}</h2>
<div style="margin:12px 0;">
<p style="margin:4px 0; font-size:14px; color:#6b4d00;"><strong>Start Date:</strong> ${new Date(data.startDate).toLocaleDateString('en-US', {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric'
})}</p>
<p style="margin:4px 0; font-size:14px; color:#6b4d00;"><strong>End Date:</strong> ${new Date(data.endDate).toLocaleDateString('en-US', {
	weekday: 'long',
	year: 'numeric',
	month: 'long',
	day: 'numeric'
})}</p>
</div>
</div>

<p style="margin:20px 0; font-size:16px; line-height:1.6;">Join now and compete with your group members to achieve your habit goals!</p>

<!-- Button (bulletproof) -->
<div style="margin:24px 0 8px;">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${data.challengeUrl}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="12%" stroke="f" fillcolor="#FFD84D">
<w:anchorlock/>
<center style="color:#111111;font-family:Segoe UI, Arial, sans-serif;font-size:16px;font-weight:700;">View Challenge →</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${data.challengeUrl}" style="display:inline-block; text-decoration:none; font-weight:700; font-size:16px; line-height:48px; padding:0 28px; border-radius:12px; background:#FFD84D; background-image:linear-gradient(180deg,#FFE66D 0%, #FFD84D 70%, #FFF5C2 100%); color:#111111; box-shadow:0 4px 12px rgba(255,216,77,0.45);">View Challenge →</a>
<!--<![endif]-->
</div>

<hr style="margin:28px 0; border:none; height:1px; background:linear-gradient(90deg, rgba(255,216,77,0.2), rgba(0,0,0,0));" />

<p class="muted" style="margin:0; font-size:12px; color:#6b6b6b;">You're receiving this email because you're a member of ${data.groupName}.</p>
<p class="muted" style="margin:8px 0 0; font-size:12px; color:#6b6b6b;">Sent from ${process.env.NEXT_PUBLIC_APP_URL || 'https://z3st.app'}</p>
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
	`;
}

function generateChallengeHalfwayEmail(data: ChallengeEmailData): string {
	const startDate = new Date(data.startDate);
	const endDate = new Date(data.endDate);
	const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
	const daysRemaining = Math.ceil(totalDays / 2);

	return `
<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Challenge Halfway Point</title>
<style>
/* Dark mode support (best-effort) */
@media (prefers-color-scheme: dark) {
body, .body-bg { background: #0b0b0b !important; }
.card { background: #121212 !important; color: #f6f6f6 !important; border-color: #1e1e1e !important; }
.muted { color: #b5b5b5 !important; }
.progress-card { background: #1e1e1e !important; border-color: #2a2a2a !important; }
}
/* Mobile tweaks */
@media screen and (max-width: 600px) {
.container { width: 100% !important; }
.px-md { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body class="body-bg" style="margin:0; padding:0; background:#FFFBEA;">
<!-- Preheader -->
<div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">You're halfway through ${data.challengeTitle}! Keep going!</div>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
<tr>
<!-- Citrus gradient bar -->
<td style="height:10px; background:#FFF7C2; background-image:linear-gradient(90deg,#FFF7C2 0%, #FFE066 35%, #FFD84D 60%, #FFFFFF 100%);"></td>
</tr>
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="border-collapse:separate; width:600px; max-width:600px;">
<tr>
<td class="card px-md" style="background:#ffffff; border:1px solid #F7EFC3; border-radius:16px; padding:32px; box-shadow:0 6px 24px rgba(255,216,77,0.18); font-family:Segoe UI, Roboto, Arial, sans-serif; color:#1a1a1a;">
<h1 style="margin:0 0 12px; font-size:24px; line-height:1.25;">${data.challengeEmoji || '⏰'} You're Halfway There!</h1>
<p style="margin:0 0 20px; font-size:16px; line-height:1.6;">Great progress! You've reached the halfway point of <strong>${data.challengeTitle}</strong> in ${data.groupName}.</p>

<!-- Progress card -->
<div class="progress-card" style="background:#FFF0B3; border:1px solid #FFD84D; border-radius:12px; padding:20px; margin:20px 0;">
<h2 style="margin:0 0 16px; font-size:18px; color:#6b4d00; text-align:center;">Challenge Progress</h2>
<div style="margin:16px 0;">
<div style="background:#FFF7C2; height:12px; border-radius:6px; overflow:hidden; border:1px solid #FFE066;">
<div style="background:#FFD84D; background-image:linear-gradient(90deg,#FFE66D 0%, #FFD84D 100%); height:100%; width:50%;"></div>
</div>
<p style="text-align:center; margin:12px 0 0; font-size:20px; font-weight:bold; color:#B7791F;">50% Complete</p>
</div>
<p style="margin:16px 0 0; font-size:16px; color:#6b4d00; text-align:center;"><strong>${daysRemaining} days</strong> remaining</p>
</div>

<p style="margin:20px 0; font-size:16px; line-height:1.6;">Keep up the momentum! Check the leaderboard to see where you stand.</p>

<!-- Button (bulletproof) -->
<div style="margin:24px 0 8px;">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${data.challengeUrl}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="12%" stroke="f" fillcolor="#FFD84D">
<w:anchorlock/>
<center style="color:#111111;font-family:Segoe UI, Arial, sans-serif;font-size:16px;font-weight:700;">View Leaderboard →</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${data.challengeUrl}" style="display:inline-block; text-decoration:none; font-weight:700; font-size:16px; line-height:48px; padding:0 28px; border-radius:12px; background:#FFD84D; background-image:linear-gradient(180deg,#FFE66D 0%, #FFD84D 70%, #FFF5C2 100%); color:#111111; box-shadow:0 4px 12px rgba(255,216,77,0.45);">View Leaderboard →</a>
<!--<![endif]-->
</div>

<hr style="margin:28px 0; border:none; height:1px; background:linear-gradient(90deg, rgba(255,216,77,0.2), rgba(0,0,0,0));" />

<p class="muted" style="margin:0; font-size:12px; color:#6b6b6b;">You're receiving this email because you're participating in this challenge.</p>
<p class="muted" style="margin:8px 0 0; font-size:12px; color:#6b6b6b;">Sent from ${process.env.NEXT_PUBLIC_APP_URL || 'https://z3st.app'}</p>
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
	`;
}

function generateChallengeCompletedEmail(data: ChallengeCompletedData): string {
	return `
<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Challenge Completed</title>
<style>
/* Dark mode support (best-effort) */
@media (prefers-color-scheme: dark) {
body, .body-bg { background: #0b0b0b !important; }
.card { background: #121212 !important; color: #f6f6f6 !important; border-color: #1e1e1e !important; }
.muted { color: #b5b5b5 !important; }
.winner-card { background: #1e1e1e !important; border-color: #FFD84D !important; }
}
/* Mobile tweaks */
@media screen and (max-width: 600px) {
.container { width: 100% !important; }
.px-md { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body class="body-bg" style="margin:0; padding:0; background:#FFFBEA;">
<!-- Preheader -->
<div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">${data.challengeTitle} is complete! Congratulations ${data.winnerUsername}!</div>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
<tr>
<!-- Citrus gradient bar -->
<td style="height:10px; background:#FFF7C2; background-image:linear-gradient(90deg,#FFF7C2 0%, #FFE066 35%, #FFD84D 60%, #FFFFFF 100%);"></td>
</tr>
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="border-collapse:separate; width:600px; max-width:600px;">
<tr>
<td class="card px-md" style="background:#ffffff; border:1px solid #F7EFC3; border-radius:16px; padding:32px; box-shadow:0 6px 24px rgba(255,216,77,0.18); font-family:Segoe UI, Roboto, Arial, sans-serif; color:#1a1a1a;">
<h1 style="margin:0 0 12px; font-size:24px; line-height:1.25;">🎉 Challenge Complete!</h1>
<p style="margin:0 0 8px; font-size:20px; line-height:1.4; font-weight:600; color:#B7791F;">${data.challengeTitle}</p>
<p style="margin:0 0 20px; font-size:16px; line-height:1.6;">The challenge in <strong>${data.groupName}</strong> has come to an end. Congratulations to everyone who participated!</p>

<!-- Winner card -->
<div class="winner-card" style="background:#FFF0B3; border:2px solid #FFD84D; border-radius:12px; padding:24px; margin:20px 0; text-align:center;">
<div style="font-size:48px; margin-bottom:12px;">🏆</div>
<h2 style="margin:0 0 16px; font-size:20px; color:#6b4d00;">Winner</h2>
<div style="font-size:40px; margin:12px 0;">${data.winnerEmoji || '🍋'}</div>
<p style="margin:12px 0; font-size:24px; font-weight:700; color:#1a1a1a;">
${data.winnerUsername}
</p>
<div style="background:#FFF7C2; border:1px solid #FFE066; border-radius:8px; padding:16px; margin:16px 0; display:inline-block;">
<p style="margin:0; font-size:14px; color:#6b4d00;">Final Score</p>
<p style="margin:8px 0 0; font-size:32px; font-weight:bold; color:#B7791F;">${data.winnerScore}</p>
</div>
</div>

<p style="margin:20px 0; font-size:16px; line-height:1.6;">View the full results and see how everyone performed in the challenge.</p>

<!-- Button (bulletproof) -->
<div style="margin:24px 0 8px;">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${data.challengeUrl}" style="height:48px;v-text-anchor:middle;width:260px;" arcsize="12%" stroke="f" fillcolor="#FFD84D">
<w:anchorlock/>
<center style="color:#111111;font-family:Segoe UI, Arial, sans-serif;font-size:16px;font-weight:700;">View Results →</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-- -->
<a href="${data.challengeUrl}" style="display:inline-block; text-decoration:none; font-weight:700; font-size:16px; line-height:48px; padding:0 28px; border-radius:12px; background:#FFD84D; background-image:linear-gradient(180deg,#FFE66D 0%, #FFD84D 70%, #FFF5C2 100%); color:#111111; box-shadow:0 4px 12px rgba(255,216,77,0.45);">View Results →</a>
<!--<![endif]-->
</div>

<hr style="margin:28px 0; border:none; height:1px; background:linear-gradient(90deg, rgba(255,216,77,0.2), rgba(0,0,0,0));" />

<p class="muted" style="margin:0; font-size:12px; color:#6b6b6b;">You're receiving this email because you were a participant in this challenge.</p>
<p class="muted" style="margin:8px 0 0; font-size:12px; color:#6b6b6b;">Sent from ${process.env.NEXT_PUBLIC_APP_URL || 'https://z3st.app'}</p>
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
	`;
}
