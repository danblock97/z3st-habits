"use client";

import Link from "next/link";
import { CalendarClock, Sparkles, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { GroupSummary } from "./types";

type GroupsClientProps = {
  groups: GroupSummary[];
};

export function GroupsClient({ groups }: GroupsClientProps) {
  const hasGroups = groups.length > 0;

  return (
    <section className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Rally your crew for accountability loops and shared rituals. Organize members by intention, not inbox threads.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="mailto:hello@z3st.app?subject=Start%20a%20Z3st%20crew">
            Start a group
          </Link>
        </Button>
      </header>

      {hasGroups ? <GroupGrid groups={groups} /> : <EmptyGroupsState />}
    </section>
  );
}

function GroupGrid({ groups }: { groups: GroupSummary[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.id} className="border-border/60 bg-card/80 shadow-sm transition hover:border-border">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                  <span role="img" aria-label={`${group.ownerDisplayName} avatar`}>
                    {group.ownerEmoji ?? "🍋"}
                  </span>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-tight">{group.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Led by {group.ownerDisplayName}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs capitalize">
                {group.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Formed {formatDate(group.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Joined {formatDate(group.joinedAt)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyGroupsState() {
  return (
    <Card className="border-dashed border-border/70 bg-card/70">
      <CardHeader className="items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl">Gather your citrus crew</CardTitle>
        <CardDescription>
          Bring your accountability circle into Z3st to share streak snapshots, energy calls, and weekly resets.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 pb-12">
        <ul className="grid gap-3 text-sm text-muted-foreground">
          <li>• Align on rituals with a shared dashboard.</li>
          <li>• Warm up new members with quick-start prompts.</li>
          <li>• Celebrate wins with seasonal badges.</li>
        </ul>
        <Button asChild size="lg">
          <Link href="mailto:hello@z3st.app?subject=Start%20a%20Z3st%20crew">
            Start a group
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('en-US');
  } catch {
    return value;
  }
}
