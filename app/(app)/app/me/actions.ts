'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';
import type { ProfileFormState } from './form-state';

const profileSchema = z.object({
  username: z
    .string({ required_error: 'Username is required.' })
    .trim()
    .min(3, 'Username must be at least 3 characters long.')
    .max(32, 'Username must be at most 32 characters long.')
    .regex(/^[a-z0-9_]+$/i, 'Username can include letters, numbers, and underscores only.'),
  timezone: z
    .string({ required_error: 'Timezone is required.' })
    .trim()
    .min(1, 'Timezone is required.'),
  emoji: z
    .string()
    .trim()
    .max(4, 'Emoji must be at most 2 characters long.')
    .optional()
    .transform((value) => (value ? value : null)),
});

type ProfileInput = z.infer<typeof profileSchema>;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse({
    username: formData.get('username'),
    timezone: formData.get('timezone'),
    emoji: formData.get('emoji') ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: ProfileFormState['fieldErrors'] = {};
    const flattened = parsed.error.flatten().fieldErrors;

    (Object.keys(flattened) as Array<keyof ProfileInput>).forEach((key) => {
      const errorMessage = flattened[key]?.[0];
      if (errorMessage) {
        fieldErrors[key] = errorMessage;
      }
    });

    return {
      status: 'error',
      message: 'Please fix the highlighted fields.',
      fieldErrors,
    };
  }

  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      status: 'error',
      message: 'You must be signed in to update your profile.',
    };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      username: parsed.data.username,
      timezone: parsed.data.timezone,
      emoji: parsed.data.emoji ?? null,
    })
    .eq('id', session.user.id)
    .select('id')
    .single();

  if (error || !data) {
    if (error?.code === '23505') {
      return {
        status: 'error',
        message: 'That username is already taken. Try another one.',
        fieldErrors: { username: 'That username is already taken.' },
      };
    }

    return {
      status: 'error',
      message: error?.message ?? 'We could not update your profile right now.',
    };
  }

  revalidatePath('/app/me');

  return {
    status: 'success',
    message: 'Profile updated successfully.',
  };
}
