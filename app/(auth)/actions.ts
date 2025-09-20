'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';
import type { EmailSignInState } from '@/lib/auth/types';

const emailSchema = z.object({
  email: z.string().email(),
});

const originFallback = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

function getRedirectUrl(path: string) {
  const origin = headers().get('origin') ?? originFallback;
  return new URL(path, origin).toString();
}

export async function signInWithEmail(
  _prevState: EmailSignInState,
  formData: FormData,
): Promise<EmailSignInState> {
  const parsed = emailSchema.safeParse({
    email: String(formData.get('email') ?? ''),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email.toLowerCase(),
    options: {
      emailRedirectTo: getRedirectUrl('/auth/callback'),
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    message: 'Check your email for a secure sign-in link.',
  };
}

export async function signInWithGoogle() {
  if (!googleClientId || !googleClientSecret) {
    redirect('/login?error=Google%20sign-in%20is%20not%20configured.');
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getRedirectUrl('/auth/callback'),
      queryParams: {
        prompt: 'consent',
        access_type: 'offline',
      },
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }

  redirect('/login');
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut({ scope: 'global' });
}
