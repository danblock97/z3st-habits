import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Chrome } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createServerClient } from '@/lib/supabase/server';

import { EmailSignInForm } from './email-sign-in-form';
import { signInWithEmail, signInWithGoogle } from '../(auth)/actions';

import type { EmailSignInState } from '@/lib/auth/types';

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/app');
  }

  const resolvedSearchParams = await searchParams;
  const errorMessage = resolvedSearchParams?.error;
  const isGoogleOAuthConfigured = Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
      <Card className="w-full border-border/60 bg-background/95 shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-2xl">Sign in to Z3st</CardTitle>
          <CardDescription>
            Access your habit cockpit with a secure magic link or Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isGoogleOAuthConfigured ? (
            <>
              <form action={signInWithGoogle} className="space-y-4">
                {resolvedSearchParams?.redirectTo && (
                  <input type="hidden" name="redirectTo" value={resolvedSearchParams.redirectTo} />
                )}
                <Button variant="outline" type="submit" className="w-full">
                  <Chrome className="mr-2 h-4 w-4" aria-hidden="true" />
                  Continue with Google
                </Button>
              </form>
              <div className="relative">
                <Separator />
                <span className="absolute inset-x-0 -top-3 mx-auto w-fit rounded-full bg-background px-2 text-xs uppercase text-muted-foreground">
                  or
                </span>
              </div>
            </>
          ) : (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Google sign-in is not configured yet. Use your email to request a magic link.
            </p>
          )}
          <EmailSignInForm action={signInWithEmail} redirectTo={resolvedSearchParams?.redirectTo} />
          {errorMessage ? (
            <p className="text-sm text-destructive">
              {decodeURIComponent(errorMessage)}
            </p>
          ) : null}
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Want to explore first?{' '}
        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
          Return to the homepage
        </Link>
        .
      </p>
    </div>
  );
}
