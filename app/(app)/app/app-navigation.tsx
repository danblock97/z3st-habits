"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, UserRound, Users, Crown, BarChart3, Trophy, Medal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  iconName: string;
};

const iconMap: Record<string, LucideIcon> = {
  ListChecks,
  Users,
  UserRound,
  Crown,
  BarChart3,
  Trophy,
  Medal,
};

type AppNavigationProps = {
  items: NavItem[];
};

export function AppTabs({ items }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="App sections" className="hidden md:block">
      <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/80 p-1 text-sm shadow-sm">
        {items.map((item) => {
          const isActive = isRouteActive(pathname, item.href);
          const Icon = iconMap[item.iconName];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 transition-colors",
                isActive
                  ? "bg-background text-foreground shadow"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppMobileNav({ items }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="App navigation" className="md:hidden">
      <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-1 rounded-full border border-border/70 bg-background/95 px-4 py-3 shadow-lg shadow-primary/20 backdrop-blur">
        {items.map((item) => {
          const isActive = isRouteActive(pathname, item.href);
          const Icon = iconMap[item.iconName];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isRouteActive(currentPathname: string | null, href: string) {
  if (!currentPathname) {
    return false;
  }

  if (currentPathname === href) {
    return true;
  }

  return currentPathname.startsWith(`${href}/`);
}

