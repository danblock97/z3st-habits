import { redirect } from 'next/navigation';
import { Suspense } from 'react';
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
import { createServerClient } from '@/lib/supabase/server';

import { JoinPageContent } from './join-page-content';

type JoinPageProps = {
  params: Promise<{ token: string }>;
  searchParams?: { error?: string };
};

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

async function getInviteData(token: string) {
  const supabase = await createServerClient();

  // Get invite details (this works even without authentication)
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select(`
      id,
      group_id,
      status,
      expires_at,
      created_at,
      groups!inner (id, name, created_at,
        owner:profiles!groups_owner_id_fkey (
          username,
          emoji
        )
      )
    `)
    .eq('token', token)
    .maybeSingle();

  return { invite, error: inviteError };
}


export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const resolvedParams = await params;
  const { invite, error } = await getInviteData(resolvedParams.token);

  // Handle error cases
  if (error || !invite) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
          <Card className="w-full border-border/60 bg-background/95 shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <CardTitle className="text-2xl">Invalid Invite</CardTitle>
              <CardDescription>
                This invite link is invalid or has expired.
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
      </div>
    );
  }

  // Check if invite is expired
  const now = new Date();
  const expiresAt = new Date(invite.expires_at);
  if (now > expiresAt) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
          <Card className="w-full border-border/60 bg-background/95 shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <CardTitle className="text-2xl">Expired Invite</CardTitle>
              <CardDescription>
                This invite link expired on {formatDate(invite.expires_at)}.
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
      </div>
    );
  }

  // Check if invite is already accepted
  if (invite.status === 'accepted') {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
          <Card className="w-full border-border/60 bg-background/95 shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <CardTitle className="text-2xl">Already Joined</CardTitle>
              <CardDescription>
                You have already joined this group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/app/groups">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  View Your Groups
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
          <Card className="w-full border-border/60 bg-background/95 shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <CardTitle className="text-2xl">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }>
        <JoinPageContent token={resolvedParams.token} inviteData={invite} />
      </Suspense>
    </div>
  );
}
