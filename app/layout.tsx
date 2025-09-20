import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LineChart,
  ListChecks,
  UserRound,
} from "lucide-react";
import { Geist, Geist_Mono } from "next/font/google";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const HEADER_LINKS: { href: string; label: string }[] = [
  { href: "#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

const APP_NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/habits", label: "Habits", icon: ListChecks },
  { href: "/app/insights", label: "Insights", icon: LineChart },
  { href: "/app/profile", label: "Profile", icon: UserRound },
];

export const metadata: Metadata = {
  metadataBase: new URL("https://z3st.app"),
  title: {
    default: "Z3st Habits",
    template: "%s | Z3st Habits",
  },
  description:
    "Z3st Habits is the citrus-powered ritual system for founders and creatives to design habits that actually stick.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAuthenticated = Boolean(
    cookieStore.get("sb-access-token") ??
      cookieStore.get("supabase-auth-token") ??
      cookieStore.get("sb-refresh-token")
  );

  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "min-h-dvh bg-background text-foreground antialiased"
        )}
      >
        <div className="flex min-h-dvh flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        {isAuthenticated ? <MobileBottomNav /> : null}
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <span className="text-2xl" aria-hidden="true">
            🍋
          </span>
          <span className="hidden sm:inline">Z3st Habits</span>
          <span className="sr-only">Z3st Habits home</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/70 md:flex">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="lg">
          <Link href="/app">Launch app</Link>
        </Button>
      </div>
    </header>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-foreground/70 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">Z3st Habits</p>
          <p>Making rituals effortless since {year}.</p>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

function MobileBottomNav() {
  return (
    <nav aria-label="App navigation" className="md:hidden">
      <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-1 rounded-full border border-border/70 bg-background/95 px-4 py-3 shadow-lg shadow-primary/20 backdrop-blur">
        {APP_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
