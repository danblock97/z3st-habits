export const THEME_STORAGE_KEY = "z3st-theme" as const;

export type ThemePreference = "light" | "dark";

// Central default theme for the app. Use this everywhere instead of the literal
// string to avoid duplication.
export const DEFAULT_THEME: ThemePreference = "light";
