"use client";

import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	THEME_STORAGE_KEY,
	type ThemePreference,
	DEFAULT_THEME,
} from "@/lib/theme";

function setTheme(theme: ThemePreference) {
	const root = document.documentElement;

	root.classList.toggle("dark", theme === "dark");
	root.style.colorScheme = theme;
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		// Ignore localStorage errors (e.g., private mode)
	}
}

export function ThemeToggle({ className }: { className?: string }) {
	const [theme, setThemeState] = useState<ThemePreference | null>(null);

	useEffect(() => {
		const stored = (() => {
			try {
				const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);
				if (storedValue === "dark" || storedValue === "light") {
					return storedValue;
				}
			} catch {
				// Ignore localStorage errors (e.g., private mode)
			}
			return null;
		})();
		// Default to the project's DEFAULT_THEME when there is no stored preference.
		const initialTheme = (stored as ThemePreference | null) ?? DEFAULT_THEME;
		setThemeState(initialTheme);
		setTheme(initialTheme);

		// Do not listen to system preference changes. Theme should only change
		// when the user explicitly toggles or when a stored preference exists.
		return () => undefined;
	}, []);

	const isDark = theme === "dark";

	return (
		<Button
			type="button"
			size="icon"
			variant="ghost"
			className={cn("h-10 w-10", className)}
			onClick={() => {
				const nextTheme = isDark ? "light" : "dark";
				setThemeState(nextTheme);
				setTheme(nextTheme);
			}}
			aria-label={isDark ? "Activate light mode" : "Activate dark mode"}
		>
			<SunMedium
				className={cn(
					"h-5 w-5 transition transform",
					isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"
				)}
				aria-hidden="true"
			/>
			<MoonStar
				className={cn(
					"absolute h-5 w-5 transition transform",
					isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"
				)}
				aria-hidden="true"
			/>
		</Button>
	);
}
