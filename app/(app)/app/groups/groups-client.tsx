"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock, Copy, Plus, Sparkles, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createGroup, createInvite } from "./actions";
import { groupFormInitialState, type GroupFormState } from "./form-state";
import type { GroupSummary } from "./types";

type GroupsClientProps = {
  groups: GroupSummary[];
};

export function GroupsClient({ groups }: GroupsClientProps) {
  const hasGroups = groups.length > 0;
  const [state, setState] = useState<GroupFormState>(groupFormInitialState);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createGroup(state, formData);
      setState(result);

      if (result.status === 'success' && result.group) {
        setIsDialogOpen(false);
        // The page will revalidate and show the new group
      }
    });
  };

  const handleCreateInvite = async (groupId: string) => {
    startTransition(async () => {
      setInviteError(null);
      const result = await createInvite(groupId);

      if (result.success && result.inviteUrl) {
        setInviteUrl(result.inviteUrl);
        setShowInviteDialog(true);
      } else {
        setInviteError(result.message || 'Could not create invite link.');
      }
    });
  };

  const copyInviteUrl = async () => {
    if (inviteUrl) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        // You could add a toast notification here
      } catch (err) {
        // Fallback for older browsers
        console.error('Failed to copy: ', err);
      }
    }
  };

  return (
    <section className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Groups</h1>
          <p className="text-muted-foreground">
            Rally your crew for accountability loops and shared rituals. Organize members by intention, not inbox threads.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form action={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create a new group</DialogTitle>
                <DialogDescription>
                  Give your group a name and start inviting your accountability partners.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Morning Warriors"
                    className="col-span-3"
                    disabled={isPending}
                  />
                </div>
                {state.fieldErrors?.name && (
                  <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </DialogFooter>
              {state.message && state.status === 'error' && (
                <p className="mt-4 text-sm text-destructive">{state.message}</p>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {hasGroups ? <GroupGrid groups={groups} onCreateInvite={handleCreateInvite} /> : <EmptyGroupsState />}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Group Invite</DialogTitle>
            <DialogDescription>
              Anyone with this link can join your group. It expires in 7 days.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {inviteUrl && (
              <div className="flex items-center gap-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyInviteUrl}
                  title="Copy invite link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInviteDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function GroupGrid({ groups, onCreateInvite }: { groups: GroupSummary[]; onCreateInvite: (groupId: string) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.id} className="border-border/60 bg-card/80 shadow-sm transition hover:border-border">
          <Link href={`/app/g/${group.id}`}>
            <CardHeader className="space-y-3 cursor-pointer">
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
            <div className="border-t bg-muted/30 p-4">
              {(group.role === 'owner' || group.role === 'admin') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    onCreateInvite(group.id);
                  }}
                >
                  <UsersRound className="mr-2 h-4 w-4" />
                  Create Invite Link
                </Button>
              )}
            </div>
          </Link>
        </Card>
      ))}
    </div>
  );
}

function EmptyGroupsState() {
  const [state, setState] = useState<GroupFormState>(groupFormInitialState);
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createGroup(state, formData);
      setState(result);

      if (result.status === 'success' && result.group) {
        setIsDialogOpen(false);
        // The page will revalidate and show the new group
      }
    });
  };

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Start a group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form action={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create a new group</DialogTitle>
                <DialogDescription>
                  Give your group a name and start inviting your accountability partners.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name-empty" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name-empty"
                    name="name"
                    placeholder="Morning Warriors"
                    className="col-span-3"
                    disabled={isPending}
                  />
                </div>
                {state.fieldErrors?.name && (
                  <p className="text-sm text-destructive">{state.fieldErrors.name}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </DialogFooter>
              {state.message && state.status === 'error' && (
                <p className="mt-4 text-sm text-destructive">{state.message}</p>
              )}
            </form>
          </DialogContent>
        </Dialog>
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
