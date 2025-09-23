import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LineChart,
  ListChecks,
  UserRound,
} from "lucide-react";
import { Geist, Geist_Mono } from "next/font/google";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { createServerClient } from "@/lib/supabase/server";
import { signOut } from "./(auth)/actions";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

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
  { href: "/app/analytics", label: "Analytics", icon: LineChart },
  { href: "/app/me", label: "Profile", icon: UserRound },
];

export const metadata: Metadata = {
  metadataBase: new URL("https://z3st.app"),
  title: {
    default: "Z3st Habits - Build Habits That Actually Stick",
    template: "%s | Z3st Habits",
  },
  description:
    "Transform your productivity with Z3st Habits. The citrus-powered habit system that adapts to your energy, celebrates wins, and builds momentum without burnout. Start free today.",
  keywords: [
    "habit tracking",
    "productivity app",
    "habit formation",
    "goal tracking",
    "streak tracking",
    "morning routine",
    "personal development",
    "self improvement",
    "ritual building",
    "focus app",
  ],
  authors: [{ name: "Z3st Team" }],
  creator: "Z3st",
  publisher: "Z3st",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://z3st.app",
    title: "Z3st Habits - Build Habits That Actually Stick",
    description: "Transform your productivity with Z3st Habits. The citrus-powered habit system that adapts to your energy, celebrates wins, and builds momentum without burnout.",
    siteName: "Z3st Habits",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "Z3st Habits - Build Habits That Actually Stick",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Z3st Habits - Build Habits That Actually Stick",
    description: "Transform your productivity with Z3st Habits. The citrus-powered habit system that adapts to your energy, celebrates wins, and builds momentum without burnout.",
    images: ["/og"],
    creator: "@z3sthabits",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-site-verification-code",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  const isAuthenticated = Boolean(user);

  // Fetch user profile data if authenticated
  let userProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url, emoji, username')
      .eq('id', user.id)
      .maybeSingle();
    userProfile = profile;
  }

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
          <SiteHeader user={user} userProfile={userProfile} />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
        {isAuthenticated ? <MobileBottomNav /> : null}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

function SiteHeader({ 
  user, 
  userProfile 
}: { 
  user: User | null;
  userProfile: { avatar_url: string | null; emoji: string | null; username: string | null } | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-8"
            aria-hidden="true"
          />
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
        {user ? <UserMenu user={user} userProfile={userProfile} /> : <SignInButton />}
      </div>
    </header>
  );
}

function SignInButton() {
  return (
    <Button asChild size="lg">
      <Link href="/login">Sign in</Link>
    </Button>
  );
}

function UserMenu({ 
  user, 
  userProfile 
}: { 
  user: User;
  userProfile: { avatar_url: string | null; emoji: string | null; username: string | null } | null;
}) {
  const displayName =
    userProfile?.username ||
    (user.user_metadata.full_name as string | undefined) ||
    (user.user_metadata.name as string | undefined) ||
    user.email ||
    "Account";

  async function handleSignOut() {
    "use server";
    await signOut();
    redirect("/");
  }

  return (
    <div className="flex items-center gap-3">
      <Button asChild size="lg" variant="outline" className="hidden sm:flex">
        <Link href="/app">Open app</Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus-visible:outline-none" asChild>
          <button className="rounded-full border border-border/60 bg-transparent p-0">
            <UserAvatar
              className="h-10 w-10"
              avatarUrl={userProfile?.avatar_url}
              emoji={userProfile?.emoji}
              username={userProfile?.username}
              email={user.email}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            {user.email ? (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/app">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/me">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={handleSignOut}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full text-left">Sign out</button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
