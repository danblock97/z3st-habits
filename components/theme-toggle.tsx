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
		const readStoredTheme = (): ThemePreference | null => {
			try {
				const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);
				if (storedValue === "dark" || storedValue === "light") {
					return storedValue;
				}
			} catch {
				// Ignore localStorage errors (e.g., private mode)
			}
			return null;
		};

		const stored = readStoredTheme();
		const mediaQuery =
			typeof window.matchMedia === "function"
				? window.matchMedia("(prefers-color-scheme: dark)")
				: null;
		const systemTheme: ThemePreference | null = mediaQuery
			? mediaQuery.matches
				? "dark"
				: "light"
			: null;

		const initialTheme = stored ?? systemTheme ?? DEFAULT_THEME;
		setThemeState(initialTheme);
		setTheme(initialTheme);

		if (!stored && mediaQuery) {
			const handleChange = (event: MediaQueryListEvent) => {
				const storedPreference = readStoredTheme();
				if (storedPreference) {
					return;
				}
				const nextTheme: ThemePreference = event.matches ? "dark" : "light";
				setThemeState(nextTheme);
				setTheme(nextTheme);
			};

			if (typeof mediaQuery.addEventListener === "function") {
				mediaQuery.addEventListener("change", handleChange);
			} else if (typeof mediaQuery.addListener === "function") {
				mediaQuery.addListener(handleChange);
			}

			return () => {
				if (typeof mediaQuery.removeEventListener === "function") {
					mediaQuery.removeEventListener("change", handleChange);
				} else if (typeof mediaQuery.removeListener === "function") {
					mediaQuery.removeListener(handleChange);
				}
			};
		}

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
