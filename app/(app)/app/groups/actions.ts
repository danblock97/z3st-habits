'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { createServerClient } from '@/lib/supabase/server';

import { groupFormInitialState, type GroupFormState } from './form-state';
import type { GroupSummary } from './types';

const createGroupSchema = z.object({
  name: z
    .string({ required_error: 'Group name is required.' })
    .trim()
    .min(3, 'Group name must be at least 3 characters long.')
    .max(80, 'Group name must be at most 80 characters long.'),
});

function toGroupSummary(record: {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}): GroupSummary {
  return {
    id: record.id,
    name: record.name,
    ownerId: record.owner_id,
    ownerDisplayName: 'You',
    ownerEmoji: '🍋',
    role: 'owner',
    createdAt: record.created_at,
    joinedAt: record.created_at,
  };
}

export async function createGroup(
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const parsed = createGroupSchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    const fieldErrors: GroupFormState['fieldErrors'] = {};
    const flattened = parsed.error.flatten().fieldErrors;

    (Object.keys(flattened) as Array<keyof typeof flattened>).forEach((key) => {
      const message = flattened[key]?.[0];
      if (message) {
        if (key === 'name') {
          fieldErrors.name = message;
        }
      }
    });

    return {
      ...groupFormInitialState,
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
    console.error('Group creation failed - no session:', sessionError);
    return {
      ...groupFormInitialState,
      status: 'error',
      message: 'You need to be signed in to create groups.',
    };
  }

  const userId = session.user.id;

  // Create group and membership in a transaction
  console.log('Creating group for user:', userId, 'with name:', parsed.data.name);
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: parsed.data.name,
      owner_id: userId,
    })
    .select('id, name, owner_id, created_at')
    .single();

  console.log('Group creation result:', { groupData, groupError });

  if (groupError || !groupData) {
    console.error('Group creation failed:', groupError);
    return {
      ...groupFormInitialState,
      status: 'error',
      message: groupError?.message ?? 'We could not create that group right now.',
    };
  }

  // Create owner membership
  console.log('Creating membership for user:', userId, 'in group:', groupData.id);
  const { error: membershipError } = await supabase
    .from('group_members')
    .insert({
      group_id: groupData.id,
      user_id: userId,
      role: 'owner',
    });

  console.log('Membership creation result:', membershipError);

  if (membershipError) {
    console.error('Membership creation failed:', membershipError);
    return {
      ...groupFormInitialState,
      status: 'error',
      message: membershipError.message ?? 'We could not set up group membership right now.',
    };
  }

  const group = toGroupSummary(groupData);

  revalidatePath('/app/groups');

  return {
    status: 'success',
    message: 'Group created! Ready to invite your crew.',
    group,
  };
}

export async function createInvite(groupId: string) {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Check if user has permission to invite to this group
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return {
      success: false,
      message: 'You do not have permission to invite members to this group.',
    };
  }

  // Generate invite token (24 characters, URL-safe)
  const token = nanoid(24);

  // Set expiry to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invite, error } = await supabase
    .from('invites')
    .insert({
      group_id: groupId,
      email: '', // We'll add email later if needed
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select('id, token, created_at, expires_at')
    .single();

  if (error || !invite) {
    return {
      success: false,
      message: error?.message ?? 'Could not create invite link.',
    };
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const inviteUrl = new URL(`/join/${token}`, origin).toString();

  return {
    success: true,
    inviteUrl,
    token: invite.token,
    expiresAt: invite.expires_at,
  };
}

export async function acceptInvite(token: string) {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    // Store the token in the URL so we can redirect back after auth
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('redirectTo', `/join/${token}`);
    redirect(loginUrl.toString());
  }

  const userId = session.user.id;

  // Get the invite
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select(`
      id,
      group_id,
      status,
      expires_at,
      groups!inner (id, name, owner_id)
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .maybeSingle();

  if (inviteError || !invite) {
    return {
      success: false,
      message: 'Invalid or expired invite link.',
    };
  }

  // Check if invite is expired
  const now = new Date();
  const expiresAt = new Date(invite.expires_at);
  if (now > expiresAt) {
    return {
      success: false,
      message: 'This invite link has expired.',
    };
  }

  // Check if user is already a member
  const { data: existingMembership } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', invite.group_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMembership) {
    return {
      success: false,
      message: 'You are already a member of this group.',
    };
  }

  // Create membership
  const { error: membershipError } = await supabase
    .from('group_members')
    .insert({
      group_id: invite.group_id,
      user_id: userId,
      role: 'member',
    });

  if (membershipError) {
    return {
      success: false,
      message: membershipError.message ?? 'Could not join the group.',
    };
  }

  // Mark invite as accepted
  await supabase
    .from('invites')
    .update({ status: 'accepted' })
    .eq('id', invite.id);

  const group = Array.isArray(invite.groups) ? invite.groups[0] : invite.groups;

  return {
    success: true,
    groupId: invite.group_id,
    groupName: group?.name || 'Unknown Group',
  };
}

export async function removeMember(groupId: string, memberId: string) {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      success: false,
      message: 'You must be signed in to manage group members.',
    };
  }

  const userId = session.user.id;

  // Check if user has permission to remove members (owner or admin)
  const { data: membership } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return {
      success: false,
      message: 'You do not have permission to remove members from this group.',
    };
  }

  // Prevent self-removal
  if (memberId === userId) {
    return {
      success: false,
      message: 'You cannot remove yourself from the group.',
    };
  }

  // Remove the member
  const { error: removeError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId);

  if (removeError) {
    return {
      success: false,
      message: removeError.message ?? 'Could not remove member from group.',
    };
  }

  return {
    success: true,
    message: 'Member removed from group.',
  };
}
