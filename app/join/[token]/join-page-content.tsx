"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

import { acceptInvite } from '../../(app)/app/groups/actions';

type JoinPageContentProps = {
  token: string;
  inviteData: {
    id: string;
    group_id: string;
    status: string;
    expires_at: string;
    created_at: string;
    groups: {
      id: string;
      name: string;
      created_at: string;
      owner: {
        username: string | null;
        emoji: string | null;
      }[] | null;
    }[];
  };
};

export function JoinPageContent({ token, inviteData }: JoinPageContentProps) {
  const [result, setResult] = useState<{ success: boolean; groupId?: string; groupName?: string; message?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Check if user is already a member
  useEffect(() => {
    const checkMembership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsMember(false);
        return;
      }

      // Get invite details to find group_id
      const { data: invite } = await supabase
        .from('invites')
        .select('group_id')
        .eq('token', token)
        .maybeSingle();

      if (!invite) {
        setIsMember(false);
        return;
      }

      // Check if user is a member
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', user.id)
        .maybeSingle();

      setIsMember(!!membership);
    };

    checkMembership();
  }, [token, supabase]);

  const handleJoin = () => {
    startTransition(async () => {
      const joinResult = await acceptInvite(token);
      setResult(joinResult);

      if (joinResult.success) {
        // Update membership status and refresh
        setIsMember(true);
      }
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const group = Array.isArray(inviteData.groups) ? inviteData.groups[0] : inviteData.groups;
  const owner = Array.isArray(group?.owner) ? group.owner[0] : group?.owner;

  // Show loading state while checking membership
  if (isMember === null) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
        <Card className="w-full border-border/60 bg-background/95 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // If user is already a member, show success message
  if (isMember) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
        <Card className="w-full border-border/60 bg-background/95 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Welcome to {group?.name}!</CardTitle>
            <CardDescription>
              You are already a member of this group.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/app/groups">
                View Your Groups
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we've already joined successfully, show success message
  if (result?.success) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
        <Card className="w-full border-border/60 bg-background/95 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Welcome to {result.groupName}!</CardTitle>
            <CardDescription>
              You have successfully joined the group.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/app/groups">
                View Your Groups
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
        <Card className="w-full border-border/60 bg-background/95 shadow-lg">
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl">Group Not Found</CardTitle>
            <CardDescription>
              The group associated with this invite could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/app/groups">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Groups
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
      <Card className="w-full border-border/60 bg-background/95 shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
            <Users className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Join {group.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join this group led by {owner?.username ?? 'the group leader'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">Group Details:</p>
            <p>Created: {formatDate(group.created_at)}</p>
            <p>Expires: {formatDate(inviteData.expires_at)}</p>
          </div>

          {result?.message && (
            <p className="text-sm text-destructive">{result.message}</p>
          )}

          <Button
            onClick={handleJoin}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? 'Joining...' : 'Join Group'}
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/app/groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
