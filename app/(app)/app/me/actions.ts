'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements, getUserUsage, canDowngradeToTier } from '@/lib/entitlements-server';
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
  avatar_url: z
    .string()
    .url('Avatar URL must be a valid URL.')
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
    bio: formData.get('bio') ?? undefined,
    is_public: formData.get('is_public') === 'true' ? true : formData.get('is_public') === 'false' ? false : undefined,
    avatar_url: formData.get('avatar_url') ?? undefined,
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

  // Only update bio, is_public, and avatar_url if they were provided (these columns might not exist yet)
  if (parsed.data.bio !== undefined) {
    updateData.bio = parsed.data.bio ?? null;
  }
  if (parsed.data.is_public !== undefined) {
    updateData.is_public = parsed.data.is_public ?? false;
  }
  if (parsed.data.avatar_url !== undefined) {
    updateData.avatar_url = parsed.data.avatar_url ?? null;
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

// Delete a habit
export async function deleteHabit(habitId: string) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { success: false, message: 'You must be signed in to delete habits.' };
  }

  // Check if user owns this habit
  const { data: habit, error: checkError } = await supabase
    .from('habits')
    .select('owner_id')
    .eq('id', habitId)
    .single();

  if (checkError || !habit || habit.owner_id !== session.user.id) {
    return { success: false, message: 'You do not have permission to delete this habit.' };
  }

  // Delete the habit (this will cascade delete checkins and reminders)
  const { error: deleteError } = await supabase
    .from('habits')
    .delete()
    .eq('id', habitId);

  if (deleteError) {
    console.error('Error deleting habit:', deleteError);
    return { success: false, message: 'Failed to delete habit. Please try again.' };
  }

  revalidatePath('/app/habits');
  return { success: true, message: 'Habit deleted successfully.' };
}

// Delete a group
export async function deleteGroup(groupId: string) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { success: false, message: 'You must be signed in to delete groups.' };
  }

  // Check if user owns this group
  const { data: group, error: checkError } = await supabase
    .from('groups')
    .select('owner_id')
    .eq('id', groupId)
    .single();

  if (checkError || !group || group.owner_id !== session.user.id) {
    return { success: false, message: 'You do not have permission to delete this group.' };
  }

  // Delete the group (this will cascade delete memberships and invites)
  const { error: deleteError } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (deleteError) {
    console.error('Error deleting group:', deleteError);
    return { success: false, message: 'Failed to delete group. Please try again.' };
  }

  revalidatePath('/app/groups');
  return { success: true, message: 'Group deleted successfully.' };
}

// Remove a member from a group
export async function removeGroupMember(groupId: string, memberId: string) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { success: false, message: 'You must be signed in to manage group members.' };
  }

  // Check if user has permission to remove members
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', session.user.id)
    .single();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return { success: false, message: 'You do not have permission to remove members from this group.' };
  }

  // Prevent self-removal
  if (memberId === session.user.id) {
    return { success: false, message: 'You cannot remove yourself from the group.' };
  }

  // Remove the member
  const { error: removeError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId);

  if (removeError) {
    console.error('Error removing member:', removeError);
    return { success: false, message: 'Failed to remove member from group.' };
  }

  revalidatePath(`/app/g/${groupId}`);
  return { success: true, message: 'Member removed from group.' };
}

// Get current usage stats for the user
export async function getCurrentUsage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const entitlements = await fetchUserEntitlements(session.user.id);
  if (!entitlements) {
    return null;
  }

  const usage = await getUserUsage(session.user.id);
  return { entitlements, usage };
}

// Check if user can downgrade to a specific tier
export async function checkDowngradeRequirements(targetTier: 'free' | 'pro' | 'plus') {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const entitlements = await fetchUserEntitlements(session.user.id);
  if (!entitlements) {
    return null;
  }

  const usage = await getUserUsage(session.user.id);
  if (!usage) {
    return null;
  }

  return canDowngradeToTier(entitlements, targetTier, usage);
}

// Upload avatar image to Supabase storage
export async function uploadAvatar(formData: FormData): Promise<{ success: boolean; message: string; avatarUrl?: string }> {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      success: false,
      message: 'You must be signed in to upload an avatar.',
    };
  }

  const file = formData.get('avatar') as File;
  if (!file) {
    return {
      success: false,
      message: 'No file provided.',
    };
  }

  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      message: 'Invalid file type. Please upload a PNG, JPEG, or WebP image.',
    };
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      success: false,
      message: 'File size too large. Please upload an image smaller than 5MB.',
    };
  }

  const userId = session.user.id;
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  try {
    // Create a server client with service role for storage operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Upload the file to Supabase storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing file
      });

    if (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        message: 'Failed to upload avatar. Please try again.',
      };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return {
      success: true,
      message: 'Avatar uploaded successfully.',
      avatarUrl: publicUrl,
    };
  } catch (error) {
    console.error('Avatar upload error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}
