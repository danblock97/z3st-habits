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
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be at most 500 characters long.')
    .optional()
    .transform((value) => (value ? value : null)),
  is_public: z.boolean().optional(),
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
    bio: formData.get('bio') ?? undefined,
    is_public: formData.get('is_public') === 'true' ? true : formData.get('is_public') === 'false' ? false : undefined,
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

  const updateData: Record<string, string | null | boolean> = {
    username: parsed.data.username,
    timezone: parsed.data.timezone,
    emoji: parsed.data.emoji ?? null,
  };

  // Only update bio and is_public if they were provided (these columns might not exist yet)
  if (parsed.data.bio !== undefined) {
    updateData.bio = parsed.data.bio ?? null;
  }
  if (parsed.data.is_public !== undefined) {
    updateData.is_public = parsed.data.is_public ?? false;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
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
      message: error?.message ?? 'We could not update your profile right now. Please try again.',
    };
  }

  revalidatePath('/app/me');

  return {
    status: 'success',
    message: 'Profile updated successfully.',
  };
}
