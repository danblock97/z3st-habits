import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const next = requestUrl.searchParams.get("next") ?? "/app";

	// Use NEXT_PUBLIC_SITE_URL or fall back to request origin
	const origin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

	if (!code) {
		return NextResponse.redirect(
			new URL(
				`/login?error=${encodeURIComponent("Missing code from Supabase.")}`,
				origin
			)
		);
	}

	const supabase = await createServerClient();
	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		return NextResponse.redirect(
			new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
		);
	}

	return NextResponse.redirect(new URL(next, origin));
}
